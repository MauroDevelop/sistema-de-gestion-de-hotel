# 🏨 Sistema de Gestión Hotelera - Evolución Ciclo 2026

## Contexto Académico
Este proyecto representa la base de trabajo para la cátedra de **segundo año** de la **Tecnicatura Superior en Desarrollo de Software**. 

Toma como punto de partida el trabajo realizado originalmente en primer año por el compañero WillyDevelop (Sistema de Gestión Hotelera - Prácticas Profesionalizantes I). El objetivo de esta nueva etapa es evolucionar esta base, aplicar nuevas arquitecturas y expandir sus capacidades trabajando en un entorno colaborativo real.

## Equipo de Desarrollo
* **Desarrolladores:** Mauro Algañaraz, Rodrigo Rivero, Wilian Fariña, José Ojeda y Esteban Abalos

## Estado Actual y Tecnologías
Para facilitar la migración inicial y por requerimiento del equipo, el código base se encuentra actualmente **unificado en un solo archivo (`index.html`)**. Este archivo contiene la estructura semántica, los estilos (CSS) y la lógica de negocio (JavaScript).

**Tecnologías base:**
* HTML5
* CSS3 (Flexbox, UI/UX básico)
* Vanilla JavaScript
* Persistencia de datos mediante `localStorage`

*Nota Técnica: El primer gran objetivo del equipo será modularizar este código, separando responsabilidades (arquitectura proxima a definir) antes de escalar hacia un backend más complejo.*

## Funcionalidades Activas
Actualmente, el sistema en su versión `v1.0-base` permite:
1. **Gestión de Huéspedes:** * Registro con DNI, fechas de entrada/salida.
   * Cálculo automático de noches de estadía.
   * Lógica de precios según tipo de habitación (Simple, Doble, Matrimonial, Suite) y servicios de comida.
   * Aplicación de descuentos dinámicos por paquetes (Finde/Semana).
2. **Gestión de Empleados:**
   * Registro de turnos con fecha y hora de ingreso/salida.
   * Cálculo automático de horas trabajadas.
3. **Persistencia:** Mantenimiento de datos en sesión local (CRUD funcional).

## Reglas de Colaboración (Workflow)
Para mantener un código limpio y evitar conflictos, el equipo trabajará bajo el estándar **Feature Branch Workflow (GitHub Flow)**:

1. **PROHIBIDO** hacer `push` directamente a la rama `main`.
2. La rama `main` siempre debe contener código estable y funcional.
3. Para cada nueva tarea, el desarrollador debe crear una rama a partir de `main` con el formato: `feature/nombre-de-la-tarea` o `fix/nombre-del-error`.
4. Una vez finalizada la tarea, se debe abrir un **Pull Request (PR)** hacia `main`.
5. Todo PR debe ser revisado y aprobado por el líder del equipo antes de realizar el `merge`.


### Modelo de Datos y Entidades

A continuación se detalla la estructura de datos definida por el equipo para el sistema, identificando las entidades principales, sus atributos y relaciones.

#### Entidades Principales

**1. HUÉSPED**
| Atributo | Tipo / Detalle |
| :--- | :--- |
| **ID** | **Primary Key (🔑)** |
| Nombre completo | Texto |
| DNI | Numérico |
| Habitación | *Foreign Key* (Relación con entidad HABITACIÓN) |
| Comida | *Foreign Key* (Relación con entidad COMIDA) |
| Descuento | *Foreign Key* (Relación con entidad DESCUENTO) |
| Fecha de entrada | Fecha |
| Fecha de salida | Fecha |

**2. EMPLEADO**
| Atributo | Tipo / Detalle |
| :--- | :--- |
| Nombre completo | Texto |
| DNI | Numérico |
| Fecha entrada | Fecha/Hora |
| Fecha salida | Fecha/Hora |


#### Entidades de Referencia (Catálogos)

**3. HABITACIÓN**
* **ID** (Primary Key)
* **Tipo**: `Simple`, `Doble`, `Matrimonial`, `Suite`

**4. COMIDA**
* **ID** (Primary Key)
* **Tipos**: `Desayuno`, `Media Pensión`, `Pensión Completa`

**5. DESCUENTO**
* **Tipo**: `Nulo`, `8%`, `12%`

---

### Reglas de Negocio

Las siguientes reglas deben aplicarse estrictamente a nivel de validación en el sistema para garantizar la integridad de los datos:

1. **Obligatoriedad de datos:** Ningún campo puede estar vacío al momento de realizar un registro.
2. **Coherencia temporal:** La hora de salida no puede ser anterior a la hora de ingreso (Aplica tanto para el registro de estadía de huéspedes como para los turnos de empleados).



estructura para el proyecto actualizando

hotel/
│
├── .gitignore
├── README.md
│
├── backend/
│   ├── .env.example
│   ├── .gitkeep
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma         # Esquema de base de datos MySQL
│   └── src/
│       ├── app.js                # Punto de entrada Express
│       ├── config/               # Configuración de Prisma/DB
│       │   └── db.js
│       ├── controllers/          # Lógica para auth, huéspedes, habitaciones y precios
│       │   ├── auth.controller.js
│       │   ├── huesped.controller.js
│       │   ├── habitacion.controller.js
│       │   └── precio.controller.js
│       ├── middlewares/          # JWT y control de roles (Admin/User)
│       │   ├── auth.middleware.js
│       │   └── role.middleware.js
│       ├── routes/               # Rutas expuestas de la API
│       │   ├── auth.routes.js
│       │   ├── huesped.routes.js
│       │   ├── habitacion.routes.js
│       │   └── precio.routes.js
│       └── services/             # Reglas de negocio y cálculo de costos/descuentos
│           ├── huesped.service.js
│           └── precio.service.js
│
└── frontend/
    ├── css/                      # Estilos css
    │   └── styles.css
    ├── js/                       # Consumo de la API Backend
    │   ├── api.js                # Instancia base de fetch/axios
    │   ├── auth.js               # Manejo de login/logout y JWT
    │   ├── huespedes.js          # Lógica del CRUD de huéspedes
    │   └── navegacion.js         # Control de vistas/pestañas por rol
    ├── pages/                    # Subpáginas modulares
    │   ├── login.html
    │   ├── huespedes.html
    │   ├── habitaciones.html
    │   └── precios.html
    └── index.html                # Vista principal 