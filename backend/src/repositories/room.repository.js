// repositorio de acceso a datos para habitaciones, tipos y comodidades
import { pool } from '../config/db.js';

export class RoomRepository {
    // obtiene los datos de una habitacion especifica por su numero
    static async getById(nro_habitacion) {
        const [rows] = await pool.execute(
            `SELECT h.*, th.nombre AS tipo 
             FROM habitaciones h
             JOIN tipos_habitacion th ON h.id_tipo = th.id_tipo
             WHERE h.nro_habitacion = ?`,
            [nro_habitacion]
        );
        return rows[0] || null;
    }

    // obtiene la lista de habitaciones filtrada dinamicamente agrupadando comodidades con GROUP_CONCAT
    static async getAll(filters = {}) {
        let query = `
            SELECT h.nro_habitacion, th.nombre AS tipo, h.piso, h.precio_noche, h.estado,
                   GROUP_CONCAT(c.nombre SEPARATOR ', ') AS caracteristicas,
                   GROUP_CONCAT(c.id_comodidad) AS comodidades_ids
            FROM habitaciones h
            JOIN tipos_habitacion th ON h.id_tipo = th.id_tipo
            LEFT JOIN habitacion_comodidad hc ON h.nro_habitacion = hc.nro_habitacion
            LEFT JOIN comodidades c ON hc.id_comodidad = c.id_comodidad
            WHERE 1=1
        `;
        const params = [];

        // aplica filtro por tipo de habitacion si viene especificado
        if (filters.tipo) {
            query += ` AND th.nombre = ?`;
            params.push(filters.tipo);
        }
        // aplica filtro por estado si viene especificado
        if (filters.estado) {
            query += ` AND h.estado = ?`;
            params.push(filters.estado);
        }

        query += ` GROUP BY h.nro_habitacion ORDER BY h.nro_habitacion ASC`;
        const [rows] = await pool.execute(query, params);
        return rows;
    }

    // obtiene las comodidades especificas asignadas a una habitacion
    static async getComodidadesByRoom(nro_habitacion) {
        const [rows] = await pool.execute(
            `SELECT c.id_comodidad, c.codigo, c.nombre, c.categoria, c.precio_extra
             FROM comodidades c
             JOIN habitacion_comodidad hc ON c.id_comodidad = hc.id_comodidad
             WHERE hc.nro_habitacion = ?`,
            [nro_habitacion]
        );
        return rows;
    }

    // obtiene todo el catalogo de comodidades disponibles ordenadas por categoria
    static async getCatalogoComodidades() {
        const [rows] = await pool.execute(`SELECT * FROM comodidades ORDER BY categoria, nombre ASC`);
        return rows;
    }

    // registra una nueva comodidad en el catalogo
    static async createComodidad({ codigo, nombre, categoria, precio_extra = 0 }) {
        const [result] = await pool.execute(
            `INSERT INTO comodidades (codigo, nombre, categoria, precio_extra) VALUES (?, ?, ?, ?)`,
            [codigo, nombre, categoria, Number(precio_extra) || 0]
        );
        return result.insertId;
    }

    // crea una habitacion y le asocia sus comodidades dentro de una transaccion
    static async createRoomWithAmenities(roomData, amenityIds = []) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // si el id del tipo no existe pero viene el nombre, busca o crea el tipo en la base de datos
            let finalIdTipo = roomData.id_tipo;
            if (!finalIdTipo && roomData.tipo_nombre) {
                const [tipos] = await connection.execute(`SELECT id_tipo FROM tipos_habitacion WHERE nombre = ?`, [roomData.tipo_nombre]);
                if (tipos.length > 0) {
                    finalIdTipo = tipos[0].id_tipo;
                } else {
                    const [ins] = await connection.execute(`INSERT INTO tipos_habitacion (nombre, precio_base) VALUES (?, ?)`, [roomData.tipo_nombre, roomData.precio_noche]);
                    finalIdTipo = ins.insertId;
                }
            }

            // inserta la habitacion con estado inicial LIBRE
            await connection.execute(
                `INSERT INTO habitaciones (nro_habitacion, id_tipo, piso, precio_noche, estado) 
                 VALUES (?, ?, ?, ?, 'LIBRE')`,
                [roomData.nro_habitacion, finalIdTipo || 1, roomData.piso, roomData.precio_noche]
            );

            // inserta la relacion de comodidades si se seleccionaron
            if (amenityIds.length > 0) {
                const values = amenityIds.map(id => `(${roomData.nro_habitacion}, ${Number(id)})`).join(',');
                await connection.query(
                    `INSERT INTO habitacion_comodidad (nro_habitacion, id_comodidad) VALUES ${values}`
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // elimina una habitacion unicamente si su estado actual es LIBRE
    static async deleteRoom(nro_habitacion) {
        const [result] = await pool.execute(
            `DELETE FROM habitaciones WHERE nro_habitacion = ? AND estado = 'LIBRE'`,
            [nro_habitacion]
        );
        return result.affectedRows > 0;
    }
}
