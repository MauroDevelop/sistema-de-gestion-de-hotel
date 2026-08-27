// repositorio de acceso a datos para la tabla de huespedes y su relacion con habitaciones activas
import { pool } from '../config/db.js';

export class HuespedRepository {
    // obtiene todos los huespedes realizando LEFT JOIN con reservas activas para mostrar que habitacion ocupan
    static async getAll(filtro = '') {
        let query = `
            SELECT h.*, 
                   r.id_reserva,
                   r.nro_habitacion,
                   r.tipo_pension,
                   r.fecha_ingreso,
                   th.nombre AS tipo_habitacion
            FROM huespedes h
            LEFT JOIN reservas r ON h.id_huesped = r.id_huesped AND r.estado_reserva = 'ACTIVA'
            LEFT JOIN habitaciones hab ON r.nro_habitacion = hab.nro_habitacion
            LEFT JOIN tipos_habitacion th ON hab.id_tipo = th.id_tipo
            WHERE 1=1
        `;
        const params = [];

        // si el usuario ingreso un termino de busqueda, filtra por nombre, apellido o DNI
        if (filtro) {
            query += ` AND (h.nombre LIKE ? OR h.apellido LIKE ? OR h.nro_documento LIKE ?)`;
            const search = `%${filtro}%`;
            params.push(search, search, search);
        }

        query += ` ORDER BY h.id_huesped DESC`;
        const [rows] = await pool.execute(query, params);
        return rows;
    }

    // busca un huesped por su numero de documento unico
    static async findByDocumento(nro_documento) {
        const [rows] = await pool.execute(
            `SELECT * FROM huespedes WHERE nro_documento = ?`,
            [nro_documento]
        );
        return rows[0] || null;
    }
}
