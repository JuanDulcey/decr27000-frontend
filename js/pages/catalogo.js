/**
 * AuditSys Mini (DECR 27000) — Controlador de Catálogo (RF02, CP-03, CP-13)
 */

import { api } from '../api.js';
import { EMPRESA_ABC_SUGGESTED_IDS } from '../config.js';
import { normalizeSearchText } from '../format.js';
import { initLayout } from '../layout.js';
import { escapeHtml, renderCategoryBadge, showToast } from '../ui.js';

let allControls = [];
let selectedIds = new Set();
let lockedIds = new Set();
let activeAuditId = null;
let isClosedAudit = false;
let activeCategory = 'TODOS';
let searchTerm = '';
let searchDebounce = null;

async function bootstrap() {
  const ctx = await initLayout({
    activeStep: 3,
    onAuditChange: async (nextId, nextAudit) => {
      activeAuditId = nextId;
      isClosedAudit = nextAudit?.estado === 'CERRADA';
      await loadSelectionForAudit(nextId);
      renderControls();
    },
  });
  if (!ctx) return;

  activeAuditId = ctx.activeAuditId;
  isClosedAudit = ctx.activeAudit?.estado === 'CERRADA';

  bindEvents();
  await Promise.all([loadAllControls(), loadSelectionForAudit(activeAuditId)]);
  renderControls();
}

async function loadAllControls() {
  try {
    const res = await api.getControles();
    allControls = Array.isArray(res?.data) ? res.data : [];
  } catch (err) {
    showToast(`Error al cargar el catálogo: ${err.message}`, 'error');
  }
}

async function loadSelectionForAudit(idAuditoria) {
  selectedIds = new Set();
  lockedIds = new Set();
  if (!idAuditoria) return;
  try {
    const res = await api.getEvaluaciones(idAuditoria);
    const evals = Array.isArray(res?.data) ? res.data : [];
    for (const ev of evals) {
      selectedIds.add(ev.id_control);
      if ((ev.evidencias && ev.evidencias.length > 0) || (ev.hallazgos && ev.hallazgos.length > 0)) {
        lockedIds.add(ev.id_control);
      }
    }
    updateSelectionHeader();
  } catch (err) {
    showToast(`No se pudo cargar la selección actual: ${err.message}`, 'error');
  }
}

function bindEvents() {
  const searchInput = document.getElementById('catalog-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        searchTerm = normalizeSearchText(e.target.value);
        renderControls();
      }, 180);
    });
  }

  document.querySelectorAll('#category-tabs [data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-cat');
      document.querySelectorAll('#category-tabs [data-cat]').forEach((b) => {
        b.className =
          b === btn ? 'btn btn-primary text-xs py-1.5' : 'btn btn-outline text-xs py-1.5';
      });
      renderControls();
    });
  });

  document.getElementById('btn-load-suggested')?.addEventListener('click', () => {
    if (isClosedAudit) {
      showSecurityAlert('Operación denegada: la auditoría está CERRADA y es inmutable (CP-13).');
      return;
    }
    selectedIds = new Set(EMPRESA_ABC_SUGGESTED_IDS);
    updateSelectionHeader();
    renderControls();
    showToast('Selección sugerida de 13 controles (Empresa ABC) cargada.', 'info');
  });

  document.getElementById('btn-save-selection')?.addEventListener('click', saveSelection);

  // Modal de Edición de Catálogo (CP-13)
  const modal = document.getElementById('edit-control-modal');
  const closeModal = () => {
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  };
  document.getElementById('modal-ctrl-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-ctrl-cancel')?.addEventListener('click', closeModal);

  document.getElementById('edit-control-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idCtrl = Number(document.getElementById('edit-ctrl-id').value);
    const modalAlert = document.getElementById('modal-ctrl-alert');
    modalAlert.classList.add('hidden');

    const payload = {
      nombre: document.getElementById('edit-ctrl-nombre').value.trim(),
      criterio: document.getElementById('edit-ctrl-criterio').value.trim(),
      pregunta_orientadora: document.getElementById('edit-ctrl-pregunta').value.trim(),
      ejemplo_aplicacion: document.getElementById('edit-ctrl-ejemplo').value.trim(),
      evidencia_sugerida: document.getElementById('edit-ctrl-evidencia').value.trim(),
    };

    try {
      const res = await api.updateControlCatalogo(idCtrl, payload);
      showToast(res?.message || 'Control actualizado en el catálogo.', 'success');
      closeModal();
      await loadAllControls();
      renderControls();
    } catch (err) {
      const msg =
        err.status === 403
          ? `403 Acceso Denegado (RNF04 / CP-13): ${err.message}`
          : err.message;
      modalAlert.textContent = msg;
      modalAlert.classList.remove('hidden');
      showSecurityAlert(msg);
      showToast(msg, 'error', 7000);
    }
  });
}

function showSecurityAlert(msg) {
  const alertBox = document.getElementById('catalog-security-alert');
  if (!alertBox) return;
  if (!msg) {
    alertBox.classList.add('hidden');
    alertBox.textContent = '';
    return;
  }
  alertBox.textContent = msg;
  alertBox.classList.remove('hidden');
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateSelectionHeader() {
  const count = selectedIds.size;
  const countEl = document.getElementById('selected-count');
  const tabCountEl = document.getElementById('tab-selected-count');
  const badgeEl = document.getElementById('range-status-badge');

  if (countEl) countEl.textContent = String(count);
  if (tabCountEl) tabCountEl.textContent = String(count);

  if (badgeEl) {
    if (count >= 10 && count <= 15) {
      badgeEl.className = 'chip chip-implementado';
      badgeEl.innerHTML = `<span aria-hidden="true">✓</span><span>Rango válido (${count} controles seleccionados)</span>`;
    } else {
      badgeEl.className = 'chip chip-no-implementado';
      badgeEl.innerHTML = `<span aria-hidden="true">✕</span><span>Rango obligatorio: seleccione entre 10 y 15 controles (actual: ${count})</span>`;
    }
  }
}

function renderControls() {
  const container = document.getElementById('controls-list');
  if (!container) return;

  const filtered = allControls.filter((c) => {
    if (activeCategory === 'SELECCIONADOS') {
      if (!selectedIds.has(c.id_control)) return false;
    } else if (activeCategory !== 'TODOS') {
      if (c.categoria !== activeCategory) return false;
    }

    if (searchTerm) {
      const hay = normalizeSearchText(
        `${c.codigo_iso} ${c.nombre} ${c.criterio} ${c.pregunta_orientadora} ${c.ejemplo_aplicacion || ''}`
      );
      if (!hay.includes(searchTerm)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card p-8 text-center text-sm text-slate-500">
        No se encontraron controles con los filtros actuales.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((c) => {
      const isSelected = selectedIds.has(c.id_control);
      const isLocked = lockedIds.has(c.id_control);
      return `
        <article class="card p-4 transition-colors ${
          isSelected ? 'border-2 border-[#003366] bg-[#e6eef5]/30' : 'hover:border-slate-300'
        }">
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div class="flex-1 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-md bg-[#003366] text-white font-mono text-xs font-bold">
                  ${escapeHtml(c.codigo_iso)}
                </span>
                ${renderCategoryBadge(c.categoria)}
                <h3 class="font-bold text-slate-900 text-base">${escapeHtml(c.nombre)}</h3>
              </div>

              <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <strong class="text-[#003366]">Criterio ISO 27002:2022:</strong> ${escapeHtml(c.criterio)}
              </p>

              <p class="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <strong>Pregunta orientadora:</strong> ${escapeHtml(c.pregunta_orientadora)}
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                <div><strong>Ejemplo:</strong> ${escapeHtml(c.ejemplo_aplicacion || '—')}</div>
                <div><strong>Evidencia sugerida:</strong> ${escapeHtml(c.evidencia_sugerida || '—')}</div>
              </div>
            </div>

            <div class="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
              <label class="inline-flex items-center gap-2.5 min-h-[44px] px-3 py-1.5 rounded-lg border cursor-pointer select-none ${
                isSelected
                  ? 'bg-[#003366] text-white border-[#003366]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }">
                <input type="checkbox" class="w-4 h-4 accent-[#00C6D0]"
                  data-toggle-ctrl="${escapeHtml(c.id_control)}"
                  ${isSelected ? 'checked' : ''}
                  ${isClosedAudit ? 'disabled' : ''} />
                <span class="text-xs font-bold">${isSelected ? 'En auditoría ✓' : 'Incluir en auditoría'}</span>
              </label>

              ${
                isLocked
                  ? '<span class="text-[11px] text-amber-700 font-medium">Con evidencias/hallazgos</span>'
                  : ''
              }

              <button type="button" data-edit-ctrl="${escapeHtml(c.id_control)}"
                class="btn btn-ghost text-xs text-slate-600 hover:text-[#003366] px-2.5">
                ✎ Editar Criterio (Catálogo)
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  container.querySelectorAll('[data-toggle-ctrl]').forEach((chk) => {
    chk.addEventListener('change', (e) => {
      const idCtrl = Number(chk.getAttribute('data-toggle-ctrl'));
      if (e.target.checked) {
        selectedIds.add(idCtrl);
      } else {
        selectedIds.delete(idCtrl);
      }
      showSecurityAlert('');
      updateSelectionHeader();
      renderControls();
    });
  });

  container.querySelectorAll('[data-edit-ctrl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idCtrl = Number(btn.getAttribute('data-edit-ctrl'));
      openEditModal(idCtrl);
    });
  });
}

function openEditModal(idCtrl) {
  const ctrl = allControls.find((c) => c.id_control === idCtrl);
  if (!ctrl) return;

  document.getElementById('edit-ctrl-id').value = String(ctrl.id_control);
  document.getElementById('modal-ctrl-title').textContent = `Editar Control ${ctrl.codigo_iso} (Catálogo)`;
  document.getElementById('edit-ctrl-nombre').value = ctrl.nombre || '';
  document.getElementById('edit-ctrl-criterio').value = ctrl.criterio || '';
  document.getElementById('edit-ctrl-pregunta').value = ctrl.pregunta_orientadora || '';
  document.getElementById('edit-ctrl-ejemplo').value = ctrl.ejemplo_aplicacion || '';
  document.getElementById('edit-ctrl-evidencia').value = ctrl.evidencia_sugerida || '';
  document.getElementById('modal-ctrl-alert').classList.add('hidden');

  const modal = document.getElementById('edit-control-modal');
  modal?.classList.remove('hidden');
  modal?.classList.add('flex');
}

async function saveSelection() {
  showSecurityAlert('');
  const count = selectedIds.size;

  if (count < 10 || count > 15) {
    const msg = `Regla RN02 / CP-03: Debe seleccionar entre 10 y 15 controles del catálogo ISO/IEC 27002:2022 para continuar (actualmente seleccionó ${count}).`;
    showSecurityAlert(msg);
    showToast(msg, 'error', 7000);
    return;
  }

  try {
    const btn = document.getElementById('btn-save-selection');
    btn.disabled = true;
    const res = await api.saveSeleccionControles(activeAuditId, Array.from(selectedIds));
    showToast(res?.message || 'Selección guardada correctamente.', 'success');
    setTimeout(() => {
      window.location.href = 'evaluacion.html';
    }, 500);
  } catch (err) {
    showSecurityAlert(err.message);
    showToast(err.message, 'error', 7000);
    document.getElementById('btn-save-selection').disabled = false;
  }
}

bootstrap();
