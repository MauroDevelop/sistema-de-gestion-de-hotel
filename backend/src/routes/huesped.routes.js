import { Router } from 'express';
import { HuespedController } from '../controllers/huesped.controller.js';

const router = Router();

router.get('/', HuespedController.getAll);
router.get('/buscar/:dni', HuespedController.getByDni);
router.post('/', HuespedController.create);
router.post('/checkout/:id', HuespedController.checkout);

export default router;
