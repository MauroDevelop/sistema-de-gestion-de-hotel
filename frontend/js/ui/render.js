import { api } from '../services/api.js';

export const render = {
    habitaciones: async (filtros = { tipo: '', estado: '', texto: '' }) => {
        let habs = await api.getHabitaciones();
        const container = document.getElementById('grid-habitaciones');
        
        if (filtros.tipo) habs = habs.filter(h => h.tipo === filtros.tipo);
        if (filtros.estado) habs = habs.filter(h => h.estado === filtros.estado);
        if (filtros.texto) {
            const txt = filtros.texto.toLowerCase();
            habs = habs.filter(h => h.id.toString().includes(txt) || h.caracteristicas.some(c => c.toLowerCase().includes(txt)));
        }

        if (habs.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">No se encontraron habitaciones con esos filtros.</div>`;
            return;
        }

        container.innerHTML = habs.map(h => {
            const isOcupada = h.estado === 'OCUPADA';
            const colorBadge = isOcupada ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200';
            const bgCard = isOcupada ? 'bg-slate-50' : 'bg-white';
            
            return `
            <div class="${bgCard} border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition relative group overflow-hidden flex flex-col">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-slate-800">Hab. ${h.id}</h3>
                        <p class="text-sm text-slate-500 font-medium">${h.tipo}</p>
                    </div>
                    <span class="px-2.5 py-1 text-xs font-bold rounded-full border ${colorBadge}">${h.estado}</span>
                </div>
                <div class="mb-4 flex-1">
                    <p class="text-xl font-bold text-blue-600 mb-2">$${h.precio.toLocaleString('es-AR')}<span class="text-xs text-slate-400 font-normal">/noche</span></p>
                    <div class="flex flex-wrap gap-1">
                        ${h.caracteristicas.slice(0,2).map(c => `<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded truncate max-w-[120px]">${c}</span>`).join('')}
                        ${h.caracteristicas.length > 2 ? `<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded">+${h.caracteristicas.length - 2}</span>` : ''}
                    </div>
                </div>
                <button class="btn-room-details w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition" data-id="${h.id}">Ver Detalles</button>
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
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">No hay huéspedes registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = huespedes.map(h => `
            <tr class="hover:bg-slate-50 transition">
                <td class="px-6 py-4">
                    <p class="font-medium text-slate-800">${h.nombre}</p>
                    <p class="text-xs text-slate-500">DNI: ${h.dni}</p>
                </td>
                <td class="px-6 py-4 font-bold text-slate-700">#${h.habitacion_id}</td>
                <td class="px-6 py-4 text-sm">
                    <p class="text-slate-800">${h.ingreso}</p>
                    <p class="text-slate-500 text-xs">al ${h.salida}</p>
                </td>
                <td class="px-6 py-4 text-sm">
                    <p>${h.comida}</p>
                    ${h.descuento > 0 ? `<span class="text-xs text-green-600 font-medium">-${h.descuento}% Desc.</span>` : ''}
                </td>
                <td class="px-6 py-4 text-right">
                    <span class="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">${h.estado}</span>
                </td>
            </tr>
        `).join('');
    },
    empleados: async () => {
        const usuarios = await api.getUsuarios();
        const logs = await api.getLogs();
        
        document.getElementById('table-usuarios').innerHTML = usuarios.map(u => `
            <tr class="hover:bg-slate-50 transition">
                <td class="px-6 py-4 font-medium text-slate-800">${u.nombre}</td>
                <td class="px-6 py-4 text-slate-600 text-sm font-mono">${u.dni}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-[10px] font-bold rounded-full ${u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}">${u.rol}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button class="btn-edit-user text-purple-600 hover:text-purple-800 text-sm font-medium transition" data-dni="${u.dni}">Editar / Ver Pass</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('table-logs').innerHTML = logs.map(l => `
            <tr class="hover:bg-slate-50 transition">
                <td class="px-6 py-3 text-slate-500 text-xs whitespace-nowrap">${l.fecha}</td>
                <td class="px-6 py-3 font-medium text-slate-700 text-sm">${l.usuario}</td>
                <td class="px-6 py-3 text-slate-600 text-sm">${l.accion}</td>
            </tr>
        `).join('');
    }
};