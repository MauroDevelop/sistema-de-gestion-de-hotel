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
            container.innerHTML = `<div class="col-span-full text-center py-12 text-[#64748B] soft-card font-medium text-xs">No se encontraron habitaciones con los criterios aplicados.</div>`;
            return;
        }

        container.innerHTML = habs.map(h => {
            const isOcupada = h.estado === 'OCUPADA';
            const badgeClass = isOcupada ? 'badge-danger' : 'badge-success';
            
            return `
            <div class="soft-card flex flex-col justify-between group">
                <div>
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="text-lg font-extrabold text-[#1E293B]">Hab. #${h.id}</h3>
                            <p class="text-xs font-medium text-[#64748B]">${h.tipo}</p>
                        </div>
                        <span class="badge-status ${badgeClass}">${h.estado}</span>
                    </div>
                    <div class="mb-4">
                        <p class="text-2xl font-extrabold text-[#0084FF] tracking-tight mb-2">$${h.precio.toLocaleString('es-AR')}<span class="text-xs text-[#94A3B8] font-normal"> /noche</span></p>
                        <div class="flex flex-wrap gap-1.5">
                            ${h.caracteristicas.slice(0, 3).map(c => `<span class="text-[10px] bg-[#F8FAFC] text-[#64748B] px-2 py-0.5 rounded-[6px] border border-[#E2E8F0] font-medium truncate max-w-[110px]">${c}</span>`).join('')}
                            ${h.caracteristicas.length > 3 ? `<span class="text-[10px] bg-[#F8FAFC] text-[#64748B] px-2 py-0.5 rounded-[6px] border border-[#E2E8F0] font-medium">+${h.caracteristicas.length - 3}</span>` : ''}
                        </div>
                    </div>
                </div>
                <button class="btn-room-details w-full py-2 bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#1E293B] border border-[#E2E8F0] rounded-[10px] text-xs font-semibold transition flex items-center justify-center gap-1.5" data-id="${h.id}">
                    <svg class="w-3.5 h-3.5 text-[#64748B]" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
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
            huespedes = huespedes.filter(h => h.nombre.toLowerCase().includes(txt) || h.dni.includes(txt));
        }

        if (huespedes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-[#64748B] font-medium">No hay huéspedes registrados en el sistema.</td></tr>`;
            return;
        }

        tbody.innerHTML = huespedes.map(h => `
            <tr class="hover:bg-[#F8FAFC] transition">
                <td class="px-6 py-4">
                    <p class="font-bold text-[#1E293B] text-xs">${h.nombre}</p>
                    <p class="text-[11px] text-[#64748B]">DNI: ${h.dni}</p>
                </td>
                <td class="px-6 py-4 font-bold text-[#0084FF] text-xs">Hab. #${h.habitacion_id}</td>
                <td class="px-6 py-4 text-xs">
                    <p class="text-[#1E293B] font-semibold">${h.ingreso}</p>
                    <p class="text-[#94A3B8] text-[11px]">Salida: ${h.salida}</p>
                </td>
                <td class="px-6 py-4 text-xs">
                    <p class="text-[#64748B] font-medium">${h.comida}</p>
                    ${h.descuento > 0 ? `<span class="text-[10px] text-[#22C55E] font-bold">-${h.descuento}% Descuento</span>` : ''}
                </td>
                <td class="px-6 py-4 text-right">
                    <span class="badge-status badge-info">${h.estado}</span>
                </td>
            </tr>
        `).join('');
    },
    empleados: async () => {
        const usuarios = await api.getUsuarios();
        const logs = await api.getLogs();
        
        document.getElementById('table-usuarios').innerHTML = usuarios.map(u => `
            <tr class="hover:bg-[#F8FAFC] transition">
                <td class="px-6 py-4 font-bold text-[#1E293B] text-xs">${u.nombre}</td>
                <td class="px-6 py-4 text-[#64748B] text-xs font-mono">${u.dni}</td>
                <td class="px-6 py-4">
                    <span class="badge-status ${u.rol === 'ADMIN' ? 'badge-purple' : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'}">${u.rol}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button class="btn-edit-user text-[#0084FF] hover:text-[#0073E6] text-xs font-semibold transition" data-dni="${u.dni}">Editar / Ver Pass</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('table-logs').innerHTML = logs.map(l => `
            <tr class="hover:bg-[#F8FAFC] transition">
                <td class="px-6 py-3.5 text-[#94A3B8] text-[11px] whitespace-nowrap font-mono">${l.fecha}</td>
                <td class="px-6 py-3.5 font-semibold text-[#1E293B] text-xs">${l.usuario}</td>
                <td class="px-6 py-3.5 text-[#64748B] text-xs">${l.accion}</td>
            </tr>
        `).join('');
    }
};