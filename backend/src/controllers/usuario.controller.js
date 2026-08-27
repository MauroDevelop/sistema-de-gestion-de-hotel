// controlador para gestion de usuarios y logs del sistema
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository.js';

export class UsuarioController {
    // GET /api/usuarios - obtiene todo el personal registrado (Admin solo)
    static async getAll(req, res) {
        try {
            const data = await UserRepository.getAll();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // GET /api/usuarios/logs - obtiene los logs de auditoria del sistema
    static async getLogs(req, res) {
        try {
            const limit = req.query.limit || 50;
            const data = await UserRepository.getLogs(limit);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // POST /api/usuarios - crea un nuevo usuario del sistema (Admin solo)
    static async create(req, res) {
        try {
            const { nombre, dni, correo, password, id_rol } = req.body;
            if (!nombre || !dni || !correo || !password || !id_rol) {
                return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
            }

            // genera la sal y el hash de la contraseña usando bcryptjs
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // crea el usuario en la base de datos
            await UserRepository.create({ nombre, dni, correo, password_hash, id_rol });

            // registra la operacion en logs de auditoria
            await UserRepository.logAction(req.user.id, `Creación de usuario: ${nombre} (${dni})`, req.ip);

            return res.status(201).json({ success: true, message: 'Usuario creado exitosamente' });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
}
