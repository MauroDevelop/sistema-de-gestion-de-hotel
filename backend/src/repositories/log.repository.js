import { pool } from '../config/db.js';

export class LogRepository {
    // Registra una nueva acción en la tabla logs
    static async create(usuario, accion) {
        await pool.execute(
            `INSERT INTO logs (fecha, usuario, accion) VALUES (NOW(), ?, ?)`,
            [usuario || 'Sistema', accion]
        );
    }

    // Obtiene los últimos logs registrados
    static async getAll(limit = 50) {
        const [rows] = await pool.execute(
            `SELECT DATE_FORMAT(fecha, '%Y-%m-%d %H:%i') AS fecha, usuario, accion
             FROM logs
             ORDER BY id_log DESC
             LIMIT ?`,
            [Number(limit)]
        );
        return rows;
    }
}
