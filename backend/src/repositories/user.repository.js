import { pool } from '../config/db.js';

export class UserRepository {
    // Busca un usuario por DNI, Usuario (Username) y Contraseña para el login de 3 campos
    static async findByDniUsuarioAndPass(dni, usuario, pass) {
        const dniClean = (dni || '').trim();
        const userClean = (usuario || '').trim().toLowerCase();
        const passClean = (pass || '').trim();

        if (!dniClean || !passClean) return null;
        
        // 1. Búsqueda por DNI y Contraseña
        let [rows] = await pool.execute(
            `SELECT u.id_usuario, u.dni, u.username, u.contraseña AS pass, u.nombre, c.tipo_cargo AS rol
             FROM usuario u
             JOIN cargos c ON u.cargo = c.id_cargo
             WHERE TRIM(u.dni) = ? AND TRIM(u.contraseña) = ?`,
            [dniClean, passClean]
        );

        if (rows.length > 0) {
            const u = rows[0];
            // Asegurar que el nombre de usuario esté guardado en la BD si estaba vacío
            if (!u.username || u.username.trim() === '') {
                const newUsername = userClean || u.nombre.toLowerCase().split(' ')[0];
                await pool.execute(`UPDATE usuario SET username = ? WHERE id_usuario = ?`, [newUsername, u.id_usuario]);
                u.username = newUsername;
            }
            return u;
        }

        return null;
    }

    // Obtiene todos los usuarios con su rol y username
    static async getAll() {
        const [rows] = await pool.execute(
            `SELECT u.dni, u.username, u.contraseña AS pass, u.nombre, c.tipo_cargo AS rol
             FROM usuario u
             JOIN cargos c ON u.cargo = c.id_cargo
             ORDER BY u.id_usuario ASC`
        );
        return rows;
    }

    // Busca un usuario por DNI
    static async findByDni(dni) {
        const [rows] = await pool.execute(
            `SELECT u.id_usuario, u.dni, u.username, u.contraseña AS pass, u.nombre, c.tipo_cargo AS rol
             FROM usuario u
             JOIN cargos c ON u.cargo = c.id_cargo
             WHERE u.dni = ?`,
            [dni]
        );
        return rows[0] || null;
    }

    // Crea un nuevo usuario
    static async create({ nombre, username, dni, pass, rol }) {
        const [cargos] = await pool.execute(`SELECT id_cargo FROM cargos WHERE tipo_cargo = ?`, [rol || 'RECEPCION']);
        const cargoId = cargos.length > 0 ? cargos[0].id_cargo : 2;

        const partesNombre = (nombre || '').split(' ');
        const nom = partesNombre[0] || nombre;
        const ape = partesNombre.slice(1).join(' ') || 'Sistema';
        const userCode = (username || nom).toLowerCase();
        const correo = `${dni}@hotel.com`;

        const [result] = await pool.execute(
            `INSERT INTO usuario (nombre, apellido, username, contraseña, correo, dni, cargo)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nom, ape, userCode, pass, correo, dni, cargoId]
        );
        return result.insertId;
    }

    // Actualiza un usuario existente por DNI
    static async updateByDni(dni, { nombre, username, pass, rol }) {
        const [cargos] = await pool.execute(`SELECT id_cargo FROM cargos WHERE tipo_cargo = ?`, [rol || 'RECEPCION']);
        const cargoId = cargos.length > 0 ? cargos[0].id_cargo : 2;

        const partesNombre = (nombre || '').split(' ');
        const nom = partesNombre[0] || nombre;
        const ape = partesNombre.slice(1).join(' ') || 'Sistema';
        const userCode = (username || nom).toLowerCase();

        const [result] = await pool.execute(
            `UPDATE usuario
             SET nombre = ?, apellido = ?, username = ?, contraseña = ?, cargo = ?
             WHERE dni = ?`,
            [nom, ape, userCode, pass, cargoId, dni]
        );
        return result.affectedRows > 0;
    }
}
