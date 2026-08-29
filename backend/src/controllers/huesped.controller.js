import { HuespedRepository } from '../repositories/huesped.repository.js';
import { LogRepository } from '../repositories/log.repository.js';

export class HuespedController {
    // GET /api/huespedes
    static async getAll(req, res) {
        try {
            const data = await HuespedRepository.getAll();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // POST /api/huespedes
    static async create(req, res) {
        try {
            const { nombre, dni, habitacion_id, ingreso, salida, comida, descuento } = req.body;

            if (!nombre || !dni || !habitacion_id || !ingreso) {
                return res.status(400).json({ message: 'Nombre, DNI, habitación y fecha de ingreso son requeridos.' });
            }

            const result = await HuespedRepository.createHuespedConReserva({
                nombre,
                dni,
                habitacion_id: Number(habitacion_id),
                ingreso,
                salida,
                comida,
                descuento: Number(descuento) || 0
            });

            await LogRepository.create('Recepcion', `Registro de huésped: ${nombre} (Hab. ${habitacion_id})`);

            return res.status(201).json(result);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}
