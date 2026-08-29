import { pool } from '../config/db.js';

export class HuespedRepository {
    // Obtiene todos los huéspedes con sus datos de reserva y habitación
    static async getAll() {
        const [rows] = await pool.execute(
            `SELECT r.id_reserva AS id,
                    h.nombre,
                    h.dni,
                    r.nro_habitacion AS habitacion_id,
                    DATE_FORMAT(rd.inicio, '%Y-%m-%d') AS ingreso,
                    CASE WHEN rd.fin IS NOT NULL THEN DATE_FORMAT(rd.fin, '%Y-%m-%d') ELSE 'A definir' END AS salida,
                    COALESCE(rd.comida, 'Ninguno') AS comida,
                    COALESCE(rd.descuento, 0) AS descuento,
                    CASE WHEN hab.estado = 'OCUPADA' THEN 'ACTIVO' ELSE 'FINALIZADO' END AS estado
             FROM reserva r
             JOIN huesped h ON r.id_huesped = h.id_huesped
             JOIN reserva_data rd ON r.id_reserva_data = rd.id_reserva_data
             JOIN habitacion hab ON r.nro_habitacion = hab.nro_habitacion
             ORDER BY r.id_reserva DESC`
        );
        return rows;
    }

    // Registra un nuevo huésped y crea su reserva asociada
    static async createHuespedConReserva({ nombre, dni, habitacion_id, ingreso, salida, comida, descuento, creado_por_id = 1 }) {
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
                throw new Error('La habitación no está disponible');
            }

            // 2. Buscar o crear el huésped
            const [huespedRows] = await connection.execute(
                `SELECT id_huesped FROM huesped WHERE dni = ?`,
                [dni]
            );

            let idHuesped;
            if (huespedRows.length > 0) {
                idHuesped = huespedRows[0].id_huesped;
            } else {
                const [insHuesped] = await connection.execute(
                    `INSERT INTO huesped (nombre, dni, fecha_nacimiento, telefono, creado_por_id)
                     VALUES (?, ?, '2000-01-01', '', ?)`,
                    [nombre, dni, creado_por_id]
                );
                idHuesped = insHuesped.insertId;
            }

            // 3. Crear reserva_data
            const fechaFin = (salida && salida !== 'A definir') ? salida : null;
            const [insResData] = await connection.execute(
                `INSERT INTO reserva_data (inicio, fin, comida, descuento, creado_por_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [ingreso, fechaFin, comida || 'Ninguno', descuento || 0, creado_por_id]
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
                habitacion_id,
                ingreso,
                salida: salida || 'A definir',
                comida: comida || 'Ninguno',
                descuento: descuento || 0,
                estado: 'ACTIVO'
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
