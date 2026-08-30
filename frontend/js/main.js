import { api } from './services/api.js';
import { auth } from './services/auth.js';
import { render } from './ui/render.js';

document.addEventListener('DOMContentLoaded', () => {
    
    const initApp = () => {
        const user = auth.getUser();
        if(!user) return;

        document.getElementById('ui-user-name').textContent = user.nombre;
        const roleBadge = document.getElementById('ui-user-role');
        roleBadge.textContent = user.rol;
        
        const navAdmin = document.getElementById('nav-admin-section');
        const btnAddRoom = document.getElementById('btn-add-room');
        
        if(user.rol === 'ADMIN') {
            if (navAdmin) navAdmin.classList.remove('hidden');
            roleBadge.className = 'inline-block mt-0.5 px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]';
            if (btnAddRoom) btnAddRoom.classList.remove('hidden');
        } else {
            if (navAdmin) navAdmin.classList.add('hidden');
            roleBadge.className = 'inline-block mt-0.5 px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]';
            if (btnAddRoom) btnAddRoom.classList.add('hidden');
        }

        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        // Cargar vista por defecto
        const defaultNavBtn = document.querySelector('[data-target="page-habitaciones"]');
        if (defaultNavBtn) defaultNavBtn.click();
    };

    if(auth.getUser()) initApp();

    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const dni = document.getElementById('login-dni').value;
        const pass = document.getElementById('login-pass').value;
        const errorMsg = document.getElementById('login-error');
        
        if (await auth.login(dni, pass)) {
            errorMsg.classList.add('hidden');
            initApp();
        } else {
            errorMsg.classList.remove('hidden');
        }
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('active');
                b.removeAttribute('data-active');
            });
            const currentBtn = e.currentTarget;
            currentBtn.classList.add('active');
            currentBtn.setAttribute('data-active', 'true');
            
            const target = currentBtn.dataset.target;
            document.querySelectorAll('.app-page').forEach(p => p.classList.add('hidden'));
            const targetPage = document.getElementById(target);
            if (targetPage) targetPage.classList.remove('hidden');
            
            if(target === 'page-habitaciones') render.habitaciones();
            if(target === 'page-huespedes') render.huespedes();
            if(target === 'page-empleados') render.empleados();
        });
    });

    document.addEventListener('click', async (e) => {
        if (e.target.closest('#btn-logout')) {
            e.preventDefault();
            auth.logout();
        }
        
        if (e.target.closest('#btn-add-room')) {
            document.getElementById('form-add-room').reset();
            document.getElementById('modal-add-room').classList.remove('hidden');
        }

        if (e.target.closest('#btn-add-user')) {
            document.getElementById('form-add-user').reset();
            document.getElementById('user-dni').readOnly = false;
            document.getElementById('modal-add-user').classList.remove('hidden');
        }

        if (e.target.closest('.btn-edit-user')) {
            const dni = e.target.closest('.btn-edit-user').dataset.dni;
            const usuarios = await api.getUsuarios();
            const u = usuarios.find(x => x.dni === dni);
            if(u) {
                document.getElementById('user-nombre').value = u.nombre;
                document.getElementById('user-dni').value = u.dni;
                document.getElementById('user-dni').readOnly = true;
                document.getElementById('user-pass').value = u.pass;
                document.getElementById('user-rol').value = u.rol;
                document.getElementById('modal-add-user').classList.remove('hidden');
            }
        }

        if (e.target.closest('#btn-add-huesped')) {
            const select = document.getElementById('huesped-hab');
            const habs = await api.getHabitaciones();
            const libres = habs.filter(h => h.estado === 'LIBRE');
            
            if(libres.length === 0) {
                select.innerHTML = '<option value="">No hay habitaciones libres</option>';
            } else {
                select.innerHTML = libres.map(h => `<option value="${h.id}">Hab. #${h.id} - ${h.tipo} ($${h.precio.toLocaleString('es-AR')})</option>`).join('');
            }
            
            document.getElementById('error-add-huesped').classList.add('hidden');
            document.getElementById('form-add-huesped').reset();
            document.getElementById('modal-add-huesped').classList.remove('hidden');
        }

        if (e.target.closest('.btn-room-details')) {
            const id = parseInt(e.target.closest('.btn-room-details').dataset.id);
            const habs = await api.getHabitaciones();
            const h = habs.find(x => x.id === id);
            if(!h) return;

            const user = auth.getUser();
            const modal = document.getElementById('modal-room-details');
            
            document.getElementById('detail-room-id').textContent = `#${h.id}`;
            document.getElementById('detail-room-tipo').textContent = h.tipo;
            document.getElementById('detail-room-precio').textContent = `$${h.precio.toLocaleString('es-AR')}`;
            document.getElementById('detail-room-chars').innerHTML = h.caracteristicas.map(c => `<span class="bg-[#F8FAFC] text-[#64748B] px-2 py-0.5 rounded-[6px] text-[11px] font-medium border border-[#E2E8F0]">${c}</span>`).join('');
            
            const elEstado = document.getElementById('detail-room-estado');
            elEstado.textContent = h.estado;
            elEstado.className = `badge-status ${h.estado === 'LIBRE' ? 'badge-success' : 'badge-danger'}`;

            const zoneDelete = document.getElementById('zone-delete-room');
            zoneDelete.innerHTML = ''; 
            
            if(user.rol === 'ADMIN') {
                if(h.estado === 'LIBRE') {
                    zoneDelete.innerHTML = `<button id="btn-delete-room" data-id="${h.id}" class="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#EF4444] bg-[#FFF5F5] hover:bg-[#FFE8E8] rounded-[10px] transition border border-[#FFE8E8]"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"></path></svg> Eliminar Habitación</button>`;
                } else {
                    zoneDelete.innerHTML = `<p class="text-xs text-center text-[#94A3B8] italic font-medium">Habitación ocupada. No se puede eliminar.</p>`;
                }
            }
            modal.classList.remove('hidden');
        }

        if (e.target.closest('#btn-delete-room')) {
            const btn = e.target.closest('#btn-delete-room');
            const id = parseInt(btn.dataset.id);
            if(confirm(`¿Está seguro que desea eliminar la habitación #${id}?`)) {
                await api.deleteHabitacion(id);
                document.getElementById('modal-room-details').classList.add('hidden');
                render.habitaciones();
            }
        }

        if (e.target.closest('.btn-close-modal')) {
            e.target.closest('.fixed.inset-0').classList.add('hidden');
        }
    });

    document.querySelectorAll('.fixed.inset-0').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.add('hidden');
        });
    });

    document.getElementById('form-add-room').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const caracteristicasArray = document.getElementById('room-chars').value
                .split(',')
                .map(c => c.trim())
                .filter(c => c);

            await api.addHabitacion({ 
                id: parseInt(document.getElementById('room-id').value), 
                tipo: document.getElementById('room-type').value, 
                precio: parseInt(document.getElementById('room-price').value),
                caracteristicas: caracteristicasArray
            });
            document.getElementById('modal-add-room').classList.add('hidden');
            render.habitaciones();
        } catch (error) { alert(error.message); }
    });

    document.getElementById('form-add-user').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const dniInput = document.getElementById('user-dni');
            const data = { 
                nombre: document.getElementById('user-nombre').value,
                dni: dniInput.value,
                pass: document.getElementById('user-pass').value,
                rol: document.getElementById('user-rol').value
            };

            if (dniInput.readOnly) {
                await api.updateUsuario(data);
            } else {
                await api.createUsuario(data);
            }

            document.getElementById('modal-add-user').classList.add('hidden');
            render.empleados();
        } catch (error) { alert(error.message); }
    });

    document.getElementById('check-hoy').addEventListener('change', (e) => {
        const inputFecha = document.getElementById('huesped-in');
        if (e.target.checked) {
            const hoy = new Date();
            const yyyy = hoy.getFullYear();
            const mm = String(hoy.getMonth() + 1).padStart(2, '0');
            const dd = String(hoy.getDate()).padStart(2, '0');
            inputFecha.value = `${yyyy}-${mm}-${dd}`;
        } else {
            inputFecha.value = '';
        }
    });

    document.getElementById('form-add-huesped').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('error-add-huesped');
        try {
            await api.addHuesped({
                nombre: document.getElementById('huesped-nombre').value,
                dni: document.getElementById('huesped-dni').value,
                habitacion_id: parseInt(document.getElementById('huesped-hab').value),
                ingreso: document.getElementById('huesped-in').value,
                salida: 'A definir',
                comida: 'Ninguno',
                descuento: 0
            });
            document.getElementById('modal-add-huesped').classList.add('hidden');
            document.getElementById('check-hoy').checked = false; 
            render.huespedes();
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    });

    const triggerHabFilters = () => {
        render.habitaciones({
            tipo: document.getElementById('filtro-tipo').value,
            estado: document.getElementById('filtro-estado').value,
            texto: document.getElementById('filtro-texto').value
        });
    };
    document.getElementById('filtro-tipo').addEventListener('change', triggerHabFilters);
    document.getElementById('filtro-estado').addEventListener('change', triggerHabFilters);
    document.getElementById('filtro-texto').addEventListener('input', triggerHabFilters);
    document.getElementById('search-huesped').addEventListener('input', (e) => {
        render.huespedes(e.target.value);
    });
});