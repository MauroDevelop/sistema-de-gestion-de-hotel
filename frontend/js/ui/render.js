import { api } from '../services/api.js';

export const render = {
    habitaciones: async (filtros = { tipo: '', estado: '', texto: '' }) => {
        const habsAll = await api.getHabitaciones();
        const container = document.getElementById('grid-habitaciones');
        
        // Actualización de Métricas KPI en tiempo real
        const totalCount = habsAll.length;
        const libresCount = habsAll.filter(h => h.estado === 'LIBRE').length;
        const ocupadasCount = habsAll.filter(h => h.estado === 'OCUPADA').length;
        const pctOccupancy = totalCount > 0 ? Math.round((ocupadasCount / totalCount) * 100) : 0;

        const kpiTotal = document.getElementById('kpi-total-habs');
        const kpiLibres = document.getElementById('kpi-libres-habs');
        const kpiOcupadas = document.getElementById('kpi-ocupadas-habs');
        const kpiPct = document.getElementById('kpi-porcentaje-ocupacion');

        if (kpiTotal) kpiTotal.textContent = totalCount;
        if (kpiLibres) kpiLibres.textContent = libresCount;
        if (kpiOcupadas) kpiOcupadas.textContent = ocupadasCount;
        if (kpiPct) kpiPct.textContent = `${pctOccupancy}%`;

        // Filtrado
        let habs = [...habsAll];
        if (filtros.tipo) habs = habs.filter(h => h.tipo === filtros.tipo);
        if (filtros.estado) habs = habs.filter(h => h.estado === filtros.estado);
        if (filtros.texto) {
            const txt = filtros.texto.toLowerCase();
            habs = habs.filter(h => h.id.toString().includes(txt) || h.caracteristicas.some(c => c.toLowerCase().includes(txt)));
        }

        if (habs.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-12 text-[#315762] soft-card font-medium text-xs rounded-[3px]">No se encontraron habitaciones con los criterios aplicados.</div>`;
            return;
        }

        container.innerHTML = habs.map(h => {
            const isOcupada = h.estado === 'OCUPADA';
            const badgeClass = isOcupada ? 'badge-danger' : 'badge-success';
            
            return `
            <div class="soft-card flex flex-col justify-between group rounded-[3px]">
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="text-lg font-extrabold text-[#182C32]">Hab. #${h.id}</h3>
                            <p class="text-xs font-semibold text-[#315762]">${h.tipo}</p>
                        </div>
                        <span class="badge-status ${badgeClass}">${h.estado}</span>
                    </div>
                    <div class="mb-4">
                        <p class="text-2xl font-extrabold text-[#315762] tracking-tight mb-2">$${h.precio.toLocaleString('es-AR')}<span class="text-xs text-[#5B828D] font-normal"> /noche</span></p>
                        <div class="flex flex-wrap gap-1.5">
                            ${h.caracteristicas.slice(0, 3).map(c => `<span class="text-[10px] bg-[#EBF2F4] text-[#315762] px-2 py-0.5 rounded-[2px] border border-[#C2D1D5] font-semibold truncate max-w-[110px]">${c}</span>`).join('')}
                            ${h.caracteristicas.length > 3 ? `<span class="text-[10px] bg-[#EBF2F4] text-[#315762] px-2 py-0.5 rounded-[2px] border border-[#C2D1D5] font-semibold">+${h.caracteristicas.length - 3}</span>` : ''}
                        </div>
                    </div>
                </div>
                <button class="btn-room-details w-full py-2 bg-[#EBF2F4] hover:bg-[#D9E5E8] text-[#315762] border border-[#C2D1D5] rounded-[3px] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer" data-id="${h.id}">
                    <svg class="w-3.5 h-3.5 text-[#315762]" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span>Ver Detalles</span>
                </button>
            </div>`;
        }).join('');
    },

    huespedes: async (filtroTexto = '') => {
        let huespedes = await api.getHuespedes();
        const tbody = document.getElementById('table-huespedes');
        
        if (filtroTexto) {
            const txt = filtroTexto.toLowerCase();
            huespedes = huespedes.filter(h => 
                h.nombre.toLowerCase().includes(txt) || 
                h.dni.includes(txt) || 
                (h.patente && h.patente.toLowerCase().includes(txt)) ||
                (h.vehiculo_modelo && h.vehiculo_modelo.toLowerCase().includes(txt))
            );
        }

        if (huespedes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-[#315762] font-semibold">No hay registros de huéspedes en el sistema.</td></tr>`;
            return;
        }

        tbody.innerHTML = huespedes.map(h => {
            const poseeAuto = h.posee_vehiculo || (h.patente && h.patente !== '-');
            const isCheckIn = h.estado === 'CHECK-IN' || h.estado === 'ACTIVO';
            const badgeClass = isCheckIn ? 'badge-danger' : 'badge-success';

            return `
            <tr class="hover:bg-[#EBF2F4] transition">
                <td class="px-6 py-4">
                    <p class="font-bold text-[#182C32] text-xs">${h.nombre}</p>
                    <p class="text-[11px] text-[#315762]">DNI: ${h.dni}</p>
                    <p class="text-[10px] text-[#5B828D] truncate max-w-[180px]">${h.direccion || 'Sin dirección'}</p>
                </td>
                <td class="px-6 py-4 text-xs">
                    ${poseeAuto ? `
                        <p class="font-bold text-[#182C32] text-[11px]">${h.vehiculo_modelo}</p>
                        <span class="inline-block px-2 py-0.5 rounded-[2px] bg-[#EBF2F4] text-[#315762] font-mono text-[10px] border border-[#C2D1D5]">Patente: ${h.patente}</span>
                    ` : `<span class="text-[#5B828D] italic text-[11px]">Sin vehículo</span>`}
                </td>
                <td class="px-6 py-4 text-xs">
                    <p class="font-bold text-[#315762]">Hab. #${h.habitacion_id}</p>
                    <p class="text-[11px] text-[#5B828D]">${h.habitacion_tipo || 'Habitación'}</p>
                </td>
                <td class="px-6 py-4 text-xs">
                    <p class="text-[#182C32] font-semibold">Llegada: ${h.ingreso}</p>
                    <p class="text-[#315762] text-[11px]">Egreso: ${h.salida}</p>
                </td>
                <td class="px-6 py-4">
                    <span class="badge-status ${badgeClass}">${isCheckIn ? 'EN HOTEL (CHECK-IN)' : 'EGRESADO (CHECK-OUT)'}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    ${isCheckIn ? `
                        <button class="btn-trigger-checkout bg-[#315762] hover:bg-[#223F47] text-white px-3 py-1.5 rounded-[3px] font-bold text-xs shadow-sm transition flex items-center gap-1 ml-auto cursor-pointer" 
                            data-id="${h.id}" 
                            data-nombre="${h.nombre}" 
                            data-hab="${h.habitacion_id}" 
                            data-tipo="${h.habitacion_tipo || 'Habitación'}" 
                            data-precio="${h.precio_noche || 25000}" 
                            data-ingreso="${h.ingreso}" 
                            data-salida="${h.salida}">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"></path></svg>
                            Realizar Check-out
                        </button>
                    ` : `<span class="text-[#5B828D] font-medium text-[11px] italic">Check-out Finalizado</span>`}
                </td>
            </tr>`;
        }).join('');
    },

    empleados: async () => {
        const usuarios = await api.getUsuarios();
        const logs = await api.getLogs();
        
        document.getElementById('table-usuarios').innerHTML = usuarios.map(u => {
            const isAdmin = u.rol === 'ADMIN';
            const roleBadgeClass = isAdmin ? 'badge-purple' : 'badge-info';

            return `
            <tr class="hover:bg-[#EBF2F4] transition">
                <td class="px-6 py-4 font-bold text-[#182C32] text-xs">${u.nombre}</td>
                <td class="px-6 py-4 text-[#315762] text-xs font-mono">${u.username || '-'}</td>
                <td class="px-6 py-4 text-[#315762] text-xs font-mono">${u.dni}</td>
                <td class="px-6 py-4">
                    <span class="badge-status ${roleBadgeClass}">${u.rol}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button class="btn-edit-user text-[#315762] hover:text-[#223F47] text-xs font-bold transition" data-dni="${u.dni}">Editar / Ver Pass</button>
                </td>
            </tr>`;
        }).join('');

        document.getElementById('table-logs').innerHTML = logs.map(l => `
            <tr class="hover:bg-[#EBF2F4] transition">
                <td class="px-6 py-3.5 text-[#5B828D] text-[11px] whitespace-nowrap font-mono">${l.fecha}</td>
                <td class="px-6 py-3.5 font-bold text-[#182C32] text-xs">${l.usuario}</td>
                <td class="px-6 py-3.5 text-[#315762] text-xs">${l.accion}</td>
            </tr>
        `).join('');
    },

    // Selector de Características Premeditadas para modales de Habitación
    renderCaracteristicasSelector: async (selectedArray = []) => {
        const selectorContainer = document.getElementById('room-chars-selector');
        if (!selectorContainer) return;
        
        const catalogo = await api.getCatalogoCaracteristicas();
        if (catalogo.length === 0) {
            selectorContainer.innerHTML = `<p class="text-xs text-[#5B828D] italic col-span-2">No hay características en el catálogo premeditado.</p>`;
            return;
        }

        selectorContainer.innerHTML = catalogo.map(item => {
            const isChecked = selectedArray.includes(item.nombre);
            return `
            <label class="flex items-center gap-2 text-xs font-semibold text-[#182C32] cursor-pointer hover:bg-white p-1.5 rounded-[2px] transition select-none">
                <input type="checkbox" name="room-char-item" value="${item.nombre}" ${isChecked ? 'checked' : ''} class="rounded-[2px] text-[#315762] focus:ring-[#315762] w-4 h-4 cursor-pointer">
                <span class="truncate">${item.nombre}</span>
            </label>`;
        }).join('');
    }
};