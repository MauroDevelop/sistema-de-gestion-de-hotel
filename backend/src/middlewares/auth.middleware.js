// middlewares de autenticacion y control de acceso por rol
import jwt from 'jsonwebtoken';

// verifica que la peticion traiga un token Bearer JWT valido en el encabezado Authorization
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // si no hay token enviado, retorna error 401 no autorizado
    if (!token) {
        return res.status(401).json({ success: false, message: 'Acceso no autorizado: Token no provisto' });
    }

    // verifica la firma y expiracion del token
    jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret_hotel_evolution_2026', (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
        }
        // adjunta los datos del usuario decodificado a la peticion Express
        req.user = user;
        next();
    });
};

// verifica que el usuario autenticado tenga el rol de ADMIN
export const requireAdmin = (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Requiere permisos de Administrador' });
    }
    next();
};
