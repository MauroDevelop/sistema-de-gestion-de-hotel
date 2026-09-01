//implemento el patron strategy para calcular tarifas para calcular tarifas 
// desacoplando los regímenes de pensión y aplicando recargos por comodidades y 
// descuentos de forma limpia y extensible.


//patron straregy
const RegimenPensionStrategies = {
    SOLO_ALOJAMIENTO: {
        calcular: (precioBase) => 0
    },
    DESAYUNO: {
        calcular: (precioBase) => precioBase * 0.10 //10% adicional
    },
    MEDIA_PENSION: {
        calcular: (precioBase) => precioBase * 0.25 // 25% adicional
    },
    PENSION_COMPLETA: {
        calcular: (precioBase) => precioBase * 0.40 // 40% adicional
    }
};

export class PrecioService {

    //calcula la cantidad de noches entre dos fechas
    static calcularNoches(fechaIngreso, fechaSalida){
        if (!fechaSalida) return 1;
        
        const fIngreso = new Date(fechaIngreso);
        const fSalida = new Date(fechaSalida);

        const diffTime = fSalida.getTime() - fIngreso.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 1;
        
    }


    //calcula el desglose completo de costos de una estadia 
    static calcularTarifaTotal({
        precioBaseHabitacion,
        comodidades = [],
        tipoPension = 'DESAYUNO',
        descuentoPorcentaje = 0,
        fechaIngreso,
        fechaSalida
    }){
        if (!precioBaseHabitacion || precioBaseHabitacion <= 0) {
            throw new Error('El precio base de la habitacion debe ser mayor a 0');
        }

        const noches = this.calcularNoches(fechaIngreso, fechaSalida);

        //Recargo por comodidades seleccionadas
        const extraComodidadesPorNoche = comodidades.reduce(
            (acc, item) => acc + (Number(item.precio_extra) || 0), 
            0
        );

        // Cálculo de pensión usando Strategy
        const estrategiaPension = RegimenPensionStrategies[tipoPension] || RegimenPensionStrategies.DESAYUNO;
        const costoPensionPorNoche = estrategiaPension.calcular(precioBaseHabitacion);

        //Subtotal por noche
        const subtotalPorNoche = Number(precioBaseHabitacion) + extraComodidadesPorNoche + costoPensionPorNoche;

        // Subtotal estadía
        const subtotalEstadia = subtotalPorNoche * noches;

        // Aplicación de descuento
        const porcentaje = Math.max(0, Math.min(Number(descuentoPorcentaje) || 0, 100));
        const montoDescuento = subtotalEstadia * (porcentaje / 100);

        // Total final
        const totalFinal = Math.max(0, subtotalEstadia - montoDescuento);

        return {
            noches,
            precioBasePorNoche: Number(precioBaseHabitacion),
            extraComodidadesPorNoche,
            costoPensionPorNoche,
            subtotalPorNoche,
            subtotalEstadia,
            descuentoPorcentaje: porcentaje,
            montoDescuento,
            totalFinal: Number(totalFinal.toFixed(2))
    };
}
}