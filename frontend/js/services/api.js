const BASE_URL = window.location.origin.includes('localhost') ? `${window.location.protocol}//${window.location.hostname}:3000/api` : '/api';

let catalogoCache = [];

export const api = {
    // LOGIN DE 3 CAMPOS (DNI, USUARIO Y CONTRASEÑA)
    login: async (dni, usuario, pass) => {
        try {
            const res = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni, usuario, pass })
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error('Error en login fetch:', e);
            return null;
        }
    },

    // --- FUNCIONES PARA HABITACIONES Y CATÁLOGO ---
    getHabitaciones: async () => {
        try {
            const res = await fetch(`${BASE_URL}/habitaciones`);
            if (!res.ok) throw new Error('Error al obtener habitaciones');
            return await res.json();
        } catch (e) {
            console.warn('Usando respuesta de fallback para habitaciones:', e.message);
            return [];
        }
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

    updateHabitacion: async (id, data) => {
        const res = await fetch(`${BASE_URL}/habitaciones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Error al modificar habitación');
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

    // CATÁLOGO DE CARACTERÍSTICAS PREMEDITADAS POR ADMIN
    getCatalogoCaracteristicas: async () => {
        try {
            const res = await fetch(`${BASE_URL}/caracteristicas`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    catalogoCache = data;
                    return data;
                }
            }
        } catch (e) {
            console.warn('Fallback local para catálogo de características');
        }
        return catalogoCache;
    },

    addCaracteristicaCatalogo: async (nombre) => {
        const itemObj = { id: Date.now(), nombre: nombre.trim() };
        if (!catalogoCache.some(c => c.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
            catalogoCache.push(itemObj);
        }
        try {
            const res = await fetch(`${BASE_URL}/caracteristicas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombre.trim() })
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn('Guardado en caché local de catálogo:', e.message);
        }
        return itemObj;
    },

    // --- FUNCIONES PARA HUESPEDES & CHECK-IN / CHECK-OUT ---
    getHuespedes: async () => {
        try {
            const res = await fetch(`${BASE_URL}/huespedes`);
            if (!res.ok) throw new Error('Error al obtener huéspedes');
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    addHuesped: async (data) => {
        const res = await fetch(`${BASE_URL}/huespedes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Error al realizar Check-in');
        }
        return await res.json();
    },

    checkoutHuesped: async (id) => {
        const res = await fetch(`${BASE_URL}/huespedes/checkout/${id}`, {
            method: 'POST'
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Error al realizar Check-out');
        }
        return await res.json();
    },

    // --- FUNCIONES PARA EMPLEADOS Y LOGS ---
    getUsuarios: async () => {
        try {
            const res = await fetch(`${BASE_URL}/usuarios`);
            if (!res.ok) throw new Error('Error al obtener usuarios');
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    getLogs: async () => {
        try {
            const res = await fetch(`${BASE_URL}/logs`);
            if (!res.ok) throw new Error('Error al obtener logs');
            return await res.json();
        } catch (e) {
            return [];
        }
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