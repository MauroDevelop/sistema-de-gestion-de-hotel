// servicio de autenticacion con bcryptjs para contraseñas y jsonwebtoken para tokens
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository.js';

export class AuthService {
    // autenticacion con 3 factores: Correo, DNI y Contraseña
    static async login(correo, dni, password, ip = null) {
        // comprobacion inicial de que los tres datos vengan presentes
        if (!correo || !dni || !password) {
            throw new Error('Correo, DNI y Contraseña son obligatorios para el ingreso.');
        }

        // busca el usuario activo en la base de datos usando correo y dni
        const user = await UserRepository.findByCredentials(correo.trim().toLowerCase(), String(dni).trim());
        if (!user) {
            throw new Error('Credenciales inválidas. Verifique correo, DNI y contraseña.');
        }

        // compara la contraseña en texto plano recibida contra el hash bcrypt almacenado
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Credenciales inválidas. Verifique correo, DNI y contraseña.');
        }

        // datos que se guardan dentro del token JWT desencriptable en el frontend/backend
        const payload = {
            id: user.id_usuario,
            dni: user.dni,
            correo: user.correo,
            nombre: user.nombre,
            rol: user.rol
        };

        // firma el token con la clave secreta y le establece un tiempo de expiracion de 12 horas
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'jwt_secret_hotel_evolution_2026',
            { expiresIn: '12h' }
        );

        // registra la accion de inicio de sesion exitoso en los logs de auditoria del sistema
        await UserRepository.logAction(user.id_usuario, 'Inicio de sesión exitoso', ip);

        // retorna el token generado y los datos de perfil del usuario
        return {
            token,
            user: {
                id: user.id_usuario,
                nombre: user.nombre,
                dni: user.dni,
                correo: user.correo,
                rol: user.rol
            }
        };
    }
}
