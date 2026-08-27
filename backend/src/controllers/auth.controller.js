// controlador de endpoints de autenticacion
import { AuthService } from '../services/auth.service.js';

export class AuthController {
    // atiende la ruta POST /api/auth/login
    static async login(req, res) {
        try {
            // desestructura credenciales del cuerpo de la peticion HTTP
            const { correo, dni, password } = req.body;
            // obtiene la IP del cliente para registrar en logs de auditoria
            const ip = req.ip || req.connection.remoteAddress;
            // invoca el servicio de autenticacion
            const result = await AuthService.login(correo, dni, password, ip);
            // retorna respuesta exitosa 200 con el token y datos del usuario
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            // si hay credenciales invalidas u otro error, retorna estado 401
            return res.status(401).json({ success: false, message: error.message });
        }
    }
}
