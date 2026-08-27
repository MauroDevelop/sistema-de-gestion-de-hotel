// archivo principal de entrada del servidor Express
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// importacion de los modulos de rutas del sistema
import authRoutes from './routes/auth.routes.js';
import habitacionRoutes from './routes/habitacion.routes.js';
import reservaRoutes from './routes/reserva.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';

// inicializa la lectura de variables de entorno desde el archivo .env
dotenv.config();

// crea la instancia principal de la aplicacion Express
const app = express();

// habilita CORS para permitir peticiones desde el frontend (Vite React)
app.use(cors());

// habilita la lectura de cuerpos de peticion en formato JSON
app.use(express.json());

// registro y montaje de las rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/habitaciones', habitacionRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/usuarios', usuarioRoutes);

// manejador global para rutas 404 no encontradas
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint no encontrado' });
});

// manejador global de errores del servidor (catch 500)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

// obtiene el puerto desde las variables de entorno o usa el 3000 por defecto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor backend ejecutándose en el puerto ${PORT}`);
});

export default app;
