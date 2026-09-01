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

    // Actualiza los datos completos de una habitación existente
    static async update(id, { tipo, precio, estado, caracteristicas }) {
        const charsJson = Array.isArray(caracteristicas) ? JSON.stringify(caracteristicas) : JSON.stringify([]);
        const estadoVal = (estado !== undefined && estado !== null) ? estado : null;
        const [result] = await pool.execute(
            `UPDATE habitacion 
             SET tipo = ?, precio_noche = ?, estado = COALESCE(?, estado), caracteristicas = ?
             WHERE nro_habitacion = ?`,
            [tipo, precio, estadoVal, charsJson, id]
        );
        return result.affectedRows > 0;
    }

    // Actualiza el estado de una habitación (LIBRE/OCUPADA)
    static async updateEstado(id, estado) {
        await pool.execute(
            `UPDATE habitacion SET estado = ? WHERE nro_habitacion = ?`,
            [estado, id]
        );
    }

    // Elimina una habitación libre y desvincula registros antiguos si aplica
    static async deleteById(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const [habs] = await connection.execute(
                `SELECT estado FROM habitacion WHERE nro_habitacion = ? FOR UPDATE`,
                [id]
            );
            
            if (habs.length === 0) {
                await connection.rollback();
                return false;
            }
            
            if (habs[0].estado !== 'LIBRE') {
                await connection.rollback();
                throw new Error('No se puede eliminar una habitación que se encuentra OCUPADA.');
            }

            // Eliminar reservas antiguas asociadas a esta habitación liberada para no romper la restricción de clave foránea
            const [resRows] = await connection.execute(
                `SELECT id_reserva, id_reserva_data FROM reserva WHERE nro_habitacion = ?`,
                [id]
            );

            for (const res of resRows) {
                await connection.execute(`DELETE FROM pago WHERE id_reserva = ?`, [res.id_reserva]);
                await connection.execute(`DELETE FROM reserva WHERE id_reserva = ?`, [res.id_reserva]);
                if (res.id_reserva_data) {
                    await connection.execute(`DELETE FROM reserva_data WHERE id_reserva_data = ?`, [res.id_reserva_data]);
                }
            }

            const [result] = await connection.execute(
                `DELETE FROM habitacion WHERE nro_habitacion = ?`,
                [id]
            );

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // --- MÉTODOS PARA CATÁLOGO DE CARACTERÍSTICAS PREMEDITADAS ---
    static async getCatalogoCaracteristicas() {
        try {
            const [rows] = await pool.execute(
                `SELECT id, nombre FROM caracteristicas_catalogo ORDER BY id ASC`
            );
            return rows;
        } catch (e) {
            console.error('Error al obtener catálogo de características:', e.message);
            return [];
        }
    }

    static async addCaracteristicaCatalogo(nombre) {
        try {
            const [result] = await pool.execute(
                `INSERT IGNORE INTO caracteristicas_catalogo (nombre) VALUES (?)`,
                [nombre]
            );
            return { id: result.insertId || Date.now(), nombre };
        } catch (e) {
            console.error('Error al insertar característica:', e.message);
            return { id: Date.now(), nombre };
        }
    }
}
