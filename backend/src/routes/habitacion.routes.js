import { Router } from 'express';
import { HabitacionController } from '../controllers/habitacion.controller.js';

const router = Router();

router.get('/', HabitacionController.getAll);
router.post('/', HabitacionController.create);
router.put('/:id', HabitacionController.update);
router.delete('/:id', HabitacionController.delete);

export default router;
