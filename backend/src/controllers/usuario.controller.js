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
            const { nombre, dni, pass, rol } = req.body;
            if (!nombre || !dni || !pass) {
                return res.status(400).json({ message: 'Nombre, DNI y contraseña son obligatorios.' });
            }

            const existing = await UserRepository.findByDni(dni);
            if (existing) {
                return res.status(400).json({ message: 'El usuario ya está registrado' });
            }

            await UserRepository.create({ nombre, dni, pass, rol: rol || 'USER' });
            await LogRepository.create('Admin', `Creación de usuario: ${nombre} (${dni})`);

            return res.status(201).json({ nombre, dni, pass, rol: rol || 'USER' });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    // PUT /api/usuarios/:dni
    static async update(req, res) {
        try {
            const dni = req.params.dni;
            const { nombre, pass, rol } = req.body;

            const existing = await UserRepository.findByDni(dni);
            if (!existing) {
                return res.status(404).json({ message: 'El usuario no existe' });
            }

            await UserRepository.updateByDni(dni, {
                nombre: nombre || existing.nombre,
                pass: pass || existing.pass,
                rol: rol || existing.rol
            });

            await LogRepository.create('Admin', `Actualización de usuario: ${nombre || existing.nombre} (${dni})`);

            return res.status(200).json({
                nombre: nombre || existing.nombre,
                dni,
                pass: pass || existing.pass,
                rol: rol || existing.rol
            });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}
