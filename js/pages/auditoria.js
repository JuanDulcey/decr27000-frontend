/**
 * AuditSys SGSI — Controlador de Auditoría
 */

import { api } from '../api.js';
import { setActiveAuditId } from '../auth.js';
import { OFFICIAL_REFERENTES } from '../config.js';
import { toInputDate } from '../format.js';
import { icon } from '../icons.js';
import { initLayout, populateAuditSelector, updateAuditStatusBadge } from '../layout.js';
import { confirmModal, escapeHtml, renderAuditStateBadge, showToast } from '../ui.js';
import {
  attachLiveValidationClear,
  clearAllFieldErrors,
  setFieldError,
  validateAuditoriaForm,
} from '../validators.js';

let isNewMode = false;
let currentAuditId = null;
let currentAudit = null;

let form = null;
let pageTitle = null;
let btnSave = null;
let btnGoCatalog = null;
let closedBanner = null;
let statePill = null;

export async function bootstrap() {
  const urlParams = new URLSearchParams(window.location.search);
  isNewMode = urlParams.get('mode') === 'new';
  currentAuditId = Number(urlParams.get('id')) || null;
  currentAudit = null;

  form = document.getElementById('auditoria-form');
  pageTitle = document.getElementById('page-title');
  btnSave = document.getElementById('btn-save-auditoria');
  btnGoCatalog = document.getElementById('btn-go-catalog');
  closedBanner = document.getElementById('closed-audit-banner');
  statePill = document.getElementById('audit-state-pill');

  const ctx = await initLayout({
    activeStep: 2,
    onAuditChange: async (nextId) => {
      isNewMode = false;
      currentAuditId = nextId;
      await loadAuditoriaData(nextId);
    },
  });
  if (!ctx) return;

  attachLiveValidationClear(form);
  bindFormSubmit();
  await loadUsuarios();

  if (isNewMode) {
    setupNewMode();
  } else {
    currentAuditId = currentAuditId || ctx.activeAuditId;
    if (currentAuditId) {
      setActiveAuditId(currentAuditId);
      await loadAuditoriaData(currentAuditId);
    } else {
      setupNewMode();
    }
  }
}

async function loadUsuarios() {
  const select = document.getElementById('id_auditor');
  if (!select) return;
  try {
    const res = await api.getUsuarios();
    const usuarios = res?.data || [];
    select.innerHTML = '<option value="">Seleccione un auditor...</option>';
    for (const u of usuarios) {
      const opt = document.createElement('option');
      opt.value = String(u.id_usuario);
      opt.textContent = `${u.nombre} (${u.rol})`;
      select.appendChild(opt);
    }
  } catch (err) {
    showToast(`No se pudieron cargar los auditores: ${err.message}`, 'error');
  }
}

function setupNewMode() {
  isNewMode = true;
  currentAudit = null;
  clearAllFieldErrors(form);
  form.reset();
  document.getElementById('referentes').value = OFFICIAL_REFERENTES;
  document.getElementById('id_auditor').value = '1';
  pageTitle.textContent = 'Nueva Auditoría SGSI';
  btnSave.textContent = 'Crear Auditoría (BORRADOR)';
  btnGoCatalog.classList.add('hidden');
  closedBanner.classList.add('hidden');
  statePill.innerHTML = renderAuditStateBadge('BORRADOR');
  setFormDisabled(false);

  document.getElementById('lifecycle-checklist').innerHTML =
    '<p class="text-slate-600">Al crear la auditoría iniciará en estado <strong>BORRADOR</strong>. Luego podrá seleccionar entre 10 y 15 controles en el Paso 3.</p>';
  document.getElementById('lifecycle-actions').innerHTML = '';
}

async function loadAuditoriaData(id) {
  try {
    clearAllFieldErrors(form);
    const res = await api.getAuditoria(id);
    const audit = res?.data;
    if (!audit) {
      setupNewMode();
      return;
    }
    currentAudit = audit;
    isNewMode = false;

    pageTitle.textContent = `Auditoría #${audit.id_auditoria}: ${audit.organizacion}`;
    btnSave.textContent = 'Guardar Cambios';
    btnGoCatalog.classList.remove('hidden');
    statePill.innerHTML = renderAuditStateBadge(audit.estado);
    updateAuditStatusBadge(audit);

    document.getElementById('organizacion').value = audit.organizacion || '';
    document.getElementById('id_auditor').value = String(audit.id_auditor || '');
    document.getElementById('fecha_inicio').value = toInputDate(audit.fecha_inicio);
    document.getElementById('fecha_fin').value = toInputDate(audit.fecha_fin);
    document.getElementById('objetivo').value = audit.objetivo || '';
    document.getElementById('alcance').value = audit.alcance || '';
    document.getElementById('referentes').value = audit.referentes || OFFICIAL_REFERENTES;

    const isClosed = audit.estado === 'CERRADA';
    closedBanner.classList.toggle('hidden', !isClosed);
    setFormDisabled(isClosed);

    await renderLifecyclePanel(audit);
  } catch (err) {
    showToast(`Error al cargar la auditoría: ${err.message}`, 'error');
  }
}

function setFormDisabled(disabled) {
  form.querySelectorAll('input, select, textarea').forEach((el) => {
    el.disabled = disabled;
  });
  // Mantenemos visible el botón si está cerrada para permitir probar CP-13 si se habilita o mostrar aviso
  btnSave.disabled = disabled;
}

async function renderLifecyclePanel(audit) {
  const checklistEl = document.getElementById('lifecycle-checklist');
  const actionsEl = document.getElementById('lifecycle-actions');
  if (!checklistEl || !actionsEl) return;

  let verif = audit.verificacion_cierre;
  if (!verif) {
    try {
      const vRes = await api.getVerificacionCierre(audit.id_auditoria);
      verif = vRes?.data;
    } catch {
      verif = null;
    }
  }

  if (verif) {
    const okRange = verif.total_seleccionados >= 10 && verif.total_seleccionados <= 15;
    const okPend = (verif.pendientes || []).length === 0 && verif.total_seleccionados > 0;
    const okEv = (verif.sin_evidencia || []).length === 0;
    const okHall = (verif.total_hallazgos || 0) >= 3;
    const okRec = (verif.hallazgos_sin_recomendacion || []).length === 0;

    const ruleRow = (ok, label, val) => `
      <div class="flex items-center justify-between gap-2">
        <span class="inline-flex items-center gap-1.5 ${ok ? 'text-[#2E9E5B]' : 'text-[#D64545]'} font-medium">
          ${icon(ok ? 'check' : 'x', 'w-3.5 h-3.5')}
          <span class="text-slate-700">${label}</span>
        </span>
        <span class="font-bold">${val}</span>
      </div>`;

    checklistEl.innerHTML = `
      <div class="font-bold text-[#003366] mb-1">Requisitos de Transición</div>
      ${ruleRow(okRange, 'Selección de 10 a 15 controles', verif.total_seleccionados)}
      ${ruleRow(okPend, 'Sin controles pendientes', `${(verif.pendientes || []).length} pend.`)}
      ${ruleRow(okEv, 'Evidencias en Impl. / Parcial', `${(verif.sin_evidencia || []).length} falt.`)}
      ${ruleRow(okHall, 'Mínimo 3 hallazgos', verif.total_hallazgos)}
      ${ruleRow(okRec, 'Hallazgos con recomendación', `${(verif.hallazgos_sin_recomendacion || []).length} sin rec.`)}
    `;
  }

  const estado = audit.estado;
  const buttons = [];

  if (estado === 'BORRADOR') {
    buttons.push({
      target: 'EN_EJECUCION',
      label: 'Pasar a EN EJECUCIÓN',
      iconName: 'play',
      cls: 'btn-primary',
    });
  } else if (estado === 'EN_EJECUCION') {
    buttons.push({
      target: 'EN_REVISION',
      label: 'Enviar a EN REVISIÓN',
      iconName: 'eye',
      cls: 'btn-primary',
    });
  } else if (estado === 'EN_REVISION') {
    buttons.push({
      target: 'EN_EJECUCION',
      label: 'Devolver a EN EJECUCIÓN',
      iconName: 'rotateCcw',
      cls: 'btn-outline',
    });
    buttons.push({
      target: 'CERRADA',
      label: 'Cerrar Auditoría (Inmutable)',
      iconName: 'lock',
      cls: 'btn-success',
    });
  } else if (estado === 'CERRADA') {
    actionsEl.innerHTML = `
      <div class="p-3 rounded-lg bg-[#eaf6ef] border border-[#2E9E5B] text-xs text-green-900 font-semibold flex items-center justify-center gap-1.5">
        ${icon('checkCircle', 'w-4 h-4')}
        <span>Auditoría cerrada definitivamente.</span>
      </div>
      <a href="informe.html" class="btn btn-primary w-full text-xs">Ver Informe Consolidado</a>
    `;
    return;
  }

  actionsEl.innerHTML = buttons
    .map(
      (b) =>
        `<button type="button" data-next-state="${escapeHtml(b.target)}" class="btn ${b.cls} w-full text-xs">${icon(
          b.iconName,
          'w-3.5 h-3.5'
        )}<span>${escapeHtml(b.label)}</span></button>`
    )
    .join('');

  actionsEl.querySelectorAll('[data-next-state]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const nextState = btn.getAttribute('data-next-state');
      if (nextState === 'CERRADA') {
        const ok = await confirmModal({
          title: 'Cerrar Auditoría Definitivamente',
          message:
            'Una vez cerrada, la auditoría quedará en modo de solo lectura y no permitirá editar controles, evidencias, hallazgos ni recomendaciones. ¿Desea continuar?',
          confirmText: 'Sí, Cerrar Auditoría',
          danger: true,
        });
        if (!ok) return;
      }

      try {
        btn.disabled = true;
        const res = await api.changeEstadoAuditoria(audit.id_auditoria, nextState);
        showToast(res?.message || `Estado actualizado a ${nextState}.`, 'success');
        const listRes = await api.getAuditorias();
        populateAuditSelector(listRes?.data || [], { ...audit, estado: nextState });
        await loadAuditoriaData(audit.id_auditoria);
      } catch (err) {
        showToast(err.message, 'error', 8000);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function bindFormSubmit() {
  if (!form) return;
  form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllFieldErrors(form);

  const values = {
    organizacion: document.getElementById('organizacion').value,
    id_auditor: document.getElementById('id_auditor').value,
    fecha_inicio: document.getElementById('fecha_inicio').value,
    fecha_fin: document.getElementById('fecha_fin').value,
    objetivo: document.getElementById('objetivo').value,
    alcance: document.getElementById('alcance').value,
    referentes: document.getElementById('referentes').value,
  };

  const { valid } = validateAuditoriaForm(values);
  if (!valid) {
    showToast('Corrija los campos marcados en rojo antes de guardar.', 'warning');
    return;
  }

  const payload = {
    ...values,
    organizacion: values.organizacion.trim(),
    objetivo: values.objetivo.trim(),
    alcance: values.alcance.trim(),
    referentes: values.referentes.trim(),
    id_auditor: Number(values.id_auditor),
  };

  try {
    btnSave.disabled = true;
    if (isNewMode) {
      const res = await api.createAuditoria(payload);
      const created = res?.data;
      showToast(res?.message || 'Auditoría creada en estado BORRADOR.', 'success');
      if (created?.id_auditoria) {
        setActiveAuditId(created.id_auditoria);
        currentAuditId = created.id_auditoria;
        isNewMode = false;
        const listRes = await api.getAuditorias();
        populateAuditSelector(listRes?.data || [], created);
        await loadAuditoriaData(created.id_auditoria);
      }
    } else {
      const res = await api.updateAuditoria(currentAuditId, payload);
      showToast(res?.message || 'Datos de auditoría actualizados.', 'success');
      const listRes = await api.getAuditorias();
      populateAuditSelector(listRes?.data || [], res?.data || currentAudit);
      await loadAuditoriaData(currentAuditId);
    }
  } catch (err) {
    if (err.field) {
      setFieldError(err.field, err.message);
    }
    showToast(err.message, 'error', 7000);
  } finally {
    btnSave.disabled = currentAudit?.estado === 'CERRADA';
  }
  });
}

if (!window.__AUDITSYS_SOFT_NAV__) {
  bootstrap();
}
