/**
 * AuditSys Mini (DECR 27000) — Controlador de Hallazgos, Recomendaciones y Trazabilidad
 * (RF05, RF06, RNF05, CP-07, CP-08)
 */

import { api } from '../api.js';
import { initLayout, populateAuditSelector } from '../layout.js';
import {
  confirmModal,
  escapeHtml,
  renderControlStateChip,
  renderSeverityBadge,
  showToast,
} from '../ui.js';
import {
  attachLiveValidationClear,
  clearAllFieldErrors,
  setFieldError,
  validateHallazgoForm,
} from '../validators.js';

let activeAuditId = null;
let activeAudit = null;
let evaluaciones = [];
let hallazgos = [];
let trazabilidadRows = [];
let trazFilter = 'ALL';

async function bootstrap() {
  const ctx = await initLayout({
    activeStep: 5,
    onAuditChange: async (nextId, nextAudit) => {
      activeAuditId = nextId;
      activeAudit = nextAudit;
      await refreshAll();
    },
  });
  if (!ctx) return;

  activeAuditId = ctx.activeAuditId;
  activeAudit = ctx.activeAudit;

  bindFormsAndFilters();
  await refreshAll();
}

async function refreshAll() {
  const isClosed = activeAudit?.estado === 'CERRADA';
  document.getElementById('hall-closed-banner')?.classList.toggle('hidden', !isClosed);
  document.getElementById('new-hallazgo-section')?.classList.toggle('hidden', isClosed);

  try {
    const [evalRes, hallRes, trazRes, audRes] = await Promise.all([
      api.getEvaluaciones(activeAuditId),
      api.getHallazgos(activeAuditId),
      api.getTrazabilidad(activeAuditId),
      api.getAuditoria(activeAuditId),
    ]);

    evaluaciones = Array.isArray(evalRes?.data) ? evalRes.data : [];
    hallazgos = Array.isArray(hallRes?.data) ? hallRes.data : [];
    trazabilidadRows = Array.isArray(trazRes?.data) ? trazRes.data : [];
    if (audRes?.data) activeAudit = audRes.data;

    populateControlSelect();
    renderClosurePanel();
    renderHallazgosList();
    renderTrazabilidad();
  } catch (err) {
    showToast(`Error al cargar datos de hallazgos: ${err.message}`, 'error');
  }
}

function populateControlSelect() {
  const select = document.getElementById('h-evaluacion');
  if (!select) return;

  select.innerHTML = '<option value="">Seleccione un control evaluado...</option>';
  for (const ev of evaluaciones) {
    const opt = document.createElement('option');
    opt.value = String(ev.id_evaluacion);
    opt.textContent = `${ev.codigo_iso} — ${ev.nombre} [${ev.estado}]`;
    select.appendChild(opt);
  }

  const preselectId = new URLSearchParams(window.location.search).get('id_evaluacion');
  if (preselectId && evaluaciones.some((e) => String(e.id_evaluacion) === preselectId)) {
    select.value = preselectId;
    select.dispatchEvent(new Event('change'));
  }
}

function bindFormsAndFilters() {
  const form = document.getElementById('hallazgo-form');
  attachLiveValidationClear(form);

  // Heredar automáticamente el criterio ISO 27002:2022 al elegir control (RF05)
  document.getElementById('h-evaluacion')?.addEventListener('change', (e) => {
    const idEval = Number(e.target.value);
    const ev = evaluaciones.find((x) => x.id_evaluacion === idEval);
    const criterioInput = document.getElementById('h-criterio');
    if (ev && criterioInput) {
      criterioInput.value = `ISO/IEC 27002:2022, control ${ev.codigo_iso}: ${ev.criterio}`;
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors(form);

    const values = {
      id_evaluacion: document.getElementById('h-evaluacion').value,
      severidad: document.getElementById('h-severidad').value,
      condicion: document.getElementById('h-condicion').value,
      criterio: document.getElementById('h-criterio').value,
      causa: document.getElementById('h-causa').value,
      efecto_riesgo: document.getElementById('h-efecto').value,
      rec_descripcion: document.getElementById('rec-descripcion').value,
      rec_plazo_dias: document.getElementById('rec-plazo').value,
    };

    const { valid } = validateHallazgoForm(values, false);
    if (!valid) {
      showToast('Complete todos los campos obligatorios del hallazgo.', 'warning');
      return;
    }

    const payload = {
      condicion: values.condicion.trim(),
      criterio: values.criterio.trim(),
      causa: values.causa.trim(),
      efecto_riesgo: values.efecto_riesgo.trim(),
      severidad: values.severidad,
    };

    if (values.rec_descripcion && values.rec_descripcion.trim()) {
      payload.recomendacion = {
        descripcion: values.rec_descripcion.trim(),
        prioridad: document.getElementById('rec-prioridad').value,
        plazo_dias: Number(values.rec_plazo_dias) || 60,
        responsable_sug: document.getElementById('rec-responsable').value.trim(),
      };
    }

    try {
      const btn = document.getElementById('btn-save-hallazgo');
      btn.disabled = true;
      const res = await api.createHallazgo(Number(values.id_evaluacion), payload);
      showToast(res?.message || 'Hallazgo registrado.', 'success');
      form.reset();
      document.getElementById('rec-plazo').value = '60';
      document.getElementById('rec-responsable').value =
        'Líder de TI / Seguridad de la Información';
      await refreshAll();
    } catch (err) {
      if (err.field) setFieldError(err.field, err.message);
      showToast(err.message, 'error', 7000);
    } finally {
      document.getElementById('btn-save-hallazgo').disabled = false;
    }
  });

  // Modal Editar Hallazgo
  const editHallModal = document.getElementById('edit-hall-modal');
  const editHallForm = document.getElementById('edit-hall-form');
  if (editHallForm) attachLiveValidationClear(editHallForm);
  const closeEditHallModal = () => {
    editHallModal?.classList.add('hidden');
    editHallModal?.classList.remove('flex');
  };
  document.getElementById('edit-hall-close')?.addEventListener('click', closeEditHallModal);
  document.getElementById('edit-hall-cancel')?.addEventListener('click', closeEditHallModal);

  editHallForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors(editHallForm);
    const idHall = Number(document.getElementById('edit-hall-id').value);
    const condicion = document.getElementById('edit-hall-cond').value.trim();
    const criterio = document.getElementById('edit-hall-crit').value.trim();
    const causa = document.getElementById('edit-hall-causa').value.trim();
    const efecto_riesgo = document.getElementById('edit-hall-efecto').value.trim();
    const severidad = document.getElementById('edit-hall-sev').value;

    let valid = true;
    if (!condicion) {
      setFieldError('edit-hall-cond', 'La condición es obligatoria.');
      valid = false;
    }
    if (!criterio) {
      setFieldError('edit-hall-crit', 'El criterio es obligatorio.');
      valid = false;
    }
    if (!causa) {
      setFieldError('edit-hall-causa', 'La causa raíz es obligatoria.');
      valid = false;
    }
    if (!efecto_riesgo) {
      setFieldError('edit-hall-efecto', 'El efecto o riesgo es obligatorio.');
      valid = false;
    }
    if (!valid) return;

    try {
      await api.updateHallazgo(idHall, { condicion, criterio, causa, efecto_riesgo, severidad });
      showToast('Hallazgo actualizado correctamente.', 'success');
      closeEditHallModal();
      await refreshAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Modal Agregar Recomendación
  const recModal = document.getElementById('add-rec-modal');
  const recForm = document.getElementById('add-rec-form');
  const closeRecModal = () => {
    recModal?.classList.add('hidden');
    recModal?.classList.remove('flex');
  };
  document.getElementById('add-rec-close')?.addEventListener('click', closeRecModal);
  document.getElementById('add-rec-cancel')?.addEventListener('click', closeRecModal);

  recForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors(recForm);
    const idHall = Number(document.getElementById('add-rec-hallazgo-id').value);
    const desc = document.getElementById('m-rec-desc').value.trim();
    if (!desc) {
      setFieldError('m-rec-desc', 'La descripción de la recomendación es obligatoria.');
      return;
    }
    try {
      await api.createRecomendacion(idHall, {
        descripcion: desc,
        prioridad: document.getElementById('m-rec-prio').value,
        plazo_dias: Number(document.getElementById('m-rec-plazo').value) || 60,
        responsable_sug: document.getElementById('m-rec-resp').value.trim(),
      });
      showToast('Recomendación asociada al hallazgo.', 'success');
      closeRecModal();
      await refreshAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Filtros de Trazabilidad
  document.querySelectorAll('[data-traz-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      trazFilter = btn.getAttribute('data-traz-filter');
      document.querySelectorAll('[data-traz-filter]').forEach((b) => {
        b.className = b === btn ? 'btn btn-primary text-xs py-1.5' : 'btn btn-outline text-xs py-1.5';
      });
      renderTrazabilidad();
    });
  });
}

function renderClosurePanel() {
  const metricsEl = document.getElementById('closure-metrics');
  const actionsEl = document.getElementById('closure-actions');
  const errBox = document.getElementById('closure-error-box');
  if (!metricsEl || !actionsEl) return;

  errBox?.classList.add('hidden');

  const totalHalls = hallazgos.length;
  const withRec = hallazgos.filter((h) => (h.recomendaciones || []).length > 0).length;
  const sinEv = evaluaciones.filter(
    (e) =>
      (e.estado === 'IMPLEMENTADO' || e.estado === 'PARCIAL') &&
      (!e.evidencias || e.evidencias.length === 0)
  );

  metricsEl.innerHTML = `
    <span class="px-2.5 py-1 rounded-md ${
      totalHalls >= 3 ? 'bg-[#eaf6ef] text-[#14532d]' : 'bg-amber-50 text-amber-900'
    }">
      Hallazgos documentados: ${totalHalls} (Mínimo requerido: 3)
    </span>
    <span class="px-2.5 py-1 rounded-md ${
      totalHalls > 0 && withRec === totalHalls
        ? 'bg-[#eaf6ef] text-[#14532d]'
        : 'bg-amber-50 text-amber-900'
    }">
      Hallazgos con recomendación: ${withRec} / ${totalHalls}
    </span>
    <span class="px-2.5 py-1 rounded-md ${
      sinEv.length === 0 ? 'bg-[#eaf6ef] text-[#14532d]' : 'bg-[#fbecec] text-[#7f1d1d]'
    }">
      Controles sin evidencia (RN04): ${sinEv.length}
    </span>
  `;

  const estado = activeAudit?.estado || 'BORRADOR';
  const btns = [];
  if (estado === 'EN_EJECUCION') {
    btns.push({ target: 'EN_REVISION', label: '◉ Enviar a Revisión', cls: 'btn-primary' });
  } else if (estado === 'EN_REVISION') {
    btns.push({ target: 'CERRADA', label: '🔒 Cerrar Auditoría', cls: 'btn-success' });
  }

  actionsEl.innerHTML = btns
    .map(
      (b) =>
        `<button type="button" data-transition="${b.target}" class="btn ${b.cls} text-xs">${b.label}</button>`
    )
    .join('');

  actionsEl.querySelectorAll('[data-transition]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const target = btn.getAttribute('data-transition');
      errBox?.classList.add('hidden');
      if (target === 'CERRADA') {
        const ok = await confirmModal({
          title: 'Cerrar Auditoría Definitivamente',
          message:
            '¿Confirma que desea cerrar la auditoría? Una vez cerrada será inmutable (CP-13).',
          confirmText: 'Cerrar Auditoría',
          danger: true,
        });
        if (!ok) return;
      }

      try {
        btn.disabled = true;
        const res = await api.changeEstadoAuditoria(activeAuditId, target);
        showToast(res?.message || `Auditoría pasada a ${target}.`, 'success');
        const listRes = await api.getAuditorias();
        populateAuditSelector(listRes?.data || [], { ...activeAudit, estado: target });
        await refreshAll();
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message;
          errBox.classList.remove('hidden');
        }
        showToast(err.message, 'error', 8000);
        btn.disabled = false;
      }
    });
  });
}

function renderHallazgosList() {
  const container = document.getElementById('hallazgos-list');
  if (!container) return;

  const isClosed = activeAudit?.estado === 'CERRADA';

  if (hallazgos.length === 0) {
    container.innerHTML = `
      <div class="card p-6 text-center text-sm text-slate-500">
        Aún no hay hallazgos documentados en esta auditoría.
      </div>
    `;
    return;
  }

  container.innerHTML = hallazgos
    .map((h) => {
      const recs = h.recomendaciones || [];
      const recsHtml =
        recs.length === 0
          ? `<div class="p-3 rounded-lg bg-[#fbecec] border border-[#D64545] text-[#7f1d1d] text-xs font-bold">
               ⚠ Sin recomendación asociada (bloquea el cierre según RN06 / CP-08).
             </div>`
          : recs
              .map(
                (r) => `
              <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    ${renderSeverityBadge(r.prioridad, 'Prioridad')}
                    <span class="text-xs font-bold text-[#003366]">Plazo: ${escapeHtml(
                      r.plazo_dias
                    )} días</span>
                    <span class="text-xs text-slate-500">· Responsable: ${escapeHtml(
                      r.responsable_sug || 'Líder TI'
                    )}</span>
                  </div>
                  <p class="text-xs sm:text-sm text-slate-800">${escapeHtml(r.descripcion)}</p>
                </div>
                ${
                  isClosed
                    ? ''
                    : `<button type="button" data-del-rec="${escapeHtml(
                        r.id_recomendacion
                      )}" class="btn btn-ghost text-xs text-[#D64545] shrink-0">Eliminar</button>`
                }
              </div>
            `
              )
              .join('');

      return `
        <article class="card p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-3 py-1 rounded-md bg-[#003366] text-white font-mono text-sm font-extrabold">
                ${escapeHtml(h.codigo)}
              </span>
              <span class="text-xs font-bold text-[#003366] bg-[#e6eef5] px-2.5 py-1 rounded">
                Control ${escapeHtml(h.codigo_iso)} — ${escapeHtml(h.control_nombre)}
              </span>
              ${renderSeverityBadge(h.severidad)}
            </div>
            ${
              isClosed
                ? ''
                : `<div class="flex items-center gap-1">
                    <button type="button" data-edit-hall="${escapeHtml(
                      h.id_hallazgo
                    )}" class="btn btn-outline text-xs py-1 px-2.5">✎ Editar</button>
                    <button type="button" data-del-hall="${escapeHtml(
                      h.id_hallazgo
                    )}" class="btn btn-ghost text-xs text-[#D64545]">Eliminar</button>
                  </div>`
            }
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <strong class="block text-[#003366] mb-1">Condición:</strong>
              <p class="text-slate-800">${escapeHtml(h.condicion)}</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <strong class="block text-[#003366] mb-1">Criterio:</strong>
              <p class="text-slate-800">${escapeHtml(h.criterio)}</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <strong class="block text-[#003366] mb-1">Causa Raíz:</strong>
              <p class="text-slate-800">${escapeHtml(h.causa)}</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <strong class="block text-[#003366] mb-1">Efecto / Riesgo:</strong>
              <p class="text-slate-800">${escapeHtml(h.efecto_riesgo)}</p>
            </div>
          </div>

          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recomendaciones Asociadas (${recs.length})
              </h3>
              ${
                isClosed
                  ? ''
                  : `<button type="button" data-add-rec="${escapeHtml(
                      h.id_hallazgo
                    )}" data-hall-code="${escapeHtml(
                      h.codigo
                    )}" class="btn btn-outline text-xs py-1 px-2.5">+ Agregar otra recomendación</button>`
              }
            </div>
            ${recsHtml}
          </div>
        </article>
      `;
    })
    .join('');

  container.querySelectorAll('[data-add-rec]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idHall = btn.getAttribute('data-add-rec');
      const code = btn.getAttribute('data-hall-code');
      document.getElementById('add-rec-hallazgo-id').value = idHall;
      document.getElementById('add-rec-title').textContent = `Agregar Recomendación a ${code}`;
      document.getElementById('add-rec-form').reset();
      document.getElementById('m-rec-plazo').value = '60';
      document.getElementById('m-rec-resp').value = 'Líder de TI / Seguridad';
      const modal = document.getElementById('add-rec-modal');
      modal?.classList.remove('hidden');
      modal?.classList.add('flex');
    });
  });

  container.querySelectorAll('[data-edit-hall]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-edit-hall'));
      const h = hallazgos.find((item) => item.id_hallazgo === id);
      if (!h) return;
      const modal = document.getElementById('edit-hall-modal');
      const form = document.getElementById('edit-hall-form');
      clearAllFieldErrors(form);
      document.getElementById('edit-hall-id').value = String(h.id_hallazgo);
      document.getElementById('edit-hall-title').textContent = `Editar Hallazgo ${h.codigo}`;
      document.getElementById('edit-hall-sev').value = h.severidad || 'MEDIA';
      document.getElementById('edit-hall-cond').value = h.condicion || '';
      document.getElementById('edit-hall-crit').value = h.criterio || '';
      document.getElementById('edit-hall-causa').value = h.causa || '';
      document.getElementById('edit-hall-efecto').value = h.efecto_riesgo || '';
      modal?.classList.remove('hidden');
      modal?.classList.add('flex');
    });
  });

  container.querySelectorAll('[data-del-hall]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.getAttribute('data-del-hall'));
      const ok = await confirmModal({
        title: 'Eliminar Hallazgo',
        message: '¿Desea eliminar este hallazgo y sus recomendaciones asociadas?',
        confirmText: 'Eliminar',
        danger: true,
      });
      if (!ok) return;
      try {
        await api.deleteHallazgo(id);
        showToast('Hallazgo eliminado.', 'info');
        await refreshAll();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  container.querySelectorAll('[data-del-rec]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.getAttribute('data-del-rec'));
      const ok = await confirmModal({
        title: 'Eliminar Recomendación',
        message: '¿Está seguro de eliminar esta recomendación?',
        confirmText: 'Eliminar',
        danger: true,
      });
      if (!ok) return;
      try {
        await api.deleteRecomendacion(id);
        showToast('Recomendación eliminada.', 'info');
        await refreshAll();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

function renderTrazabilidad() {
  const container = document.getElementById('trazabilidad-table-container');
  if (!container) return;

  const filtered = trazabilidadRows.filter((r) => {
    if (trazFilter === 'SIN_EVIDENCIA') {
      return (
        (r.estado === 'IMPLEMENTADO' || r.estado === 'PARCIAL') && !r.codigo_evidencia
      );
    }
    if (trazFilter === 'SIN_RECOMENDACION') {
      return Boolean(r.hallazgo_codigo) && !r.recomendacion_descripcion;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML =
      '<div class="p-6 text-center text-sm text-slate-500">No hay registros que coincidan con el filtro seleccionado.</div>';
    return;
  }

  const rowsHtml = filtered
    .map(
      (r) => `
      <tr class="hover:bg-slate-50">
        <td class="px-3 py-2.5 font-mono text-xs font-bold text-[#003366]">${escapeHtml(r.codigo_iso)}</td>
        <td class="px-3 py-2.5 text-xs font-medium text-slate-900">${escapeHtml(r.control_nombre)}</td>
        <td class="px-3 py-2.5">${renderControlStateChip(r.estado)}</td>
        <td class="px-3 py-2.5 text-xs">
          ${
            r.codigo_evidencia
              ? `<span class="font-mono font-bold text-[#003366]">${escapeHtml(
                  r.codigo_evidencia
                )}</span> <span class="text-slate-600">${escapeHtml(r.evidencia_descripcion)}</span>`
              : '<span class="text-slate-400 italic">Sin evidencia</span>'
          }
        </td>
        <td class="px-3 py-2.5 text-xs">
          ${
            r.hallazgo_codigo
              ? `<span class="font-mono font-bold text-[#D64545]">${escapeHtml(
                  r.hallazgo_codigo
                )}</span> (${escapeHtml(r.hallazgo_severidad)})`
              : '<span class="text-slate-400">—</span>'
          }
        </td>
        <td class="px-3 py-2.5 text-xs">
          ${
            r.recomendacion_descripcion
              ? `<span class="font-semibold">${escapeHtml(
                  r.recomendacion_prioridad
                )} (${escapeHtml(r.recomendacion_plazo_dias)}d):</span> ${escapeHtml(
                  r.recomendacion_descripcion
                )}`
              : '<span class="text-slate-400">—</span>'
          }
        </td>
      </tr>
    `
    )
    .join('');

  container.innerHTML = `
    <table class="w-full text-left text-xs">
      <thead class="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
        <tr>
          <th class="px-3 py-2.5">ISO</th>
          <th class="px-3 py-2.5">Control</th>
          <th class="px-3 py-2.5">Estado</th>
          <th class="px-3 py-2.5">Evidencia (EV-nn)</th>
          <th class="px-3 py-2.5">Hallazgo (H-nn)</th>
          <th class="px-3 py-2.5">Recomendación</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200">
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

bootstrap();
