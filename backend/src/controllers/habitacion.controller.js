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

    // PUT /api/habitaciones/:id
    static async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { tipo, precio, estado, caracteristicas } = req.body;
            
            const ok = await RoomRepository.update(id, {
                tipo,
                precio: Number(precio),
                estado,
                caracteristicas: caracteristicas || []
            });

            if (!ok) {
                return res.status(404).json({ message: 'Habitación no encontrada' });
            }

            await LogRepository.create('Admin', `Modificación de datos de habitación #${id}`);
            return res.status(200).json({ success: true, message: 'Habitación actualizada' });
        } catch (error) {
            return res.status(500).json({ message: error.message });
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

    // GET /api/caracteristicas (Catálogo premeditado)
    static async getCatalogo(req, res) {
        try {
            const data = await RoomRepository.getCatalogoCaracteristicas();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // POST /api/caracteristicas (Añadir al catálogo premeditado)
    static async addCatalogo(req, res) {
        try {
            const { nombre } = req.body;
            if (!nombre || !nombre.trim()) {
                return res.status(400).json({ message: 'El nombre de la característica es obligatorio' });
            }
            const created = await RoomRepository.addCaracteristicaCatalogo(nombre.trim());
            await LogRepository.create('Admin', `Nueva característica añadida al catálogo: ${nombre.trim()}`);
            return res.status(201).json(created);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
