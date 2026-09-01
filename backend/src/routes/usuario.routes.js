import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller.js';

const router = Router();

router.get('/', UsuarioController.getAll);
router.post('/', UsuarioController.create);
router.put('/:dni', UsuarioController.update);

export default router;
