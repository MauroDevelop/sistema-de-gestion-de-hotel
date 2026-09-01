# 🏨 Sistema de Gestión Hotelera - Evolución Ciclo 2026

## Contexto Académico
Este proyecto representa la evolución de la solución de software para la cátedra de **segundo año** de la **Tecnicatura Superior en Desarrollo de Software**.

Toma como punto de partida el prototipo base realizado en primer año por el compañero WillyDevelop (*Sistema de Gestión Hotelera - Prácticas Profesionalizantes I*). El objetivo de esta nueva etapa es evolucionar esa base monolítica hacia una **arquitectura Full-Stack desacoplada**, aplicando patrones de diseño, seguridad avanzada y buenas prácticas de ingeniería de software en un entorno colaborativo real.

## Equipo de Desarrollo
* **Desarrolladores:** Mauro Algañaraz, Rodrigo Rivero, Wilian Fariña y José Ojeda

---

## Evolución del Proyecto:

| Aspecto | Primera Versión (`primera version`) | Versión Actual (`sistema-de-gestion-de-hotel`) |
| :--- | :--- | :--- |
| **Arquitectura** | Monolito Cliente en un solo archivo (`index.html`). | Arquitectura cliente-servidor desacoplada (Frontend + Backend REST API). |
| **Persistencia** | Simulación local con `localStorage`. | Base de datos relacional MySQL con transacciones ACID. |
| **Lógica de Negocio** | Código JS embebido en interfaz. | Servicios de dominio (`services/`) con patrones de diseño. |
| **Autenticación** | Sin autenticación o mock local. | Autenticación de 3 factores (Correo + DNI + Password), JWT y Bcrypt. |
| **Seguridad y Control** | Acceso libre a todas las vistas. | Control de acceso basado en roles (RBAC: ADMIN / RECEPCION) y logs de auditoría. |

---

## Tecnologías y Stack Tecnológico

### Backend
* **Entorno de Ejecución:** Node.js (ES Modules)
* **Framework Web:** Express.js (API RESTful)
* **Base de Datos:** MySQL con `mysql2/promise` (Pool de conexiones y soporte transaccional)
* **Seguridad & Autenticación:** 
  * `jsonwebtoken` (Firma y verificación JWT con expiración de 12h)
  * `bcrypt` / `bcryptjs` (Hashing de contraseñas)
* **Utilidades:** `dotenv` (Variables de entorno) y `cors` (Intercambio de recursos de origen cruzado)

### Frontend
* **Estructura:** HTML5 Semántico
* **Estilos:** CSS3 Modular (Flexbox, Grid, Variables CSS y diseño adaptativo)
* **Lógica Cliente:** Vanilla JavaScript (ES Modules: `api.js`, `auth.js`, `render.js`, `main.js`)
* **Consumo API:** Fetch API con interceptores de Token JWT (`Bearer Token`)

---

## Arquitectura de Software y Patrones de Diseño

El sistema ha sido reestructurado siguiendo principios **SOLID** y patrones de diseño reconocidos en la industria:

1. **Patrón Estrategia (*Strategy Pattern*):**
   - Implementado en [`precio.service.js`](file:///c:/Users/willy/Documents/IT/Modelado%20de%20software/hotel/sistema-de-gestion-de-hotel/backend/src/services/precio.service.js).
   - Encapsula las reglas de tarifación por régimen de comida (`SOLO_ALOJAMIENTO`, `DESAYUNO` [+10%], `MEDIA_PENSION` [+25%], `PENSION_COMPLETA` [+40%]). Permite agregar nuevos planes de pensión sin modificar la lógica existente (*Open/Closed Principle*).
2. **Patrón Repositorio (*Repository Pattern*):**
   - Implementado en el directorio [`repositories/`](file:///c:/Users/willy/Documents/IT/Modelado%20de%20software/hotel/sistema-de-gestion-de-hotel/backend/src/repositories).
   - Aisla las consultas SQL directas (`huesped.repository.js`, `reserva.repository.js`, `room.repository.js`, `user.repository.js`, `log.repository.js`) de la lógica de negocio.
3. **Arquitectura en Capas (*Layered Architecture*):**
   - **Rutas (`routes/`):** Definición de endpoints API protegidos por middlewares.
   - **Middlewares (`middlewares/`):** Verificación de tokens JWT y autorización basada en roles (RBAC).
   - **Controladores (`controllers/`):** Recepción de peticiones HTTP, validación inicial de parámetros y respuesta JSON.
   - **Servicios (`services/`):** Orquestación de reglas de negocio, validaciones complejas y cálculo de costos.
   - **Repositorios (`repositories/`):** Capa de persistencia y consultas transaccionales a MySQL.

---

## Módulos y Funcionalidades Principales

### 1. Autenticación y Seguridad de 3 Factores
* **Login Seguro:** Verificación simultánea de **Correo electrónico**, **DNI** y **Contraseña**.
* **Gestión de Sesiones:** Generación de JWT almacenado en cliente con autodestrucción por expiración (12 horas).
* **Control de Roles (RBAC):** 
  * `ADMIN`: Acceso completo a usuarios, configuración, habitaciones y registros de auditoría.
  * `RECEPCION`: Operación diaria de check-in, check-out, gestión de huéspedes y habitaciones.
* **Auditoría y Logs:** Registro automático de acciones clave por usuario con fecha, hora e IP.

### 2. Gestión de Huéspedes
* **Validación Rigurosa:** Sanitización de datos (`trim()`, `toLowerCase()`), formato de e-mail mediante Regex.
* **Verificación de Edad:** Restricción obligatoria de mayoría de edad (+18 años) para el titular de la reserva.
* **Atributos de Ficha:** DNI, datos de contacto, dirección, vehículos (modelo/patente) y métodos de pago.

### 3. Gestión de Habitaciones y Comodidades
* **Categorías:** `Simple`, `Doble`, `Matrimonial`, `Suite`.
* **Estados Dinámicos:** `LIBRE`, `OCUPADA`, `LIMPIEZA`.
* **Catálogo de Comodidades:** Asignación de adicionales (Jacuzzi, Balcón, Minibar, etc.) con recargos dinámicos por noche.

### 4. Motor de Reservas, Check-In & Check-Out
* **Check-In:** Orquestación transaccional que valida disponibilidad de habitación, asocia el huésped, calcula noches efectivas, aplica el régimen de pensión elegido y descuenta promociones (rango 0% a 100%).
* **Check-Out:** Cálculo del consumo real de estadía, cierre financiero de la reserva, generación de comprobante de pago y actualización automática del estado de la habitación.

---

## Estructura del Proyecto

```
sistema-de-gestion-de-hotel/
├── schema.sql                   # Script SQL de creación e inicialización de BD MySQL
├── update.md                    # Documentación técnica de servicios y lógica de negocio
├── README.md                    # Documentación principal del sistema
│
├── backend/                     # Servidor backend API REST (Express.js)
│   ├── package.json             # Manifiesto de dependencias y scripts Node
│   └── src/
│       ├── app.js               # Punto de entrada y configuración Express
│       ├── config/              # Configuración e inicialización de conexión MySQL
│       │   ├── db.js
│       │   └── dbInit.js
│       ├── controllers/         # Controladores HTTP (auth, habitacion, huesped, reserva, usuario)
│       ├── middlewares/         # Middlewares de seguridad (JWT y RBAC)
│       ├── repositories/        # Capa de datos y consultas SQL
│       ├── routes/              # Endpoints API (/api/...)
│       └── services/            # Lógica de negocio (precio, huesped, habitacion, auth, reserva)
│
└── frontend/                    # Cliente web frontend (HTML/CSS/JS Modules)
    ├── index.html               # Vista principal / Dashboard interactivo
    ├── CONTRATOS_API.md          # Especificación detallada de contratos de la API
    ├── README-FRONTEND.md       # Documentación de arquitectura frontend
    ├── css/                     # Estilos CSS modulares
    └── js/                      # Código JavaScript modular
        ├── main.js              # Inicializador de la aplicación
        ├── services/            # Cliente de API (api.js) y Auth (auth.js)
        └── ui/                  # Renderizado de componentes y modales (render.js)
```

---

## Modelo de Datos (MySQL)

El sistema utiliza la base de datos `sistema_hotel` estructurada en las siguientes tablas principales:

* `cargos`: Catálogo de roles del sistema (`1: ADMIN`, `2: RECEPCION`).
* `usuario`: Credenciales de acceso, DNI, correo, cargo y hash de contraseña.
* `huesped`: Información personal, de contacto y vehículo de los huéspedes.
* `habitacion`: Número de habitación, tipo, cantidad de camas, precio base por noche y estado.
* `caracteristicas_catalogo`: Catálogo de comodidades disponibles.
* `reserva_data`: Fechas de inicio/fin, pensión seleccionada y porcentaje de descuento.
* `reserva`: Relación de check-in vinculando huésped, habitación, reserva y usuario que la registró.
* `pago`: Registro de pagos y liquidaciones monetarias.
* `logs`: Auditoría de actividades y eventos del sistema.

---

## Guía de Instalación y Ejecución

### Prerrequisitos
* **Node.js** (Versión 16 u superior)
* **MySQL Server** (Versión 8.0 u superior)

### 1. Instalación del Backend
```bash
cd backend
npm install
```

### 3. Iniciar el Servidor Backend
```bash
# Modo Desarrollo (con recarga automática Nodemon)
npm run dev

# Modo Producción
npm start
```
El servidor backend se iniciará en `http://localhost:3000`.

### 4. Acceder al Frontend
Al iniciar el backend, Express sirve automáticamente los archivos estáticos del frontend. Acceda desde su navegador web a:
```
http://localhost:3000
```

---

## Reglas de Colaboración (Workflow)

El equipo de desarrollo trabaja bajo el estándar **Feature Branch Workflow (GitHub Flow)**:

1. **PROHIBIDO** hacer `push` directamente a la rama `main`.
2. La rama `main` siempre debe contener código estable, probado y listo para producción.
3. Para cada nueva tarea o corrección, cree una rama a partir de `main`:
   - Nuevas funciones: `feature/nombre-de-la-tarea`
   - Correcciones: `fix/nombre-del-error`
4. Al finalizar la tarea, abra un **Pull Request (PR)** hacia `main`.
5. Todo PR debe ser revisado y aprobado por el equipo antes de realizar el `merge`.