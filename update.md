## archivo precio.service.js

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


==========
## archivo huesped.service.js

Bloque 1: Declaración de Clase y Desestructuración

**export class HuespedService {}**
Clase contenedora de las reglas de validación y limpieza de huéspedes.

**static validarYFormatear(data) {}**
Recibe el objeto con todos los datos que vienen del formulario de registro.

**const { nombre, apellido, ... } = data;**
Desestructura todos los campos recibidos estableciendo 'DNI' por defecto si no se indica el tipo de documento.

-------

Bloque 2: Verificación de Campos Obligatorios
**const camposObligatorios = { nombre, apellido, nro_documento, ... };**
Reúne los 10 campos que no pueden faltar para registrar un huésped titular.

**for (const [campo, valor] of Object.entries(camposObligatorios))**
Itera campo por campo. Si algún valor viene nulo o con texto en blanco, lanza `throw new Error(...)` indicando exactamente cuál falta.

-------

Bloque 3: Validación de Formato de Correo y Edad (+18)

**const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;**
Patrón de expresión regular para verificar que el correo tenga formato válido (`usuario@dominio.com`).

**const fechaNac = new Date(fecha_nacimiento);**
Convierte la fecha de nacimiento a Date. Si no es válida, interrumpe con error.

**const edad = new Date().getFullYear() - fechaNac.getFullYear();**
Calcula la edad. Si es menor de 18 años, frena el registro indicando que el titular debe ser mayor de edad.

------

Bloque 4: Limpieza de Espacios y Normalización

**return { nombre: nombre.trim(), correo: correo.trim().toLowerCase(), ... };**
Retorna los datos limpios de espacios en los extremos y convierte el correo a minúsculas para evitar duplicados en la base de datos.


========

## archivo habitacion.service.js

Bloque 1: Listas Válidas y Validación de Habitación

**static TIPOS_VALIDOS = ['Simple', 'Doble', 'Matrimonial', 'Suite'];**
Arreglos estáticos con las categorías y estados permitidos en el hotel.

**static validarHabitacion({ nro_habitacion, id_tipo, tipo_nombre, piso, precio_noche })**
Valida que el número de habitación y precio sean enteros positivos y que el tipo de habitación exista.

------

Bloque 2: Normalización de Comodidades
**static filtrarComodidadesIds(amenityIds)**
Filtra un arreglo de IDs recibidos desde checkboxes. Convierte strings a enteros con `parseInt()`, elimina valores nulos o negativos, y usa `[...new Set(...)]` para eliminar duplicados.

======

## archivo auth.service.js

Bloque 1: Autenticación de 3 Factores


**static async login(correo, dni, password, ip = null)**
Verifica los 3 datos exigidos: Correo electrónico, número de DNI y Contraseña.

**const user = await UserRepository.findByCredentials(...)**
Consulta la base de datos buscando un usuario activo con ese correo y DNI. Si no existe, lanza un mensaje de credenciales inválidas.

---

Bloque 2: Verificación Bcrypt y Firma JWT


**const isMatch = await bcrypt.compare(password, user.password_hash);**
Compara la contraseña en texto plano introducida contra el hash Bcrypt encriptado en la base de datos.

**const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });**
Genera un token cifrado firmado con la clave secreta que expira en 12 horas.

**await UserRepository.logAction(user.id_usuario, 'Inicio de sesión exitoso', ip);**
Registra el evento de inicio de sesión con la IP del usuario en los logs del sistema.

=========

## archivo reserva.service.js

Bloque 1: Orquestación del Check-In

**static async registrarCheckIn(datosCheckIn, usuarioId)**
Valida el huésped con `HuespedService`, verifica que la habitación exista y esté en estado `LIBRE`, calcula la tarifa con `PrecioService` y ejecuta la transacción en base de datos.

---

Bloque 2: Procesamiento del Check-Out

**static async procesarCheckOut(idReserva, usuarioId)**
Llama a `ReservaRepository.finalizarCheckOutTransaccional` para calcular el tiempo real transcurrido, efectuar la liquidación cobrada y liberar la habitación.