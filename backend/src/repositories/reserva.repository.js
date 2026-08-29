// repositorio transaccional de reservas, check-in y check-out
import { pool } from '../config/db.js';
import { RoomRepository } from './room.repository.js';
import { PrecioService } from '../services/precio.service.js';

export class ReservaRepository {
    // obtiene todas las reservas unidas con datos de huesped, usuario y habitacion
    static async getAll() {
        const [rows] = await pool.execute(`
            SELECT r.id_reserva, r.nro_habitacion, r.fecha_ingreso, r.fecha_salida, 
                   r.tipo_pension, r.descuento_porcentaje, r.total_estimado, r.estado_reserva,
                   h.id_huesped, h.nombre, h.apellido, h.nro_documento, h.correo, h.telefono,
                   u.nombre AS registrado_por,
                   th.nombre AS tipo_habitacion,
                   h// repositorio transaccional de reservas, check-in y check-out
import { pool } from '../config/db.js';
import { RoomRepository } from './room.repository.js';
import { PrecioService } from '../services/precio.service.js';

export class ReservaRepository {
    // obtiene todas las reservas unidas con datos de huesped, usuario y habitacion
    static async getAll() {
        const [rows] = await pool.execute(`
            SELECT r.id_reserva, r.nro_habitacion, r.fecha_ingreso, r.fecha_salida, 
                   r.tipo_pension, r.descuento_porcentaje, r.total_estimado, r.estado_reserva,
                   h.id_huesped, h.nombre, h.apellido, h.nro_documento, h.correo, h.telefono,
                   u.nombre AS registrado_por,
                   th.nombre AS tipo_habitacion,
                   hab.precio_noche
            FROM reservas r
            JOIN huespedes h ON r.id_huesped = h.id_huesped
            JOIN usuarios u ON r.id_usuario_registro = u.id_usuario
            JOIN habitaciones hab ON r.nro_habitacion = hab.nro_habitacion
            JOIN tipos_habitacion th ON hab.id_tipo = th.id_tipo
            ORDER BY r.id_reserva DESC
        `);
        return rows;
    }

    // obtiene los detalles de una reserva individual por su id
    static async getById(id_reserva) {
        const [rows] = await pool.execute(`
            SELECT r.*, h.nombre, h.apellido, h.nro_documento, hab.precio_noche, th.nombre AS tipo_habitacion
            FROM reservas r
            JOIN huespedes h ON r.id_huesped = h.id_huesped
            JOIN habitaciones hab ON r.nro_habitacion = hab.nro_habitacion
            JOIN tipos_habitacion th ON hab.id_tipo = th.id_tipo
            WHERE r.id_reserva = ?
        `, [id_reserva]);
        return rows[0] || null;
    }

    // ejecuta el check-in completo dentro de una transaccion SQL segura
    static async crearReservaTransaccional({ huesped, nro_habitacion, id_usuario_registro, fecha_ingreso, fecha_salida, tipo_pension, descuento_porcentaje, total_estimado }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. guarda o actualiza los datos del huesped usando ON DUPLICATE KEY UPDATE por DNI
            const [hResult] = await connection.execute(`
                INSERT INTO huespedes (
                    nombre, apellido, tipo_documento, nro_documento, nacionalidad,
                    fecha_nacimiento, correo, telefono, direccion, ciudad, pais,
                    contacto_emergencia_nombre, contacto_emergencia_telefono
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    telefono = VALUES(telefono),
                    direccion = VALUES(direccion),
                    correo = VALUES(correo),
                    id_huesped = LAST_INSERT_ID(id_huesped)
            `, [
                huesped.nombre, huesped.apellido, huesped.tipo_documento, huesped.nro_documento,
                huesped.nacionalidad, huesped.fecha_nacimiento, huesped.correo, huesped.telefono,
                huesped.direccion, huesped.ciudad, huesped.pais,
                huesped.contacto_emergencia_nombre, huesped.contacto_emergencia_telefono
            ]);

            const idHuesped = hResult.insertId;

            // 2. aplica un bloqueo pesmista (FOR UPDATE) para garantizar que otra peticion simultanea no ocupe la habitacion
            const [habRows] = await connection.execute(
                `SELECT estado FROM habitaciones WHERE nro_habitacion = ? FOR UPDATE`,
                [nro_habitacion]
            );

            if (habRows.length === 0 || habRows[0].estado !== 'LIBRE') {
                throw new Error('La habitación fue ocupada por otra transacción concurrente');
            }

            // marca la habitacion como OCUPADA
            await connection.execute(
                `UPDATE habitaciones SET estado = 'OCUPADA' WHERE nro_habitacion = ?`,
                [nro_habitacion]
            );

            // 3. inserta el registro de la nueva reserva activa
            const [reservaResult] = await connection.execute(`
                INSERT INTO reservas (
                    id_huesped, nro_habitacion, id_usuario_registro,
                    fecha_ingreso, fecha_salida, tipo_pension,
                    descuento_porcentaje, total_estimado, estado_reserva
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVA')
            `, [
                idHuesped, nro_habitacion, id_usuario_registro,
                fecha_ingreso, fecha_salida || null, tipo_pension,
                descuento_porcentaje, total_estimado
            ]);

            // 4. escribe automaticamente el log de auditoria de la operacion
            await connection.execute(
                `INSERT INTO logs_sistema (id_usuario, accion) VALUES (?, ?)`,
                [id_usuario_registro, `Check-in: ${huesped.nombre} ${huesped.apellido} en Hab. #${nro_habitacion}`]
            );

            // confirma la transaccion si todo salio bien
            await connection.commit();
            return reservaResult.insertId;
        } catch (error) {
            // revierte cualquier cambio si ocurre algun error en la secuencia
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // ejecuta la finalizacion de check-out recalculando el precio por tiempo transcurrido y liberando la habitacion
    static async finalizarCheckOutTransaccional(id_reserva, id_usuario) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. obtiene la reserva activa aplicando bloqueo pesimista
            const [resRows] = await connection.execute(
                `SELECT r.*, h.nombre, h.apellido, hab.precio_noche 
                 FROM reservas r
                 JOIN huespedes h ON r.id_huesped = h.id_huesped
                 JOIN habitaciones hab ON r.nro_habitacion = hab.nro_habitacion
                 WHERE r.id_reserva = ? AND r.estado_reserva = 'ACTIVA' FOR UPDATE`,
                [id_reserva]
            );

            if (resRows.length === 0) {
                throw new Error('La reserva no existe o ya fue finalizada.');
            }

            const resData = resRows[0];
            const now = new Date();
            const fechaSalidaEfectiva = now.toISOString().slice(0, 19).replace('T', ' ');

            // 2. obtiene las comodidades de la habitacion para el desglose de adicionales
            const comodidades = await RoomRepository.getComodidadesByRoom(resData.nro_habitacion);

            // 3. recalcula el total a cobrar aplicando la estrategia segun las noches consumidas reales
            const calculoTarifa = PrecioService.calcularTarifaTotal({
                precioBaseHabitacion: resData.precio_noche,
                comodidades,
                tipoPension: resData.tipo_pension,
                descuentoPorcentaje: resData.descuento_porcentaje,
                fechaIngreso: resData.fecha_ingreso,
                fechaSalida: now
            });

            // 4. actualiza la reserva a FINALIZADA guardando la fecha de salida real y el total cobrado
            await connection.execute(
                `UPDATE reservas 
                 SET fecha_salida = ?, total_estimado = ?, estado_reserva = 'FINALIZADA' 
                 WHERE id_reserva = ?`,
                [fechaSalidaEfectiva, calculoTarifa.totalFinal, id_reserva]
            );

            // 5. cambia la habitacion nuevamente a estado LIBRE
            await connection.execute(
                `UPDATE habitaciones SET estado = 'LIBRE' WHERE nro_habitacion = ?`,
                [resData.nro_habitacion]
            );

            // 6. guarda el log de auditoria con el importe cobrado
            await connection.execute(
                `INSERT INTO logs_sistema (id_usuario, accion) VALUES (?, ?)`,
                [id_usuario, `Check-out: ${resData.nombre} ${resData.apellido} liberó Hab. #${resData.nro_habitacion}. Total cobrado: $${calculoTarifa.totalFinal}`]
            );

            await connection.commit();

            return {
                id_reserva: id_reserva,
                nro_habitacion: resData.nro_habitacion,
                huesped: `${resData.nombre} ${resData.apellido}`,
                fecha_ingreso: resData.fecha_ingreso,
                fecha_salida: fechaSalidaEfectiva,
                tarifa: calculoTarifa
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
ab.precio_noche
            FROM reservas r
            JOIN huespedes h ON r.id_huesped = h.id_huesped
            JOIN usuarios u ON r.id_usuario_registro = u.id_usuario
            JOIN habitaciones hab ON r.nro_habitacion = hab.nro_habitacion
            JOIN tipos_habitacion th ON hab.id_tipo = th.id_tipo
            ORDER BY r.id_reserva DESC
        `);
        return rows;
    }

    // obtiene los detalles de una reserva individual por su id
    static async getById(id_reserva) {
        const [rows] = await pool.execute(`
            SELECT r.*, h.nombre, h.apellido, h.nro_documento, hab.precio_noche, th.nombre AS tipo_habitacion
            FROM reservas r
            JOIN huespedes h ON r.id_huesped = h.id_huesped
            JOIN habitaciones hab ON r.nro_habitacion = hab.nro_habitacion
            JOIN tipos_habitacion th ON hab.id_tipo = th.id_tipo
            WHERE r.id_reserva = ?
        `, [id_reserva]);
        return rows[0] || null;
    }

    // ejecuta el check-in completo dentro de una transaccion SQL segura
    static async crearReservaTransaccional({ huesped, nro_habitacion, id_usuario_registro, fecha_ingreso, fecha_salida, tipo_pension, descuento_porcentaje, total_estimado }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. guarda o actualiza los datos del huesped usando ON DUPLICATE KEY UPDATE por DNI
            const [hResult] = await connection.execute(`
                INSERT INTO huespedes (
                    nombre, apellido, tipo_documento, nro_documento, nacionalidad,
                    fecha_nacimiento, correo, telefono, direccion, ciudad, pais,
                    contacto_emergencia_nombre, contacto_emergencia_telefono
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    telefono = VALUES(telefono),
                    direccion = VALUES(direccion),
                    correo = VALUES(correo),
                    id_huesped = LAST_INSERT_ID(id_huesped)
            `, [
                huesped.nombre, huesped.apellido, huesped.tipo_documento, huesped.nro_documento,
                huesped.nacionalidad, huesped.fecha_nacimiento, huesped.correo, huesped.telefono,
                huesped.direccion, huesped.ciudad, huesped.pais,
                huesped.contacto_emergencia_nombre, huesped.contacto_emergencia_telefono
            ]);

            const idHuesped = hResult.insertId;

            // 2. aplica un bloqueo pesmista (FOR UPDATE) para garantizar que otra peticion simultanea no ocupe la habitacion
            const [habRows] = await connection.execute(
                `SELECT estado FROM habitaciones WHERE nro_habitacion = ? FOR UPDATE`,
                [nro_habitacion]
            );

            if (habRows.length === 0 || habRows[0].estado !== 'LIBRE') {
                throw new Error('La habitación fue ocupada por otra transacción concurrente');
            }

            // marca la habitacion como OCUPADA
            await connection.execute(
                `UPDATE habitaciones SET estado = 'OCUPADA' WHERE nro_habitacion = ?`,
                [nro_habitacion]
            );

            // 3. inserta el registro de la nueva reserva activa
            const [reservaResult] = await connection.execute(`
                INSERT INTO reservas (
                    id_huesped, nro_habitacion, id_usuario_registro,
                    fecha_ingreso, fecha_salida, tipo_pension,
                    descuento_porcentaje, total_estimado, estado_reserva
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVA')
            `, [
                idHuesped, nro_habitacion, id_usuario_registro,
                fecha_ingreso, fecha_salida || null, tipo_pension,
                descuento_porcentaje, total_estimado
            ]);

            // 4. escribe automaticamente el log de auditoria de la operacion
            await connection.execute(
                `INSERT INTO logs_sistema (id_usuario, accion) VALUES (?, ?)`,
                [id_usuario_registro, `Check-in: ${huesped.nombre} ${huesped.apellido} en Hab. #${nro_habitacion}`]
            );

            // confirma la transaccion si todo salio bien
            await connection.commit();
            return reservaResult.insertId;
        } catch (error) {
            // revierte cualquier cambio si ocurre algun error en la secuencia
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // ejecuta la finalizacion de check-out recalculando el precio por tiempo transcurrido y liberando la habitacion
    static async finalizarCheckOutTransaccional(id_reserva, id_usuario) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. obtiene la reserva activa aplicando bloqueo pesimista
            const [resRows] = await connection.execute(
                `SELECT r.*, h.nombre, h.apellido, hab.precio_noche 
                 FROM reservas r
                 JOIN huespedes h ON r.id_huesped = h.id_huesped
                 JOIN habitaciones hab ON r.nro_habitacion = hab.nro_habitacion
                 WHERE r.id_reserva = ? AND r.estado_reserva = 'ACTIVA' FOR UPDATE`,
                [id_reserva]
            );

            if (resRows.length === 0) {
                throw new Error('La reserva no existe o ya fue finalizada.');
            }

            const resData = resRows[0];
            const now = new Date();
            const fechaSalidaEfectiva = now.toISOString().slice(0, 19).replace('T', ' ');

            // 2. obtiene las comodidades de la habitacion para el desglose de adicionales
            const comodidades = await RoomRepository.getComodidadesByRoom(resData.nro_habitacion);

            // 3. recalcula el total a cobrar aplicando la estrategia segun las noches consumidas reales
            const calculoTarifa = PrecioService.calcularTarifaTotal({
                precioBaseHabitacion: resData.precio_noche,
                comodidades,
                tipoPension: resData.tipo_pension,
                descuentoPorcentaje: resData.descuento_porcentaje,
                fechaIngreso: resData.fecha_ingreso,
                fechaSalida: now
            });

            // 4. actualiza la reserva a FINALIZADA guardando la fecha de salida real y el total cobrado
            await connection.execute(
                `UPDATE reservas 
                 SET fecha_salida = ?, total_estimado = ?, estado_reserva = 'FINALIZADA' 
                 WHERE id_reserva = ?`,
                [fechaSalidaEfectiva, calculoTarifa.totalFinal, id_reserva]
            );

            // 5. cambia la habitacion nuevamente a estado LIBRE
            await connection.execute(
                `UPDATE habitaciones SET estado = 'LIBRE' WHERE nro_habitacion = ?`,
                [resData.nro_habitacion]
            );

            // 6. guarda el log de auditoria con el importe cobrado
            await connection.execute(
                `INSERT INTO logs_sistema (id_usuario, accion) VALUES (?, ?)`,
                [id_usuario, `Check-out: ${resData.nombre} ${resData.apellido} liberó Hab. #${resData.nro_habitacion}. Total cobrado: $${calculoTarifa.totalFinal}`]
            );

            await connection.commit();

            return {
                id_reserva: id_reserva,
                nro_habitacion: resData.nro_habitacion,
                huesped: `${resData.nombre} ${resData.apellido}`,
                fecha_ingreso: resData.fecha_ingreso,
                fecha_salida: fechaSalidaEfectiva,
                tarifa: calculoTarifa
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
