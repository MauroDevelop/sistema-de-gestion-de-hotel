# Contratos de API RESTful para el Sistema de Gestión Hotelera

Este documento describe los endpoints que el equipo de backend debe implementar para que el frontend funcione correctamente. Cada endpoint incluye el método HTTP, la ruta, el payload que el frontend envía (cuando aplica) y la respuesta esperada en caso de éxito.

## 📋 Lista de Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/login` | Autenticación de usuario |
| GET | `/habitaciones` | Obtener lista de todas las habitaciones |
| POST | `/habitaciones` | Crear una nueva habitación |
| DELETE | `/habitaciones/:id` | Eliminar una habitación por su ID |
| GET | `/huespedes` | Obtener lista de todos los huéspedes |
| POST | `/huespedes` | Registrar un nuevo huésped |
| GET | `/usuarios` | Obtener lista de todos los usuarios (empleados) |
| POST | `/usuarios` | Crear un nuevo usuario |
| PUT | `/usuarios/:dni` | Actualizar un usuario existente |
| GET | `/logs` | Obtener historial de actividad del sistema |

---

## 📄 Detalle de cada endpoint

### 1. POST `/login`
**Payload (envía el frontend):**
```json
{
  "dni": "string",
  "pass": "string"
}
```
**Response (devuelve el backend):**
```json
{
  "dni": "string",
  "pass": "string",
  "nombre": "string",
  "rol": "string" // valores: "ADMIN" o "USER"
}
```

---

### 2. GET `/habitaciones`
**Payload:** (ninguno)

**Response (devuelve el backend):**
```json
[
  {
    "id": "number",
    "tipo": "string", // ej: "Simple", "Doble", "Matrimonial", "Suite"
    "precio": "number",
    "estado": "string", // valores: "LIBRE" o "OCUPADA"
    "caracteristicas": [
      "string"
    ]
  }
]
```

---

### 3. POST `/habitaciones` (Crear habitación)
**Payload (envía el frontend) - **NO incluir `id` (lo genera el backend):**
```json
{
  "tipo": "string",
  "precio": "number",
  "caracteristicas": [
    "string"
  ]
}
```
**Response (devuelve el backend):**
```json
{
  "id": "number",
  "tipo": "string",
  "precio": "number",
  "estado": "LIBRE",
  "caracteristicas": [
    "string"
  ]
}
```

---

### 4. DELETE `/habitaciones/:id`
**Payload:** (ninguno)

**Response (devuelve el backend):**
```json
{
  "message": "Habitación eliminada correctamente"
}
```
(Opcional: devolver el objeto eliminado o simplemente 204 No Content)

---

### 5. GET `/huespedes`
**Payload:** (ninguno)

**Response (devuelve el backend):**
```json
[
  {
    "id": "number",
    "nombre": "string",
    "dni": "string",
    "habitacion_id": "number",
    "ingreso": "string", // formato ISO date: "YYYY-MM-DD"
    "salida": "string", // formato ISO date o "A definir"
    "comida": "string",
    "descuento": "number", // porcentaje (ej: 10 para 10%)
    "estado": "string" // valores: "ACTIVO", etc.
  }
]
```

---

### 6. POST `/huespedes` (Registrar huésped)
**Payload (envía el frontend) - **NO incluir `id` ni `estado` (los genera el backend):**
```json
{
  "nombre": "string",
  "dni": "string",
  "habitacion_id": "number",
  "ingreso": "string", // formato ISO date: "YYYY-MM-DD"
  "salida": "string", // opcional, puede venir vacío
  "comida": "string",
  "descuento": "number"
}
```
**Response (devuelve el backend):**
```json
{
  "id": "number",
  "nombre": "string",
  "dni": "string",
  "habitacion_id": "number",
  "ingreso": "string",
  "salida": "string",
  "comida": "string",
  "descuento": "number",
  "estado": "ACTIVO"
}
```
**Nota:** El backend debe validar que la habitación exista y esté libre, y luego actualizar su estado a `OCUPADA`.

---

### 7. GET `/usuarios`
**Payload:** (ninguno)

**Response (devuelve el backend):**
```json
[
  {
    "dni": "string",
    "pass": "string",
    "nombre": "string",
    "rol": "string" // valores: "ADMIN" o "USER"
  }
]
```

---

### 8. POST `/usuarios` (Crear usuario)
**Payload (envía el frontend):**
```json
{
  "nombre": "string",
  "dni": "string",
  "pass": "string",
  "rol": "string" // valores: "ADMIN" o "USER"
}
```
**Response (devuelve el backend):**
```json
{
  "nombre": "string",
  "dni": "string",
  "pass": "string",
  "rol": "string"
}
```

---

### 9. PUT `/usuarios/:dni` (Actualizar usuario)
**Payload (envía el frontend) - **el dni va en la ruta, no en el cuerpo:**
```json
{
  "nombre": "string",
  "pass": "string",
  "rol": "string"
}
```
**Response (devuelve el backend):**
```json
{
  "nombre": "string",
  "dni": "string", // mismo que en la ruta
  "pass": "string",
  "rol": "string"
}
```

---

### 10. GET `/logs`
**Payload:** (ninguno)

**Response (devuelve el backend):**
```json
[
  {
    "fecha": "string", // formato: "YYYY-MM-DD HH:MM"
    "usuario": "string",
    "accion": "string"
  }
]
```

---

## 🛠️ Notas importantes para el backend

- **IDs generados por la base de datos:** En los endpoints de creación (`POST /habitaciones`, `POST /huespedes`, `POST /usuarios`) el frontend **no debe enviar** el campo `id`. El backend debe generar un identificador único y devolverlo en la respuesta.
- **Datos complejos como arrays:** El campo `caracteristicas` de las habitaciones debe enviarse y recibirse como un array de strings (`string[]`), nunca como una string separada por comas.
- **Separación de creación y actualización:** Para usuarios, se usan dos endpoints distintos: `POST /usuarios` para crear y `PUT /usuarios/:dni` para actualizar, siguiendo el estándar REST.
- **Estados controlados por el backend:** El estado de una habitación (`LIBRE`/`OCUPADA`) y el estado de un huésped (`ACTIVO`) deben ser gestionados completamente por el backend; el frontend solo envía los datos necesarios y muestra lo que recibe.
- **Manejo de errores:** En caso de fallo (por ejemplo, habitación ya existente, credenciales inválidas, habitación no disponible), el backend debe responder con el código de estado HTTP apropiado (400, 401, 404, 409, etc.) y un mensaje explicativo en el cuerpo de la respuesta.
