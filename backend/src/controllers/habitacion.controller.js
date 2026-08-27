// controlador de endpoints para habitaciones y comodidades
import { RoomRepository } from '../repositories/room.repository.js';
import { HabitacionService } from '../services/habitacion.service.js';
import { UserRepository } from '../repositories/user.repository.js';

export class HabitacionController {
    // GET /api/habitaciones - obtiene todas las habitaciones filtradas
    static async getAll(req, res) {
        try {
            const data = await RoomRepository.getAll(req.query);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // GET /api/habitaciones/comodidades - obtiene el catalogo de comodidades
    static async getComodidades(req, res) {
        try {
            const data = await RoomRepository.getCatalogoComodidades();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // funcion auxiliar para convertir el nombre de comodidad en un codigo slug sin tildes
    static fontEncodingSlug(str) {
        return str.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "_");
    }

    // POST /api/habitaciones/comodidades - registra una nueva comodidad en el catalogo
    static async createComodidad(req, res) {
        try {
            const { nombre, categoria, precio_extra } = req.body;
            if (!nombre || !categoria) {
                return res.status(400).json({ success: false, message: 'El nombre y la categoría de la comodidad son obligatorios.' });
            }

            const codigo = HabitacionController.fontEncodingSlug(nombre);
            const idComodidad = await RoomRepository.createComodidad({
                codigo,
                nombre: nombre.trim(),
                categoria,
                precio_extra: Number(precio_extra) || 0
            });

            // registra la accion en logs de auditoria
            await UserRepository.logAction(req.user.id, `Creación de Comodidad: ${nombre} (${categoria})`, req.ip);
            return res.status(201).json({ success: true, message: 'Comodidad creada con éxito', data: { id_comodidad: idComodidad } });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    // POST /api/habitaciones - crea una nueva habitacion con sus comodidades
    static async create(req, res) {
        try {
            const datosValidados = HabitacionService.validarHabitacion(req.body);
            const amenities = HabitacionService.filtrarComodidadesIds(req.body.comodidades);

            await RoomRepository.createRoomWithAmenities({
                ...datosValidados,
                tipo_nombre: req.body.tipo_nombre
            }, amenities);

            // registra la operacion en logs de auditoria
            await UserRepository.logAction(req.user.id, `Creación de Habitación #${datosValidados.nro_habitacion}`, req.ip);

            return res.status(201).json({ success: true, message: 'Habitación creada con éxito' });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    // DELETE /api/habitaciones/:nro - elimina una habitacion libre
    static async delete(req, res) {
        try {
            const nro = parseInt(req.params.nro);
            const deleted = await RoomRepository.deleteRoom(nro);

            if (!deleted) {
                return res.status(400).json({ success: false, message: 'No se puede eliminar la habitación (no existe o está ocupada).' });
            }

            await UserRepository.logAction(req.user.id, `Eliminación de Habitación #${nro}`, req.ip);
            return res.status(200).json({ success: true, message: 'Habitación eliminada correctamente' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
