export const db = {
    habitaciones: [
        { id: 101, tipo: 'Simple', precio: 25000, estado: 'LIBRE', caracteristicas: ['TV', 'Ventilador', 'Cama 1 Plaza'] },
        { id: 102, tipo: 'Doble', precio: 40000, estado: 'OCUPADA', caracteristicas: ['TV', 'Aire Acondicionado', '2 Camas 1 Plaza'] },
        { id: 201, tipo: 'Matrimonial', precio: 45000, estado: 'LIBRE', caracteristicas: ['TV 42"', 'Aire Acondicionado', 'Sommier 2 Plazas'] },
        { id: 301, tipo: 'Suite', precio: 80000, estado: 'LIBRE', caracteristicas: ['TV 55"', 'Jacuzzi', 'Minibar', 'Vista al Parque'] }
    ],
    huespedes: [
        { id: 1, nombre: 'Carlos Rodríguez', dni: '35123456', habitacion_id: 102, ingreso: '2026-08-15', salida: '2026-08-20', comida: 'Desayuno', descuento: 0, estado: 'ACTIVO' }
    ],
    usuarios: [
        { dni: '1111', pass: 'admin', nombre: 'Admin Master', rol: 'ADMIN' },
        { dni: '2222', pass: 'recep', nombre: 'Juan Recepción', rol: 'USER' }
    ],
    logs: [
        { fecha: '2026-08-19 07:55', usuario: 'Juan Recepción', accion: 'Inicio de turno' },
        { fecha: '2026-08-19 08:30', usuario: 'Juan Recepción', accion: 'Registro de huésped: Carlos Rodríguez (Hab. 102)' },
        { fecha: '2026-08-19 10:15', usuario: 'Juan Recepción', accion: 'Check-out: María López (Hab. 201)' },
        { fecha: '2026-08-19 15:00', usuario: 'Admin Master', accion: 'Inicio de turno (Admin)' },
        { fecha: '2026-08-19 15:30', usuario: 'Admin Master', accion: 'Creación de nueva Habitación #301' }
    ]
};