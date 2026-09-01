import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();

// Soporta POST / en la ruta montada /api/login y /login
router.post('/', AuthController.login);
router.post('/login', AuthController.login);

export default router;
