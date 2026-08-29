const BASE_URL = 'http://localhost:3000/api';

export const api = {
    // BACKEND: Petición a la API para verificar credenciales (dni y pass)
    login: async (dni, pass) => {
        try {
            const res = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni, pass })
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error('Error en login fetch:', e);
            return null;
        }
    },

    // --- FUNCIONES PARA HABITACIONES ---
    getHabitaciones: async () => {
        const res = await fetch(`${BASE_URL}/habitaciones`);
        if (!res.ok) throw new Error('Error al obtener habitaciones');
        return await res.json();
    },

    addHabitacion: async (data) => {
        const res = await fetch(`${BASE_URL}/habitaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Error al agregar habitación');
        }
        return await res.json();
    },

    deleteHabitacion: async (id) => {
        const res = await fetch(`${BASE_URL}/habitaciones/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Error al eliminar habitación');
        }
        return await res.json();
    },

    // --- FUNCIONES PARA HUESPEDES ---
    getHuespedes: async () => {
        const res = await fetch(`${BASE_URL}/huespedes`);
        if (!res.ok) throw new Error('Error al obtener huéspedes');
        return await res.json();
    },

    addHuesped: async (data) => {
        const res = await fetch(`${BASE_URL}/huespedes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Error al registrar huésped');
        }
        return await res.json();
    },

    // --- FUNCIONES PARA EMPLEADOS Y LOGS ---
    getUsuarios: async () => {
        const res = await fetch(`${BASE_URL}/usuarios`);
        if (!res.ok) throw new Error('Error al obtener usuarios');
        return await res.json();
    },

    getLogs: async () => {
        const res = await fetch(`${BASE_URL}/logs`);
        if (!res.ok) throw new Error('Error al obtener logs');
        return await res.json();
    },

    createUsuario: async (data) => {
        const res = await fetch(`${BASE_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Error al crear usuario');
        }
        return await res.json();
    },

    updateUsuario: async (data) => {
        const res = await fetch(`${BASE_URL}/usuarios/${data.dni}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Error al actualizar usuario');
        }
        return await res.json();
    }
};