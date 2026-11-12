/**
 * AuditSys Mini (DECR 27000) — Layout Compartido: Sidebar, Top Header, Selector Global y Stepper de 6 Pasos
 * Especificación: FRONTEND_SPEC.md §3.2, §4.1 y PLAN_DESARROLLO.md §2.2 (F1.4)
 */

import { api } from './api.js';
import {
  getActiveAuditId,
  getCurrentUser,
  logout,
  quickSwitchDemoRole,
  requireAuth,
  setActiveAuditId,
} from './auth.js';
import { OFFICIAL_REFERENTES } from './config.js';
import { icon } from './icons.js';
import { escapeHtml, renderAuditStateBadge, showToast } from './ui.js';

const STEPS = [
  { step: 1, href: 'dashboard.html', label: '1. Dashboard', short: 'Dashboard', iconName: 'chart' },
  { step: 2, href: 'auditoria.html', label: '2. Datos de Auditoría', short: 'Auditoría', iconName: 'clipboard' },
  {
    step: 3,
    href: 'catalogo.html',
    label: '3. Catálogo y Selección [10-15]',
    short: 'Catálogo',
    iconName: 'book',
  },
  {
    step: 4,
    href: 'evaluacion.html',
    label: '4. Evaluación y Evidencias',
    short: 'Evaluación',
    iconName: 'checkCircle',
  },
  {
    step: 5,
    href: 'hallazgos.html',
    label: '5. Hallazgos y Recomendaciones',
    short: 'Hallazgos',
    iconName: 'alertTriangle',
  },
  { step: 6, href: 'informe.html', label: '6. Informe Consolidado', short: 'Informe', iconName: 'fileText' },
];

/**
 * Inicializa el layout compartido en cualquiera de las 6 páginas internas
 * @param {object} opts { activeStep: 1..6, onAuditChange?: (idAuditoria, auditoriaObj) => void }
 */
export async function initLayout({ activeStep = 1, onAuditChange = null } = {}) {
  const user = requireAuth();
  if (!user) return null;

  renderShell(user, activeStep);
  bindSidebarEvents();

  let auditorias = [];
  try {
    const res = await api.getAuditorias();
    auditorias = Array.isArray(res?.data) ? res.data : [];
  } catch (err) {
    showToast(`No se pudieron cargar las auditorías: ${err.message}`, 'error');
  }

  let activeId = getActiveAuditId();
  let activeAudit = auditorias.find((a) => a.id_auditoria === activeId) || auditorias[0] || null;
  if (activeAudit) {
    activeId = activeAudit.id_auditoria;
    setActiveAuditId(activeId);
  }

  populateAuditSelector(auditorias, activeAudit);

  const selector = document.getElementById('global-audit-selector');
  if (selector) {
    selector.addEventListener('change', (e) => {
      const nextId = Number(e.target.value);
      if (!nextId) return;
      setActiveAuditId(nextId);
      const nextAudit = auditorias.find((a) => a.id_auditoria === nextId) || null;
      updateAuditStatusBadge(nextAudit);
      if (typeof onAuditChange === 'function') {
        onAuditChange(nextId, nextAudit);
      } else {
        window.location.reload();
      }
    });
  }

  return { user, auditorias, activeAudit, activeAuditId: activeId };
}

function renderShell(user, activeStep) {
  const appContainer = document.getElementById('app-shell');
  if (!appContainer) return;

  const existingMain = document.getElementById('page-content');
  const mainFragment = existingMain ? existingMain : document.createElement('div');

  const roleBadgeCls =
    user.rol === 'admin'
      ? 'bg-[#00C6D0] text-[#003366]'
      : 'bg-white/15 text-white border border-white/25';

  const navLinksHtml = STEPS.map((s) => {
    const isActive = s.step === activeStep;
    return `
      <a href="${s.href}"
         class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold min-h-[44px] transition-colors ${
           isActive
             ? 'bg-[#00C6D0] text-[#003366] shadow-sm'
             : 'text-slate-100 hover:bg-white/10 hover:text-white'
         }"
         ${isActive ? 'aria-current="page"' : ''}>
        <span class="w-5 flex items-center justify-center" aria-hidden="true">${icon(s.iconName, 'w-4 h-4')}</span>
        <span>${escapeHtml(s.label)}</span>
      </a>
    `;
  }).join('');

  const stepperHtml = STEPS.map((s) => {
    const isActive = s.step === activeStep;
    return `
      <a href="${s.href}" class="stepper-step ${isActive ? 'active' : ''}" ${
        isActive ? 'aria-current="step"' : ''
      }>
        <span class="step-num">${s.step}</span>
        <span>${escapeHtml(s.short)}</span>
      </a>
    `;
  }).join('<span class="text-slate-300 select-none px-0.5" aria-hidden="true">→</span>');

  const layoutWrapper = document.createElement('div');
  layoutWrapper.className = 'min-h-screen flex flex-col md:flex-row bg-slate-50';
  layoutWrapper.innerHTML = `
    <!-- Overlay móvil para sidebar -->
    <div id="sidebar-backdrop" class="fixed inset-0 bg-slate-900/50 z-30 hidden md:hidden no-print"></div>

    <!-- Sidebar Izquierdo (#003366) -->
    <aside id="app-sidebar"
      class="fixed md:sticky top-0 left-0 z-40 h-screen w-72 bg-[#003366] text-white flex flex-col justify-between shrink-0 transform -translate-x-full md:translate-x-0 transition-transform duration-200 ease-in-out no-print">
      <div class="p-4 overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-white/15">
          <a href="dashboard.html" class="flex items-center gap-2.5 text-white no-underline">
            <div class="w-9 h-9 rounded-lg bg-[#00C6D0] text-[#003366] font-extrabold flex items-center justify-center text-lg shadow-sm">
              A
            </div>
            <div>
              <div class="font-bold text-base leading-tight">AuditSys Mini</div>
              <div class="text-[11px] text-[#00C6D0] font-semibold tracking-wide">ISO/IEC 27002:2022</div>
            </div>
          </a>
          <button type="button" id="sidebar-close-btn" class="md:hidden text-white/80 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Cerrar menú">${icon('x', 'w-5 h-5')}</button>
        </div>

        <nav class="mt-5 space-y-1.5" aria-label="Navegación principal">
          ${navLinksHtml}
        </nav>
      </div>

      <!-- Perfil del Usuario y Cambio Rápido de Rol -->
      <div class="p-4 border-t border-white/15 bg-[#002850] space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-bold text-white truncate">${escapeHtml(user.nombre)}</p>
            <p class="text-xs text-slate-300 truncate">${escapeHtml(user.correo)}</p>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${roleBadgeCls}">
            ${escapeHtml(user.rol)}
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <button type="button" id="btn-switch-role"
            class="w-full min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors text-center cursor-pointer">
            Cambiar a perfil ${user.rol === 'admin' ? 'Auditora' : 'Admin SGSI'}
          </button>
          <button type="button" id="btn-logout"
            class="w-full min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-[#D64545]/90 hover:bg-[#D64545] text-white transition-colors text-center cursor-pointer">
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>

    <!-- Columna Principal -->
    <div id="main-wrapper" class="flex-1 flex flex-col min-w-0">
      <!-- Top Header Persistente -->
      <header id="app-header" class="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 shadow-2xs no-print">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 flex-1 min-w-[220px]">
            <button type="button" id="sidebar-open-btn"
              class="md:hidden btn btn-outline px-2.5 min-h-[44px] min-w-[44px]"
              aria-label="Abrir menú lateral" aria-expanded="false">
              ${icon('menu', 'w-5 h-5')}
            </button>

            <div class="flex-1 max-w-md">
              <label for="global-audit-selector" class="sr-only">Auditoría Activa</label>
              <select id="global-audit-selector" class="form-select text-sm font-semibold text-[#003366]">
                <option value="">Cargando auditorías...</option>
              </select>
            </div>

            <div id="header-audit-badge" class="hidden sm:block"></div>
          </div>

          <div class="flex items-center gap-2">
            <a href="auditoria.html?mode=new" class="btn btn-primary text-xs sm:text-sm whitespace-nowrap">
              <span aria-hidden="true">+</span>
              <span>Nueva Auditoría</span>
            </a>
          </div>
        </div>
        <div id="header-audit-badge-mobile" class="sm:hidden mt-2"></div>
      </header>

      <!-- Stepper Guiado en 6 Pasos -->
      <div id="app-stepper" class="bg-white border-b border-slate-200 px-4 py-1.5 no-print">
        <nav class="stepper-container" aria-label="Flujo de auditoría en 6 pasos">
          ${stepperHtml}
        </nav>
      </div>

      <!-- Contenido de la Página -->
      <main id="app-main" class="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
      </main>

      <!-- Pie de Página Normativo -->
      <footer class="bg-white border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500 no-print">
        <span>AuditSys Mini (DECR 27000) · Referentes: <strong>${escapeHtml(OFFICIAL_REFERENTES)}</strong></span>
      </footer>
    </div>
  `;

  const mainSlot = layoutWrapper.querySelector('#app-main');
  mainSlot.appendChild(mainFragment);

  appContainer.innerHTML = '';
  appContainer.appendChild(layoutWrapper);
}

function bindSidebarEvents() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const openBtn = document.getElementById('sidebar-open-btn');
  const closeBtn = document.getElementById('sidebar-close-btn');

  const toggleSidebar = (open) => {
    if (!sidebar || !backdrop) return;
    if (open) {
      sidebar.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
      if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    } else {
      sidebar.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
      if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    }
  };

  if (openBtn) openBtn.addEventListener('click', () => toggleSidebar(true));
  if (closeBtn) closeBtn.addEventListener('click', () => toggleSidebar(false));
  if (backdrop) backdrop.addEventListener('click', () => toggleSidebar(false));

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const switchBtn = document.getElementById('btn-switch-role');
  if (switchBtn) {
    switchBtn.addEventListener('click', async () => {
      const current = getCurrentUser();
      const target = current?.rol === 'admin' ? 'auditor' : 'admin';
      try {
        switchBtn.disabled = true;
        await quickSwitchDemoRole(target);
        window.location.reload();
      } catch (err) {
        showToast(err.message, 'error');
        switchBtn.disabled = false;
      }
    });
  }
}

export function populateAuditSelector(auditorias, activeAudit) {
  const selector = document.getElementById('global-audit-selector');
  if (!selector) return;

  if (!auditorias || auditorias.length === 0) {
    selector.innerHTML = '<option value="">Sin auditorías registradas</option>';
    updateAuditStatusBadge(null);
    return;
  }

  selector.innerHTML = '';
  for (const a of auditorias) {
    const opt = document.createElement('option');
    opt.value = String(a.id_auditoria);
    opt.textContent = `#${a.id_auditoria} — ${a.organizacion} (${a.estado})`;
    if (activeAudit && a.id_auditoria === activeAudit.id_auditoria) {
      opt.selected = true;
    }
    selector.appendChild(opt);
  }
  updateAuditStatusBadge(activeAudit);
}

export function updateAuditStatusBadge(audit) {
  const desktopBadge = document.getElementById('header-audit-badge');
  const mobileBadge = document.getElementById('header-audit-badge-mobile');
  const html = audit ? renderAuditStateBadge(audit.estado) : '';
  if (desktopBadge) desktopBadge.innerHTML = html;
  if (mobileBadge) mobileBadge.innerHTML = html;
}
