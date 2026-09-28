import { pool } from '../config/db.js';

export class HuespedRepository {
    // Obtiene todos los huéspedes con sus datos extendidos, reserva, acompañantes y estado
    static async getAll() {
        const [rows] = await pool.execute(
            `SELECT r.id_reserva AS id,
                    h.nombre,
                    COALESCE(h.nombres, h.nombre) AS nombres,
                    COALESCE(h.apellidos, '') AS apellidos,
                    h.dni,
                    COALESCE(h.tipo_documento, 'DNI') AS tipo_documento,
                    COALESCE(h.direccion, 'No especificada') AS direccion,
                    COALESCE(h.telefono, '-') AS telefono,
                    COALESCE(h.email, '-') AS email,
                    COALESCE(h.posee_vehiculo, 0) AS posee_vehiculo,
                    COALESCE(h.vehiculo_modelo, '-') AS vehiculo_modelo,
                    COALESCE(r.vehiculo_patente, h.patente, '-') AS patente,
                    r.nro_habitacion AS habitacion_id,
                    hab.tipo AS habitacion_tipo,
                    hab.precio_noche AS precio_noche,
                    DATE_FORMAT(rd.inicio, '%Y-%m-%d %H:%i') AS ingreso,
                    CASE WHEN rd.fin IS NOT NULL THEN DATE_FORMAT(rd.fin, '%Y-%m-%d %H:%i') ELSE 'A definir' END AS salida,
                    CASE WHEN hab.estado = 'OCUPADA' THEN 'CHECK-IN' ELSE 'CHECK-OUT' END AS estado,
                    COALESCE(rd.adultos, 1) AS adultos,
                    COALESCE(rd.ninos, 0) AS ninos,
                    COALESCE(rd.precio_total, 0) AS precio_total,
                    (SELECT COUNT(*) FROM reserva_acompanantes ra WHERE ra.id_reserva = r.id_reserva) AS cant_acompanantes
             FROM reserva r
             JOIN huesped h ON r.id_huesped = h.id_huesped
             JOIN reserva_data rd ON r.id_reserva_data = rd.id_reserva_data
             JOIN habitacion hab ON r.nro_habitacion = hab.nro_habitacion
             ORDER BY r.id_reserva DESC`
        );
        return rows;
    }

    // Busca un huésped por su DNI / número de documento para autocompletar en el Paso 1
    static async findByDni(dni) {
        const cleanDni = (dni || '').trim();
        if (!cleanDni) return null;

        const [rows] = await pool.execute(
            `SELECT id_huesped, nombre, nombres, apellidos, tipo_documento, dni, numero_documento, nacionalidad,
                    DATE_FORMAT(fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
                    telefono, email, direccion, posee_vehiculo, vehiculo_modelo, patente
             FROM huesped
             WHERE dni = ? OR numero_documento = ?
             LIMIT 1`,
            [cleanDni, cleanDni]
        );

        if (rows.length === 0) return null;
        const h = rows[0];

        // Separar nombre y apellido si solo existe el campo legado 'nombre'
        let nombres = h.nombres || '';
        let apellidos = h.apellidos || '';
        if (!nombres && h.nombre) {
            const parts = h.nombre.trim().split(' ');
            if (parts.length > 1) {
                nombres = parts.slice(0, -1).join(' ');
                apellidos = parts.slice(-1).join(' ');
            } else {
                nombres = h.nombre;
                apellidos = '';
            }
        }

        return {
            id_huesped: h.id_huesped,
            nombres,
            apellidos,
            nombre: h.nombre,
            tipo_documento: h.tipo_documento || 'DNI',
            numero_documento: h.numero_documento || h.dni,
            dni: h.dni,
            nacionalidad: h.nacionalidad || 'Argentina',
            fecha_nacimiento: h.fecha_nacimiento || '',
            telefono: h.telefono || '',
            email: h.email || '',
            direccion: h.direccion || '',
            posee_vehiculo: Boolean(h.posee_vehiculo),
            vehiculo_modelo: h.vehiculo_modelo || '',
            patente: h.patente || ''
        };
    }

    // Registra Check-in completo con transacción atómica: Titular, Acompañantes y Reserva
    static async createCheckInCompleto({
        nombres,
        apellidos,
        nombre,
        tipo_documento = 'DNI',
        numero_documento,
        dni,
        nacionalidad = 'Argentina',
        fecha_nacimiento,
        direccion,
        telefono,
        email,
        posee_vehiculo = false,
        vehiculo_modelo = '',
        patente = '',
        habitacion_id,
        fecha_checkin,
        fecha_checkout,
        ingreso,
        salida,
        adultos = 1,
        ninos = 0,
        acompanantes = [],
        precio_noche = 0,
        precio_total = 0,
        creado_por_id = 1
    }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const docNum = (numero_documento || dni || '').trim();
            const nomb = (nombres || nombre || '').trim();
            const apel = (apellidos || '').trim();
            const nombreCompleto = apel ? `${nomb} ${apel}` : nomb;
            const inDate = fecha_checkin || ingreso;
            const outDate = fecha_checkout || salida || null;
            const patVehiculo = (posee_vehiculo && patente) ? patente.trim().toUpperCase() : null;
            const modelVehiculo = (posee_vehiculo && vehiculo_modelo) ? vehiculo_modelo.trim() : null;

            // 1. Validar y bloquear habitación con FOR UPDATE
            const [habRows] = await connection.execute(
                `SELECT nro_habitacion, tipo, precio_noche, estado FROM habitacion WHERE nro_habitacion = ? FOR UPDATE`,
                [habitacion_id]
            );

            if (habRows.length === 0) {
                throw new Error('La habitación seleccionada no existe.');
            }
            if (habRows[0].estado === 'OCUPADA') {
                throw new Error('La habitación ya se encuentra ocupada.');
            }

            // 2. Insertar o actualizar Huésped Titular
            const [huespedRows] = await connection.execute(
                `SELECT id_huesped FROM huesped WHERE dni = ? OR numero_documento = ? LIMIT 1`,
                [docNum, docNum]
            );

            let idTitular;
            const hasVehiculo = posee_vehiculo ? 1 : 0;
            const dir = tieneValor(direccion) ? direccion.trim() : null;
            const tel = tieneValor(telefono) ? telefono.trim() : null;
            const mail = tieneValor(email) ? email.trim() : null;
            const nac = tieneValor(nacionalidad) ? nacionalidad.trim() : 'Argentina';
            const fNac = tieneValor(fecha_nacimiento) ? fecha_nacimiento : null;

            if (huespedRows.length > 0) {
                idTitular = huespedRows[0].id_huesped;
                await connection.execute(
                    `UPDATE huesped 
                     SET nombre = ?, nombres = ?, apellidos = ?, tipo_documento = ?, dni = ?, numero_documento = ?,
                         nacionalidad = ?, fecha_nacimiento = ?, telefono = ?, email = ?, direccion = ?,
                         posee_vehiculo = ?, vehiculo_modelo = ?, patente = ?
                     WHERE id_huesped = ?`,
                    [nombreCompleto, nomb, apel, tipo_documento, docNum, docNum, nac, fNac, tel, mail, dir, hasVehiculo, modelVehiculo, patVehiculo, idTitular]
                );
            } else {
                const [insHuesped] = await connection.execute(
                    `INSERT INTO huesped 
                     (nombre, nombres, apellidos, tipo_documento, dni, numero_documento, nacionalidad, fecha_nacimiento, telefono, email, direccion, posee_vehiculo, vehiculo_modelo, patente, creado_por_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [nombreCompleto, nomb, apel, tipo_documento, docNum, docNum, nac, fNac, tel, mail, dir, hasVehiculo, modelVehiculo, patVehiculo, creado_por_id]
                );
                idTitular = insHuesped.insertId;
            }

            // 3. Crear registro de estadía en reserva_data
            const tarifaPorNoche = precio_noche > 0 ? precio_noche : (habRows[0].precio_noche || 0);
            const [insResData] = await connection.execute(
                `INSERT INTO reserva_data 
                 (inicio, fin, adultos, ninos, precio_noche, precio_total, comida, descuento, creado_por_id)
                 VALUES (?, ?, ?, ?, ?, ?, 'Ninguno', 0, ?)`,
                [inDate, outDate, adultos, ninos, tarifaPorNoche, precio_total, creado_por_id]
            );
            const idReservaData = insResData.insertId;

            // 4. Crear registro en reserva con patente asociada a la estadía
            const [insReserva] = await connection.execute(
                `INSERT INTO reserva 
                 (id_huesped, nro_habitacion, id_reserva_data, vehiculo_patente, creado_por_id, fecha_registro)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [idTitular, habitacion_id, idReservaData, patVehiculo, creado_por_id]
            );
            const idReserva = insReserva.insertId;

            // 5. Procesar Acompañantes en tabla huesped y tabla intermedia reserva_acompanantes
            const listaAcompsGuardados = [];
            if (Array.isArray(acompanantes) && acompanantes.length > 0) {
                for (const acomp of acompanantes) {
                    const acompNomb = (acomp.nombres || acomp.nombre || '').trim();
                    const acompApel = (acomp.apellidos || '').trim();
                    const acompDoc = (acomp.numero_documento || acomp.dni || '').trim();
                    const acompTipo = acomp.tipo_documento || 'DNI';

                    if (!acompNomb || !acompDoc) continue;

                    const acompNombreCompleto = acompApel ? `${acompNomb} ${acompApel}` : acompNomb;

                    // Buscar si el acompañante ya existe en el sistema
                    const [existenteAcomp] = await connection.execute(
                        `SELECT id_huesped FROM huesped WHERE dni = ? OR numero_documento = ? LIMIT 1`,
                        [acompDoc, acompDoc]
                    );

                    let idAcomp;
                    if (existenteAcomp.length > 0) {
                        idAcomp = existenteAcomp[0].id_huesped;
                        await connection.execute(
                            `UPDATE huesped SET nombre = ?, nombres = ?, apellidos = ?, tipo_documento = ? WHERE id_huesped = ?`,
                            [acompNombreCompleto, acompNomb, acompApel, acompTipo, idAcomp]
                        );
                    } else {
                        const [insAcomp] = await connection.execute(
                            `INSERT INTO huesped (nombre, nombres, apellidos, tipo_documento, dni, numero_documento, nacionalidad, fecha_nacimiento, creado_por_id)
                             VALUES (?, ?, ?, ?, ?, ?, 'Argentina', '2000-01-01', ?)`,
                            [acompNombreCompleto, acompNomb, acompApel, acompTipo, acompDoc, acompDoc, creado_por_id]
                        );
                        idAcomp = insAcomp.insertId;
                    }

                    // Vincular acompañante en tabla intermedia reserva_acompanantes
                    await connection.execute(
                        `INSERT IGNORE INTO reserva_acompanantes (id_reserva, id_huesped) VALUES (?, ?)`,
                        [idReserva, idAcomp]
                    );

                    listaAcompsGuardados.push({
                        id_huesped: idAcomp,
                        nombres: acompNomb,
                        apellidos: acompApel,
                        numero_documento: acompDoc
                    });
                }
            }

            // 6. Actualizar estado de habitación a OCUPADA
            await connection.execute(
                `UPDATE habitacion SET estado = 'OCUPADA' WHERE nro_habitacion = ?`,
                [habitacion_id]
            );

            await connection.commit();

            return {
                id_reserva: idReserva,
                id: idReserva,
                id_huesped: idTitular,
                nombre: nombreCompleto,
                dni: docNum,
                habitacion_id,
                habitacion_tipo: habRows[0].tipo,
                ingreso: inDate,
                salida: outDate || 'A definir',
                adultos,
                ninos,
                precio_noche: tarifaPorNoche,
                precio_total,
                acompanantes: listaAcompsGuardados,
                patente: patVehiculo || '-',
                estado: 'CHECK-IN'
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Método de compatibilidad legado
    static async createHuespedConReserva(data) {
        return await this.createCheckInCompleto(data);
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
