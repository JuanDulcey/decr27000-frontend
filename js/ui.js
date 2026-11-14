/**
 * AuditSys Mini (DECR 27000) — Utilidades de UI, Escape XSS, Chips, Modales y Toasts
 * Especificación: FRONTEND_SPEC.md §3.1, §3.2 y PLAN_DESARROLLO.md §2.2
 */

import { icon } from './icons.js';

/**
 * Escapa caracteres HTML para prevenir ataques XSS al renderizar datos de la API
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Genera el HTML seguro de un Chip de Estado de Control (Texto + Color + Ícono — Principio 3)
 */
export function renderControlStateChip(estado) {
  const normalized = String(estado || 'PENDIENTE').toUpperCase();
  switch (normalized) {
    case 'IMPLEMENTADO':
      return `<span class="chip chip-implementado" title="Control implementado conforme al criterio">${icon('check', 'w-3.5 h-3.5')}<span>Implementado</span></span>`;
    case 'PARCIAL':
      return `<span class="chip chip-parcial" title="Control implementado parcialmente con brechas">${icon('circleHalf', 'w-3.5 h-3.5')}<span>Parcial</span></span>`;
    case 'NO_IMPLEMENTADO':
      return `<span class="chip chip-no-implementado" title="Sin evidencia de implementación">${icon('x', 'w-3.5 h-3.5')}<span>No implementado</span></span>`;
    case 'NO_APLICABLE':
      return `<span class="chip chip-no-aplicable" title="Fuera del alcance con justificación formal">${icon('minus', 'w-3.5 h-3.5')}<span>No aplicable</span></span>`;
    default:
      return `<span class="chip chip-pendiente" title="Pendiente de evaluar">${icon('circle', 'w-3.5 h-3.5')}<span>Pendiente de evaluar</span></span>`;
  }
}

/**
 * Genera el HTML seguro de un Badge de Severidad o Prioridad
 */
export function renderSeverityBadge(severidad, prefix = 'Severidad') {
  const norm = String(severidad || 'MEDIA').toUpperCase();
  const labelPrefix = prefix ? `${escapeHtml(prefix)} ` : '';
  if (norm === 'ALTA') {
    return `<span class="chip badge-alta">${icon('arrowUp', 'w-3.5 h-3.5')}<span>${labelPrefix}Alta</span></span>`;
  }
  if (norm === 'BAJA') {
    return `<span class="chip badge-baja">${icon('arrowDown', 'w-3.5 h-3.5')}<span>${labelPrefix}Baja</span></span>`;
  }
  return `<span class="chip badge-media">${icon('diamond', 'w-3.5 h-3.5')}<span>${labelPrefix}Media</span></span>`;
}

/**
 * Genera el HTML seguro del Badge de Estado de la Auditoría
 */
export function renderAuditStateBadge(estado) {
  const norm = String(estado || 'BORRADOR').toUpperCase();
  switch (norm) {
    case 'EN_EJECUCION':
      return `<span class="audit-badge audit-badge-ejecucion">${icon('play', 'w-3.5 h-3.5')}<span>EN EJECUCIÓN</span></span>`;
    case 'EN_REVISION':
      return `<span class="audit-badge audit-badge-revision">${icon('eye', 'w-3.5 h-3.5')}<span>EN REVISIÓN</span></span>`;
    case 'CERRADA':
      return `<span class="audit-badge audit-badge-cerrada">${icon('lock', 'w-3.5 h-3.5')}<span>CERRADA (Inmutable)</span></span>`;
    default:
      return `<span class="audit-badge audit-badge-borrador">${icon('edit', 'w-3.5 h-3.5')}<span>BORRADOR</span></span>`;
  }
}

/**
 * Genera el HTML de un Badge de Categoría ISO/IEC 27002:2022
 */
export function renderCategoryBadge(categoria) {
  const norm = String(categoria || '').toUpperCase();
  const map = {
    ORGANIZACIONAL: { label: '5. Organizacional', cls: 'bg-blue-50 text-[#003366] border-blue-200' },
    PERSONAS: { label: '6. Personas / TTHH', cls: 'bg-purple-50 text-purple-900 border-purple-200' },
    FISICO: { label: '7. Físico', cls: 'bg-amber-50 text-amber-900 border-amber-200' },
    TECNOLOGICO: { label: '8. Tecnológico', cls: 'bg-cyan-50 text-cyan-900 border-cyan-200' },
  };
  const info = map[norm] || { label: norm || 'General', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${info.cls}">${escapeHtml(
    info.label
  )}</span>`;
}

/**
 * Muestra una notificación Toast no intrusiva con soporte aria-live (RNF01 / RNF03)
 */
export function showToast(message, type = 'info', duration = 5000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    container.className =
      'fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-[calc(100%-2rem)] pointer-events-none no-print';
    document.body.appendChild(container);
  }

  const styles = {
    success: {
      bg: 'bg-[#2E9E5B] text-white border-[#25824a]',
      iconName: 'checkCircle',
      role: 'status',
    },
    error: {
      bg: 'bg-[#D64545] text-white border-[#b83232]',
      iconName: 'alertCircle',
      role: 'alert',
    },
    warning: {
      bg: 'bg-[#F2A900] text-[#1E293B] border-amber-600',
      iconName: 'alertTriangle',
      role: 'alert',
    },
    info: {
      bg: 'bg-[#003366] text-white border-[#002244]',
      iconName: 'info',
      role: 'status',
    },
  };

  const cfg = styles[type] || styles.info;
  const toast = document.createElement('div');
  toast.setAttribute('role', cfg.role);
  toast.className = `pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border ${cfg.bg} transition-all duration-200`;

  const iconSpan = document.createElement('span');
  iconSpan.className = 'leading-5 select-none pt-0.5';
  iconSpan.setAttribute('aria-hidden', 'true');
  iconSpan.innerHTML = icon(cfg.iconName, 'w-4 h-4');

  const textDiv = document.createElement('div');
  textDiv.className = 'text-sm font-medium flex-1 leading-snug';
  textDiv.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className =
    'ml-2 text-current opacity-80 hover:opacity-100 font-bold text-sm leading-none p-1 rounded';
  closeBtn.setAttribute('aria-label', 'Cerrar notificación');
  closeBtn.innerHTML = icon('x', 'w-4 h-4');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  toast.appendChild(iconSpan);
  toast.appendChild(textDiv);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, duration);
  }

  return toast;
}

/**
 * Modal de confirmación accesible (sin usar window.confirm intrusivo)
 */
export function confirmModal({
  title = 'Confirmar acción',
  message = '¿Está seguro de continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  requirePhrase = null,
}) {
  return new Promise((resolve) => {
    const existing = document.getElementById('modal-backdrop');
    if (existing) existing.remove();

    const previousFocus = document.activeElement;
    const backdrop = document.createElement('div');
    backdrop.id = 'modal-backdrop';
    backdrop.className =
      'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 no-print';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    const phraseHtml = requirePhrase
      ? `
      <div class="mt-4">
        <label for="confirm-phrase-input" class="block text-xs font-semibold text-slate-700 mb-1">
          Para confirmar, escriba exactamente: <code class="px-1.5 py-0.5 bg-slate-100 rounded text-[#D64545] font-mono">${escapeHtml(
            requirePhrase
          )}</code>
        </label>
        <input id="confirm-phrase-input" type="text" class="form-input font-mono text-sm" placeholder="${escapeHtml(
          requirePhrase
        )}" autocomplete="off" />
        <p id="confirm-phrase-error" class="field-error hidden">La frase ingresada no coincide.</p>
      </div>
    `
      : '';

    backdrop.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div class="${danger ? 'bg-[#D64545]' : 'bg-[#0F172A]'} text-white px-5 py-4 flex items-center justify-between">
          <h3 class="font-bold text-base">${escapeHtml(title)}</h3>
          <button type="button" id="modal-close-x" class="text-white/80 hover:text-white p-1" aria-label="Cerrar">${icon('x', 'w-4 h-4')}</button>
        </div>
        <div class="p-5">
          <p class="text-sm text-slate-700 leading-relaxed">${escapeHtml(message)}</p>
          ${phraseHtml}
          <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" id="modal-cancel-btn" class="btn btn-outline">${escapeHtml(
              cancelText
            )}</button>
            <button type="button" id="modal-confirm-btn" class="btn ${
              danger ? 'btn-danger' : 'btn-primary'
            }">${escapeHtml(confirmText)}</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(false);
      }
    };

    const cleanup = (result) => {
      document.removeEventListener('keydown', onKeyDown);
      backdrop.remove();
      if (previousFocus && typeof previousFocus.focus === 'function' && document.contains(previousFocus)) {
        previousFocus.focus();
      }
      resolve(result);
    };

    document.addEventListener('keydown', onKeyDown);
    backdrop.querySelector('#modal-cancel-btn').addEventListener('click', () => cleanup(false));
    backdrop.querySelector('#modal-close-x').addEventListener('click', () => cleanup(false));
    backdrop.querySelector('#modal-confirm-btn').addEventListener('click', () => {
      if (requirePhrase) {
        const input = backdrop.querySelector('#confirm-phrase-input');
        const err = backdrop.querySelector('#confirm-phrase-error');
        if (!input || input.value.trim() !== requirePhrase) {
          if (input) input.classList.add('input-error');
          if (err) err.classList.remove('hidden');
          return;
        }
      }
      cleanup(true);
    });

    const initialFocus = requirePhrase
      ? backdrop.querySelector('#confirm-phrase-input')
      : backdrop.querySelector('#modal-confirm-btn');
    initialFocus?.focus();
  });
}

const modalLastFocus = new WeakMap();

/**
 * Abre un modal HTML existente con soporte de tecla Escape y restauración de foco.
 */
export function openModal(modal, focusSelector = null) {
  if (!modal) return;
  modalLastFocus.set(modal, document.activeElement);
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  if (!modal.dataset.a11yBound) {
    modal.dataset.a11yBound = '1';
    const onKeyDown = (e) => {
      if (!document.body.contains(modal)) {
        document.removeEventListener('keydown', onKeyDown);
        return;
      }
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        e.preventDefault();
        closeModal(modal);
      }
    };
    document.addEventListener('keydown', onKeyDown);
  }

  requestAnimationFrame(() => {
    const target = focusSelector
      ? modal.querySelector(focusSelector)
      : modal.querySelector('input:not([type="hidden"]), textarea, select, button:not([disabled])');
    target?.focus?.();
  });
}

/**
 * Cierra un modal HTML y restaura el foco al elemento previo.
 */
export function closeModal(modal) {
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  const prev = modalLastFocus.get(modal);
  if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
    prev.focus();
  }
}

/**
 * Genera un bloque Skeleton de carga
 */
export function renderSkeleton(lines = 4) {
  const items = Array.from({ length: lines })
    .map(
      (_, i) =>
        `<div class="skeleton h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'} mb-3"></div>`
    )
    .join('');
  return `<div class="p-4" aria-busy="true" aria-label="Cargando contenido">${items}</div>`;
}
