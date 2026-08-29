import { pool } from '../config/db.js';

export class UserRepository {
    // Busca un usuario por DNI y Contraseña para login
    static async findByDniAndPass(dni, pass) {
        const [rows] = await pool.execute(
            `SELECT u.id_usuario, u.dni, u.contraseña AS pass, u.nombre, c.tipo_cargo AS rol
             FROM usuario u
             JOIN cargos c ON u.cargo = c.id_cargo
             WHERE u.dni = ? AND u.contraseña = ?`,
            [dni, pass]
        );
        return rows[0] || null;
    }

    // Obtiene todos los usuarios con su rol
    static async getAll() {
        const [rows] = await pool.execute(
            `SELECT u.dni, u.contraseña AS pass, u.nombre, c.tipo_cargo AS rol
             FROM usuario u
             JOIN cargos c ON u.cargo = c.id_cargo
             ORDER BY u.id_usuario ASC`
        );
        return rows;
    }

    // Busca un usuario por DNI
    static async findByDni(dni) {
        const [rows] = await pool.execute(
            `SELECT u.id_usuario, u.dni, u.contraseña AS pass, u.nombre, c.tipo_cargo AS rol
             FROM usuario u
             JOIN cargos c ON u.cargo = c.id_cargo
             WHERE u.dni = ?`,
            [dni]
        );
        return rows[0] || null;
    }

    // Crea un nuevo usuario
    static async create({ nombre, dni, pass, rol }) {
        // Obtiene id_cargo según tipo_cargo (ADMIN o USER)
        const [cargos] = await pool.execute(`SELECT id_cargo FROM cargos WHERE tipo_cargo = ?`, [rol || 'USER']);
        const cargoId = cargos.length > 0 ? cargos[0].id_cargo : 2;

        const partesNombre = (nombre || '').split(' ');
        const nom = partesNombre[0] || nombre;
        const ape = partesNombre.slice(1).join(' ') || 'Sistema';
        const correo = `${dni}@hotel.com`;

        const [result] = await pool.execute(
            `INSERT INTO usuario (nombre, apellido, contraseña, correo, dni, cargo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nom, ape, pass, correo, dni, cargoId]
        );
        return result.insertId;
    }

    // Actualiza un usuario existente por DNI
    static async updateByDni(dni, { nombre, pass, rol }) {
        const [cargos] = await pool.execute(`SELECT id_cargo FROM cargos WHERE tipo_cargo = ?`, [rol || 'USER']);
        const cargoId = cargos.length > 0 ? cargos[0].id_cargo : 2;

        const partesNombre = (nombre || '').split(' ');
        const nom = partesNombre[0] || nombre;
        const ape = partesNombre.slice(1).join(' ') || 'Sistema';

        const [result] = await pool.execute(
            `UPDATE usuario
             SET nombre = ?, apellido = ?, contraseña = ?, cargo = ?
             WHERE dni = ?`,
            [nom, ape, pass, cargoId, dni]
        );
        return result.affectedRows > 0;
    }
}
