import { api } from './services/api.js';
import { auth } from './services/auth.js';
import { render } from './ui/render.js';

document.addEventListener('DOMContentLoaded', () => {

    const initApp = () => {
        const user = auth.getUser();
        if (!user) return;

        document.getElementById('ui-user-name').textContent = user.username || user.nombre;
        const roleBadge = document.getElementById('ui-user-role');
        roleBadge.textContent = user.rol;

        const navAdmin = document.getElementById('nav-admin-section');
        const btnAddRoom = document.getElementById('btn-add-room');
        const btnManageCatalogo = document.getElementById('btn-manage-catalogo');

        // Permisos estrictos de 2 ROLES: ADMIN y RECEPCION
        if (user.rol === 'ADMIN') {
            if (navAdmin) navAdmin.classList.remove('hidden');
            roleBadge.className = 'inline-block mt-0.5 px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-[#315762] text-white border border-[#223F47]';
            if (btnAddRoom) btnAddRoom.classList.remove('hidden');
            if (btnManageCatalogo) btnManageCatalogo.classList.remove('hidden');
        } else {
            // RECEPCION
            if (navAdmin) navAdmin.classList.add('hidden');
            roleBadge.className = 'inline-block mt-0.5 px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-[#EBF2F4] text-[#315762] border border-[#C2D1D5]';
            if (btnAddRoom) btnAddRoom.classList.add('hidden');
            if (btnManageCatalogo) btnManageCatalogo.classList.add('hidden');
        }

        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');

        // Cargar vista por defecto
        const defaultNavBtn = document.querySelector('[data-target="page-habitaciones"]');
        if (defaultNavBtn) defaultNavBtn.click();
    };

    if (auth.getUser()) initApp();

    // LOGIN CON 3 CAMPOS OBLIGATORIOS (DNI, USUARIO Y CONTRASEÑA)
    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const dni = (document.getElementById('login-dni').value || '').trim();
        const usuario = (document.getElementById('login-usuario').value || '').trim();
        const pass = (document.getElementById('login-pass').value || '').trim();
        const errorMsg = document.getElementById('login-error');

        if (!dni || !pass) {
            errorMsg.textContent = 'Por favor complete el DNI y la Contraseña.';
            errorMsg.classList.remove('hidden');
            return;
        }

        if (await auth.login(dni, usuario, pass)) {
            errorMsg.classList.add('hidden');
            initApp();
        } else {
            errorMsg.textContent = 'Credenciales incorrectas. Verifique DNI, Usuario y Contraseña.';
            errorMsg.classList.remove('hidden');
        }
    });

    // NAVEGACIÓN TOPBAR HORIZONTAL
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

            if (target === 'page-habitaciones') render.habitaciones();
            if (target === 'page-huespedes') render.huespedes();
            if (target === 'page-empleados') render.empleados();
        });
    });

    // DELEGACIÓN DE EVENTOS CLICK
    document.addEventListener('click', async (e) => {
        // Logout
        if (e.target.closest('#btn-logout')) {
            e.preventDefault();
            auth.logout();
        }

        // Abrir Modal Agregar Habitación (Admin)
        if (e.target.closest('#btn-add-room')) {
            document.getElementById('form-add-room').reset();
            document.getElementById('room-mode').value = 'CREATE';
            document.getElementById('room-id').readOnly = false;
            document.getElementById('modal-room-title').textContent = 'Añadir Habitación';
            await render.renderCaracteristicasSelector([]);
            document.getElementById('modal-add-room').classList.remove('hidden');
        }

        // Abrir Modal Agregar a Catálogo de Características (Admin)
        if (e.target.closest('#btn-open-add-catalogo') || e.target.closest('#btn-manage-catalogo')) {
            document.getElementById('form-add-catalogo').reset();
            document.getElementById('modal-add-catalogo').classList.remove('hidden');
        }

        // Abrir Modal Agregar Usuario (Admin)
        if (e.target.closest('#btn-add-user')) {
            document.getElementById('form-add-user').reset();
            document.getElementById('user-dni').readOnly = false;
            document.getElementById('modal-add-user').classList.remove('hidden');
        }

        // Editar Usuario (Admin)
        if (e.target.closest('.btn-edit-user')) {
            const dni = e.target.closest('.btn-edit-user').dataset.dni;
            const usuarios = await api.getUsuarios();
            const u = usuarios.find(x => x.dni === dni);
            if (u) {
                document.getElementById('user-nombre').value = u.nombre;
                if (document.getElementById('user-username')) document.getElementById('user-username').value = u.username || u.nombre.toLowerCase();
                document.getElementById('user-dni').value = u.dni;
                document.getElementById('user-dni').readOnly = true;
                document.getElementById('user-pass').value = u.pass;
                document.getElementById('user-rol').value = u.rol;
                document.getElementById('modal-add-user').classList.remove('hidden');
            }
        }

        // Abrir Modal Registrar Huésped / Check-in
        if (e.target.closest('#btn-add-huesped')) {
            const select = document.getElementById('huesped-hab');
            const habs = await api.getHabitaciones();
            const libres = habs.filter(h => h.estado === 'LIBRE');

            if (libres.length === 0) {
                select.innerHTML = '<option value="">No hay habitaciones libres para Check-in</option>';
            } else {
                select.innerHTML = libres.map(h => `<option value="${h.id}">Hab. #${h.id} - ${h.tipo} ($${h.precio.toLocaleString('es-AR')}/noche)</option>`).join('');
            }

            // Autocompletar fecha de hoy para Check-in
            const hoy = new Date().toISOString().split('T')[0];
            document.getElementById('huesped-in').value = hoy;
            document.getElementById('huesped-out').value = '';

            document.getElementById('error-add-huesped').classList.add('hidden');
            document.getElementById('form-add-huesped').reset();
            document.getElementById('huesped-in').value = hoy;
            document.getElementById('check-vehiculo').checked = false;
            document.getElementById('vehiculo-inputs-zone').classList.add('hidden');
            document.getElementById('modal-add-huesped').classList.remove('hidden');
        }

        // ABRIR MODAL DE CHECK-OUT PROFESIONAL
        if (e.target.closest('.btn-trigger-checkout')) {
            const btn = e.target.closest('.btn-trigger-checkout');
            const idReserva = parseInt(btn.dataset.id);
            const nombre = btn.dataset.nombre;
            const habId = btn.dataset.hab;
            const habTipo = btn.dataset.tipo;
            const precioNoche = parseFloat(btn.dataset.precio || 25000);
            const fechaIngreso = btn.dataset.ingreso;
            const fechaSalida = btn.dataset.salida !== 'A definir' ? btn.dataset.salida : new Date().toISOString().split('T')[0];

            // Cálculo de Noches
            const date1 = new Date(fechaIngreso);
            const date2 = new Date(fechaSalida);
            const diffTime = Math.abs(date2 - date1);
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 0 || isNaN(diffDays)) diffDays = 1;

            const montoTotal = diffDays * precioNoche;

            document.getElementById('checkout-reserva-id').value = idReserva;
            document.getElementById('checkout-huesped-nombre').textContent = nombre;
            document.getElementById('checkout-hab-id').textContent = `#${habId} (${habTipo})`;
            document.getElementById('checkout-fechas').textContent = `${fechaIngreso} al ${fechaSalida}`;
            document.getElementById('checkout-noches').textContent = `${diffDays} noche(s)`;
            document.getElementById('checkout-monto-total').textContent = `$${montoTotal.toLocaleString('es-AR')}`;

            document.getElementById('modal-checkout').classList.remove('hidden');
        }

        // CONFIRMAR CHECK-OUT
        if (e.target.closest('#btn-confirm-checkout')) {
            const idReserva = parseInt(document.getElementById('checkout-reserva-id').value);
            if (idReserva) {
                try {
                    await api.checkoutHuesped(idReserva);
                    document.getElementById('modal-checkout').classList.add('hidden');
                    render.huespedes();
                    render.habitaciones();
                } catch (error) {
                    alert(error.message);
                }
            }
        }

        // Ver Detalles / Editar Habitación Modal
        if (e.target.closest('.btn-room-details')) {
            const id = parseInt(e.target.closest('.btn-room-details').dataset.id);
            const habs = await api.getHabitaciones();
            const h = habs.find(x => x.id === id);
            if (!h) return;

            const user = auth.getUser();
            const modal = document.getElementById('modal-room-details');

            document.getElementById('detail-room-id').textContent = `#${h.id}`;
            document.getElementById('detail-room-tipo').textContent = h.tipo;
            document.getElementById('detail-room-precio').textContent = `$${h.precio.toLocaleString('es-AR')}`;
            document.getElementById('detail-room-chars').innerHTML = h.caracteristicas.map(c => `<span class="bg-[#F8FAFC] text-[#64748B] px-2 py-0.5 rounded-[6px] text-[11px] font-medium border border-[#E2E8F0]">${c}</span>`).join('');

            const elEstado = document.getElementById('detail-room-estado');
            elEstado.textContent = h.estado;
            elEstado.className = `badge-status ${h.estado === 'LIBRE' ? 'badge-success' : 'badge-danger'}`;

            const zoneActions = document.getElementById('zone-actions-room');
            zoneActions.innerHTML = '';
            if (user && user.rol === 'ADMIN') {
                zoneActions.innerHTML += `<button id="btn-edit-room-trigger" data-id="${h.id}" class="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-[#315762] bg-[#EBF2F4] hover:bg-[#D9E5E8] rounded-[3px] transition border border-[#C2D1D5]"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"></path></svg> Editar Habitación</button>`;

                if (h.estado === 'LIBRE') {
                    zoneActions.innerHTML += `<button id="btn-delete-room" data-id="${h.id}" class="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-[#7A2828] bg-[#F8EAEA] hover:bg-[#E8C4C4] rounded-[3px] transition border border-[#E8C4C4]"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"></path></svg> Eliminar Habitación</button>`;
                }
            }
            modal.classList.remove('hidden');
        }

        // Trigger Modificar Habitación desde Modal Detalles (Admin)
        if (e.target.closest('#btn-edit-room-trigger')) {
            const id = parseInt(e.target.closest('#btn-edit-room-trigger').dataset.id);
            const habs = await api.getHabitaciones();
            const h = habs.find(x => x.id === id);
            if (h) {
                document.getElementById('modal-room-details').classList.add('hidden');
                document.getElementById('room-mode').value = 'EDIT';
                document.getElementById('room-id').value = h.id;
                document.getElementById('room-id').readOnly = true;
                document.getElementById('room-type').value = h.tipo;
                document.getElementById('room-price').value = h.precio;
                document.getElementById('modal-room-title').textContent = `Editar Habitación #${h.id}`;
                await render.renderCaracteristicasSelector(h.caracteristicas || []);
                document.getElementById('modal-add-room').classList.remove('hidden');
            }
        }

        // Eliminar Habitación (Abrir Modal Personalizado de Confirmación)
        if (e.target.closest('#btn-delete-room')) {
            const btn = e.target.closest('#btn-delete-room');
            const id = parseInt(btn.dataset.id);
            const confirmBtn = document.getElementById('btn-confirm-delete-action');
            if (confirmBtn) {
                confirmBtn.dataset.type = 'room';
                confirmBtn.dataset.id = id;
            }
            document.getElementById('confirm-delete-message').textContent = `¿Está seguro de que desea eliminar la Habitación #${id}? Esta acción no se puede deshacer.`;
            document.getElementById('modal-confirm-delete').classList.remove('hidden');
        }

        // Cerrar Modales
        if (e.target.closest('.btn-close-modal')) {
            const modalEl = e.target.closest('.fixed.inset-0');
            if (modalEl && modalEl.id !== 'login-container') {
                modalEl.classList.add('hidden');
            }
        }
    });

    // Cerrar modal al hacer clic en el backdrop (excepto la pantalla de login)
    document.querySelectorAll('.fixed.inset-0').forEach(modal => {
        if (modal.id === 'login-container') return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    });

    // Event listener para Acción de Confirmar Eliminación (Modal Personalizado)
    document.getElementById('btn-confirm-delete-action')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const type = btn.dataset.type;
        const id = parseInt(btn.dataset.id);
        const modalConfirm = document.getElementById('modal-confirm-delete');

        try {
            if (type === 'room') {
                await api.deleteHabitacion(id);
                modalConfirm.classList.add('hidden');
                document.getElementById('modal-room-details').classList.add('hidden');
                await render.habitaciones();
            }
        } catch (err) {
            modalConfirm.classList.add('hidden');
            alert(`Error al eliminar: ${err.message}`);
        }
    });

    // Toggle de Campos de Vehículo en Registro de Huésped
    document.getElementById('check-vehiculo').addEventListener('change', (e) => {
        const zone = document.getElementById('vehiculo-inputs-zone');
        if (e.target.checked) {
            zone.classList.remove('hidden');
        } else {
            zone.classList.add('hidden');
            document.getElementById('huesped-auto').value = '';
            document.getElementById('huesped-patente').value = '';
        }
    });

    // Formulario Guardar/Editar Habitación (con Catálogo Premeditado)
    document.getElementById('form-add-room').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const mode = document.getElementById('room-mode').value;
            const id = parseInt(document.getElementById('room-id').value);
            const tipo = document.getElementById('room-type').value;
            const precio = parseInt(document.getElementById('room-price').value);

            // Obtener checkboxes seleccionados del catálogo premeditado
            const selectedChars = Array.from(document.querySelectorAll('input[name="room-char-item"]:checked'))
                .map(cb => cb.value);

            if (mode === 'EDIT') {
                await api.updateHabitacion(id, {
                    tipo,
                    precio,
                    caracteristicas: selectedChars
                });
            } else {
                await api.addHabitacion({
                    id,
                    tipo,
                    precio,
                    caracteristicas: selectedChars
                });
            }
            document.getElementById('modal-add-room').classList.add('hidden');
            render.habitaciones();
        } catch (error) { alert(error.message); }
    });

    // Formulario Añadir Característica al Catálogo Premeditado
    document.getElementById('form-add-catalogo').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const nombre = document.getElementById('catalogo-nombre-input').value;
            if (!nombre || !nombre.trim()) return;

            await api.addCaracteristicaCatalogo(nombre.trim());
            document.getElementById('modal-add-catalogo').classList.add('hidden');

            // Re-renderizar selector de características si el modal de habitación está abierto
            const selectedChars = Array.from(document.querySelectorAll('input[name="room-char-item"]:checked'))
                .map(cb => cb.value);
            selectedChars.push(nombre.trim());
            await render.renderCaracteristicasSelector(selectedChars);
        } catch (error) { alert(error.message); }
    });

    // Formulario Registrar/Editar Usuario (Admin - 2 Roles: RECEPCION y ADMIN)
    document.getElementById('form-add-user').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const dniInput = document.getElementById('user-dni');
            const data = {
                nombre: document.getElementById('user-nombre').value,
                username: document.getElementById('user-username')?.value || document.getElementById('user-nombre').value.toLowerCase().split(' ')[0],
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

    // Formulario Registrar Huésped / Check-in
    document.getElementById('form-add-huesped').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('error-add-huesped');
        try {
            const poseeVehiculo = document.getElementById('check-vehiculo').checked;
            const habitacionId = parseInt(document.getElementById('huesped-hab').value);
            if (!habitacionId) throw new Error('Debe seleccionar una habitación disponible.');

            await api.addHuesped({
                nombre: document.getElementById('huesped-nombre').value,
                dni: document.getElementById('huesped-dni').value,
                direccion: document.getElementById('huesped-direccion').value,
                posee_vehiculo: poseeVehiculo,
                vehiculo_modelo: poseeVehiculo ? document.getElementById('huesped-auto').value : '',
                patente: poseeVehiculo ? document.getElementById('huesped-patente').value : '',
                habitacion_id: habitacionId,
                ingreso: document.getElementById('huesped-in').value,
                salida: document.getElementById('huesped-out').value || null
            });
            document.getElementById('modal-add-huesped').classList.add('hidden');
            render.huespedes();
            render.habitaciones();
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    });

    // Filtros de Habitaciones y Huéspedes
    const triggerHabFilters = () => {
        render.habitaciones({
            tipo: document.getElementById('filtro-tipo').value,
            estado: document.getElementById('filtro-estado').value,
            texto: document.getElementById('filtro-texto').value
        });
    };
    document.getElementById('filtro-tipo')?.addEventListener('change', triggerHabFilters);
    document.getElementById('filtro-estado')?.addEventListener('change', triggerHabFilters);
    document.getElementById('filtro-texto')?.addEventListener('input', triggerHabFilters);

    document.getElementById('search-huesped')?.addEventListener('input', (e) => {
        render.huespedes(e.target.value);
    });
});