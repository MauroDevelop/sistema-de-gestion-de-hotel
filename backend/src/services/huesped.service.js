// servicio encargado de la validacion y normalizacion de los datos del huesped

export class HuespedService {
    // valida y normaliza toda la informacion requerida del huesped antes de guardarla
    static validarYFormatear(data) {
        // desestructuracion de campos desde el objeto recibido
        const {
            nombre,
            apellido,
            tipo_documento = 'DNI',
            nro_documento,
            nacionalidad,
            fecha_nacimiento,
            correo,
            telefono,
            direccion,
            ciudad,
            pais,
            contacto_emergencia_nombre,
            contacto_emergencia_telefono
        } = data;

        // lista de campos que son estrictamente obligatorios
        const camposObligatorios = {
            nombre,
            apellido,
            nro_documento,
            nacionalidad,
            fecha_nacimiento,
            correo,
            telefono,
            direccion,
            ciudad,
            pais
        };

        // recorre cada campo obligatorio para verificar que no venga vacio o solo con espacios
        for (const [campo, valor] of Object.entries(camposObligatorios)) {
            if (!valor || String(valor).trim() === '') {
                throw new Error(`El campo '${campo}' es obligatorio para el registro del huésped.`);
            }
        }

        // expresion regular para verificar que el formato del correo sea valido
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            throw new Error('El formato del correo electrónico es inválido.');
        }

        // convierte la fecha de nacimiento a objeto Date para validar si es fecha real
        const fechaNac = new Date(fecha_nacimiento);
        if (isNaN(fechaNac.getTime())) {
            throw new Error('La fecha de nacimiento proporcionada no es válida.');
        }

        // calcula la edad actual restando los años
        const edad = new Date().getFullYear() - fechaNac.getFullYear();
        if (edad < 18) {
            throw new Error('El huésped principal titular debe ser mayor de 18 años.');
        }

        // retorna el objeto con todos los valores limpios y formateados (sin espacios extra y correo en minuscula)
        return {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            tipo_documento: tipo_documento.toUpperCase().trim(),
            nro_documento: String(nro_documento).trim(),
            nacionalidad: nacionalidad.trim(),
            fecha_nacimiento,
            correo: correo.trim().toLowerCase(),
            telefono: String(telefono).trim(),
            direccion: direccion.trim(),
            ciudad: ciudad.trim(),
            pais: pais.trim(),
            contacto_emergencia_nombre: contacto_emergencia_nombre ? contacto_emergencia_nombre.trim() : null,
            contacto_emergencia_telefono: contacto_emergencia_telefono ? String(contacto_emergencia_telefono).trim() : null
        };
    }
}
