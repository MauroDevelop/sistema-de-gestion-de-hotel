import { pool } from '../config/db.js';

export class HuespedRepository {
    // Obtiene todos los huéspedes con sus datos extendidos, reserva y estado de Check-in / Check-out
    static async getAll() {
        const [rows] = await pool.execute(
            `SELECT r.id_reserva AS id,
                    h.nombre,
                    h.dni,
                    COALESCE(h.direccion, 'No especificada') AS direccion,
                    COALESCE(h.posee_vehiculo, 0) AS posee_vehiculo,
                    COALESCE(h.vehiculo_modelo, '-') AS vehiculo_modelo,
                    COALESCE(h.patente, '-') AS patente,
                    r.nro_habitacion AS habitacion_id,
                    hab.tipo AS habitacion_tipo,
                    hab.precio_noche AS precio_noche,
                    DATE_FORMAT(rd.inicio, '%Y-%m-%d') AS ingreso,
                    CASE WHEN rd.fin IS NOT NULL THEN DATE_FORMAT(rd.fin, '%Y-%m-%d') ELSE 'A definir' END AS salida,
                    CASE WHEN hab.estado = 'OCUPADA' THEN 'CHECK-IN' ELSE 'CHECK-OUT' END AS estado
             FROM reserva r
             JOIN huesped h ON r.id_huesped = h.id_huesped
             JOIN reserva_data rd ON r.id_reserva_data = rd.id_reserva_data
             JOIN habitacion hab ON r.nro_habitacion = hab.nro_habitacion
             ORDER BY r.id_reserva DESC`
        );
        return rows;
    }

    // Registra Check-in de un huésped y asigna habitación
    static async createHuespedConReserva({ 
        nombre, 
        dni, 
        direccion, 
        posee_vehiculo, 
        vehiculo_modelo, 
        patente, 
        habitacion_id, 
        ingreso, 
        salida, 
        creado_por_id = 1 
    }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Verificar si la habitación existe y está libre
            const [habRows] = await connection.execute(
                `SELECT estado FROM habitacion WHERE nro_habitacion = ? FOR UPDATE`,
                [habitacion_id]
            );

            if (habRows.length === 0) {
                throw new Error('La habitación no existe');
            }
            if (habRows[0].estado === 'OCUPADA') {
                throw new Error('La habitación ya se encuentra ocupada por otro huésped');
            }

            // 2. Buscar o crear/actualizar el huésped
            const [huespedRows] = await connection.execute(
                `SELECT id_huesped FROM huesped WHERE dni = ?`,
                [dni]
            );

            let idHuesped;
            const hasVehiculo = posee_vehiculo ? 1 : 0;
            const modelAuto = tieneValor(vehiculo_modelo) ? vehiculo_modelo.trim() : null;
            const patAuto = tieneValor(patente) ? patente.trim() : null;
            const dir = tieneValor(direccion) ? direccion.trim() : null;

            if (huespedRows.length > 0) {
                idHuesped = huespedRows[0].id_huesped;
                await connection.execute(
                    `UPDATE huesped 
                     SET nombre = ?, direccion = ?, posee_vehiculo = ?, vehiculo_modelo = ?, patente = ?
                     WHERE id_huesped = ?`,
                    [nombre, dir, hasVehiculo, modelAuto, patAuto, idHuesped]
                );
            } else {
                const [insHuesped] = await connection.execute(
                    `INSERT INTO huesped (nombre, dni, fecha_nacimiento, telefono, direccion, posee_vehiculo, vehiculo_modelo, patente, creado_por_id)
                     VALUES (?, ?, '2000-01-01', '', ?, ?, ?, ?, ?)`,
                    [nombre, dni, dir, hasVehiculo, modelAuto, patAuto, creado_por_id]
                );
                idHuesped = insHuesped.insertId;
            }

            // 3. Crear reserva_data
            const fechaFin = (salida && salida !== 'A definir') ? salida : null;
            const [insResData] = await connection.execute(
                `INSERT INTO reserva_data (inicio, fin, comida, descuento, creado_por_id)
                 VALUES (?, ?, 'Ninguno', 0, ?)`,
                [ingreso, fechaFin, creado_por_id]
            );
            const idReservaData = insResData.insertId;

            // 4. Crear reserva
            const [insReserva] = await connection.execute(
                `INSERT INTO reserva (id_huesped, nro_habitacion, id_reserva_data, creado_por_id, fecha_registro)
                 VALUES (?, ?, ?, ?, NOW())`,
                [idHuesped, habitacion_id, idReservaData, creado_por_id]
            );

            // 5. Actualizar estado de la habitación a OCUPADA
            await connection.execute(
                `UPDATE habitacion SET estado = 'OCUPADA' WHERE nro_habitacion = ?`,
                [habitacion_id]
            );

            await connection.commit();

            return {
                id: insReserva.insertId,
                nombre,
                dni,
                direccion: dir || 'No especificada',
                posee_vehiculo: hasVehiculo,
                vehiculo_modelo: modelAuto || '-',
                patente: patAuto || '-',
                habitacion_id,
                ingreso,
                salida: salida || 'A definir',
                estado: 'CHECK-IN'
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Realiza el Check-out profesional: libera la habitación y finaliza la estadía
    static async checkoutHuesped(id_reserva) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Obtener la reserva y la habitación asociada
            const [resRows] = await connection.execute(
                `SELECT r.id_reserva, r.nro_habitacion, r.id_reserva_data, h.nombre, h.dni
                 FROM reserva r
                 JOIN huesped h ON r.id_huesped = h.id_huesped
                 WHERE r.id_reserva = ? FOR UPDATE`,
                [id_reserva]
            );

            if (resRows.length === 0) {
                throw new Error('La reserva no fue encontrada');
            }

            const res = resRows[0];

            // 2. Liberar la habitación
            await connection.execute(
                `UPDATE habitacion SET estado = 'LIBRE' WHERE nro_habitacion = ?`,
                [res.nro_habitacion]
            );

            // 3. Registrar fecha real de salida en reserva_data
            await connection.execute(
                `UPDATE reserva_data SET fin = CURDATE() WHERE id_reserva_data = ?`,
                [res.id_reserva_data]
            );

            await connection.commit();

            return {
                success: true,
                message: `Check-out realizado exitosamente. Habitación #${res.nro_habitacion} liberada.`,
                habitacion_id: res.nro_habitacion,
                huesped: res.nombre
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

function tieneValor(v) {
    return v && typeof v === 'string' && v.trim().length > 0;
}
