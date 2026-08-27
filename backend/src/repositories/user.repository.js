// repositorio de acceso a datos para la tabla de usuarios y logs del sistema
import { pool } from '../config/db.js';

export class UserRepository {
    // busca un usuario activo por correo y DNI relacionando la tabla de roles
    static async findByCredentials(correo, dni) {
        const [rows] = await pool.execute(
            `SELECT u.id_usuario, u.nombre, u.dni, u.correo, u.password_hash, u.activo, r.nombre AS rol 
             FROM usuarios u 
             JOIN roles r ON u.id_rol = r.id_rol 
             WHERE u.correo = ? AND u.dni = ? AND u.activo = TRUE`,
            [correo, dni]
        );
        return rows[0] || null;
    }

    // obtiene todos los usuarios ordenados del mas reciente al mas antiguo
    static async getAll() {
        const [rows] = await pool.execute(
            `SELECT u.id_usuario, u.nombre, u.dni, u.correo, u.activo, r.nombre AS rol, u.created_at
             FROM usuarios u
             JOIN roles r ON u.id_rol = r.id_rol
             ORDER BY u.id_usuario DESC`
        );
        return rows;
    }

    // inserta un nuevo usuario en la base de datos con contraseña ya encriptada
    static async create({ nombre, dni, correo, password_hash, id_rol }) {
        const [result] = await pool.execute(
            `INSERT INTO usuarios (nombre, dni, correo, password_hash, id_rol) 
             VALUES (?, ?, ?, ?, ?)`,
            [nombre, dni, correo, password_hash, id_rol]
        );
        return result.insertId;
    }

    // inserta una nueva entrada en los logs de auditoria del sistema
    static async logAction(id_usuario, accion, ip_origen = null) {
        await pool.execute(
            `INSERT INTO logs_sistema (id_usuario, accion, ip_origen) VALUES (?, ?, ?)`,
            [id_usuario, accion, ip_origen]
        );
    }

    // consulta los ultimos N logs de auditoria uniendo con la tabla de usuarios
    static async getLogs(limit = 50) {
        const [rows] = await pool.execute(
            `SELECT l.id_log, l.accion, l.ip_origen, l.created_at, 
                    COALESCE(u.nombre, 'Sistema') AS usuario,
                    COALESCE(u.dni, '-') AS dni
             FROM logs_sistema l
             LEFT JOIN usuarios u ON l.id_usuario = u.id_usuario
             ORDER BY l.id_log DESC
             LIMIT ?`,
            [Number(limit)]
        );
        return rows;
    }
}
