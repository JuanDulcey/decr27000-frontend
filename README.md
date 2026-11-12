# DECR 27000 — AuditSys Mini (Frontend)

Aplicación Web Multipágina (**MPA**) para la gestión de auditorías de sistemas de información bajo **ISO 19011:2026**, **ISO/IEC 27001:2022** e **ISO/IEC 27002:2022** (catálogo de 93 controles).

- **URL de Producción (Vercel)**: `https://decr27000-frontend.vercel.app`
- **Backend API (Render)**: `https://decr27000-backend.onrender.com/api`

---

## Stack Tecnológico

- **HTML5 semántico + CSS3 (`css/styles.css`) + Tailwind CSS (CDN)** sin paso de compilación/build.
- **Vanilla JavaScript (Módulos ES6)** en `js/`.
- **Chart.js `4.4.1`** (CDN con SRI) para gráficos de cumplimiento y severidad en el Dashboard.
- **html2pdf.js `0.10.1`** (CDN con SRI) + reglas nativas `@media print` para exportación del Informe Consolidado a PDF.
- **Herramientas de desarrollo**: `pnpm` (`eslint`, `prettier`, `@playwright/test`, `serve`).

---

## Estructura del Proyecto

```text
decr27000-frontend/
├── vercel.json                 # Configuración estática y cabeceras de seguridad
├── package.json                # Scripts de desarrollo, lint y pruebas E2E
├── index.html                  # Redirección automática según sesión
├── login.html                  # Autenticación, acceso demo 1-clic y configuración API
├── dashboard.html              # Pantalla 1: KPIs, Chart.js y tabla de auditorías (RF09, CP-11)
├── auditoria.html              # Pantalla 2: Datos generales y ciclo de vida (RF01, CP-01, CP-02)
├── catalogo.html               # Pantalla 3: 93 controles ISO 27002 y selección 10-15 (RF02, CP-03, CP-13)
├── evaluacion.html             # Pantalla 4: Evaluación maestro-detalle y evidencias (RF03, RF04, CP-04..06)
├── hallazgos.html              # Pantalla 5: Hallazgos H-nn, recomendaciones y trazabilidad (RF05, RF06, RNF05)
├── informe.html                # Pantalla 6: Informe de 8 secciones, versiones y PDF (RF07, RF08, CP-09, CP-10)
├── 404.html                    # Página de error 404
├── css/
│   └── styles.css              # Paleta oficial, chips accesibles, >=44px móvil y @media print
├── js/
│   ├── config.js               # Resolución de API_BASE_URL (localhost vs Render)
│   ├── api.js                  # Cliente HTTP fetch con JWT, timeout 70s y respaldo local
│   ├── auth.js                 # Gestión de sesión JWT, roles y protección de rutas
│   ├── layout.js               # Sidebar plegable, header con selector de auditoría y stepper de 6 pasos
│   ├── ui.js                   # Escape XSS, chips de estado, toasts aria-live y modales
│   ├── validators.js           # Validación en línea conservando lo digitado (RNF03)
│   ├── format.js               # Formateadores es-CO (coma decimal y fechas dd/mm/aaaa)
│   ├── seed-data.js            # Semilla oficial de los 93 controles y Empresa ABC
│   └── pages/                  # Controladores ES6 de cada pantalla
└── e2e/                        # Pruebas automatizadas con Playwright (CP-01..CP-13)
```

---

## Ejecución Local

1. Instalar herramientas de desarrollo (opcional, solo para lint/pruebas/servidor):
   ```bash
   pnpm install
   ```
2. Iniciar el servidor estático local en el puerto `3000`:
   ```bash
   pnpm dev
   ```
   También puede abrirse con cualquier servidor estático (`npx serve . -l 3000` o Live Server).
3. En entorno local (`localhost` / `127.0.0.1`), `js/config.js` apunta automáticamente a `http://localhost:4000/api`. Si el backend local o remoto no responde, puede cambiar el modo de conexión desde el acordeón **Configuración de Conexión API** en `login.html`.

---

## Usuarios Demo (Sustentación)

| Perfil | Correo | Contraseña |
| :--- | :--- | :--- |
| **Auditora Líder** | `ana.auditora@auditsys.edu.co` | `Audit2026*` |
| **Administrador SGSI** | `admin@auditsys.edu.co` | `Audit2026*` |

---

## Calidad y Pruebas

```bash
pnpm lint       # Verificación estática con ESLint
pnpm test:e2e   # Pruebas E2E Playwright (escritorio y móvil 360px)
```
