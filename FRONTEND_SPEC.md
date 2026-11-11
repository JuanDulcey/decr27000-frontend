# AUDITSYS MINI — ESPECIFICACIÓN TÉCNICA Y DE DISEÑO COMPLETA DE FRONTEND (`/frontend`)

> **Propósito de este documento**: Este archivo contiene la especificación técnica, de interfaz de usuario (UI/UX), sistema de diseño, validaciones en cliente y contrato de consumo de API REST **100% autocontenida** para que una Inteligencia Artificial (o equipo de desarrollo) construya de principio a fin el módulo `/frontend` de **AuditSys Mini – Sistema de Gestión de Auditorías de Sistemas de Información (ISO/IEC 27001:2022 & ISO/IEC 27002:2022)**.

---

## 1. Arquitectura General del Frontend (`/frontend`)

- **Enfoque Tecnológico**: Aplicación Web Multipágina (**MPA** con páginas HTML independientes que recargan al cambiar de módulo) construida con **HTML5 semántico + CSS3 (Variables CSS + Tailwind CSS vía CDN) + Vanilla JavaScript (Módulos ES6)**.
- **Librerías CDN Ligeras Incluidas**:
  - **Tailwind CSS CDN** (`https://cdn.tailwindcss.com`) configurado con la paleta corporativa oficial del proyecto.
  - **Lucide Icons / FontAwesome CDN** para iconografía clara de auditoría y seguridad.
  - **Chart.js CDN** (`https://cdn.jsdelivr.net/npm/chart.js`) para los gráficos del Dashboard (`RF09`: gráfico de anillo de controles por estado y gráfico de barras de hallazgos por severidad).
  - **html2pdf.js CDN** (`https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js`) + estilos nativos `@media print` para la generación y descarga del Informe Consolidado en PDF (`RF08`, `CP-10`).
- **Despliegue**: **Vercel** (apuntando el *Root Directory* a `frontend`), consumiendo el Backend desplegado en **Render** mediante `API_BASE_URL`.

---

## 2. Estructura de Archivos del Frontend (`/frontend`)

La IA debe generar exactamente la siguiente estructura de archivos dentro de `/frontend`:

```text
frontend/
├── vercel.json                   # Configuración estática para Vercel
├── index.html                    # Redirección automática o vista de Login (igual a login.html)
├── login.html                    # Pantalla de Autenticación + Botones de Acceso Rápido Demo (Auditor / Admin)
├── dashboard.html                # Pantalla 1: Dashboard de Indicadores y Auditorías (RF09, CP-11)
├── auditoria.html                # Pantalla 2: Configuración / Nueva Auditoría (RF01, CP-01, CP-02)
├── catalogo.html                 # Pantalla 3: Catálogo de 93 Controles ISO 27002 y Selección 10-15 (RF02, CP-03, CP-13)
├── evaluacion.html               # Pantalla 4: Evaluación de Controles y Evidencias (RF03, RF04, CP-04, CP-05, CP-06)
├── hallazgos.html                # Pantalla 5: Hallazgos, Recomendaciones y Matriz de Trazabilidad (RF05, RF06, RNF05, CP-07, CP-08)
├── informe.html                  # Pantalla 6: Vista Previa, Versiones y Exportación PDF del Informe (RF07, RF08, CP-09, CP-10)
├── css/
│   └── styles.css                # Variables CSS oficiales, chips de estado, diseño móvil (>=44px) y reglas @media print
└── js/
    ├── config.js                 # Define API_BASE_URL (ej. http://localhost:4000/api o URL de Render)
    ├── api.js                    # Cliente Fetch centralizado (inyecta JWT, maneja errores 400/401/403 y estados de carga)
    ├── auth.js                   # Lógica de sesión, protección de páginas privadas y cambio de rol demo
    ├── layout.js                 # Inyecta Sidebar, Header con selector de Auditoría Activa, Stepper de 6 pasos y alertas Toast
    ├── validators.js             # Funciones de validación en línea (muestran error bajo el campo sin borrar lo digitado)
    ├── dashboard.js              # Controlador de dashboard.html (KPIs, Chart.js, selector de auditoría y botón Reset Demo)
    ├── auditoria.js              # Controlador de auditoria.html (Formulario RF01, validaciones CP-01/CP-02, cambio de estado)
    ├── catalogo.js               # Controlador de catalogo.html (Buscador, filtro 4 categorías, contador 10-15 CP-03, edición Admin CP-13)
    ├── evaluacion.js             # Controlador de evaluacion.html (Panel maestro-detalle, 4 estados, justificación NA CP-05, evidencias EV-nn CP-06)
    ├── hallazgos.js              # Controlador de hallazgos.html (CRUD Hallazgos H-nn CP-07, Recomendaciones CP-08 y tabla de Trazabilidad RNF05)
    └── informe.js                # Controlador de informe.html (8 secciones del informe, cálculo CP-09, snapshot y exportación PDF CP-10)
```

---

## 3. Sistema de Diseño y Convenciones Visuales Oficiales

El diseño debe cumplir rigurosamente las convenciones visuales, de accesibilidad y de adaptabilidad móvil especificadas en el documento académico (`AuditSys_Mini_Proyecto_Ejemplo.docx`, Sección 3):

### 3.1. Paleta de Colores Oficial (`css/styles.css` y Configuración Tailwind)

| Elemento / Estado | Código HEX | Texto Obligatorio en UI | Uso en el Sistema |
| :--- | :--- | :--- | :--- |
| **Acción Principal (Corporativo)** | `#003366` | *(Botón sólido)* | Encabezados principales, barra lateral activa, botones "Guardar", "Continuar", "Generar PDF". |
| **Acento Secundario** | `#00C6D0` | *(Etiquetas y avance)* | Barras de progreso, indicadores de paso activo en el Stepper, badges normativos ISO. |
| **Estado: Implementado** | `#2E9E5B` | `Implementado` | Chip/Badge verde con ícono `✓`. Control con evidencia suficiente y operación conforme al criterio. |
| **Estado: Parcial** | `#F2A900` | `Parcial` | Chip/Badge ámbar con ícono `◐` (texto oscuro `#1E293B` para alto contraste). Control con brechas. |
| **Estado: No implementado** | `#D64545` | `No implementado` | Chip/Badge rojo con ícono `✕`. Sin evidencia de implementación frente al criterio. |
| **Estado: No aplicable** | `#8A98A3` | `No aplicable` | Chip/Badge gris pizarra con ícono `—`. Fuera del alcance; exige justificación formal. |
| **Estado: Pendiente** | `#64748B` | `Pendiente de evaluar` | Chip neutro con borde punteado para controles recién seleccionados aún no evaluados. |
| **Severidad Alta / Media / Baja** | `#D64545` / `#F2A900` / `#2E9E5B` | `Severidad Alta` / `Media` / `Baja` | Badges de criticidad en Hallazgos y Recomendaciones. |

### 3.2. Cinco Principios de Diseño Obligatorios
1. **Flujo Guiado en 6 Pasos (Stepper Superior Persistente)**:
   En la parte superior de todas las páginas internas se muestra una barra de progreso horizontal con enlaces directos a los 6 pasos del proceso auditor sobre la auditoría activa:
   `1. Dashboard (dashboard.html)` $\rightarrow$ `2. Datos de Auditoría (auditoria.html)` $\rightarrow$ `3. Catálogo y Selección [10-15] (catalogo.html)` $\rightarrow$ `4. Evaluación y Evidencias (evaluacion.html)` $\rightarrow$ `5. Hallazgos y Recomendaciones (hallazgos.html)` $\rightarrow$ `6. Informe Consolidado (informe.html)`.
2. **Una Tarea Principal por Pantalla**:
   - En `evaluacion.html`, el auditor tiene la lista lateral de los controles seleccionados (10 a 15) y a la derecha el panel integral del control activo: criterio normativo, pregunta orientadora, selector de los 4 estados, observación, justificación de no aplicabilidad, listado/registro de evidencias (`EV-nn`) y botón directo para levantar un hallazgo sin perder el contexto.
3. **Estado Siempre Visible con Texto + Color + Ícono**:
   - Nunca comunicar el estado de un control o la severidad de un hallazgo únicamente con color (accesibilidad).
4. **Validación en Línea Conservando lo Digitado (`RNF03`)**:
   - Ningún error de validación debe borrar el formulario ni usar `alert()` intrusivos del navegador.
   - Cada campo obligatorio lleva asterisco rojo (`*`) y un contenedor `<p class="field-error text-xs text-[#D64545] mt-1 hidden" id="error-campo"></p>` debajo del input. Si falla la validación (en cliente o devuelta por el backend con `400`), el borde del input se pinta en `#D64545` y se muestra el mensaje exacto debajo del campo conservando intactos todos los datos escritos por el usuario.
5. **Adaptabilidad Móvil (`RNF01` y Caso de Prueba `CP-12` — Pantalla 7)**:
   - En resoluciones móviles (desde `360px` de ancho):
     - Disposición en una sola columna (`grid-cols-1`).
     - Barra lateral plegable mediante botón hamburguesa en el encabezado superior.
     - Todos los botones de acción, selectores de estado e interruptores tienen una **altura mínima de `44px` (`min-h-[44px]`)** para operación táctil cómoda.
     - Tablas con desplazamiento horizontal limpio o tarjetas apiladas responsivas.

---

## 4. Especificación Detallada Pantalla por Pantalla

### 4.0. Pantalla de Autenticación (`login.html` e `index.html`) — `RNF04` y `CP-13`
- **Diseño**: Tarjeta corporativa centrada con identidad visual de **AuditSys Mini — ISO/IEC 27001 & 27002:2022**.
- **Componentes**:
  1. Formulario de inicio de sesión con `correo` y `password` (con validación en línea).
  2. **Bloque de "Acceso Rápido Académico / Sustentación (1-Clic)"**:
     - Botón **"Ingresar como Auditora Líder (Ana R.)"** $\rightarrow$ Autocompleta y envía `ana.auditora@auditsys.edu.co` / `Audit2026*` (Rol: `auditor`).
     - Botón **"Ingresar como Administrador SGSI"** $\rightarrow$ Autocompleta y envía `admin@auditsys.edu.co` / `Audit2026*` (Rol: `admin`).
  3. **Campo configurable de URL del Backend (`API_BASE_URL`)** en un acordeón discreto *"Configuración de Conexión API"*, permitiendo apuntar fácilmente a `http://localhost:4000/api` o a la URL de producción en Render sin tocar código si cambia el dominio.
- **Comportamiento**: Al autenticar con `POST /api/auth/login`, guarda `auditsys_token` y `auditsys_user` en `localStorage`, verifica o selecciona `auditsys_active_audit_id = 1` (Empresa ABC por defecto) y redirige a `dashboard.html`.

---

### 4.1. Layout Compartido (`js/layout.js`) en las 6 Páginas Internas
Todas las páginas internas (`dashboard.html`, `auditoria.html`, `catalogo.html`, `evaluacion.html`, `hallazgos.html`, `informe.html`) comparten:
- **Sidebar Izquierdo (`#003366`)**:
  - Logo de AuditSys Mini y subtítulo `ISO/IEC 27002:2022`.
  - Enlaces de navegación a las 6 páginas con resaltado activo en cian (`#00C6D0`).
  - Indicador del usuario conectado (`nombre`, badge de `rol`: `AUDITOR` o `ADMIN`) y botón `Cerrar sesión`.
- **Top Header Persistente**:
  - **Selector Global de Auditoría Activa** (`<select id="global-audit-selector">`): Permite cambiar entre las auditorías registradas (por defecto "Empresa ABC") y guarda la selección en `localStorage.setItem('auditsys_active_audit_id', id)`. Al cambiar de auditoría, recarga los datos de la vista actual.
  - **Badge del Estado de la Auditoría Activa**: `BORRADOR`, `EN EJECUCIÓN`, `EN REVISIÓN` o `CERRADA (Inmutable)`.
  - Botón `+ Nueva Auditoría` (lleva a `auditoria.html?mode=new`).

---

### 4.2. Pantalla 1: Dashboard (`dashboard.html` + `js/dashboard.js`) — `RF09` y `CP-11`
- **Endpoint consumido**: `GET /api/dashboard?id_auditoria={active_audit_id}`
- **Componentes**:
  1. **Banner de Resumen de la Auditoría Activa**: Muestra Organización (`Empresa ABC`), Periodo, Auditor Responsable, Estado actual y barra de progreso de evaluación (`13/13 controles evaluados`).
  2. **Cuatro Tarjetas KPI Superiores**:
     - **KPI 1 — Cumplimiento Base (`RF07`)**: Valor grande (ej. `33.3%`), subtítulo `4 de 12 controles aplicables implementados (1 N/A excluido)`.
     - **KPI 2 — Índice Ponderado de Avance**: Valor grande (ej. `54.2%`), subtítulo `Reconoce el 50% de avance en los 5 controles parciales`.
     - **KPI 3 — Controles Evaluados**: `13 / 13` (Desglose rápido: `4 Impl. · 5 Parc. · 3 No Impl. · 1 N/A`).
     - **KPI 4 — Hallazgos Documentados**: `4 Hallazgos` (`2 Severidad Alta · 2 Severidad Media · 4 Recomendaciones`).
  3. **Dos Gráficos Interactivos con Chart.js**:
     - **Gráfico 1 (Doughnut / Anillo)**: Distribución de controles por estado usando los colores oficiales (`#2E9E5B` Implementado, `#F2A900` Parcial, `#D64545` No implementado, `#8A98A3` No aplicable).
     - **Gráfico 2 (Barras Horizontales/Verticales)**: Hallazgos por severidad (`Alta`: `#D64545`, `Media`: `#F2A900`, `Baja`: `#2E9E5B`).
  4. **Tabla de Auditorías Recientes**:
     - Columnas: ID, Organización, Auditor, Fechas, Controles, % Cumplimiento Base, Hallazgos, Estado y acciones (`Seleccionar / Abrir`, `Editar Datos`, `Ver Informe`).
  5. **Botón Utilitario "Restaurar Datos Demo (Empresa ABC)"** (`POST /api/seed/reset` con confirmación): Permite dejar la base de datos como nueva antes de la sustentación con el profesor.

---

### 4.3. Pantalla 2: Configuración / Nueva Auditoría (`auditoria.html` + `js/auditoria.js`) — `RF01`, `CP-01`, `CP-02`, `CP-08`, `CP-13`
- **Modos de operación**:
  - Si la URL tiene `?mode=new`, muestra el formulario limpio para crear una nueva auditoría (`POST /api/auditorias`).
  - De lo contrario, carga los datos de la auditoría activa (`GET /api/auditorias/{id}`) para consulta/edición (`PUT /api/auditorias/{id}`) y gestión de su ciclo de vida (`PATCH /api/auditorias/{id}/estado`).
- **Campos del Formulario con Validación en Línea (`CP-01`, `CP-02`)**:
  - `organizacion *` (Texto, máx. 120 caracteres).
  - `id_auditor *` (Select poblado desde `GET /api/usuarios`).
  - `fecha_inicio *` (Date) y `fecha_fin *` (Date). **Validación `CP-02`**: Si `fecha_fin` está vacía o es anterior a `fecha_inicio`, muestra error en línea junto al campo `fecha_fin` y bloquea el envío sin borrar lo digitado.
  - `objetivo *` (Textarea).
  - `alcance *` (Textarea).
  - `referentes *` (Input prellenado con `ISO 19011:2018; ISO/IEC 27001:2022; ISO/IEC 27002:2022`).
- **Panel de Ciclo de Vida de la Auditoría (`BORRADOR` $\rightarrow$ `EN_EJECUCION` $\rightarrow$ `EN_REVISION` $\rightarrow$ `CERRADA`)**:
  - Permite cambiar el estado de la auditoría invocando `PATCH /api/auditorias/{id}/estado` y mostrando claramente las reglas de negocio verificadas (`CP-03`, `CP-06`, `CP-08`, `CP-13`).
  - Si la auditoría está `CERRADA`, todos los inputs aparecen deshabilitados con un aviso claro de inmutabilidad (`CP-13`).

---

### 4.4. Pantalla 3: Catálogo de los 93 Controles y Selección (`catalogo.html` + `js/catalogo.js`) — `RF02`, `CP-03`, `CP-13`
- **Endpoints consumidos**:
  - `GET /api/controles` (los 93 controles de ISO/IEC 27002:2022).
  - `GET /api/auditorias/{id}/evaluaciones` (para marcar cuáles están actualmente seleccionados en la auditoría activa).
  - `PUT /api/auditorias/{id}/seleccion-controles` (para guardar la selección de 10 a 15 controles).
  - `PUT /api/controles/{id_control}` (para probar la edición de catálogo por Rol: permitida a `admin`, bloqueada con `403` a `auditor` según `CP-13`).
- **Componentes Clave**:
  1. **Barra Superior de Selección Flotante (Sticky Bar)**:
     - **Contador en vivo**: `Controles seleccionados para la auditoría: X de 10 a 15 permitidos`.
     - **Indicador de regla `CP-03`**:
       - Si `X < 10` o `X > 15`: Badge en rojo/ámbar (`"Rango obligatorio: seleccione entre 10 y 15 controles (actual: X)"`) y si el usuario hace clic en **"Guardar Selección y Continuar a Evaluación"**, muestra el mensaje de bloqueo de `CP-03` (también validado en el servidor).
       - Si `10 <= X <= 15`: Badge en verde `#2E9E5B` (`"Rango válido (X controles seleccionados)"`).
     - Botón rápido: **"Cargar selección sugerida Empresa ABC (13 controles)"** para facilitar pruebas rápidas en nuevas auditorías.
  2. **Filtros y Búsqueda Instantánea sobre los 93 Controles**:
     - Input de búsqueda por código ISO (`5.1`, `8.23`), nombre o palabra clave (`malware`, `respaldo`, `acceso`).
     - Pestañas de filtro por Categoría ISO 27002:2022 con conteo:
       - `Todos (93)`
       - `5. Organizacionales (37)`
       - `6. Personas / TTHH (8)`
       - `7. Físicos (14)`
       - `8. Tecnológicos (34)`
       - `Solo Seleccionados en Auditoría (X)`
  3. **Tabla / Tarjetas de Controles**:
     - Muestra: Código ISO (`5.1`), Badge de Categoría, Nombre del Control, Criterio Normativo (ISO 27002:2022), Pregunta Orientadora de Evaluación, Ejemplo de Aplicación y Evidencia Sugerida.
     - **Interruptor (Switch) `"En auditoría"`** (`min-h-[44px]`) para activar/desactivar el control en la auditoría actual.
     - **Botón `"Editar Criterio (Catálogo)"`**: Abre un modal para editar el criterio o pregunta orientadora del control e invoca `PUT /api/controles/{id}`.
       - Si el usuario es `admin`, guarda exitosamente.
       - Si el usuario es `auditor`, muestra en pantalla la alerta roja de seguridad **`403 Acceso Denegado (RNF04 / CP-13)`** devuelta por el backend, permitiendo demostrar en vivo el caso de prueba `CP-13` ante el profesor.

---

### 4.5. Pantalla 4: Evaluación de Controles y Evidencias (`evaluacion.html` + `js/evaluacion.js`) — `RF03`, `RF04`, `CP-04`, `CP-05`, `CP-06`
Es la pantalla central del sistema. Utiliza un diseño **Maestro-Detalle** (2 columnas en escritorio, apiladas en móvil):
- **Columna Izquierda (Lista de los 10–15 Controles de la Auditoría)**:
  - Barra de progreso superior (`12 de 13 controles evaluados`).
  - Lista de los controles seleccionados mostrando `codigo_iso`, `nombre`, chip de `estado` con su color oficial, ícono de clip si tiene evidencias (`EV-nn`) e ícono de alerta si tiene hallazgos (`H-nn`) o si está en `IMPLEMENTADO`/`PARCIAL` sin evidencia (`CP-06`).
- **Columna Derecha (Panel Integral de Evaluación del Control Activo)**:
  1. **Encabezado Normativo del Control**:
     - Código ISO, Categoría, Nombre del Control, **Criterio Oficial ISO/IEC 27002:2022**, **Pregunta Orientadora**, Ejemplo de Aplicación y Evidencia Objetiva Sugerida.
  2. **Selector de Estado en 4 Tarjetas/Botones Interactivos (`min-h-[44px]`)**:
     - `IMPLEMENTADO` (`#2E9E5B`)
     - `PARCIAL` (`#F2A900`)
     - `NO_IMPLEMENTADO` (`#D64545`)
     - `NO_APLICABLE` (`#8A98A3`)
  3. **Formulario de Observación y Justificación**:
     - `observacion *` (Textarea obligatorio en todos los estados — `CP-04`).
     - `justificacion_na *` (Contenedor desplegable que **se muestra automáticamente cuando se selecciona `NO_APLICABLE`** — `CP-05`, advirtiendo que el control se excluirá del denominador de cumplimiento).
     - Botón **"Guardar Evaluación del Control"** (`PUT /api/evaluaciones/{id_evaluacion}`).
  4. **Sub-panel de Evidencias Asociadas al Control (`RF04` y `CP-06`)**:
     - Si el control está en `IMPLEMENTADO` o `PARCIAL` y no tiene evidencias registradas, muestra un banner amarillo/rojo destacado: *"Regla RN04 / CP-06: Los controles en estado Implementado o Parcial exigen registrar al menos una evidencia para poder avanzar a Revisión."*
     - Lista de evidencias actuales del control (`EV-01`, descripción, fuente, fecha, referencia/archivo y badge `Evidencia Simulada (Académica)`).
     - Formulario inline rápido para **Agregar Evidencia** (`POST /api/evaluaciones/{id_evaluacion}/evidencias`): `codigo_evidencia` (opcional, autogenerado `EV-nn`), `descripcion *`, `fuente *`, `fecha_evidencia *`, `referencia_url`, checkbox `es_simulada` (marcado por defecto).
  5. **Acceso Directo a Hallazgos del Control**:
     - Muestra los hallazgos asociados a este control y un botón **"Registrar Hallazgo para este Control"** (que abre el modal de hallazgo o redirige a `hallazgos.html?id_evaluacion={id_evaluacion}`).

---

### 4.6. Pantalla 5: Hallazgos, Recomendaciones y Trazabilidad (`hallazgos.html` + `js/hallazgos.js`) — `RF05`, `RF06`, `RNF05`, `CP-07`, `CP-08`
- **Endpoints consumidos**:
  - `GET /api/auditorias/{id}/evaluaciones` (para seleccionar el control asociado y heredar automáticamente su criterio normativo).
  - `GET /api/auditorias/{id}/hallazgos`
  - `POST /api/evaluaciones/{id_evaluacion}/hallazgos`
  - `POST /api/hallazgos/{id_hallazgo}/recomendaciones`
  - `GET /api/auditorias/{id}/trazabilidad`
- **Componentes Clave**:
  1. **Indicador de Reglas de Cierre (`CP-08`)**:
     - Muestra el estado del requisito de cierre: `Hallazgos documentados: X (Mínimo requerido: 3)` y `Hallazgos con recomendación asociada: X / X`.
  2. **Formulario de Nuevo Hallazgo + Recomendación Asociada (`CP-07`)**:
     - Selector de **Control Evaluado Asociado** (`id_evaluacion`): Al elegir un control (especialmente los `NO_IMPLEMENTADO` o `PARCIAL`), **prellena automáticamente el campo `criterio`** con el texto normativo de ese control en ISO/IEC 27002:2022 (`RF05`).
     - Selector de `severidad *` (`ALTA`, `MEDIA`, `BAJA`).
     - Campos obligatorios con validación en línea (`CP-07`):
       - `condicion *` (¿Qué se encontró en la organización?)
       - `criterio *` (Heredado del catálogo ISO 27002:2022, editable)
       - `causa *` (¿Por qué ocurre la desviación?)
       - `efecto_riesgo *` (¿Qué impacto o riesgo genera para la organización?)
     - **Bloque integrado de Recomendación Inicial (`RF06`)**:
       - `descripcion` de la acción recomendada, `prioridad` (`ALTA`, `MEDIA`, `BAJA`), `plazo_dias` (ej. `60`, `90`, `120` días) y `responsable_sug`.
     - Al guardar, el backend genera automáticamente el código `H-01`, `H-02`, etc.
  3. **Listado de Tarjetas de Hallazgos (`H-01`, `H-02`...) y sus Recomendaciones**:
     - Cada tarjeta muestra su código `H-nn`, el control ISO vinculado, badge de severidad, la cuarteta auditora (*Condición, Criterio, Causa, Efecto/Riesgo*) y debajo la lista de **Recomendaciones asociadas** con un botón `"+ Agregar otra recomendación a este hallazgo"`.
  4. **Matriz de Trazabilidad de Extremo a Extremo (`RNF05`)**:
     - Tabla consolidada (alimentada por `GET /api/auditorias/{id}/trazabilidad`) que muestra la cadena completa exigida por el profesor:
       `Auditoría` $\rightarrow$ `Control ISO` $\rightarrow$ `Estado Evaluación` $\rightarrow$ `Evidencia (EV-nn)` $\rightarrow$ `Hallazgo (H-nn)` $\rightarrow$ `Recomendación (Prioridad / Plazo)`.

---

### 4.7. Pantalla 6: Informe Consolidado y Exportación PDF (`informe.html` + `js/informe.js`) — `RF07`, `RF08`, `CP-09`, `CP-10`
- **Endpoints consumidos**:
  - `GET /api/auditorias/{id}/informes`
  - `POST /api/auditorias/{id}/informes` (congela una nueva versión del informe en la tabla `informe`).
- **Componentes de Configuración y Acciones (No imprimibles en el PDF)**:
  - Checkboxes para activar/mostrar las 8 secciones del informe.
  - Botón **"Generar / Guardar Nueva Versión de Informe en BD"** (`POST /api/auditorias/{id}/informes`).
  - Botón **"Exportar / Descargar PDF Oficial"** (ejecuta `html2pdf()` o `window.print()` con hoja de estilo `@media print` optimizada tamaño Carta/A4).
- **Vista Previa del Documento de Informe de Auditoría (Las 8 Secciones Oficiales de `RF08`)**:
  1. **Sección 1 — Datos Generales de la Auditoría**: Organización, objetivo, alcance, periodo, auditor líder, referentes normativos (`ISO 19011:2018`, `ISO/IEC 27001:2022`, `ISO/IEC 27002:2022`), versión del informe y estado.
  2. **Sección 2 — Alcance y Criterios Evaluados**: Tabla de los controles seleccionados con su código ISO, categoría, nombre y criterio.
  3. **Sección 3 — Resultados e Indicadores de Cumplimiento (`RF07` / `CP-09`)**:
     - Tabla de conteos por estado (`Implementados: 4`, `Parciales: 5`, `No implementados: 3`, `No aplicables: 1 [Excluidos del denominador]`, `Total Aplicables: 12`).
     - Fórmulas matemáticas explícitas renderizadas en el informe:
       - **Indicador Base de Cumplimiento**: `(4 / 12) × 100 = 33,3 %`
       - **Índice Ponderado de Avance**: `((4 × 1.0 + 5 × 0.5) / 12) × 100 = 54,2 %`
     - Párrafo de resumen ejecutivo generado dinámicamente desde la base de datos.
  4. **Sección 4 — Evaluación Detallada por Control**: Tabla con código ISO, nombre, estado, observación del auditor y justificación formal de los controles marcados como `No aplicable`.
  5. **Sección 5 — Relación de Hallazgos de Auditoría**: Fichas completas de cada hallazgo (`H-01` a `H-nn`) con severidad, condición, criterio, causa y efecto/riesgo.
  6. **Sección 6 — Plan de Recomendaciones**: Tabla vinculada por código de hallazgo (`H-nn`), recomendación, prioridad, plazo sugerido en días y responsable sugerido.
  7. **Sección 7 — Anexo de Evidencias**: Tabla con código `EV-nn`, control asociado, descripción, fuente, fecha, referencia documental y columna explícita **`Carácter de la Evidencia: SIMULADA (Fines Académicos)`** (`CP-10`).
  8. **Sección 8 — Salvaguarda y Limitaciones Normativas (Obligatoria según Rúbrica)**:
     - Recuadro destacado al pie del informe:
       > *"LIMITACIONES Y SALVAGUARDA ACADÉMICA: El porcentaje e indicador de cumplimiento presentado en este informe es estrictamente descriptivo y se fundamenta en la muestra de controles evaluados durante el ejercicio académico. No constituye una certificación en ISO/IEC 27001:2022 ni sustituye el juicio profesional del auditor ni una auditoría de tercera parte acreditada."*

---

## 5. Contrato de API Consumido por el Frontend (`js/api.js`)

El módulo `frontend/js/api.js` debe exponer métodos limpios que consuman exactamente los mismos endpoints definidos en `context/BACKEND_SPEC.md`:

| Método JS en `api.js` | Método HTTP y Ruta en Backend | Cuerpo (JSON) / Parámetros | Pantalla que lo consume |
| :--- | :--- | :--- | :--- |
| `api.login(correo, password)` | `POST /api/auth/login` | `{ correo, password }` | `login.html` |
| `api.getMe()` | `GET /api/auth/me` | *(Header JWT)* | Todas (`auth.js`) |
| `api.getUsuarios()` | `GET /api/usuarios` | — | `auditoria.html` |
| `api.resetDemoSeed()` | `POST /api/seed/reset` | — | `dashboard.html` |
| `api.getDashboard(idAuditoria)` | `GET /api/dashboard?id_auditoria={id}` | — | `dashboard.html` |
| `api.getAuditorias()` | `GET /api/auditorias` | — | `layout.js`, `dashboard.html` |
| `api.getAuditoria(id)` | `GET /api/auditorias/{id}` | — | `auditoria.html` |
| `api.createAuditoria(payload)` | `POST /api/auditorias` | `{ organizacion, objetivo, alcance, fecha_inicio, fecha_fin, referentes, id_auditor }` | `auditoria.html` |
| `api.updateAuditoria(id, payload)`| `PUT /api/auditorias/{id}` | `{ organizacion, objetivo, alcance, fecha_inicio, fecha_fin, referentes, id_auditor }` | `auditoria.html` |
| `api.changeEstadoAuditoria(id, estado)`| `PATCH /api/auditorias/{id}/estado` | `{ estado }` | `auditoria.html`, `informe.html` |
| `api.getControles(params)` | `GET /api/controles?categoria=&q=` | Query params opcionales | `catalogo.html` |
| `api.updateControlCatalogo(id, payload)`| `PUT /api/controles/{id}` | `{ nombre, criterio, pregunta_orientadora, ejemplo_aplicacion, evidencia_sugerida }` | `catalogo.html` (`CP-13`) |
| `api.getEvaluaciones(idAuditoria)`| `GET /api/auditorias/{id}/evaluaciones`| — | `catalogo.html`, `evaluacion.html`, `hallazgos.html` |
| `api.saveSeleccionControles(idAuditoria, ids)`| `PUT /api/auditorias/{id}/seleccion-controles` | `{ controles_ids: [1, 15, ...] }` | `catalogo.html` (`CP-03`) |
| `api.updateEvaluacion(idEval, payload)` | `PUT /api/evaluaciones/{idEval}` | `{ estado, observacion, justificacion_na }` | `evaluacion.html` (`CP-04`, `CP-05`) |
| `api.createEvidencia(idEval, payload)` | `POST /api/evaluaciones/{idEval}/evidencias` | `{ codigo_evidencia, descripcion, fuente, fecha_evidencia, referencia_url, es_simulada }` | `evaluacion.html` (`CP-06`) |
| `api.deleteEvidencia(idEvidencia)`| `DELETE /api/evidencias/{idEvidencia}` | — | `evaluacion.html` |
| `api.getHallazgos(idAuditoria)` | `GET /api/auditorias/{id}/hallazgos` | — | `hallazgos.html` |
| `api.createHallazgo(idEval, payload)` | `POST /api/evaluaciones/{idEval}/hallazgos` | `{ condicion, criterio, causa, efecto_riesgo, severidad, recomendacion? }` | `hallazgos.html`, `evaluacion.html` (`CP-07`) |
| `api.deleteHallazgo(idHallazgo)` | `DELETE /api/hallazgos/{idHallazgo}` | — | `hallazgos.html` |
| `api.createRecomendacion(idHallazgo, payload)`| `POST /api/hallazgos/{idHallazgo}/recomendaciones`| `{ descripcion, prioridad, plazo_dias, responsable_sug }` | `hallazgos.html` (`CP-08`) |
| `api.deleteRecomendacion(idRec)` | `DELETE /api/recomendaciones/{idRec}` | — | `hallazgos.html` |
| `api.getTrazabilidad(idAuditoria)`| `GET /api/auditorias/{id}/trazabilidad`| — | `hallazgos.html` (`RNF05`) |
| `api.getInformes(idAuditoria)` | `GET /api/auditorias/{id}/informes` | — | `informe.html` (`CP-09`, `CP-10`) |
| `api.generateInforme(idAuditoria)`| `POST /api/auditorias/{id}/informes` | — | `informe.html` (`CP-10`) |

---

## 6. Configuración de Despliegue en Vercel (`frontend/vercel.json`)

Incluir el archivo `frontend/vercel.json` para que Vercel sirva limpiamente las múltiples páginas HTML:

```json
{
  "version": 2,
  "cleanUrls": false,
  "trailingSlash": false
}
```

### Resolución Inteligente de `API_BASE_URL` en `frontend/js/config.js`
Para que el proyecto funcione tanto en desarrollo local como una vez desplegado en Vercel sin romper enlaces:
```javascript
const DEFAULT_API_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api'
    : (localStorage.getItem('auditsys_api_url') || 'https://decr27000-backend.onrender.com/api');

export const getApiBaseUrl = () => localStorage.getItem('auditsys_api_url') || DEFAULT_API_URL;
export const setApiBaseUrl = (url) => localStorage.setItem('auditsys_api_url', url.replace(/\/+$/, ''));
```
De esta manera, en local apunta automáticamente a `http://localhost:4000/api`, y en Vercel usa la URL de Render (además de permitir cambiarla desde el panel de conexión en `login.html` en cualquier momento).
