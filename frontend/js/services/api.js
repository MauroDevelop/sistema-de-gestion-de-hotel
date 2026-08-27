import { db } from '../data/db.js';

export const api = {
    // BACKEND: Petición a la base de datos para verificar las credenciales (dni y pass) y devolver el usuario si existe
    login: async (dni, pass) => db.usuarios.find(u => u.dni === dni && u.pass === pass),

    // --- FUNCIONES PARA HABITACIONES ---
    // BACKEND: Petición a la base de datos para obtener la lista de todas las habitaciones
    getHabitaciones: async () => [...db.habitaciones],

    // BACKEND: Petición a tu base de datos para agregar una nueva habitación (POST /api/habitaciones)
    addHabitacion: async (data) => {
        if(db.habitaciones.find(h => h.id === data.id)) throw new Error('El ID de habitación ya existe');
        const nueva = {
            id: data.id, 
            tipo: data.tipo, 
            precio: data.precio, 
            estado: 'LIBRE',
            caracteristicas: data.caracteristicas // Ya no hacemos .split() acá
        };
        db.habitaciones.push(nueva);
        return nueva;
    },

    // BACKEND: Petición a la base de datos para eliminar una habitación por su ID
    deleteHabitacion: async (id) => {
        db.habitaciones = db.habitaciones.filter(h => h.id !== id);
    },

    // --- FUNCIONES PARA HUESPEDES ---
    // BACKEND: Petición a la base de datos para obtener la lista de todos los huéspedes
    getHuespedes: async () => [...db.huespedes],

    // BACKEND: Petición la base de datos para registrar un nuevo huésped, asignándole una habitación disponible y actualizando el estado de la habitación a ocupada
    addHuesped: async (data) => {
        const hab = db.habitaciones.find(h => h.id === data.habitacion_id);
        if(!hab || hab.estado === 'OCUPADA') throw new Error('La habitación no está disponible');

        data.id = db.huespedes.length + 1;
        data.estado = 'ACTIVO';
        db.huespedes.push(data);

        hab.estado = 'OCUPADA';
        return data;
    },

    // --- FUNCIONES PARA EMPLEADOS ---
    // BACKEND: Petición a la base de datos para obtener la lista de todos los usuarios (empleados)
    getUsuarios: async () => [...db.usuarios],

    // BACKEND: Petición a la base de datos para obtener el historial de actividad del sistema
    getLogs: async () => [...db.logs],

   // BACKEND: Petición a la base de datos para CREAR un nuevo usuario (POST /api/usuarios)
    createUsuario: async (data) => {
        const existe = db.usuarios.find(u => u.dni === data.dni);
        if (existe) throw new Error('El usuario ya está registrado');
        db.usuarios.push(data);
    },

    // BACKEND: Petición a la base de datos para ACTUALIZAR un usuario (PUT /api/usuarios/:dni)
    updateUsuario: async (data) => {
        const existeIndex = db.usuarios.findIndex(u => u.dni === data.dni);
        if (existeIndex >= 0) {
            db.usuarios[existeIndex] = data; 
        } else {
            throw new Error('El usuario no existe');
        }
    }
};