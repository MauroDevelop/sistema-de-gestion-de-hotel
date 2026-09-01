import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller.js';

const router = Router();

router.get('/', UsuarioController.getLogs);

export default router;
