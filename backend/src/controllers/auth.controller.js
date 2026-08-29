import { UserRepository } from '../repositories/user.repository.js';
import { LogRepository } from '../repositories/log.repository.js';

export class AuthController {
    // POST /api/login
    static async login(req, res) {
        try {
            const { dni, pass } = req.body;
            if (!dni || !pass) {
                return res.status(400).json({ message: 'DNI y contraseña son requeridos' });
            }

            const user = await UserRepository.findByDniAndPass(dni, pass);
            if (!user) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            await LogRepository.create(user.nombre, `Inicio de sesión exitoso`);
            
            return res.status(200).json({
                dni: user.dni,
                pass: user.pass,
                nombre: user.nombre,
                rol: user.rol
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
