import { UserRepository } from '../repositories/user.repository.js';
import { LogRepository } from '../repositories/log.repository.js';

export class AuthController {
    // POST /api/login (Requiere 3 campos: DNI, Usuario, Contraseña)
    static async login(req, res) {
        try {
            const { dni, usuario, pass } = req.body;
            const userInput = usuario || req.body.username || req.body.user;
            
            if (!dni || !userInput || !pass) {
                return res.status(400).json({ message: 'Se requieren los 3 datos: DNI, Usuario y Contraseña.' });
            }

            const user = await UserRepository.findByDniUsuarioAndPass(dni, userInput, pass);
            if (!user) {
                return res.status(401).json({ message: 'Credenciales inválidas. Verifique DNI, Usuario y Contraseña.' });
            }

            await LogRepository.create(user.nombre, `Inicio de turno / sesión exitoso`);
            
            return res.status(200).json({
                dni: user.dni,
                username: user.username,
                pass: user.pass,
                nombre: user.nombre,
                rol: user.rol
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
