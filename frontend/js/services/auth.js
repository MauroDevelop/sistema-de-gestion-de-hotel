import { api } from './api.js';

export const auth = {
    login: async (dni, pass) => {
        try {
            const user = await api.login(dni, pass);
            if (user) {
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
        
        // 1. Ocultar la ventana principal del sistema
        const appContainer = document.getElementById('app-container');
        if (appContainer) appContainer.classList.add('hidden');
        
        // 2. Ocultar todas las páginas internas
        document.querySelectorAll('.app-page').forEach(p => p.classList.add('hidden'));
        
        // 3. Ocultar modales flotantes (cerrar diálogos abiertos)
        const modals = ['modal-add-room', 'modal-room-details', 'modal-add-huesped', 'modal-add-user'];
        modals.forEach(id => {
            const m = document.getElementById(id);
            if (m) m.classList.add('hidden');
        });
        
        // 4. Resetear y MOSTRAR la pantalla de Login
        const loginContainer = document.getElementById('login-container');
        if (loginContainer) {
            loginContainer.classList.remove('hidden');
        }
        
        const formLogin = document.getElementById('form-login');
        if (formLogin) formLogin.reset();

        const loginError = document.getElementById('login-error');
        if (loginError) loginError.classList.add('hidden');
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
