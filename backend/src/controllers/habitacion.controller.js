import { RoomRepository } from '../repositories/room.repository.js';
import { LogRepository } from '../repositories/log.repository.js';

export class HabitacionController {
    // GET /api/habitaciones
    static async getAll(req, res) {
        try {
            const data = await RoomRepository.getAll();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // POST /api/habitaciones
    static async create(req, res) {
        try {
            const { id, tipo, precio, caracteristicas } = req.body;
            
            if (!tipo || !precio) {
                return res.status(400).json({ message: 'Tipo y precio son obligatorios.' });
            }

            const existing = id ? await RoomRepository.findById(id) : null;
            if (existing) {
                return res.status(400).json({ message: 'El ID de habitación ya existe' });
            }

            // Genera ID si no viene especificado
            let newId = id;
            if (!newId) {
                const all = await RoomRepository.getAll();
                const maxId = all.reduce((max, h) => (h.id > max ? h.id : max), 100);
                newId = maxId + 1;
            }

            const created = await RoomRepository.create({
                id: newId,
                tipo,
                precio: Number(precio),
                caracteristicas: caracteristicas || []
            });

            await LogRepository.create('Admin', `Creación de habitación #${created.id}`);

            return res.status(201).json(created);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    // DELETE /api/habitaciones/:id
    static async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            const deleted = await RoomRepository.deleteById(id);

            if (!deleted) {
                return res.status(400).json({ message: 'No se puede eliminar la habitación (no existe o está ocupada).' });
            }

            await LogRepository.create('Admin', `Eliminación de habitación #${id}`);
            return res.status(200).json({ message: 'Habitación eliminada correctamente' });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
