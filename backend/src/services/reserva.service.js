// servicio encargado de orquestar el check-in, la validacion y el check-out de reservas
import { HuespedService } from './huesped.service.js';
import { PrecioService } from './precio.service.js';
import { ReservaRepository } from '../repositories/reserva.repository.js';
import { RoomRepository } from '../repositories/room.repository.js';

export class ReservaService {
    // orquesta el registro completo del huesped, estado de habitacion, calculo de tarifa y creacion
    static async registrarCheckIn(datosCheckIn, usuarioId) {
        // desestructuracion de parametros recibidos
        const {
            huespedData,
            nro_habitacion,
            fecha_ingreso,
            fecha_salida,
            tipo_pension = 'DESAYUNO',
            descuento_porcentaje = 0
        } = datosCheckIn;

        // 1. valida la integridad de los datos del huesped (mayor de 18, formato correo, etc.)
        const huespedValido = HuespedService.validarYFormatear(huespedData);

        // 2. obtiene la habitacion y verifica que exista y este LIBRE
        const habitacion = await RoomRepository.getById(nro_habitacion);
        if (!habitacion) {
            throw new Error(`La habitación #${nro_habitacion} no existe.`);
        }
        if (habitacion.estado !== 'LIBRE') {
            throw new Error(`La habitación #${nro_habitacion} no está disponible (Estado actual: ${habitacion.estado}).`);
        }

        // 3. obtiene las comodidades asociadas a la habitacion para calcular recargos adicionales
        const comodidades = await RoomRepository.getComodidadesByRoom(nro_habitacion);

        // 4. calcula el desglose de precios aplicando la estrategia (Strategy Pattern)
        const calculoTarifa = PrecioService.calcularTarifaTotal({
            precioBaseHabitacion: habitacion.precio_noche,
            comodidades,
            tipoPension: tipo_pension,
            descuentoPorcentaje: descuento_porcentaje,
            fechaIngreso: fecha_ingreso,
            fechaSalida: fecha_salida || null
        });

        // 5. ejecuta la transaccion en la base de datos (guarda huesped, bloquea habitacion y crea reserva)
        const idReserva = await ReservaRepository.crearReservaTransaccional({
            huesped: huespedValido,
            nro_habitacion,
            id_usuario_registro: usuarioId,
            fecha_ingreso,
            fecha_salida: fecha_salida || null,
            tipo_pension,
            descuento_porcentaje: calculoTarifa.descuentoPorcentaje,
            total_estimado: calculoTarifa.totalFinal
        });

        // retorna el ID de reserva creada y el desglose de tarifas
        return {
            id_reserva: idReserva,
            habitacion: nro_habitacion,
            tarifa: calculoTarifa
        };
    }

    // procesa el check-out de un huesped calculando tiempo consumido y liberando habitacion
    static async procesarCheckOut(idReserva, usuarioId) {
        return await ReservaRepository.finalizarCheckOutTransaccional(idReserva, usuarioId);
    }
}
