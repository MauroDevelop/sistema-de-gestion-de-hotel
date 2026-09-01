import { UserRepository } from '../repositories/user.repository.js';
import { LogRepository } from '../repositories/log.repository.js';

export class UsuarioController {
    // GET /api/usuarios
    static async getAll(req, res) {
        try {
            const data = await UserRepository.getAll();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // GET /api/logs
    static async getLogs(req, res) {
        try {
            const limit = req.query.limit || 50;
            const data = await LogRepository.getAll(limit);
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // POST /api/usuarios
    static async create(req, res) {
        try {
            const { nombre, username, dni, pass, rol } = req.body;
            if (!nombre || !dni || !pass) {
                return res.status(400).json({ message: 'Nombre, DNI y contraseña son obligatorios.' });
            }

            const existing = await UserRepository.findByDni(dni);
            if (existing) {
                return res.status(400).json({ message: 'El usuario ya está registrado' });
            }

            const userCode = username || nombre.toLowerCase().split(' ')[0];

            await UserRepository.create({ nombre, username: userCode, dni, pass, rol: rol || 'RECEPCION' });
            await LogRepository.create('Admin', `Creación de usuario: ${nombre} (${userCode}) - DNI: ${dni}`);

            return res.status(201).json({ nombre, username: userCode, dni, pass, rol: rol || 'RECEPCION' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    // PUT /api/usuarios/:dni
    static async update(req, res) {
        try {
            const dni = req.params.dni;
            const { nombre, username, pass, rol } = req.body;

            const existing = await UserRepository.findByDni(dni);
            if (!existing) {
                return res.status(404).json({ message: 'El usuario no existe' });
            }

            const userCode = username || existing.username || (nombre || existing.nombre).toLowerCase().split(' ')[0];

            await UserRepository.updateByDni(dni, {
                nombre: nombre || existing.nombre,
                username: userCode,
                pass: pass || existing.pass,
                rol: rol || existing.rol
            });

            await LogRepository.create('Admin', `Actualización de usuario: ${nombre || existing.nombre} (${dni})`);

            return res.status(200).json({
                nombre: nombre || existing.nombre,
                username: userCode,
                dni,
                pass: pass || existing.pass,
                rol: rol || existing.rol
            });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}
