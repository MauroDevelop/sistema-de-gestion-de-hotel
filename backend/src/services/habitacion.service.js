// servicio encargado de las reglas de negocio y validaciones de habitaciones

export class HabitacionService {
    // opciones permitidas de tipos y estados de habitacion
    static TIPOS_VALIDOS = ['Simple', 'Doble', 'Matrimonial', 'Suite'];
    static ESTADOS_VALIDOS = ['LIBRE', 'OCUPADA', 'MANTENIMIENTO', 'LIMPIEZA'];

    // valida los datos de una habitacion antes de guardarla en la base de datos
    static validarHabitacion({ nro_habitacion, id_tipo, tipo_nombre, piso, precio_noche }) {
        // comprueba que el numero de habitacion sea un numero entero mayor a 0
        if (!nro_habitacion || Number(nro_habitacion) <= 0) {
            throw new Error('El número de habitación debe ser un entero positivo.');
        }

        // si se envio nombre de tipo, valida que este dentro de las opciones permitidas
        if (tipo_nombre && !this.TIPOS_VALIDOS.includes(tipo_nombre)) {
            throw new Error(`Tipo de habitación inválido. Opciones permitidas: ${this.TIPOS_VALIDOS.join(', ')}`);
        }

        // verifica que se especifique al menos el id del tipo o el nombre del tipo
        if (!id_tipo && !tipo_nombre) {
            throw new Error('Debe especificar el tipo de habitación.');
        }

        // comprueba que el precio por noche sea positivo
        if (!precio_noche || Number(precio_noche) <= 0) {
            throw new Error('El precio por noche debe ser mayor a 0.');
        }

        // retorna un objeto estructurado con tipos numericos correctos
        return {
            nro_habitacion: Number(nro_habitacion),
            id_tipo: Number(id_tipo) || null,
            piso: Number(piso) || 1,
            precio_noche: Number(precio_noche)
        };
    }

    // limpia la lista de comodidades recibida eliminando duplicados y valores invalidos
    static filtrarComodidadesIds(amenityIds) {
        if (!Array.isArray(amenityIds)) return [];
        // convierte a numeros, elimina NaN e ids negativos y quita duplicados con Set
        return [...new Set(amenityIds.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0))];
    }
}
