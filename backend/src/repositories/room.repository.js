import { pool } from '../config/db.js';

export class RoomRepository {
    // Obtiene la lista de todas las habitaciones mapeadas al formato del frontend
    static async getAll() {
        const [rows] = await pool.execute(
            `SELECT nro_habitacion AS id, tipo, precio_noche AS precio, estado, caracteristicas
             FROM habitacion
             ORDER BY nro_habitacion ASC`
        );

        return rows.map(r => {
            let chars = [];
            if (r.caracteristicas) {
                try {
                    chars = typeof r.caracteristicas === 'string' && r.caracteristicas.trim().startsWith('[')
                        ? JSON.parse(r.caracteristicas)
                        : r.caracteristicas.split(',').map(s => s.trim()).filter(Boolean);
                } catch (e) {
                    chars = r.caracteristicas.split(',').map(s => s.trim()).filter(Boolean);
                }
            }
            return {
                id: r.id,
                tipo: r.tipo,
                precio: r.precio,
                estado: r.estado,
                caracteristicas: chars
            };
        });
    }

    // Obtiene una habitación por su número ID
    static async findById(id) {
        const [rows] = await pool.execute(
            `SELECT nro_habitacion AS id, tipo, precio_noche AS precio, estado, caracteristicas
             FROM habitacion
             WHERE nro_habitacion = ?`,
            [id]
        );
        if (rows.length === 0) return null;
        const r = rows[0];
        let chars = [];
        if (r.caracteristicas) {
            try {
                chars = typeof r.caracteristicas === 'string' && r.caracteristicas.trim().startsWith('[')
                    ? JSON.parse(r.caracteristicas)
                    : r.caracteristicas.split(',').map(s => s.trim()).filter(Boolean);
            } catch (e) {
                chars = r.caracteristicas.split(',').map(s => s.trim()).filter(Boolean);
            }
        }
        return {
            id: r.id,
            tipo: r.tipo,
            precio: r.precio,
            estado: r.estado,
            caracteristicas: chars
        };
    }

    // Crea una nueva habitación
    static async create({ id, tipo, precio, caracteristicas, creado_por_id = 1 }) {
        const charsJson = Array.isArray(caracteristicas) ? JSON.stringify(caracteristicas) : JSON.stringify([]);
        
        await pool.execute(
            `INSERT INTO habitacion (nro_habitacion, tipo, cantidad_camas, estado, precio_noche, caracteristicas, creado_por_id)
             VALUES (?, ?, 1, 'LIBRE', ?, ?, ?)`,
            [id, tipo, precio, charsJson, creado_por_id]
        );

        return {
            id,
            tipo,
            precio,
            estado: 'LIBRE',
            caracteristicas: Array.isArray(caracteristicas) ? caracteristicas : []
        };
    }

    // Actualiza el estado de una habitación (LIBRE/OCUPADA)
    static async updateEstado(id, estado) {
        await pool.execute(
            `UPDATE habitacion SET estado = ? WHERE nro_habitacion = ?`,
            [estado, id]
        );
    }

    // Elimina una habitación libre
    static async deleteById(id) {
        const [result] = await pool.execute(
            `DELETE FROM habitacion WHERE nro_habitacion = ? AND estado = 'LIBRE'`,
            [id]
        );
        return result.affectedRows > 0;
    }
}
