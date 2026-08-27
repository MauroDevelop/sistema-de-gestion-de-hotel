# Documentación del Frontend - Sistema de Gestión Hotelera

GUÍA PARA EL BACKEND: Cómo conectar la Base de Datos

El frontend sigue una arquitectura basada en capas donde cada archivo tiene una responsabilidad bien definida:

- **index.html**: Vista (View) que define la estructura y presentación de la interfaz mediante HTML y CSS.
- **main.js**: Controlador (Controller) que gestiona los eventos del usuario, coordina la lógica de aplicación y actualiza la vista según el estado.
- **js/services/api.js**: Cliente HTTP (Service) que encapsula todas las llamadas al backend, actuando como capa de acceso a datos.
- **js/ui/render.js**: Renderizador (Renderer) que transforma los datos recibidos del backend en representación DOM (codigo de html) adecuada para su visualización.

> [!NOTE]
> GitHub-style alert

> **Qué es el DOM (Document Object Model):** 
> Es la estructura de árbol que crea el navegador al leer tu archivo HTML. Permite que el código JavaScript encuentre los elementos de la página para interactuar con ellos, ocultarlos, cambiarles el color o inyectar nueva información en tiempo real.

El ciclo de vida de la información se representa mediante el siguiente flujo:

```
┌─────────────────────────────────────┐
│ 1. Usuario interactúa con el DOM    │
│    (index.html)                     │
└───────────────┬─────────────────────┘
                ▼
┌─────────────────────────────────────┐
│ 2. main.js (Controlador)            │
│    - Detecta eventos del usuario    │
│    - Llama a js/services/api.js     │
└───────────────┬─────────────────────┘
                ▼
┌─────────────────────────────────────┐
│ 3. js/services/api.js               │
│    (Cliente HTTP)                   │
│    → Envía petición al Backend      │
└───────────────┬─────────────────────┘
                ▼
┌─────────────────────────────────────┐
│ 4. Backend procesa y responde       │
└───────────────┬─────────────────────┘
                ▼
┌─────────────────────────────────────┐
│ 5. js/services/api.js               │
│    → Recibe datos del Backend       │
└───────────────┬─────────────────────┘
                ▼
┌─────────────────────────────────────┐
│ 6. js/ui/render.js                  │
│    (Renderizador)                   │
│    → Formatea datos para la UI      │
└───────────────┬─────────────────────┘
                ▼
┌─────────────────────────────────────┐
│ 7. main.js (Controlador)            │
│    → Actualiza index.html (Vista)   │
└─────────────────────────────────────┘
```

✅ QUÉ ARCHIVOS DEBES MODIFICAR
- `js/services/api.js`: Es el único punto donde se debe implementar la comunicación real con el backend. Modificar este archivo permite reemplazar la simulación de datos por llamadas HTTP efectivas sin afectar la presentación ni la lógica de control.

❌ QUÉ ARCHIVOS NO DEBES TOCAR
- `index.html`: Alterar la vista cambia la estructura DOM y puede romper los selectores y event listeners del controlador.
- `css/styles.css`: Modificar estilos afecta la presentación visual y puede inconsistencias con las clases utilizadas por el JavaScript.
- `js/ui/render.js`: Cambiar el renderizador altera la forma en que se presentan los datos, lo que puede generar incompatibilidades con las expectativas del controlador y del backend.

Para conocer las firmas exactas de los métodos y la estructura de los payloads que deben enviarse y esperarse, consulte el archivo `CONTRATOS_API.md`.

## Estructura del Proyecto

```
frontend/
├── index.html              # Página principal de la aplicación
├── css/
│   └── styles.css          # Estilos personalizados (scrollbars, animaciones)
└── js/
    ├── main.js             # Lógica principal de la aplicación
    ├── data/
    │   └── db.js           # Base de datos simulada en memoria
    ├── services/
    │   ├── api.js          # Capa de acceso a datos
    │   └── auth.js         # Gestión de autenticación y sesión
    └── ui/
        └── render.js       # Renderizado dinámico de componentes UI
```

## Descripción de Archivos

### index.html
Archivo HTML principal que contiene la estructura completa de la interfaz de usuario de la aplicación de gestión hotelera. Incluye:

- **Contenedor de login**: Formulario de autenticación para empleados (DNI y contraseña)
- **Contenedor de aplicación**: Interfaz principal que se muestra después del login exitoso
- **Sidebar de navegación**: Menú lateral con acceso a diferentes secciones:
  - Habitaciones (principal)
  - Huéspedes
  - Empleados y Logs (solo visible para administradores)
- **Header superior**: Barra de título con información del usuario y botón de logout
- **Secciones de contenido**: 
  - `page-habitaciones`: Grid de habitaciones con filtros y botón para agregar nuevas
  - `page-huespedes`: Tabla de huéspedes registrados con búsqueda
  - `page-empleados`: Gestión de usuarios y historial de actividad (admin only)
- **Modales**: Ventanas emergentes para:
  - Agregar/editar habitaciones
  - Registrar huéspedes
  - Gestionar usuarios (crear/editar)
  - Ver detalles de habitaciones
- **Integración de Tailwind CSS**: Utiliza CDN para estilos utility-first
- **Script modular**: Carga `main.js` como módulo ES6

### css/styles.css
Hoja de estilos personalizados mínimos que complementa a Tailwind CSS:

- **Scrollbars personalizadas**: Estilo para barras de desplazamiento webkit
- **Clase fade-in**: Animación de entrada suave para elementos
- **Keyframes**: Definición de la animación fadeIn

### js/main.js
Lógica principal de la aplicación que coordina todos los componentes:

- **Inicialización**: Verifica sesión activa y carga la interfaz correspondiente
- **Gestión de login**: Maneja el formulario de autenticación y redirección
- **Navegación**: Controla el sidebar y cambio de secciones mediante data-target
- **Control de roles**: Muestra/oculta secciones administrativas según rol de usuario
- **Event listeners**: 
  - Botones de logout
  - Apertura de modales (añadir habitación, usuario, huésped)
  - Edición de usuarios
  - Visualización y eliminación de habitaciones
  - Cierre de modales
  - Filtrado de habitaciones y búsqueda de huéspedes
  - Selección de fecha actual para check-in
- **Envío de forms**: Maneja el envío de formularios para crear habitaciones, usuarios y huéspedes

### js/services/api.js
Capa de acceso a datos que interactúa con la base de datos simulada:

- **login**: Verifica credenciales contra la tabla de usuarios
- **getHabitaciones**: Obtiene lista de habitaciones
- **addHabitacion**: Agrega nueva habitación con validación de ID duplicado
- **deleteHabitacion**: Elimina habitación por ID
- **getHuespedes**: Obtiene lista de huéspedes
- **addHuesped**: Registra nuevo huésped y marca habitación como ocupada
- **getUsuarios**: Obtiene lista de empleados/usuarios
- **getLogs**: Obtiene historial de actividad
- **createUsuario**: Registra nuevos empleados
- **updateUsuario**: Modifica empleados existentes

### js/services/auth.js
Gestión de autenticación y manejo de sesión:

- **login**: Autentica usuario y guarda token en localStorage
- **logout**: Elimina token y restablece vista de login
- **getUser**: Recupera usuario actual desde localStorage

### js/ui/render.js
Responsable de renderizado dinámico de la interfaz basada en los datos:

- **habitaciones**: Renderiza grid de habitaciones con filtros aplicables
  - Filtros por tipo, estado y búsqueda de texto
  - Visualización de estado (LIBRE/OCUPADA) con colores indicativos
  - Precio formateado según locale es-AR
  - Botón para ver detalles de cada habitación
- **huespedes**: Renderiza tabla de huéspedes con funcionalidad de búsqueda
  - Muestra nombre, DNI, habitación asignada, fechas, servicio y estado
  - Indicadores visuales para descuentos
- **empleados**: Renderiza dos tablas:
  - Gestión de usuarios: nombre, DNI, rol y botón de edición
  - Historial de actividad: fecha, empleado y acción realizada

### js/data/db.js
Base de datos simulada en memoria que contiene los datos iniciales del sistema:

- **habitaciones**: Array de habitaciones iniciales con diferentes tipos, precios y características
- **huespedes**: Array con huéspedes de ejemplo
- **usuarios**: Credenciales de acceso (admin y recepcionista)
- **logs**: Historial de actividades del sistema

--- Notas Técnicas ---

- **Vanilla JavaScript:** La lógica y manipulación del DOM se manejan con JS nativo (ES6 Modules), sin frameworks adicionales.
- **Tailwind CSS:** Se utiliza mediante CDN para el maquetado rápido (utility-first).
- **Manipulación de Vistas:** La navegación entre pestañas y la apertura de modales se controla dinámicamente alternando la clase `.hidden` en los elementos correspondientes.
