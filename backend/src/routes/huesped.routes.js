import { Router } from 'express';
import { HuespedController } from '../controllers/huesped.controller.js';

const router = Router();

router.get('/', HuespedController.getAll);
router.post('/', HuespedController.create);

export default router;
