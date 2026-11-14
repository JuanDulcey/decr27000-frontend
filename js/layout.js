/**
 * AuditSys Mini (DECR 27000) — Layout Compartido: Sidebar, Top Header, Selector Global y Stepper de 6 Pasos
 * Especificación: FRONTEND_SPEC.md §3.2, §4.1 y PLAN_DESARROLLO.md §2.2 (F1.4)
 */

import { api } from './api.js';
import {
  getActiveAuditId,
  logout,
  requireAuth,
  setActiveAuditId,
} from './auth.js';
import { OFFICIAL_REFERENTES } from './config.js';
import { icon } from './icons.js';
import { escapeHtml, renderAuditStateBadge, showToast } from './ui.js';

const STEPS = [
  { step: 1, group: 'Visión General', href: 'dashboard.html', label: 'Resumen Ejecutivo', iconName: 'chart' },
  { step: 2, group: 'Auditoría', href: 'auditoria.html', label: 'Datos y Alcance', iconName: 'clipboard' },
  { step: 3, group: 'Auditoría', href: 'catalogo.html', label: 'Catálogo ISO 27002', iconName: 'book' },
  { step: 4, group: 'Auditoría', href: 'evaluacion.html', label: 'Evaluación y Evidencias', iconName: 'checkCircle' },
  { step: 5, group: 'Auditoría', href: 'hallazgos.html', label: 'Hallazgos y Acciones', iconName: 'alertTriangle' },
  { step: 6, group: 'Entregables', href: 'informe.html', label: 'Informe Consolidado', iconName: 'fileText' },
];

const PAGE_CONTROLLERS = {
  'dashboard.html': './pages/dashboard.js',
  'auditoria.html': './pages/auditoria.js',
  'catalogo.html': './pages/catalogo.js',
  'evaluacion.html': './pages/evaluacion.js',
  'hallazgos.html': './pages/hallazgos.js',
  'informe.html': './pages/informe.js',
};

let shellInitialized = false;
let currentOnAuditChange = null;
let cachedAuditorias = [];
let closeMobileSidebarFn = null;
let isNavigating = false;

/**
 * Inicializa el layout compartido en cualquiera de las 6 páginas internas
 * @param {object} opts { activeStep: 1..6, onAuditChange?: (idAuditoria, auditoriaObj) => void }
 */
export async function initLayout({ activeStep = 1, onAuditChange = null } = {}) {
  const user = requireAuth();
  if (!user) return null;

  currentOnAuditChange = onAuditChange;

  if (!shellInitialized) {
    renderShell(user, activeStep);
    bindSidebarEvents();
    bindSoftNavigation();
    shellInitialized = true;
  } else {
    setActiveNavStep(activeStep);
  }

  let auditorias = [];
  try {
    const res = await api.getAuditorias();
    auditorias = Array.isArray(res?.data) ? res.data : [];
    cachedAuditorias = auditorias;
  } catch (err) {
    auditorias = cachedAuditorias;
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
  if (selector && !selector.dataset.boundChange) {
    selector.dataset.boundChange = 'true';
    selector.addEventListener('change', (e) => {
      const nextId = Number(e.target.value);
      if (!nextId) return;
      setActiveAuditId(nextId);
      const nextAudit = cachedAuditorias.find((a) => a.id_auditoria === nextId) || null;
      updateAuditStatusBadge(nextAudit);
      if (typeof currentOnAuditChange === 'function') {
        currentOnAuditChange(nextId, nextAudit);
      } else {
        window.location.reload();
      }
    });
  }

  return { user, auditorias, activeAudit, activeAuditId: activeId };
}

function setActiveNavStep(activeStep) {
  const sidebarNav = document.querySelector('#app-sidebar nav');
  if (sidebarNav) {
    sidebarNav.querySelectorAll('a[data-step]').forEach((link) => {
      const step = Number(link.getAttribute('data-step'));
      const isActive = step === activeStep;
      link.className = `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
        isActive
          ? 'bg-[#00C6D0] text-[#003366] font-semibold shadow-sm'
          : 'text-slate-200 hover:bg-white/10 hover:text-white'
      }`;
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
}

function getPageBasename(urlObj) {
  const parts = urlObj.pathname.split('/');
  return parts[parts.length - 1] || '';
}

async function ensureHeadScripts(doc) {
  const scripts = Array.from(doc.head?.querySelectorAll('script[src]') || []);
  for (const s of scripts) {
    const src = s.getAttribute('src');
    if (!src || src.includes('tailwindcss.com')) continue;
    const alreadyLoaded = Array.from(document.head.querySelectorAll('script[src]')).some(
      (existing) => existing.getAttribute('src') === src
    );
    if (alreadyLoaded) continue;

    await new Promise((resolve) => {
      const el = document.createElement('script');
      el.src = src;
      if (s.integrity) el.integrity = s.integrity;
      if (s.crossOrigin) el.crossOrigin = s.crossOrigin;
      el.onload = resolve;
      el.onerror = resolve;
      document.head.appendChild(el);
    });
  }
}

export async function navigateTo(url, { pushState = true } = {}) {
  const targetUrl = new URL(url, window.location.href);
  const basename = getPageBasename(targetUrl);
  const controllerPath = PAGE_CONTROLLERS[basename];

  if (targetUrl.origin !== window.location.origin || !controllerPath) {
    window.location.href = targetUrl.href;
    return;
  }

  if (isNavigating) return;
  isNavigating = true;

  if (typeof closeMobileSidebarFn === 'function') {
    closeMobileSidebarFn();
  }

  try {
    const res = await fetch(targetUrl.href, { credentials: 'same-origin' });
    if (!res.ok) {
      window.location.href = targetUrl.href;
      return;
    }

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const nextPageContent = doc.getElementById('page-content');
    const appMain = document.getElementById('app-main');

    if (!nextPageContent || !appMain) {
      window.location.href = targetUrl.href;
      return;
    }

    await ensureHeadScripts(doc);

    if (doc.title) document.title = doc.title;
    if (pushState) {
      window.history.pushState({}, '', targetUrl.pathname + targetUrl.search + targetUrl.hash);
    }

    const imported = document.importNode(nextPageContent, true);
    appMain.replaceChildren(imported);
    window.scrollTo({ top: 0, behavior: 'instant' });

    window.__AUDITSYS_SOFT_NAV__ = true;
    const mod = await import(controllerPath);
    if (typeof mod?.bootstrap === 'function') {
      await mod.bootstrap();
    }
  } catch {
    window.location.href = targetUrl.href;
  } finally {
    isNavigating = false;
  }
}

function bindSoftNavigation() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    const anchor = e.target?.closest?.('a[href]');
    if (!anchor) return;
    if (anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;

    const rawHref = anchor.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;

    const targetUrl = new URL(anchor.href, window.location.href);
    const basename = getPageBasename(targetUrl);
    if (targetUrl.origin === window.location.origin && PAGE_CONTROLLERS[basename]) {
      e.preventDefault();
      if (targetUrl.href !== window.location.href) {
        navigateTo(targetUrl.href);
      }
    }
  });

  window.addEventListener('popstate', () => {
    navigateTo(window.location.href, { pushState: false });
  });
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

  const groups = ['Visión General', 'Auditoría', 'Entregables'];
  const navLinksHtml = groups
    .map((groupName) => {
      const items = STEPS.filter((s) => s.group === groupName);
      const links = items
        .map((s) => {
          const isActive = s.step === activeStep;
          return `
            <a href="${s.href}" data-step="${s.step}"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                 isActive
                   ? 'bg-[#00C6D0] text-[#003366] font-semibold shadow-sm'
                   : 'text-slate-200 hover:bg-white/10 hover:text-white'
               }"
               ${isActive ? 'aria-current="page"' : ''}>
              <span class="w-5 flex items-center justify-center shrink-0" aria-hidden="true">${icon(s.iconName, 'w-4 h-4')}</span>
              <span>${escapeHtml(s.label)}</span>
            </a>
          `;
        })
        .join('');

      return `
        <div class="space-y-1">
          <div class="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">${escapeHtml(groupName)}</div>
          ${links}
        </div>
      `;
    })
    .join('');

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
            <img src="logo.jpg" alt="DECR 27000"
              class="h-10 w-auto rounded-lg object-contain bg-[#22252A] px-2 py-1 border border-white/15 shadow-sm" />
            <div class="min-w-0">
              <div class="font-bold text-sm leading-tight truncate">AuditSys SGSI</div>
              <div class="text-[10px] text-[#10B981] font-semibold tracking-wide">ISO/IEC 27002:2022</div>
            </div>
          </a>
          <button type="button" id="sidebar-close-btn" class="md:hidden text-white/80 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Cerrar menú">${icon('x', 'w-5 h-5')}</button>
        </div>

        <nav class="mt-4 space-y-4" aria-label="Navegación principal">
          ${navLinksHtml}
        </nav>
      </div>

      <!-- Perfil del Usuario -->
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

        <button type="button" id="btn-logout"
          class="w-full min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-[#D64545] text-white border border-white/15 hover:border-transparent transition-colors text-center cursor-pointer">
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Columna Principal -->
    <div id="main-wrapper" class="flex-1 flex flex-col min-w-0">
      <!-- Top Header Persistente -->
      <header id="app-header" class="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3 no-print">
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
              <span>Nueva auditoría</span>
            </a>
          </div>
        </div>
        <div id="header-audit-badge-mobile" class="sm:hidden mt-2"></div>
      </header>

      <!-- Contenido de la Página -->
      <main id="app-main" class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      </main>

      <!-- Pie de Página Normativo -->
      <footer class="bg-white border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500 no-print">
        <span>AuditSys SGSI · Referentes normativos: <strong>${escapeHtml(OFFICIAL_REFERENTES)}</strong></span>
      </footer>
    </div>
  `;

  const mainSlot = layoutWrapper.querySelector('#app-main');
  mainSlot.appendChild(mainFragment);

  appContainer.innerHTML = '';
  appContainer.appendChild(layoutWrapper);
  appContainer.dataset.ready = 'true';
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

  closeMobileSidebarFn = () => toggleSidebar(false);

  if (openBtn) openBtn.addEventListener('click', () => toggleSidebar(true));
  if (closeBtn) closeBtn.addEventListener('click', () => toggleSidebar(false));
  if (backdrop) backdrop.addEventListener('click', () => toggleSidebar(false));

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
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
