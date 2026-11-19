/**
 * AuditSys SGSI — Controlador de Evaluación y Evidencias
 */

import { api } from '../api.js';
import { downloadCsv } from '../csv.js';
import { setDirty } from '../dirty-guard.js';
import { formatDate } from '../format.js';
import { icon } from '../icons.js';
import { initLayout } from '../layout.js';
import {
  closeModal,
  confirmModal,
  escapeHtml,
  openModal,
  renderCategoryBadge,
  renderControlStateChip,
  renderSeverityBadge,
  showToast,
} from '../ui.js';
import {
  attachLiveValidationClear,
  clearAllFieldErrors,
  setFieldError,
  validateEvaluacionForm,
  validateEvidenciaForm,
} from '../validators.js';

let evaluaciones = [];
let activeEvalId = null;
let activeAuditId = null;
let isClosedAudit = false;
let selectedStateDraft = null;
let hasUnsavedChanges = false;

let keyboardBound = false;
let pendingUploadEvId = null;

const EVIDENCIA_ACCEPT_ATTR =
  'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.txt,.log,.conf,.csv,.json,.zip,.heic,.heif,.mp4,.webm,.mov,.m4v,.avi,.mkv';

function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileCategoryLabel(mimeType, filename = '') {
  const mime = String(mimeType || '').toLowerCase();
  const ext = String(filename || '').toLowerCase();
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|heic|heif)$/.test(ext)) return 'Imagen';
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv)$/.test(ext)) return 'Video';
  if (mime === 'application/pdf' || ext.endsWith('.pdf')) return 'PDF';
  if (mime.startsWith('text/') || mime === 'application/json' || /\.(txt|log|conf|csv|json)$/.test(ext)) {
    return 'Texto';
  }
  if (/\.(docx?|xlsx?|pptx?|odt|ods)$/.test(ext)) return 'Documento';
  if (ext.endsWith('.zip')) return 'ZIP';
  return 'Archivo';
}

export async function bootstrap() {
  evaluaciones = [];
  activeEvalId = null;
  selectedStateDraft = null;
  hasUnsavedChanges = false;
  setDirty(false);
  const ctx = await initLayout({
    activeStep: 4,
    onAuditChange: async (nextId, nextAudit) => {
      activeAuditId = nextId;
      isClosedAudit = nextAudit?.estado === 'CERRADA';
      activeEvalId = null;
      hasUnsavedChanges = false;
      setDirty(false);
      await loadEvaluaciones();
    },
  });
  if (!ctx) return;

  activeAuditId = ctx.activeAuditId;
  isClosedAudit = ctx.activeAudit?.estado === 'CERRADA';

  bindQuickHallazgoModal();
  bindKeyboardNavigation();
  document.getElementById('btn-export-eval-csv')?.addEventListener('click', exportEvaluacionesCsv);
  await loadEvaluaciones();
}

function exportEvaluacionesCsv() {
  if (!evaluaciones || evaluaciones.length === 0) {
    showToast('No hay controles evaluados para exportar.', 'warning');
    return;
  }
  const headers = [
    'Codigo ISO',
    'Dominio',
    'Control',
    'Estado',
    'Observacion',
    'Justificacion N/A',
    'Evidencias',
    'Fecha Evaluacion',
  ];
  const rows = evaluaciones.map((ev) => [
    ev.codigo_iso,
    ev.dominio || '',
    ev.control_nombre || '',
    ev.estado || 'PENDIENTE',
    ev.observacion || '',
    ev.justificacion_na || '',
    Array.isArray(ev.evidencias) ? ev.evidencias.length : 0,
    ev.fecha_evaluacion || '',
  ]);
  downloadCsv(`evaluacion-controles-auditoria-${activeAuditId || 'sgsi'}.csv`, headers, rows);
  showToast('Evaluación exportada a CSV.', 'success');
}

async function loadEvaluaciones() {
  document
    .getElementById('eval-closed-banner')
    ?.classList.toggle('hidden', !isClosedAudit);

  try {
    const res = await api.getEvaluaciones(activeAuditId);
    evaluaciones = Array.isArray(res?.data) ? res.data : [];

    if (evaluaciones.length === 0) {
      renderEmptyState();
      return;
    }

    if (!activeEvalId || !evaluaciones.some((e) => e.id_evaluacion === activeEvalId)) {
      activeEvalId = evaluaciones[0].id_evaluacion;
    }

    renderMasterList();
    renderDetailPanel();
  } catch (err) {
    const panel = document.getElementById('control-detail-panel');
    if (panel) {
      panel.innerHTML = `
        <div class="p-6 text-center space-y-3">
          <p class="text-sm font-semibold text-[#7f1d1d]">No se pudieron cargar las evaluaciones: ${escapeHtml(err.message)}</p>
          <button type="button" id="btn-retry-evals" class="btn btn-outline text-xs">
            ${icon('rotateCcw', 'w-3.5 h-3.5')} Reintentar
          </button>
        </div>
      `;
      document.getElementById('btn-retry-evals')?.addEventListener('click', loadEvaluaciones);
    }
    showToast(`Error al cargar evaluaciones: ${err.message}`, 'error');
  }
}

function renderEmptyState() {
  document.getElementById('eval-progress-text').textContent = '0 de 0 evaluados';
  document.getElementById('eval-progress-bar').style.width = '0%';
  document.getElementById('controls-master-list').innerHTML = `
    <div class="p-4 text-center text-xs text-slate-500 space-y-2">
      <p>No hay controles seleccionados en esta auditoría.</p>
      <a href="catalogo.html" class="btn btn-primary text-xs w-full">Ir a Seleccionar Controles (10–15)</a>
    </div>
  `;
  document.getElementById('control-detail-panel').innerHTML = `
    <div class="p-8 text-center text-sm text-slate-500">
      Seleccione entre 10 y 15 controles en el Paso 3 para comenzar la evaluación.
    </div>
  `;
}

function renderMasterList() {
  const listEl = document.getElementById('controls-master-list');
  const total = evaluaciones.length;
  const evaluados = evaluaciones.filter((e) => e.estado !== 'PENDIENTE').length;
  const pct = total > 0 ? Math.round((evaluados / total) * 100) : 0;

  document.getElementById('eval-progress-text').textContent = `${evaluados} de ${total} evaluados`;
  document.getElementById('eval-progress-bar').style.width = `${pct}%`;

  listEl.innerHTML = evaluaciones
    .map((ev) => {
      const isActive = ev.id_evaluacion === activeEvalId;
      const evCount = (ev.evidencias || []).length;
      const hallCount = (ev.hallazgos || []).length;
      const missingEv =
        (ev.estado === 'IMPLEMENTADO' || ev.estado === 'PARCIAL') && evCount === 0;

      return `
        <button type="button" data-eval-id="${escapeHtml(ev.id_evaluacion)}"
          class="w-full text-left p-3 rounded-xl border transition-all min-h-[44px] cursor-pointer ${
            isActive
              ? 'border-2 border-[#003366] bg-[#e6eef5]/60 shadow-2xs'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
          }">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-extrabold text-[#003366]">${escapeHtml(
              ev.codigo_iso
            )}</span>
            <div class="flex items-center gap-1.5 text-xs">
              ${evCount > 0 ? `<span class="inline-flex items-center gap-0.5 text-slate-600" title="${evCount} evidencia(s)">${icon('paperclip', 'w-3.5 h-3.5')}${evCount}</span>` : ''}
              ${hallCount > 0 ? `<span class="inline-flex items-center gap-0.5 text-[#D64545] font-bold" title="${hallCount} hallazgo(s)">${icon('alertTriangle', 'w-3.5 h-3.5')}${hallCount}</span>` : ''}
              ${missingEv ? `<span class="inline-flex items-center text-amber-600 font-bold" title="Falta evidencia requerida">${icon('alertCircle', 'w-3.5 h-3.5')}</span>` : ''}
            </div>
          </div>
          <div class="text-xs font-semibold text-slate-800 line-clamp-2 mb-2">${escapeHtml(
            ev.nombre
          )}</div>
          <div>${renderControlStateChip(ev.estado)}</div>
        </button>
      `;
    })
    .join('');

  listEl.querySelectorAll('[data-eval-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextId = Number(btn.getAttribute('data-eval-id'));
      if (nextId === activeEvalId) return;
      if (hasUnsavedChanges) {
        confirmModal({
          title: 'Cambios sin guardar',
          message: 'Tiene cambios sin guardar en el control actual. ¿Desea cambiar de control y descartarlos?',
          confirmText: 'Descartar y cambiar',
        }).then((ok) => {
          if (ok) {
            hasUnsavedChanges = false;
            activeEvalId = nextId;
            renderMasterList();
            renderDetailPanel();
          }
        });
        return;
      }
      activeEvalId = nextId;
      renderMasterList();
      renderDetailPanel();
    });
  });
}

function renderDetailPanel() {
  const panel = document.getElementById('control-detail-panel');
  const ev = evaluaciones.find((e) => e.id_evaluacion === activeEvalId);
  if (!panel || !ev) return;

  selectedStateDraft = ev.estado;
  hasUnsavedChanges = false;
  const evs = ev.evidencias || [];
  const halls = ev.hallazgos || [];
  const missingEvBanner =
    (ev.estado === 'IMPLEMENTADO' || ev.estado === 'PARCIAL') && evs.length === 0;

  const states = [
    { id: 'IMPLEMENTADO', label: 'Implementado', icon: icon('check', 'w-4 h-4'), desc: 'Evidencia suficiente' },
    { id: 'PARCIAL', label: 'Parcial', icon: icon('circleHalf', 'w-4 h-4'), desc: 'Cumple con brechas' },
    { id: 'NO_IMPLEMENTADO', label: 'No implementado', icon: icon('x', 'w-4 h-4'), desc: 'Sin implementación' },
    { id: 'NO_APLICABLE', label: 'No aplicable', icon: icon('minus', 'w-4 h-4'), desc: 'Exige justificación' },
  ];

  const stateCardsHtml = states
    .map((s) => {
      const isSelected = selectedStateDraft === s.id;
      return `
        <button type="button" data-state-choice="${s.id}"
          class="state-card-btn ${isSelected ? `selected-${s.id}` : ''}"
          ${isClosedAudit ? 'disabled' : ''}>
          <span class="text-lg font-extrabold" aria-hidden="true">${s.icon}</span>
          <div>
            <div class="text-sm font-bold leading-tight">${escapeHtml(s.label)}</div>
            <div class="text-[11px] opacity-75 font-normal">${escapeHtml(s.desc)}</div>
          </div>
        </button>
      `;
    })
    .join('');

  const evListHtml =
    evs.length === 0
      ? `<p class="text-xs text-slate-500 italic py-2">No hay evidencias registradas para este control.</p>`
      : evs
          .map((item) => {
            const fileCategory = getFileCategoryLabel(item.archivo_tipo, item.archivo_nombre);
            const fileBadgeHtml = item.tiene_archivo
              ? `<div class="mt-2 flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                    ${icon('fileText', 'w-3.5 h-3.5 text-[#003366]')}
                    <span class="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase text-[#003366]">${escapeHtml(
                      fileCategory
                    )}</span>
                    <span class="truncate max-w-[220px]">${escapeHtml(item.archivo_nombre || 'Archivo adjunto')}</span>
                    ${
                      item.archivo_tamano
                        ? `<span class="text-[11px] font-normal text-slate-500">(${escapeHtml(
                            formatFileSize(item.archivo_tamano)
                          )})</span>`
                        : ''
                    }
                  </span>
                  <button type="button" data-preview-ev-file="${escapeHtml(
                    item.id_evidencia
                  )}" class="btn btn-primary text-xs px-2.5">
                    ${icon('eye', 'w-3.5 h-3.5')} Previsualizar
                  </button>
                  <button type="button" data-download-ev-file="${escapeHtml(
                    item.id_evidencia
                  )}" class="btn btn-outline text-xs px-2.5">
                    ${icon('download', 'w-3.5 h-3.5')} Descargar
                  </button>
                  ${
                    isClosedAudit
                      ? ''
                      : `<button type="button" data-upload-ev-file="${escapeHtml(
                          item.id_evidencia
                        )}" class="btn btn-outline text-xs px-2.5">Reemplazar</button>
                        <button type="button" data-remove-ev-file="${escapeHtml(
                          item.id_evidencia
                        )}" class="btn btn-ghost text-xs text-[#D64545] hover:bg-red-50 px-2.5">Quitar archivo</button>`
                  }
                </div>`
              : isClosedAudit
                ? ''
                : `<div class="mt-2">
                    <button type="button" data-upload-ev-file="${escapeHtml(
                      item.id_evidencia
                    )}" class="btn btn-outline text-xs px-2.5">
                      ${icon('upload', 'w-3.5 h-3.5')} Adjuntar archivo (foto, video o documento)
                    </button>
                  </div>`;

            return `
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div class="space-y-1 min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-[#003366] text-white font-mono text-xs font-bold">
                  ${escapeHtml(item.codigo_evidencia)}
                </span>
                <span class="text-sm font-bold text-slate-900">${escapeHtml(item.descripcion)}</span>
                ${
                  item.es_simulada !== false
                    ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e0f9fa] text-[#003366] border border-[#00C6D0]">Referencial</span>'
                    : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eaf6ef] text-[#1e6f40] border border-[#2E9E5B]/30">Documental</span>'
                }
              </div>
              <div class="text-xs text-slate-600">
                Fuente: <strong>${escapeHtml(item.fuente)}</strong> · Fecha: <strong>${escapeHtml(
              formatDate(item.fecha_evidencia)
            )}</strong> ${
              item.referencia_url
                ? `· Ref: <code class="bg-white px-1 py-0.5 rounded border border-slate-200">${escapeHtml(
                    item.referencia_url
                  )}</code>`
                : ''
            }
              </div>
              ${fileBadgeHtml}
            </div>
            ${
              isClosedAudit
                ? ''
                : `<button type="button" data-del-ev="${escapeHtml(
                    item.id_evidencia
                  )}" class="btn btn-ghost text-xs text-[#D64545] hover:bg-red-50 px-2.5 shrink-0">Eliminar</button>`
            }
          </div>
        `;
          })
          .join('');

  const hallsHtml =
    halls.length === 0
      ? '<p class="text-xs text-slate-500 italic">No hay hallazgos vinculados a este control.</p>'
      : halls
          .map(
            (h) => `
          <div class="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-xs font-extrabold text-[#003366]">${escapeHtml(h.codigo)}</span>
              ${renderSeverityBadge(h.severidad)}
            </div>
            <p class="text-xs text-slate-700">${escapeHtml(h.condicion)}</p>
          </div>
        `
          )
          .join('');

  panel.innerHTML = `
    <!-- 1. Encabezado Normativo -->
    <div class="space-y-3 pb-4 border-b border-slate-200">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-3 py-1 rounded-md bg-[#003366] text-white font-mono text-sm font-extrabold">
            ${escapeHtml(ev.codigo_iso)}
          </span>
          ${renderCategoryBadge(ev.categoria)}
        </div>
        <div>${renderControlStateChip(ev.estado)}</div>
      </div>

      <h2 class="text-xl font-extrabold text-slate-900">${escapeHtml(ev.nombre)}</h2>

      <div class="p-3.5 rounded-lg bg-[#e6eef5]/60 border border-[#003366]/15 space-y-2 text-xs sm:text-sm">
        <p><strong class="text-[#003366]">Criterio Oficial ISO/IEC 27002:2022:</strong> ${escapeHtml(
          ev.criterio
        )}</p>
        <p><strong class="text-[#003366]">Pregunta Orientadora:</strong> ${escapeHtml(
          ev.pregunta_orientadora
        )}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
        <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <strong>Ejemplo de aplicación:</strong> ${escapeHtml(ev.ejemplo_aplicacion || '—')}
        </div>
        <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <strong>Evidencia objetiva sugerida:</strong> ${escapeHtml(ev.evidencia_sugerida || '—')}
        </div>
      </div>
    </div>

    <!-- 2. Formulario de Evaluación (Estado + Observación + Justificación N/A) -->
    <form id="eval-form" class="space-y-4" novalidate>
      <div>
        <label class="block text-sm font-bold text-[#003366] mb-2">
          Estado de Evaluación <span class="text-[#D64545]">*</span>
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5" id="state-cards-grid">
          ${stateCardsHtml}
        </div>
        <p id="error-estado" class="field-error hidden"></p>
      </div>

      <div>
        <label for="observacion" class="block text-sm font-bold text-slate-700 mb-1">
          Observación del Auditor <span class="text-[#D64545]">*</span>
        </label>
        <textarea id="observacion" name="observacion" rows="3" class="form-textarea"
          placeholder="Describa los resultados verificados, brechas encontradas o alcance observado..."
          ${isClosedAudit ? 'disabled' : ''}>${escapeHtml(ev.observacion || '')}</textarea>
        <p id="error-observacion" class="field-error hidden"></p>
      </div>

      <div id="justificacion-na-box" class="${
        selectedStateDraft === 'NO_APLICABLE' ? '' : 'hidden'
      } p-4 rounded-xl bg-slate-100 border border-slate-300 space-y-2">
        <div class="text-xs font-bold text-slate-700 flex items-start gap-1.5">
          ${icon('alertTriangle', 'w-4 h-4 text-amber-600 shrink-0 mt-0.5')}
          <span>Nota: Los controles marcados como <span class="underline">No aplicable</span> se excluyen automáticamente del cálculo de cumplimiento.</span>
        </div>
        <label for="justificacion_na" class="block text-sm font-bold text-slate-800">
          Justificación Formal de No Aplicabilidad <span class="text-[#D64545]">*</span>
        </label>
        <textarea id="justificacion_na" name="justificacion_na" rows="2" class="form-textarea bg-white"
          placeholder="Explique formalmente por qué este control no aplica al alcance de la organización..."
          ${isClosedAudit ? 'disabled' : ''}>${escapeHtml(ev.justificacion_na || '')}</textarea>
        <p id="error-justificacion_na" class="field-error hidden"></p>
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <button type="submit" id="btn-save-eval" class="btn btn-outline" ${
          isClosedAudit ? 'disabled' : ''
        }>
          Guardar Evaluación
        </button>
        <button type="button" id="btn-save-next-eval" class="btn btn-primary" ${
          isClosedAudit ? 'disabled' : ''
        }>
          Guardar y siguiente pendiente →
        </button>
      </div>
    </form>

    <!-- 3. Sub-panel de Evidencias (RF04 y CP-06) -->
    <div class="pt-5 border-t border-slate-200 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-[#003366]">Evidencias Asociadas (${evs.length})</h3>
      </div>

      ${
        missingEvBanner
          ? `<div class="p-3.5 rounded-lg bg-amber-50 border-2 border-[#F2A900] text-amber-950 text-xs font-bold" role="alert">
               Los controles en estado <em>Implementado</em> o <em>Parcial</em> requieren al menos una evidencia registrada antes de enviar la auditoría a revisión.
             </div>`
          : ''
      }

      <div class="space-y-2">${evListHtml}</div>
      <input type="file" id="ev-row-file-input" class="hidden" accept="${EVIDENCIA_ACCEPT_ATTR}" />

      <!-- Formulario Inline para Agregar Evidencia -->
      ${
        isClosedAudit
          ? ''
          : `<form id="evidencia-form" class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 mt-3" novalidate>
              <div class="text-xs font-bold uppercase tracking-wider text-[#003366]">+ Agregar Evidencia (EV-nn)</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="ev-descripcion" class="block text-xs font-bold text-slate-700 mb-1">Descripción *</label>
                  <input id="ev-descripcion" type="text" class="form-input text-sm" placeholder="Ej. Política de seguridad v2.0" required />
                  <p id="error-ev-descripcion" class="field-error hidden"></p>
                </div>
                <div>
                  <label for="ev-fuente" class="block text-xs font-bold text-slate-700 mb-1">Fuente *</label>
                  <input id="ev-fuente" type="text" class="form-input text-sm" placeholder="Ej. Repositorio Documental SGSI" required />
                  <p id="error-ev-fuente" class="field-error hidden"></p>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label for="ev-fecha" class="block text-xs font-bold text-slate-700 mb-1">Fecha *</label>
                  <input id="ev-fecha" type="date" class="form-input text-sm" value="${
                    new Date().toISOString().split('T')[0]
                  }" required />
                  <p id="error-ev-fecha" class="field-error hidden"></p>
                </div>
                <div>
                  <label for="ev-ref" class="block text-xs font-bold text-slate-700 mb-1">Referencia / Archivo</label>
                  <input id="ev-ref" type="text" class="form-input text-sm" placeholder="Ej. SGI-POL-001.pdf" />
                </div>
                <div class="flex items-end pb-2">
                  <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input id="ev-simulada" type="checkbox" checked class="w-4 h-4 accent-[#003366]" />
                    <span>Evidencia referencial</span>
                  </label>
                </div>
              </div>
              <div>
                <label for="ev-archivo" class="block text-xs font-bold text-slate-700 mb-1">
                  Adjuntar archivo (foto, imagen, video o documento — opcional)
                </label>
                <input id="ev-archivo" type="file" accept="${EVIDENCIA_ACCEPT_ATTR}"
                  class="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-white file:text-slate-700 hover:file:bg-slate-100 cursor-pointer" />
                <p id="ev-archivo-info" class="text-[11px] text-slate-500 mt-1">
                  Formatos admitidos: fotos/imágenes (PNG, JPG, WEBP, GIF, HEIC), videos (MP4, WEBM, MOV, AVI, MKV) y documentos (PDF, Office, TXT, CSV, JSON, ZIP).
                </p>
              </div>
              <div class="flex justify-end">
                <button type="submit" id="btn-add-ev" class="btn btn-outline text-xs">+ Registrar Evidencia</button>
              </div>
            </form>`
      }
    </div>

    <!-- 4. Acceso Directo a Hallazgos del Control -->
    <div class="pt-5 border-t border-slate-200 space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 class="text-base font-bold text-[#003366]">Hallazgos de este Control (${halls.length})</h3>
        ${
          isClosedAudit
            ? ''
            : `<button type="button" id="btn-open-quick-hallazgo" class="btn btn-danger text-xs">
                + Registrar Hallazgo para este Control
              </button>`
        }
      </div>
      <div class="space-y-2">${hallsHtml}</div>
    </div>
  `;

  bindDetailPanelEvents(ev);
}

function bindDetailPanelEvents(ev) {
  const evalForm = document.getElementById('eval-form');
  const naBox = document.getElementById('justificacion-na-box');
  attachLiveValidationClear(evalForm);

  document.querySelectorAll('[data-state-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedStateDraft = btn.getAttribute('data-state-choice');
      hasUnsavedChanges = true;
      setDirty(true);
      document.querySelectorAll('[data-state-choice]').forEach((b) => {
        const st = b.getAttribute('data-state-choice');
        b.className = `state-card-btn ${st === selectedStateDraft ? `selected-${st}` : ''}`;
      });
      if (naBox) {
        naBox.classList.toggle('hidden', selectedStateDraft !== 'NO_APLICABLE');
      }
    });
  });

  document.getElementById('observacion')?.addEventListener('input', () => {
    hasUnsavedChanges = true;
    setDirty(true);
  });
  document.getElementById('justificacion_na')?.addEventListener('input', () => {
    hasUnsavedChanges = true;
    setDirty(true);
  });

  const handleSaveEvaluation = async (advanceToNext = false) => {
    clearAllFieldErrors(evalForm);
    const payload = {
      estado: selectedStateDraft,
      observacion: document.getElementById('observacion').value,
      justificacion_na: document.getElementById('justificacion_na')?.value || '',
    };

    const { valid } = validateEvaluacionForm(payload);
    if (!valid) {
      showToast('Verifique los campos obligatorios de la evaluación.', 'warning');
      return;
    }

    const btnSave = document.getElementById('btn-save-eval');
    const btnNext = document.getElementById('btn-save-next-eval');
    try {
      if (btnSave) btnSave.disabled = true;
      if (btnNext) btnNext.disabled = true;
      const res = await api.updateEvaluacion(ev.id_evaluacion, payload);
      hasUnsavedChanges = false;
      setDirty(false);
      showToast(res?.message || 'Evaluación guardada.', 'success');

      if (advanceToNext) {
        const currentIdx = evaluaciones.findIndex((item) => item.id_evaluacion === ev.id_evaluacion);
        const nextPending =
          evaluaciones.find(
            (item, idx) => idx > currentIdx && item.estado === 'PENDIENTE'
          ) ||
          evaluaciones.find((item) => item.id_evaluacion !== ev.id_evaluacion && item.estado === 'PENDIENTE');

        if (nextPending) {
          activeEvalId = nextPending.id_evaluacion;
        } else {
          showToast('Todos los controles seleccionados han sido evaluados.', 'info');
        }
      }
      await loadEvaluaciones();
    } catch (err) {
      if (err.field) setFieldError(err.field, err.message);
      showToast(err.message, 'error', 7000);
      if (btnSave) btnSave.disabled = isClosedAudit;
      if (btnNext) btnNext.disabled = isClosedAudit;
    }
  };

  evalForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSaveEvaluation(false);
  });

  document.getElementById('btn-save-next-eval')?.addEventListener('click', async () => {
    await handleSaveEvaluation(true);
  });

  const evForm = document.getElementById('evidencia-form');
  if (evForm) {
    attachLiveValidationClear(evForm);
    const fileInput = document.getElementById('ev-archivo');
    const fileInfo = document.getElementById('ev-archivo-info');
    fileInput?.addEventListener('change', () => {
      const f = fileInput.files?.[0];
      if (!fileInfo) return;
      if (f) {
        fileInfo.textContent = `Seleccionado: ${f.name} (${formatFileSize(f.size)})`;
      } else {
        fileInfo.textContent =
          'Formatos admitidos: fotos/imágenes (PNG, JPG, WEBP, GIF, HEIC), videos (MP4, WEBM, MOV, AVI, MKV) y documentos (PDF, Office, TXT, CSV, JSON, ZIP).';
      }
    });

    evForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllFieldErrors(evForm);
      const payload = {
        descripcion: document.getElementById('ev-descripcion').value,
        fuente: document.getElementById('ev-fuente').value,
        fecha_evidencia: document.getElementById('ev-fecha').value,
        referencia_url: document.getElementById('ev-ref').value,
        es_simulada: document.getElementById('ev-simulada').checked,
      };
      const { valid } = validateEvidenciaForm(payload);
      if (!valid) return;

      const selectedFile = fileInput?.files?.[0] || null;
      try {
        const btn = document.getElementById('btn-add-ev');
        btn.disabled = true;
        const res = await api.createEvidencia(ev.id_evaluacion, payload);
        const createdEv = res?.data;

        if (selectedFile && createdEv?.id_evidencia) {
          try {
            await api.uploadEvidenciaArchivo(createdEv.id_evidencia, selectedFile);
            showToast(
              `Evidencia ${createdEv.codigo_evidencia} registrada y archivo "${selectedFile.name}" adjuntado.`,
              'success'
            );
          } catch (uploadErr) {
            showToast(
              `Evidencia ${createdEv.codigo_evidencia} registrada, pero no se pudo subir el archivo: ${uploadErr.message}`,
              'warning',
              8000
            );
          }
        } else {
          showToast(res?.message || 'Evidencia registrada.', 'success');
        }
        await loadEvaluaciones();
      } catch (err) {
        if (err.field) setFieldError(err.field, err.message);
        showToast(err.message, 'error');
        document.getElementById('btn-add-ev').disabled = false;
      }
    });
  }

  const rowFileInput = document.getElementById('ev-row-file-input');
  rowFileInput?.addEventListener('change', async () => {
    const file = rowFileInput.files?.[0];
    const targetId = pendingUploadEvId;
    pendingUploadEvId = null;
    rowFileInput.value = '';
    if (!file || !targetId) return;

    try {
      showToast(`Subiendo "${file.name}"…`, 'info', 4000);
      const res = await api.uploadEvidenciaArchivo(targetId, file);
      showToast(res?.message || `Archivo "${file.name}" adjuntado.`, 'success');
      await loadEvaluaciones();
    } catch (err) {
      showToast(err.message, 'error', 7000);
    }
  });

  document.querySelectorAll('[data-upload-ev-file]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pendingUploadEvId = Number(btn.getAttribute('data-upload-ev-file'));
      rowFileInput?.click();
    });
  });

  document.querySelectorAll('[data-preview-ev-file]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idEv = Number(btn.getAttribute('data-preview-ev-file'));
      const item = (ev.evidencias || []).find((x) => x.id_evidencia === idEv);
      if (item) openEvidencePreviewModal(item);
    });
  });

  document.querySelectorAll('[data-download-ev-file]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idEv = Number(btn.getAttribute('data-download-ev-file'));
      try {
        btn.disabled = true;
        const res = await api.getEvidenciaArchivoUrl(idEv);
        const url = res?.data?.url;
        if (url) {
          window.open(url, '_blank', 'noopener');
        } else {
          showToast('No se obtuvo el enlace de descarga.', 'warning');
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });

  document.querySelectorAll('[data-remove-ev-file]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idEv = Number(btn.getAttribute('data-remove-ev-file'));
      const ok = await confirmModal({
        title: 'Quitar archivo adjunto',
        message: 'Se eliminará el archivo del almacenamiento, pero se conservará el registro de la evidencia.',
        confirmText: 'Quitar archivo',
        danger: true,
      });
      if (!ok) return;
      try {
        const res = await api.deleteEvidenciaArchivo(idEv);
        showToast(res?.message || 'Archivo quitado de la evidencia.', 'info');
        await loadEvaluaciones();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-del-ev]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idEv = Number(btn.getAttribute('data-del-ev'));
      const ok = await confirmModal({
        title: 'Eliminar Evidencia',
        message: '¿Está seguro de eliminar esta evidencia del control evaluado?',
        confirmText: 'Eliminar',
        danger: true,
      });
      if (!ok) return;
      try {
        await api.deleteEvidencia(idEv);
        showToast('Evidencia eliminada.', 'info');
        await loadEvaluaciones();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  document.getElementById('btn-open-quick-hallazgo')?.addEventListener('click', () => {
    openQuickHallazgoModal(ev);
  });
}

async function openEvidencePreviewModal(evItem) {
  const existing = document.getElementById('ev-preview-modal-backdrop');
  if (existing) existing.remove();

  const category = getFileCategoryLabel(evItem.archivo_tipo, evItem.archivo_nombre);
  const backdrop = document.createElement('div');
  backdrop.id = 'ev-preview-modal-backdrop';
  backdrop.className =
    'fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 no-print';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  backdrop.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
      <div class="bg-[#0F172A] text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-[#007BFF] text-white font-mono text-xs font-bold">${escapeHtml(
              evItem.codigo_evidencia
            )}</span>
            <span class="px-2 py-0.5 rounded bg-white/15 text-[11px] font-bold uppercase">${escapeHtml(category)}</span>
          </div>
          <h3 class="font-bold text-sm sm:text-base truncate mt-1">${escapeHtml(
            evItem.archivo_nombre || evItem.descripcion
          )}</h3>
        </div>
        <button type="button" id="ev-preview-close" class="text-white/80 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Cerrar vista previa">
          ${icon('x', 'w-5 h-5')}
        </button>
      </div>

      <div class="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span class="block text-slate-500 font-semibold">Descripción</span>
            <span class="font-bold text-slate-900">${escapeHtml(evItem.descripcion)}</span>
          </div>
          <div>
            <span class="block text-slate-500 font-semibold">Fuente</span>
            <span class="font-bold text-slate-900">${escapeHtml(evItem.fuente)}</span>
          </div>
          <div>
            <span class="block text-slate-500 font-semibold">Fecha y Tipo</span>
            <span class="font-bold text-slate-900">${escapeHtml(formatDate(evItem.fecha_evidencia))} · ${
              evItem.es_simulada !== false ? 'Referencial' : 'Documental'
            }</span>
          </div>
          <div>
            <span class="block text-slate-500 font-semibold">Archivo</span>
            <span class="font-bold text-slate-900">${escapeHtml(evItem.archivo_tipo || '—')} ${
              evItem.archivo_tamano ? `(${escapeHtml(formatFileSize(evItem.archivo_tamano))})` : ''
            }</span>
          </div>
        </div>

        <div id="ev-preview-body" class="min-h-[220px] flex items-center justify-center rounded-xl bg-slate-100/70 border border-slate-200 p-4">
          <p class="text-sm text-slate-500 font-medium">Cargando vista previa segura…</p>
        </div>
      </div>

      <div class="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div class="text-xs text-slate-500">
          ${evItem.referencia_url ? `Ref: <code class="bg-white px-1.5 py-0.5 rounded border border-slate-200">${escapeHtml(evItem.referencia_url)}</code>` : ''}
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" id="ev-preview-download" class="btn btn-outline text-xs">
            ${icon('download', 'w-3.5 h-3.5')} Descargar
          </button>
          <button type="button" id="ev-preview-close-btn" class="btn btn-primary text-xs">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const closePreview = () => {
    document.removeEventListener('keydown', onKeyDown);
    backdrop.remove();
  };
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePreview();
    }
  };
  document.addEventListener('keydown', onKeyDown);
  backdrop.querySelector('#ev-preview-close')?.addEventListener('click', closePreview);
  backdrop.querySelector('#ev-preview-close-btn')?.addEventListener('click', closePreview);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closePreview();
  });

  backdrop.querySelector('#ev-preview-download')?.addEventListener('click', async () => {
    try {
      const res = await api.getEvidenciaArchivoUrl(evItem.id_evidencia);
      if (res?.data?.url) window.open(res.data.url, '_blank', 'noopener');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  const bodyEl = backdrop.querySelector('#ev-preview-body');
  try {
    const res = await api.getEvidenciaArchivoUrl(evItem.id_evidencia, { inline: true });
    const url = res?.data?.url;
    const mime = String(res?.data?.archivo_tipo || evItem.archivo_tipo || '').toLowerCase();
    if (!url || !bodyEl) return;

    if (mime.startsWith('image/')) {
      bodyEl.innerHTML = `<img src="${escapeHtml(url)}" alt="${escapeHtml(
        evItem.archivo_nombre || 'Imagen de evidencia'
      )}" class="max-h-[60vh] w-auto mx-auto rounded-lg object-contain shadow-sm" />`;
    } else if (mime.startsWith('video/')) {
      bodyEl.innerHTML = `<video src="${escapeHtml(url)}" controls preload="metadata" class="w-full max-h-[60vh] rounded-lg bg-black"></video>`;
    } else if (mime === 'application/pdf' || mime.startsWith('text/') || mime === 'application/json') {
      bodyEl.innerHTML = `<iframe src="${escapeHtml(
        url
      )}" class="w-full h-[60vh] rounded-lg border border-slate-200 bg-white" title="Vista previa del documento"></iframe>`;
    } else {
      bodyEl.innerHTML = `
        <div class="text-center space-y-2 py-6 max-w-md">
          <div class="inline-flex p-3 rounded-full bg-white border border-slate-200 text-[#003366]">
            ${icon('fileText', 'w-7 h-7')}
          </div>
          <p class="text-sm font-bold text-slate-900">${escapeHtml(evItem.archivo_nombre || 'Archivo adjunto')}</p>
          <p class="text-xs text-slate-600">
            Este formato (${escapeHtml(mime || category)}) no se renderiza directamente en el navegador. Usa el botón <strong>Descargar</strong> para abrirlo en tu equipo.
          </p>
        </div>
      `;
    }
  } catch (err) {
    if (bodyEl) {
      bodyEl.innerHTML = `<p class="text-sm text-[#D64545] font-semibold">No se pudo cargar la vista previa: ${escapeHtml(
        err.message
      )}</p>`;
    }
  }
}

function bindQuickHallazgoModal() {
  const modal = document.getElementById('quick-hallazgo-modal');
  const form = document.getElementById('quick-hallazgo-form');
  if (!modal || !form) return;

  attachLiveValidationClear(form);
  const close = () => closeModal(modal);
  document.getElementById('qh-close')?.addEventListener('click', close);
  document.getElementById('qh-cancel')?.addEventListener('click', close);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors(form);
    const idEval = Number(document.getElementById('qh-eval-id').value);
    const condicion = document.getElementById('qh-condicion').value.trim();
    const criterio = document.getElementById('qh-criterio').value.trim();
    const causa = document.getElementById('qh-causa').value.trim();
    const efecto_riesgo = document.getElementById('qh-efecto').value.trim();
    const severidad = document.getElementById('qh-severidad').value;

    let valid = true;
    if (!condicion) {
      setFieldError('qh-condicion', 'La condición es obligatoria.');
      valid = false;
    }
    if (!criterio) {
      setFieldError('qh-criterio', 'El criterio es obligatorio.');
      valid = false;
    }
    if (!causa) {
      setFieldError('qh-causa', 'La causa raíz es obligatoria.');
      valid = false;
    }
    if (!efecto_riesgo) {
      setFieldError('qh-efecto', 'El efecto o riesgo es obligatorio.');
      valid = false;
    }
    if (!valid) return;

    const recDesc = document.getElementById('qh-rec-desc').value.trim();
    const payload = {
      condicion,
      criterio,
      causa,
      efecto_riesgo,
      severidad,
    };
    if (recDesc) {
      payload.recomendacion = {
        descripcion: recDesc,
        prioridad: document.getElementById('qh-rec-prio').value,
        plazo_dias: Number(document.getElementById('qh-rec-plazo').value) || 60,
        responsable_sug: document.getElementById('qh-rec-resp').value.trim(),
      };
    }

    try {
      const res = await api.createHallazgo(idEval, payload);
      showToast(res?.message || 'Hallazgo registrado.', 'success');
      close();
      await loadEvaluaciones();
    } catch (err) {
      showToast(err.message, 'error', 7000);
    }
  });
}

function openQuickHallazgoModal(ev) {
  const modal = document.getElementById('quick-hallazgo-modal');
  const form = document.getElementById('quick-hallazgo-form');
  clearAllFieldErrors(form);
  form.reset();
  document.getElementById('qh-eval-id').value = String(ev.id_evaluacion);
  document.getElementById('qh-modal-title').textContent = `Registrar Hallazgo — Control ${ev.codigo_iso}`;
  document.getElementById('qh-criterio').value = `ISO/IEC 27002:2022, control ${ev.codigo_iso}: ${ev.criterio}`;
  openModal(modal, '#qh-condicion');
}

function bindKeyboardNavigation() {
  if (keyboardBound) return;
  keyboardBound = true;
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('control-detail-panel')) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (evaluaciones.length === 0) return;
    const idx = evaluaciones.findIndex((ev) => ev.id_evaluacion === activeEvalId);
    if (idx === -1) return;

    if (e.key === 'ArrowDown' && idx < evaluaciones.length - 1) {
      e.preventDefault();
      activeEvalId = evaluaciones[idx + 1].id_evaluacion;
      renderMasterList();
      renderDetailPanel();
    } else if (e.key === 'ArrowUp' && idx > 0) {
      e.preventDefault();
      activeEvalId = evaluaciones[idx - 1].id_evaluacion;
      renderMasterList();
      renderDetailPanel();
    }
  });
}

if (!window.__AUDITSYS_SOFT_NAV__) {
  bootstrap();
}
