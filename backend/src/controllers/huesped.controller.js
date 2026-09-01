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

    // POST /api/huespedes (Check-in)
    static async create(req, res) {
        try {
            const { nombre, dni, direccion, posee_vehiculo, vehiculo_modelo, patente, habitacion_id, ingreso, salida } = req.body;

            if (!nombre || !dni || !habitacion_id || !ingreso) {
                return res.status(400).json({ message: 'Nombre, DNI, Habitación y Fecha de Llegada son requeridos.' });
            }

            const result = await HuespedRepository.createHuespedConReserva({
                nombre,
                dni,
                direccion,
                posee_vehiculo,
                vehiculo_modelo,
                patente,
                habitacion_id: Number(habitacion_id),
                ingreso,
                salida
            });

            await LogRepository.create('Recepcion', `Check-in de huésped: ${nombre} (Hab. #${habitacion_id})`);

            return res.status(201).json(result);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    // POST /api/huespedes/checkout/:id
    static async checkout(req, res) {
        try {
            const id = parseInt(req.params.id);
            const result = await HuespedRepository.checkoutHuesped(id);
            
            await LogRepository.create('Recepcion', `Check-out realizado: ${result.huesped} (Hab. #${result.habitacion_id})`);

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}
