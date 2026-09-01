// definicion de rutas protegidas para reservas, check-in, check-out y huespedes
import { Router } from 'express';
import { ReservaController } from '../controllers/reserva.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// obtiene el historial completo de reservas (requiere token de sesion)
router.get('/', verifyToken, ReservaController.getAll);

// obtiene la lista de huespedes y sus habitaciones alojadas (requiere token)
router.get('/huespedes', verifyToken, ReservaController.getHuespedes);

// registra un nuevo check-in (requiere token)
router.post('/checkin', verifyToken, ReservaController.checkIn);

// procesa la salida check-out de un huesped (requiere token)
router.post('/:id/checkout', verifyToken, ReservaController.checkOut);

export default router;
