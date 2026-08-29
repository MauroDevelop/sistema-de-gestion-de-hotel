import { api } from './api.js';

export const auth = {
    login: async (dni, pass) => {
        try {
            const user = await api.login(dni, pass);
            if (user) {
                // Usamos encodeURIComponent para evitar errores con tildes y caracteres UTF-8 en btoa
                localStorage.setItem('hotel_token', encodeURIComponent(JSON.stringify(user)));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error durante la autenticación:', e);
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('hotel_token');
        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('login-container').classList.remove('hidden');
        document.getElementById('form-login').reset();
        
        document.getElementById('nav-admin-section').classList.add('hidden');
        document.getElementById('btn-add-room').classList.add('hidden');
        
        document.querySelectorAll('.app-page').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.fixed.inset-0').forEach(m => m.classList.add('hidden'));
    },
    
    getUser: () => {
        const token = localStorage.getItem('hotel_token');
        if (!token) return null;
        try {
            return JSON.parse(decodeURIComponent(token));
        } catch(e) {
            try {
                return JSON.parse(atob(token));
            } catch (err) {
                return null;
            }
        }
    }
};
