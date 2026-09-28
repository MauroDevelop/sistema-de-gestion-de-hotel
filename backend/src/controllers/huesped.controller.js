import { HuespedRepository } from '../repositories/huesped.repository.js';
import { LogRepository } from '../repositories/log.repository.js';

export class HuespedController {
    // GET /api/huespedes
    static async getAll(req, res) {
        try {
            const data = await HuespedRepository.getAll();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // GET /api/huespedes/buscar/:dni
    static async getByDni(req, res) {
        try {
            const { dni } = req.params;
            const huesped = await HuespedRepository.findByDni(dni);
            if (!huesped) {
                return res.status(404).json({ message: 'Huésped no encontrado con el documento provisto.' });
            }
            return res.status(200).json(huesped);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // POST /api/huespedes (Check-in con Wizard de 2 Pasos y Persistencia Atómica)
    static async create(req, res) {
        try {
            const {
                nombres,
                apellidos,
                nombre, // soporte legado
                tipo_documento = 'DNI',
                numero_documento,
                dni, // soporte legado
                nacionalidad,
                fecha_nacimiento,
                direccion,
                telefono,
                email,
                posee_vehiculo = false,
                vehiculo_modelo,
                patente,
                vehiculo_patente,
                habitacion_id,
                fecha_checkin,
                fecha_checkout,
                ingreso, // soporte legado
                salida,  // soporte legado
                adultos = 1,
                ninos = 0,
                acompanantes = [],
                precio_noche,
                precio_total,
                creado_por_id = 1
            } = req.body;

            const docNum = (numero_documento || dni || '').trim();
            const nomb = (nombres || nombre || '').trim();
            const apel = (apellidos || '').trim();
            const inDate = fecha_checkin || ingreso;
            const outDate = fecha_checkout || salida;

            const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

            if (!nomb) {
                return res.status(400).json({ message: 'El campo "Nombres completos" del huésped titular es obligatorio.' });
            }
            if (!soloLetrasRegex.test(nomb)) {
                return res.status(400).json({ message: 'El nombre solo puede contener letras, sin números ni caracteres especiales.' });
            }
            if (!apel && !nombre) {
                return res.status(400).json({ message: 'El campo "Apellidos completos" del huésped titular es obligatorio.' });
            }
            if (apel && !soloLetrasRegex.test(apel)) {
                return res.status(400).json({ message: 'El apellido solo puede contener letras, sin números ni caracteres especiales.' });
            }
            if (!docNum) {
                return res.status(400).json({ message: 'El campo "Número de documento" es obligatorio.' });
            }
            if (!/^\d+$/.test(docNum)) {
                return res.status(400).json({ message: 'El número de documento tiene que ser solo números sin caracteres ni letras.' });
            }
            if (!nacionalidad) {
                return res.status(400).json({ message: 'El campo "Nacionalidad" es obligatorio.' });
            }
            if (!fecha_nacimiento) {
                return res.status(400).json({ message: 'El campo "Fecha de nacimiento" es obligatorio.' });
            }
            const anioNac = parseInt(String(fecha_nacimiento).split('-')[0], 10);
            if (isNaN(anioNac) || anioNac < 1900 || anioNac > 2100) {
                return res.status(400).json({ message: 'La fecha de nacimiento debe estar comprendida entre los años 1900 y 2100.' });
            }
            if (!direccion) {
                return res.status(400).json({ message: 'El campo "Domicilio de residencia" es obligatorio.' });
            }
            if (!telefono) {
                return res.status(400).json({ message: 'El campo "Teléfono de contacto" es obligatorio.' });
            }
            if (!/^\d+$/.test(telefono)) {
                return res.status(400).json({ message: 'El teléfono no debe llevar letras ni caracteres, solo números.' });
            }
            if (!email) {
                return res.status(400).json({ message: 'El campo "Email" es obligatorio.' });
            }

            // --- VALIDACIONES PASO 2 (Habitación, Fechas y Reserva) ---
            if (!habitacion_id) {
                return res.status(400).json({ message: 'Debe seleccionar una habitación disponible para asignar.' });
            }
            if (!inDate) {
                return res.status(400).json({ message: 'La fecha y hora de Check-in es obligatoria.' });
            }
            if (!outDate) {
                return res.status(400).json({ message: 'La fecha y hora estimada de Check-out es obligatoria.' });
            }

            // Validación de Vehículo: opcional, pero si se ingresa patente, modelo/marca es obligatorio
            const pat = (vehiculo_patente || patente || '').trim().toUpperCase();
            const mod = (vehiculo_modelo || '').trim();
            if (pat && !mod) {
                return res.status(400).json({ message: 'Si ingresa la Patente del vehículo, debe ingresar obligatoriamente el Modelo o Marca.' });
            }
            const tieneAuto = Boolean(pat || mod || posee_vehiculo);
            const cantPersonas = Number(req.body.personas || adultos) || 1;

            // Validar acompañantes si fueron provistos
            if (Array.isArray(acompanantes)) {
                for (let i = 0; i < acompanantes.length; i++) {
                    const acomp = acompanantes[i];
                    if (!acomp.nombres || !acomp.numero_documento) {
                        return res.status(400).json({ 
                            message: `Acompañante #${i + 1}: Debe completar Nombre y Documento.` 
                        });
                    }
                    if (!soloLetrasRegex.test(acomp.nombres)) {
                        return res.status(400).json({ 
                            message: `Acompañante #${i + 1}: El nombre solo puede contener letras, sin números ni caracteres especiales.` 
                        });
                    }
                    if (acomp.apellidos && !soloLetrasRegex.test(acomp.apellidos)) {
                        return res.status(400).json({ 
                            message: `Acompañante #${i + 1}: El apellido solo puede contener letras, sin números ni caracteres especiales.` 
                        });
                    }
                    if (!/^\d+$/.test(String(acomp.numero_documento).trim())) {
                        return res.status(400).json({ 
                            message: `Acompañante #${i + 1}: El número de documento tiene que ser solo números sin caracteres ni letras.` 
                        });
                    }
                }
            }

            // Ejecución de la transacción atómica
            const result = await HuespedRepository.createCheckInCompleto({
                nombres: nomb,
                apellidos: apel,
                nombre: req.body.nombre,
                tipo_documento,
                numero_documento: docNum,
                dni: docNum,
                nacionalidad,
                fecha_nacimiento,
                direccion,
                telefono,
                email,
                posee_vehiculo: tieneAuto,
                vehiculo_modelo: mod,
                patente: pat,
                habitacion_id: Number(habitacion_id),
                fecha_checkin: inDate,
                fecha_checkout: outDate,
                adultos: cantPersonas,
                ninos: 0,
                acompanantes,
                precio_noche: Number(precio_noche) || 0,
                precio_total: Number(precio_total) || 0,
                creado_por_id
            });

            await LogRepository.create(
                'Recepcion',
                `Check-in completado: ${result.nombre} (Hab. #${habitacion_id}) con ${acompanantes.length} acompañante(s).`
            );

            return res.status(201).json(result);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    // POST /api/huespedes/checkout/:id
    static async checkout(req, res) {
        try {
            const id = parseInt(req.params.id);
            const result = await HuespedRepository.checkoutHuesped(id);
            
            await LogRepository.create('Recepcion', `Check-out realizado: ${result.huesped} (Hab. #${result.habitacion_id})`);

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}

