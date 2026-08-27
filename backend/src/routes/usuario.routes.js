// definicion de rutas para la administracion de usuarios y auditoria
import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller.js';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// obtiene todo el personal registrado (requiere token y rol ADMIN)
router.get('/', [verifyToken, requireAdmin], UsuarioController.getAll);

// crea un nuevo usuario del sistema (requiere token y rol ADMIN)
router.post('/', [verifyToken, requireAdmin], UsuarioController.create);

// obtiene los logs de auditoria del sistema (requiere token y rol ADMIN)
router.get('/logs', [verifyToken, requireAdmin], UsuarioController.getLogs);

export default router;
