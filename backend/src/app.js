import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './config/dbInit.js';

import authRoutes from './routes/auth.routes.js';
import habitacionRoutes from './routes/habitacion.routes.js';
import huespedRoutes from './routes/huesped.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import logRoutes from './routes/log.routes.js';
import { HabitacionController } from './controllers/habitacion.controller.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
let frontendPath = path.resolve(process.cwd(), '../frontend');
if (!fs.existsSync(frontendPath)) {
    frontendPath = path.resolve(process.cwd(), 'frontend');
}
app.use(express.static(frontendPath));

// Montar rutas tanto en / como en /api para máxima compatibilidad con el frontend
app.use('/login', authRoutes);
app.use('/api/login', authRoutes);

app.use('/habitaciones', habitacionRoutes);
app.use('/api/habitaciones', habitacionRoutes);

// Rutas de catálogo de características premeditadas
app.get('/caracteristicas', HabitacionController.getCatalogo);
app.get('/api/caracteristicas', HabitacionController.getCatalogo);
app.post('/caracteristicas', HabitacionController.addCatalogo);
app.post('/api/caracteristicas', HabitacionController.addCatalogo);

app.use('/huespedes', huespedRoutes);
app.use('/api/huespedes', huespedRoutes);

app.use('/usuarios', usuarioRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.use('/logs', logRoutes);
app.use('/api/logs', logRoutes);

// Manejador global de errores (catch 500)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor backend ejecutándose en el puerto ${PORT}`);
    });
});

export default app;
