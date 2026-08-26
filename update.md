//archivo precio.service.js

bloque 1 de patron strategy. 

**const RegimenPensionStrategies = { ... };**
declara un diccionario. En lugar de tener
muchos if/else.

**SOLO_ALOJAMIENTO: { calcular: (precioBase) => 0 }** 
cuando el huesped no contrata comidas, este devuelve 0.

**DESAYUNO: { calcular: (precioBase) => precioBase * 0.10 }** 
le pone un 10$ adicional sobre la tarifa base de la habitacion por noche.

**MEDIA_PENSION y PENSION_COMPLETA:** 
Calculan un 25% y un 40% respectivamente.

este bloque de codigo sirve por si luego agregamos otro porcentaje como 40%, simplemente agregamos una nueva clave valor sin modificar el resto de la logica del sistema.

------------------

Bloque 2 Declaracion de la clase y calclulo de noches. 

**export class PrecioService {}** 
sirve para exporta la clase contendera de los metodos de precio
static para no invocar new.

**static calcularNoches(fechaIngreso, fechaSalida) {}**
 metodo auxiliar para determinar la duracion real de la estadia.

**if (!fechaSalida) return 1;**
clausula de guarda.
Si el huesped hace check-in sin fecha de salida definida, se asume por defecto la tarifacion de al menos una noche.

**const fIngreso = new Date(fechaIngreso); y const fSalida = new Date(fechaSalida);** 
convierte string a objetos Date que javascript entienda.

**const diffTime = fSalida.getTime() - fIngreso.getTime();**
Obtiene la diferencia exacta entre ambas marcas de tiempo expresada en milisegundos.

**const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));**
Convierte los milisegundos a días completos. La fórmula multiplica: 1000 ms * 60 s * 60 min * 24 horas = milisegundos en un día. Math.ceil() redondea hacia arriba para no perder fracciones de día.

**return diffDays > 0 ? diffDays : 1;**
Control de integridad. Si por error el usuario ingresa una fecha de salida anterior o igual a la de entrada, fuerza el retorno a un mínimo seguro de 1 noche, evitando multiplicaciones por cero o valores negativos.

--------

Bloque 3: Validación de Entradas de la Tarifa

**static calcularTarifaTotal({ ... })**
Método principal que utiliza desestructuración de parámetros con valores por defecto para evitar errores si no se envían campos opcionales (comodidades = [], tipoPension = 'DESAYUNO', descuentoPorcentaje = 0).

**if (!precioBaseHabitacion || precioBaseHabitacion <= 0)**
Impide procesar reservas con habitaciones que tengan tarifas nulas, corruptas o negativas.


**throw new Error(...)**
Corta la ejecución lanzando una excepción que luego será capturada por el controlador o bloque try/catch.

**const noches = this.calcularNoches(fechaIngreso, fechaSalida);**
Reutiliza la función anterior para fijar el multiplicador de tiempo de la reserva.

---------------

Bloque 4: Recargos y aplicaciones de estrategia

**const extraComodidadesPorNoche = comodidades.reduce(...)**
Itera sobre la lista de comodidades que tiene la habitación (por ejemplo: Jacuzzi, Balcón, Minibar).

**(acc, item) => acc + (Number(item.precio_extra) || 0), 0**
Suma el campo precio_extra de cada comodidad. Number(...) || 0 previene errores en caso de que algún ítem venga con valor nulo o no numérico.

**const estrategiaPension = RegimenPensionStrategies[tipoPension] || RegimenPensionStrategies.DESAYUNO;**
Busca dinámicamente en el diccionario la estrategia correspondiente al tipo de pensión recibido. Si se envía un valor desconocido, aplica DESAYUNO como estrategia de respaldo (fallback).

**const costoPensionPorNoche = estrategiaPension.calcular(precioBaseHabitacion);**
Ejecuta la función de la estrategia seleccionada pasando el precio base de la habitación como argumento.

------------------
Bloque 5: Subtotales, descuentos y total final

**const subtotalPorNoche = Number(...) + ...**
Suma el costo base diario, los adicionales de comodidades y el recargo del plan de comida para consolidar el costo unitario por noche.

**const subtotalEstadia = subtotalPorNoche * noches**
Multiplica la tarifa por noche por la cantidad de noches calculadas.

**const porcentaje = Math.max(0, Math.min(Number(descuentoPorcentaje) || 0, 100))**
Limita el descuento entre un rango estricto de 0% a 100% (evita descuentos superiores al 100% o valores negativos que aumentarían el precio de forma fraudulenta).

**const montoDescuento = subtotalEstadia * (porcentaje / 100);**
Calcula el importe monetario exacto a descontar.

**const totalFinal = Math.max(0, subtotalEstadia - montoDescuento)**
Resta el descuento al subtotal asegurando que el total a pagar nunca sea inferior a $0.

-------------------
Bloque 6: Retorno de datos detallados

**return { ... };**
Retorna un objeto con el desglose contable completo de la operación.

**Number(totalFinal.toFixed(2))**
Trunca y redondea a exactamente dos decimales (estándar para manejo de divisas monetarias) y lo convierte nuevamente a tipo numérico para guardarlo directamente en la base de datos o enviarlo en la respuesta JSON.
