// controlador de endpoints para reservas, check-in, check-out y listado de huéspedes
import { ReservaService } from '../services/reserva.service.js';
import { ReservaRepository } from '../repositories/reserva.repository.js';
import { HuespedRepository } from '../repositories/huesped.repository.js';

export class ReservaController {
    // GET /api/reservas - obtiene el historial completo de reservas
    static async getAll(req, res) {
        try {
            const data = await ReservaRepository.getAll();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // GET /api/reservas/huespedes - obtiene el directorio de huespedes con su habitacion ocupada
    static async getHuespedes(req, res) {
        try {
            const data = await HuespedRepository.getAll(req.query.search);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // POST /api/reservas/checkin - registra un nuevo check-in
    static async checkIn(req, res) {
        try {
            const result = await ReservaService.registrarCheckIn(req.body, req.user.id);
            return res.status(201).json({ success: true, message: 'Check-in registrado con éxito', data: result });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    // POST /api/reservas/:id/checkout - finaliza la estancia y libera la habitacion
    static async checkOut(req, res) {
        try {
            const idReserva = parseInt(req.params.id);
            const result = await ReservaService.procesarCheckOut(idReserva, req.user.id);
            return res.status(200).json({ success: true, message: 'Check-out procesado con éxito', data: result });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
}
