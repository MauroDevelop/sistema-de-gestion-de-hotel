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

    // ===================================================
    // CONTROL DEL WIZARD DE CHECK-IN (PASO 1 Y PASO 2)
    // ===================================================

    // Cálculo automático de noches y precio total
    function calcularTarifasReserva() {
        const checkinVal = document.getElementById('huesped-checkin')?.value;
        const checkoutVal = document.getElementById('huesped-checkout')?.value;
        const habSelect = document.getElementById('huesped-hab');
        if (!checkinVal || !checkoutVal || !habSelect) return;

        const start = new Date(checkinVal);
        const end = new Date(checkoutVal);
        let diffMs = end - start;
        let noches = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (isNaN(noches) || noches < 1) noches = 1;

        const opt = habSelect.options[habSelect.selectedIndex];
        const precioNoche = opt ? (Number(opt.dataset.precio) || 0) : 0;
        const precioTotal = noches * precioNoche;

        const tarifaEl = document.getElementById('reserva-tarifa-noche');
        const nochesEl = document.getElementById('reserva-noches-calc');
        const totalEl = document.getElementById('reserva-precio-total');

        if (tarifaEl) tarifaEl.textContent = `$${precioNoche.toLocaleString('es-AR')}`;
        if (nochesEl) nochesEl.textContent = `${noches} noche${noches > 1 ? 's' : ''}`;
        if (totalEl) totalEl.textContent = `$${precioTotal.toLocaleString('es-AR')}`;
    }

    // Inyección de filas dinámicas de acompañantes
    function agregarFilaAcompanante(datos = {}) {
        const contenedor = document.getElementById('lista-acompanantes');
        if (!contenedor) return;

        const div = document.createElement('div');
        div.className = 'acomp-row grid grid-cols-1 sm:grid-cols-4 gap-2 p-2.5 bg-[#F4F7F8] rounded-[3px] border border-[#D9E1E3] items-center transition';
        div.innerHTML = `
            <div>
                <input type="text" placeholder="Nombres *" value="${datos.nombres || ''}" class="acomp-nombres control-input w-full text-xs py-1.5 rounded-[2px]" required>
            </div>
            <div>
                <input type="text" placeholder="Apellidos" value="${datos.apellidos || ''}" class="acomp-apellidos control-input w-full text-xs py-1.5 rounded-[2px]">
            </div>
            <div class="flex gap-1">
                <select class="acomp-tipo-doc control-select text-xs py-1.5 rounded-[2px] w-20">
                    <option value="DNI" ${datos.tipo_documento === 'DNI' ? 'selected' : ''}>DNI</option>
                    <option value="Pasaporte" ${datos.tipo_documento === 'Pasaporte' ? 'selected' : ''}>Pasap.</option>
                    <option value="Cédula" ${datos.tipo_documento === 'Cédula' ? 'selected' : ''}>Cédula</option>
                </select>
                <input type="text" placeholder="Documento *" value="${datos.numero_documento || ''}" class="acomp-doc control-input w-full text-xs py-1.5 rounded-[2px]" required>
            </div>
                <button type="button" class="btn-remove-acomp text-[#7A2828] hover:text-[#5C1E1E] p-1 rounded hover:bg-[#F8EAEA] transition text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"></path></svg>
                    <span>Quitar</span>
                </button>
            </div>
        `;

        div.querySelector('.acomp-nombres')?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
        });
        div.querySelector('.acomp-apellidos')?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
        });
        div.querySelector('.acomp-doc')?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });

        contenedor.appendChild(div);
    }

    // Sincronización de cantidad de acompañantes
    function sincronizarFilasAcompanantes(cantidad) {
        const contenedor = document.getElementById('lista-acompanantes');
        if (!contenedor) return;
        const actuales = contenedor.querySelectorAll('.acomp-row').length;
        if (cantidad > actuales) {
            for (let i = actuales; i < cantidad; i++) {
                agregarFilaAcompanante();
            }
        } else if (cantidad < actuales) {
            const filas = contenedor.querySelectorAll('.acomp-row');
            for (let i = actuales - 1; i >= cantidad; i--) {
                filas[i].remove();
            }
        }
    }

    // Control de Flujo de Pasos en el Modal
    function setHuespedStep(step) {
        const step1 = document.getElementById('huesped-step-1');
        const step2 = document.getElementById('huesped-step-2');
        const tab1 = document.getElementById('step-tab-1');
        const tab2 = document.getElementById('step-tab-2');
        const badge1 = document.getElementById('step-badge-1');
        const badge2 = document.getElementById('step-badge-2');
        const errorDiv = document.getElementById('error-add-huesped');

        if (errorDiv) errorDiv.classList.add('hidden');

        if (step === 1) {
            step1?.classList.remove('hidden');
            step2?.classList.add('hidden');

            if (tab1) tab1.className = 'py-3 px-4 border-b-2 border-[#315762] text-[#315762] flex items-center justify-center gap-2 transition-all cursor-pointer font-bold';
            if (badge1) {
                badge1.className = 'w-5 h-5 rounded-full bg-[#315762] text-white flex items-center justify-center text-[10px] font-bold';
                badge1.textContent = '1';
            }

            if (tab2) tab2.className = 'py-3 px-4 border-b-2 border-transparent text-[#5B828D] flex items-center justify-center gap-2 transition-all cursor-pointer';
            if (badge2) {
                badge2.className = 'w-5 h-5 rounded-full bg-[#D9E1E3] text-[#5B828D] flex items-center justify-center text-[10px] font-bold';
                badge2.textContent = '2';
            }
        } else {
            step1?.classList.add('hidden');
            step2?.classList.remove('hidden');

            if (tab1) tab1.className = 'py-3 px-4 border-b-2 border-transparent text-[#5B828D] flex items-center justify-center gap-2 transition-all cursor-pointer';
            if (badge1) {
                badge1.className = 'w-5 h-5 rounded-full bg-[#225C4B] text-white flex items-center justify-center text-[10px] font-bold';
                badge1.innerHTML = '&#10003;';
            }

            if (tab2) tab2.className = 'py-3 px-4 border-b-2 border-[#315762] text-[#315762] flex items-center justify-center gap-2 transition-all cursor-pointer font-bold';
            if (badge2) {
                badge2.className = 'w-5 h-5 rounded-full bg-[#315762] text-white flex items-center justify-center text-[10px] font-bold';
                badge2.textContent = '2';
            }

            calcularTarifasReserva();
        }
    }

    // Validación obligatoria del Paso 1 (Huésped Titular)
    function validateHuespedStep1() {
        const errorDiv = document.getElementById('error-add-huesped');
        const nombres = (document.getElementById('huesped-nombres')?.value || '').trim();
        const apellidos = (document.getElementById('huesped-apellidos')?.value || '').trim();
        const dni = (document.getElementById('huesped-dni')?.value || '').trim();
        const nacionalidad = (document.getElementById('huesped-nacionalidad')?.value || '').trim();
        const nacimiento = document.getElementById('huesped-nacimiento')?.value;
        const direccion = (document.getElementById('huesped-direccion')?.value || '').trim();
        const telefono = (document.getElementById('huesped-telefono')?.value || '').trim();
        const email = (document.getElementById('huesped-email')?.value || '').trim();

        const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

        if (!nombres) {
            errorDiv.textContent = 'Por favor, ingrese los Nombres completos del huésped titular.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-nombres')?.focus();
            return false;
        }
        if (!soloLetrasRegex.test(nombres)) {
            errorDiv.textContent = 'El nombre solo puede contener letras, sin números ni caracteres especiales.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-nombres')?.focus();
            return false;
        }
        if (!apellidos) {
            errorDiv.textContent = 'Por favor, ingrese los Apellidos completos del huésped titular.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-apellidos')?.focus();
            return false;
        }
        if (!soloLetrasRegex.test(apellidos)) {
            errorDiv.textContent = 'El apellido solo puede contener letras, sin números ni caracteres especiales.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-apellidos')?.focus();
            return false;
        }
        if (!dni) {
            errorDiv.textContent = 'Por favor, ingrese el Número de documento (DNI/Pasaporte).';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-dni')?.focus();
            return false;
        }
        if (!/^\d+$/.test(dni)) {
            errorDiv.textContent = 'El número de documento tiene que ser solo números sin caracteres ni letras.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-dni')?.focus();
            return false;
        }
        if (!nacionalidad) {
            errorDiv.textContent = 'Por favor, ingrese la Nacionalidad del huésped.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-nacionalidad')?.focus();
            return false;
        }
        if (!nacimiento) {
            errorDiv.textContent = 'Por favor, seleccione la Fecha de nacimiento.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-nacimiento')?.focus();
            return false;
        }
        const anioNac = parseInt(nacimiento.split('-')[0], 10);
        if (isNaN(anioNac) || anioNac < 1900 || anioNac > 2100) {
            errorDiv.textContent = 'Fecha de nacimiento no valida.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-nacimiento')?.focus();
            return false;
        }
        if (!direccion) {
            errorDiv.textContent = 'Por favor, ingrese el Domicilio de residencia.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-direccion')?.focus();
            return false;
        }
        if (!telefono) {
            errorDiv.textContent = 'Por favor, ingrese un Teléfono de contacto.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-telefono')?.focus();
            return false;
        }
        if (!/^\d+$/.test(telefono)) {
            errorDiv.textContent = 'El teléfono no debe llevar letras ni caracteres, solo números.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-telefono')?.focus();
            return false;
        }
        if (!email) {
            errorDiv.textContent = 'Por favor, ingrese el Email del huésped.';
            errorDiv.classList.remove('hidden');
            document.getElementById('huesped-email')?.focus();
            return false;
        }

        errorDiv.classList.add('hidden');
        return true;
    }

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
            const libres = habs.filter(h => h.estado === 'LIBRE' || h.estado === 'DISPONIBLE');

            if (libres.length === 0) {
                select.innerHTML = '<option value="">No hay habitaciones libres para Check-in</option>';
            } else {
                select.innerHTML = libres.map(h => `<option value="${h.id}" data-precio="${h.precio}">Hab. #${h.id} - ${h.tipo} ($${h.precio.toLocaleString('es-AR')}/noche)</option>`).join('');
            }

            // Fechas por defecto: Check-in ahora, Check-out mañana a las 10:00 AM
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);

            const formatDT = (d) => {
                const pad = (n) => String(n).padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            };

            document.getElementById('form-add-huesped').reset();
            document.getElementById('huesped-checkin').value = formatDT(now);
            document.getElementById('huesped-checkout').value = formatDT(tomorrow);
            document.getElementById('huesped-nacionalidad').value = 'Argentina';
            if (document.getElementById('huesped-personas')) document.getElementById('huesped-personas').value = '1';
            if (document.getElementById('reserva-patente')) document.getElementById('reserva-patente').value = '';
            if (document.getElementById('reserva-modelo')) document.getElementById('reserva-modelo').value = '';
            document.getElementById('zone-acompanantes').classList.add('hidden');
            document.getElementById('lista-acompanantes').innerHTML = '';
            document.getElementById('dni-lookup-banner').classList.add('hidden');
            document.getElementById('error-add-huesped').classList.add('hidden');

            setHuespedStep(1);
            calcularTarifasReserva();
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

    // ===================================================
    // LISTENERS DEL FORMULARIO Y WIZARD DE CHECK-IN
    // ===================================================

    // Restricciones de entrada en tiempo real (Nombres solo letras, DNI y Teléfono solo dígitos)
    document.getElementById('huesped-nombres')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    });
    document.getElementById('huesped-apellidos')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    });
    document.getElementById('huesped-dni')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
    document.getElementById('huesped-telefono')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });


    // Habilitación automática de acompañantes al seleccionar 2 o más personas
    const personasInput = document.getElementById('huesped-personas');
    const handlePersonasChange = (e) => {
        const cantPersonas = parseInt(e.target.value) || 1;
        const zoneAcomp = document.getElementById('zone-acompanantes');
        if (cantPersonas >= 2 && cantPersonas <= 10) {
            zoneAcomp?.classList.remove('hidden');
            sincronizarFilasAcompanantes(cantPersonas - 1);
        } else {
            zoneAcomp?.classList.add('hidden');
            sincronizarFilasAcompanantes(0);
        }
    };
    personasInput?.addEventListener('input', handlePersonasChange);
    personasInput?.addEventListener('change', handlePersonasChange);

    // Botón agregar fila de acompañante
    document.getElementById('btn-add-acomp')?.addEventListener('click', () => {
        agregarFilaAcompanante();
    });

    // Quitar fila de acompañante por delegación
    document.getElementById('lista-acompanantes')?.addEventListener('click', (e) => {
        const btnRemove = e.target.closest('.btn-remove-acomp');
        if (btnRemove) {
            const row = btnRemove.closest('.acomp-row');
            if (row) row.remove();
        }
    });

    // Recalcular tarifas cuando cambian fechas o habitación
    document.getElementById('huesped-checkin')?.addEventListener('input', calcularTarifasReserva);
    document.getElementById('huesped-checkout')?.addEventListener('input', calcularTarifasReserva);
    document.getElementById('huesped-hab')?.addEventListener('change', calcularTarifasReserva);

    // Navegación entre Pasos del Wizard
    document.getElementById('btn-huesped-next')?.addEventListener('click', () => {
        if (validateHuespedStep1()) {
            setHuespedStep(2);
        }
    });

    document.getElementById('btn-huesped-prev')?.addEventListener('click', () => {
        setHuespedStep(1);
    });

    document.getElementById('step-tab-1')?.addEventListener('click', () => {
        setHuespedStep(1);
    });

    document.getElementById('step-tab-2')?.addEventListener('click', () => {
        if (validateHuespedStep1()) {
            setHuespedStep(2);
        }
    });

    // Formulario Registrar Huésped / Check-in
    document.getElementById('form-add-huesped').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('error-add-huesped');
        try {
            // Validar Paso 1
            if (!validateHuespedStep1()) {
                setHuespedStep(1);
                return;
            }

            const habitacionId = parseInt(document.getElementById('huesped-hab')?.value);
            if (!habitacionId) {
                setHuespedStep(2);
                throw new Error('Debe seleccionar una habitación disponible.');
            }

            const checkin = document.getElementById('huesped-checkin')?.value;
            const checkout = document.getElementById('huesped-checkout')?.value;
            if (!checkin || !checkout) {
                setHuespedStep(2);
                throw new Error('Debe especificar la fecha y hora de Check-in y Check-out.');
            }

            const patenteAuto = (document.getElementById('reserva-patente')?.value || '').trim().toUpperCase();
            const modeloAuto = (document.getElementById('reserva-modelo')?.value || '').trim();
            if (patenteAuto && !modeloAuto) {
                setHuespedStep(2);
                document.getElementById('reserva-modelo')?.focus();
                throw new Error('Si ingresa la Patente del vehículo, debe ingresar obligatoriamente el Modelo o Marca.');
            }
            const poseeAuto = Boolean(patenteAuto || modeloAuto);
            const cantPersonas = parseInt(document.getElementById('huesped-personas')?.value) || 1;

            // Recolectar acompañantes si la cantidad de personas es 2 o más
            const listaAcomps = [];
            if (cantPersonas >= 2) {
                const filas = document.querySelectorAll('#lista-acompanantes .acomp-row');
                filas.forEach((f, idx) => {
                    const nom = (f.querySelector('.acomp-nombres')?.value || '').trim();
                    const ape = (f.querySelector('.acomp-apellidos')?.value || '').trim();
                    const tipo = f.querySelector('.acomp-tipo-doc')?.value || 'DNI';
                    const doc = (f.querySelector('.acomp-doc')?.value || '').trim();
                    if (nom || doc) {
                        if (!nom || !doc) {
                            throw new Error(`Acompañante #${idx + 1}: Debe completar Nombre y Documento.`);
                        }
                        const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
                        if (!soloLetrasRegex.test(nom)) {
                            throw new Error(`Acompañante #${idx + 1}: El nombre solo puede contener letras, sin números ni caracteres especiales.`);
                        }
                        if (ape && !soloLetrasRegex.test(ape)) {
                            throw new Error(`Acompañante #${idx + 1}: El apellido solo puede contener letras, sin números ni caracteres especiales.`);
                        }
                        if (!/^\d+$/.test(doc)) {
                            throw new Error(`Acompañante #${idx + 1}: El número de documento tiene que ser solo números sin caracteres ni letras.`);
                        }
                        listaAcomps.push({
                            nombres: nom,
                            apellidos: ape,
                            tipo_documento: tipo,
                            numero_documento: doc
                        });
                    }
                });
            }

            // Obtener tarifa y total
            const habSelect = document.getElementById('huesped-hab');
            const opt = habSelect.options[habSelect.selectedIndex];
            const precioNoche = opt ? (Number(opt.dataset.precio) || 0) : 0;
            const start = new Date(checkin);
            const end = new Date(checkout);
            let noches = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            if (isNaN(noches) || noches < 1) noches = 1;
            const precioTotal = noches * precioNoche;

            // Payload completo y atómico
            const payload = {
                nombres: document.getElementById('huesped-nombres').value.trim(),
                apellidos: document.getElementById('huesped-apellidos').value.trim(),
                nombre: `${document.getElementById('huesped-nombres').value.trim()} ${document.getElementById('huesped-apellidos').value.trim()}`.trim(),
                tipo_documento: document.getElementById('huesped-tipo-doc').value,
                numero_documento: document.getElementById('huesped-dni').value.trim(),
                dni: document.getElementById('huesped-dni').value.trim(),
                nacionalidad: document.getElementById('huesped-nacionalidad').value.trim(),
                fecha_nacimiento: document.getElementById('huesped-nacimiento').value,
                direccion: document.getElementById('huesped-direccion').value.trim(),
                telefono: document.getElementById('huesped-telefono').value.trim(),
                email: document.getElementById('huesped-email').value.trim(),
                posee_vehiculo: poseeAuto,
                vehiculo_modelo: modeloAuto,
                patente: patenteAuto,
                vehiculo_patente: patenteAuto,
                habitacion_id: habitacionId,
                fecha_checkin: checkin,
                fecha_checkout: checkout,
                ingreso: checkin,
                salida: checkout,
                personas: cantPersonas,
                adultos: cantPersonas,
                ninos: 0,
                acompanantes: listaAcomps,
                precio_noche: precioNoche,
                precio_total: precioTotal
            };

            await api.addHuesped(payload);

            document.getElementById('modal-add-huesped').classList.add('hidden');
            setHuespedStep(1);
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