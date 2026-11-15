/**
 * AuditSys SGSI (DECR 27000) — Controlador del Centro de Administración
 */

import { api } from '../api.js';
import { setActiveAuditId } from '../auth.js';
import { OFFICIAL_REFERENTES } from '../config.js';
import { formatDate } from '../format.js';
import { icon } from '../icons.js';
import { initLayout, navigateTo, populateAuditSelector } from '../layout.js';
import {
  closeModal,
  confirmModal,
  escapeHtml,
  openModal,
  renderAuditStateBadge,
  showToast,
} from '../ui.js';
import { attachLiveValidationClear, clearAllFieldErrors, setFieldError } from '../validators.js';

let currentUser = null;
let usersList = [];
let auditsList = [];

export async function bootstrap() {
  const ctx = await initLayout({
    activeStep: 'admin',
    onAuditChange: async () => {
      await loadAdminData();
    },
  });
  if (!ctx) return;

  currentUser = ctx.user;

  if (currentUser?.rol !== 'admin') {
    document.getElementById('admin-main-content')?.classList.add('hidden');
    const guard = document.getElementById('admin-access-guard');
    if (guard) {
      guard.classList.remove('hidden');
      guard.innerHTML = `
        <div class="card p-8 text-center space-y-3 border-amber-300 bg-amber-50/70">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto">
            ${icon('lock', 'w-6 h-6')}
          </div>
          <h2 class="text-lg font-extrabold text-slate-900">Acceso Restringido</h2>
          <p class="text-sm text-slate-600 max-w-md mx-auto">
            El Centro de Administración está disponible únicamente para usuarios con rol <strong>Administrador SGSI</strong>.
          </p>
          <a href="dashboard.html" class="btn btn-primary text-xs">Volver al Resumen Ejecutivo</a>
        </div>
      `;
    }
    return;
  }

  bindAdminModals();
  await loadAdminData();
}

async function loadAdminData() {
  const errorBanner = document.getElementById('admin-error-banner');
  if (errorBanner) {
    errorBanner.classList.add('hidden');
    errorBanner.innerHTML = '';
  }

  try {
    const [usersRes, auditsRes] = await Promise.all([api.getUsuarios(), api.getAuditorias()]);
    usersList = Array.isArray(usersRes?.data) ? usersRes.data : [];
    auditsList = Array.isArray(auditsRes?.data) ? auditsRes.data : [];

    populateAuditSelector(auditsList, null);
    renderAdminKpis();
    renderUsersTable();
    renderAuditsTable();
  } catch (err) {
    if (errorBanner) {
      errorBanner.classList.remove('hidden');
      errorBanner.innerHTML = `
        <div class="card p-4 border-[#D64545] bg-[#fbecec]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="text-xs font-semibold text-[#7f1d1d]">
            No se pudo cargar la información administrativa: ${escapeHtml(err.message)}
          </div>
          <button type="button" id="btn-retry-admin" class="btn btn-primary text-xs shrink-0">
            ${icon('rotateCcw', 'w-3.5 h-3.5')} Reintentar
          </button>
        </div>
      `;
      document.getElementById('btn-retry-admin')?.addEventListener('click', loadAdminData);
    }
    showToast(`Error al cargar administración: ${err.message}`, 'error');
  }
}

function renderAdminKpis() {
  const auditores = usersList.filter((u) => u.rol === 'auditor').length;
  const admins = usersList.filter((u) => u.rol === 'admin').length;
  const activas = auditsList.filter((a) => a.estado !== 'CERRADA').length;

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };
  setText('admin-kpi-auditores', auditores);
  setText('admin-kpi-admins', admins);
  setText('admin-kpi-auditorias', auditsList.length);
  setText('admin-kpi-activas', activas);
}

function renderUsersTable() {
  const container = document.getElementById('admin-users-container');
  if (!container) return;

  if (usersList.length === 0) {
    container.innerHTML = '<div class="p-6 text-center text-sm text-slate-500">No hay usuarios registrados.</div>';
    return;
  }

  const rows = usersList
    .map((u) => {
      const isSelf = u.id_usuario === currentUser?.id_usuario;
      const rolePill =
        u.rol === 'admin'
          ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0F172A] text-white">ADMIN</span>'
          : '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">AUDITOR</span>';

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
          <td class="px-4 py-3">
            <div class="font-bold text-slate-900 text-sm">${escapeHtml(u.nombre)}</div>
            ${isSelf ? '<span class="text-[10px] font-semibold text-[#007BFF]">Sesión actual</span>' : ''}
          </td>
          <td class="px-4 py-3 text-xs text-slate-600 font-mono">${escapeHtml(u.correo)}</td>
          <td class="px-4 py-3">${rolePill}</td>
          <td class="px-4 py-3 text-xs font-semibold text-slate-700 tabular-nums">${u.auditorias_asignadas ?? 0}</td>
          <td class="px-4 py-3">
            <div class="flex flex-wrap gap-1.5">
              <button type="button" data-edit-user="${u.id_usuario}" class="btn btn-outline text-xs py-1 px-2.5 min-h-[36px]">
                ${icon('edit', 'w-3.5 h-3.5')} Editar
              </button>
              <button type="button" data-pass-user="${u.id_usuario}" class="btn btn-outline text-xs py-1 px-2.5 min-h-[36px]">
                ${icon('key', 'w-3.5 h-3.5')} Clave
              </button>
              ${
                isSelf
                  ? ''
                  : `<button type="button" data-del-user="${u.id_usuario}" class="btn btn-outline text-xs py-1 px-2.5 min-h-[36px] text-[#D64545] hover:bg-[#fbecec] hover:border-[#D64545]">
                      ${icon('trash', 'w-3.5 h-3.5')} Eliminar
                    </button>`
              }
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <th class="px-4 py-3">Nombre</th>
          <th class="px-4 py-3">Correo institucional</th>
          <th class="px-4 py-3">Rol</th>
          <th class="px-4 py-3">Auditorías</th>
          <th class="px-4 py-3">Acciones</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  container.querySelectorAll('[data-edit-user]').forEach((btn) => {
    btn.addEventListener('click', () => openEditUserModal(Number(btn.getAttribute('data-edit-user'))));
  });
  container.querySelectorAll('[data-pass-user]').forEach((btn) => {
    btn.addEventListener('click', () => openPasswordModal(Number(btn.getAttribute('data-pass-user'))));
  });
  container.querySelectorAll('[data-del-user]').forEach((btn) => {
    btn.addEventListener('click', () => handleDeleteUser(Number(btn.getAttribute('data-del-user'))));
  });
}

function renderAuditsTable() {
  const container = document.getElementById('admin-audits-container');
  if (!container) return;

  if (auditsList.length === 0) {
    container.innerHTML = '<div class="p-6 text-center text-sm text-slate-500">Aún no hay auditorías creadas.</div>';
    return;
  }

  const rows = auditsList
    .map((a) => {
      const isClosed = a.estado === 'CERRADA';
      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
          <td class="px-4 py-3">
            <div class="font-bold text-slate-900 text-sm">${escapeHtml(a.organizacion)}</div>
            <div class="text-[11px] text-slate-500">${escapeHtml(formatDate(a.fecha_inicio))} → ${escapeHtml(formatDate(a.fecha_fin))}</div>
          </td>
          <td class="px-4 py-3 text-xs font-semibold text-slate-700">${escapeHtml(a.auditor_nombre || 'Sin asignar')}</td>
          <td class="px-4 py-3">${renderAuditStateBadge(a.estado)}</td>
          <td class="px-4 py-3 text-xs text-slate-600 tabular-nums">${a.controles_evaluados ?? 0} / ${a.total_controles ?? 0}</td>
          <td class="px-4 py-3">
            <div class="flex flex-wrap gap-1.5">
              ${
                isClosed
                  ? ''
                  : `<button type="button" data-reassign-audit="${a.id_auditoria}" class="btn btn-outline text-xs py-1 px-2.5 min-h-[36px]">
                      ${icon('userCheck', 'w-3.5 h-3.5')} Reasignar
                    </button>`
              }
              <button type="button" data-open-audit="${a.id_auditoria}" class="btn btn-primary text-xs py-1 px-2.5 min-h-[36px]">
                Abrir
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <th class="px-4 py-3">Organización y Periodo</th>
          <th class="px-4 py-3">Auditor Responsable</th>
          <th class="px-4 py-3">Estado</th>
          <th class="px-4 py-3">Controles</th>
          <th class="px-4 py-3">Acciones</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  container.querySelectorAll('[data-reassign-audit]').forEach((btn) => {
    btn.addEventListener('click', () => openReassignModal(Number(btn.getAttribute('data-reassign-audit'))));
  });
  container.querySelectorAll('[data-open-audit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-open-audit'));
      setActiveAuditId(id);
      navigateTo('dashboard.html');
    });
  });
}

function populateUserSelect(selectId, selectedId = null) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">Seleccione un responsable...</option>';
  for (const u of usersList) {
    const opt = document.createElement('option');
    opt.value = String(u.id_usuario);
    opt.textContent = `${u.nombre} (${u.rol})`;
    if (selectedId && Number(selectedId) === u.id_usuario) opt.selected = true;
    select.appendChild(opt);
  }
}

function openCreateUserModal() {
  const modal = document.getElementById('admin-user-modal');
  const form = document.getElementById('admin-user-form');
  clearAllFieldErrors(form);
  form?.reset();
  document.getElementById('admin-user-id').value = '';
  document.getElementById('admin-user-modal-title').textContent = 'Nuevo Auditor / Usuario';
  document.getElementById('admin-user-alert')?.classList.add('hidden');
  document.getElementById('u-password-group')?.classList.remove('hidden');
  document.getElementById('u-rol').value = 'auditor';
  openModal(modal, '#u-nombre');
}

function openEditUserModal(idUsuario) {
  const user = usersList.find((u) => u.id_usuario === idUsuario);
  if (!user) return;
  const modal = document.getElementById('admin-user-modal');
  const form = document.getElementById('admin-user-form');
  clearAllFieldErrors(form);
  document.getElementById('admin-user-id').value = String(user.id_usuario);
  document.getElementById('admin-user-modal-title').textContent = `Editar Usuario — ${user.nombre}`;
  document.getElementById('admin-user-alert')?.classList.add('hidden');
  document.getElementById('u-nombre').value = user.nombre || '';
  document.getElementById('u-correo').value = user.correo || '';
  document.getElementById('u-rol').value = user.rol || 'auditor';
  document.getElementById('u-password-group')?.classList.add('hidden');
  openModal(modal, '#u-nombre');
}

function openPasswordModal(idUsuario) {
  const user = usersList.find((u) => u.id_usuario === idUsuario);
  if (!user) return;
  const modal = document.getElementById('admin-password-modal');
  const form = document.getElementById('admin-pass-form');
  clearAllFieldErrors(form);
  form?.reset();
  document.getElementById('admin-pass-user-id').value = String(user.id_usuario);
  document.getElementById('admin-pass-subtitle').textContent = `Defina una nueva contraseña para ${user.nombre} (${user.correo}).`;
  openModal(modal, '#u-new-password');
}

async function handleDeleteUser(idUsuario) {
  const user = usersList.find((u) => u.id_usuario === idUsuario);
  if (!user) return;
  const ok = await confirmModal({
    title: 'Eliminar Usuario',
    message: `¿Desea eliminar permanentemente a "${user.nombre}" (${user.correo})? Esta acción solo procede si no tiene auditorías asignadas.`,
    confirmText: 'Sí, eliminar',
    danger: true,
  });
  if (!ok) return;

  try {
    const res = await api.deleteUsuario(idUsuario);
    showToast(res?.message || 'Usuario eliminado correctamente.', 'success');
    await loadAdminData();
  } catch (err) {
    showToast(err.message, 'error', 7000);
  }
}

function openNewAuditModal() {
  const modal = document.getElementById('admin-audit-modal');
  const form = document.getElementById('admin-audit-form');
  clearAllFieldErrors(form);
  form?.reset();
  populateUserSelect('aa-auditor');
  const today = new Date().toISOString().slice(0, 10);
  const nextTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  document.getElementById('aa-inicio').value = today;
  document.getElementById('aa-fin').value = nextTwoWeeks;
  document.getElementById('aa-referentes').value = OFFICIAL_REFERENTES;
  openModal(modal, '#aa-organizacion');
}

function openReassignModal(idAuditoria) {
  const audit = auditsList.find((a) => a.id_auditoria === idAuditoria);
  if (!audit) return;
  const modal = document.getElementById('admin-reassign-modal');
  document.getElementById('reassign-audit-id').value = String(audit.id_auditoria);
  document.getElementById('reassign-audit-label').textContent = `Auditoría: ${audit.organizacion} (Actual: ${audit.auditor_nombre || 'Sin asignar'})`;
  populateUserSelect('reassign-auditor-select', audit.id_auditor);
  openModal(modal, '#reassign-auditor-select');
}

function bindAdminModals() {
  document.getElementById('btn-new-user')?.addEventListener('click', openCreateUserModal);
  document.getElementById('btn-new-audit-admin')?.addEventListener('click', openNewAuditModal);

  // Modal Usuario
  const userModal = document.getElementById('admin-user-modal');
  const userForm = document.getElementById('admin-user-form');
  if (userForm) attachLiveValidationClear(userForm);
  document.getElementById('admin-user-close')?.addEventListener('click', () => closeModal(userModal));
  document.getElementById('admin-user-cancel')?.addEventListener('click', () => closeModal(userModal));

  userForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors(userForm);
    const idRaw = document.getElementById('admin-user-id').value;
    const isEdit = Boolean(idRaw);
    const nombre = document.getElementById('u-nombre').value.trim();
    const correo = document.getElementById('u-correo').value.trim().toLowerCase();
    const rol = document.getElementById('u-rol').value;
    const password = document.getElementById('u-password').value;

    let valid = true;
    if (!nombre) {
      setFieldError('u-nombre', 'El nombre completo es obligatorio.');
      valid = false;
    }
    if (!correo || !correo.includes('@')) {
      setFieldError('u-correo', 'Ingrese un correo electrónico válido.');
      valid = false;
    }
    if (!isEdit && (!password || password.length < 8)) {
      setFieldError('u-password', 'La contraseña debe tener al menos 8 caracteres.');
      valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('admin-user-save');
    btn.disabled = true;
    try {
      const res = isEdit
        ? await api.updateUsuario(Number(idRaw), { nombre, correo, rol })
        : await api.createUsuario({ nombre, correo, password, rol });
      showToast(res?.message || 'Usuario guardado correctamente.', 'success');
      closeModal(userModal);
      await loadAdminData();
    } catch (err) {
      if (err.field === 'correo') setFieldError('u-correo', err.message);
      else showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // Modal Password
  const passModal = document.getElementById('admin-password-modal');
  const passForm = document.getElementById('admin-pass-form');
  if (passForm) attachLiveValidationClear(passForm);
  document.getElementById('admin-pass-close')?.addEventListener('click', () => closeModal(passModal));
  document.getElementById('admin-pass-cancel')?.addEventListener('click', () => closeModal(passModal));

  passForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors(passForm);
    const idUser = Number(document.getElementById('admin-pass-user-id').value);
    const password = document.getElementById('u-new-password').value;
    if (!password || password.length < 8) {
      setFieldError('u-new-password', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    const btn = document.getElementById('admin-pass-save');
    btn.disabled = true;
    try {
      const res = await api.resetUsuarioPassword(idUser, password);
      showToast(res?.message || 'Contraseña actualizada.', 'success');
      closeModal(passModal);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // Modal Crear Auditoría
  const auditModal = document.getElementById('admin-audit-modal');
  const auditForm = document.getElementById('admin-audit-form');
  if (auditForm) attachLiveValidationClear(auditForm);
  document.getElementById('admin-audit-close')?.addEventListener('click', () => closeModal(auditModal));
  document.getElementById('admin-audit-cancel')?.addEventListener('click', () => closeModal(auditModal));

  auditForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors(auditForm);
    const organizacion = document.getElementById('aa-organizacion').value.trim();
    const id_auditor = Number(document.getElementById('aa-auditor').value);
    const fecha_inicio = document.getElementById('aa-inicio').value;
    const fecha_fin = document.getElementById('aa-fin').value;
    const objetivo = document.getElementById('aa-objetivo').value.trim();
    const alcance = document.getElementById('aa-alcance').value.trim();
    const referentes = document.getElementById('aa-referentes').value.trim() || OFFICIAL_REFERENTES;

    let valid = true;
    if (!organizacion) {
      setFieldError('aa-organizacion', 'La organización es obligatoria.');
      valid = false;
    }
    if (!id_auditor) {
      setFieldError('aa-auditor', 'Seleccione el auditor responsable.');
      valid = false;
    }
    if (!fecha_inicio) {
      setFieldError('aa-inicio', 'La fecha de inicio es obligatoria.');
      valid = false;
    }
    if (!fecha_fin || (fecha_inicio && fecha_fin < fecha_inicio)) {
      setFieldError('aa-fin', 'La fecha de cierre debe ser igual o posterior a la de inicio.');
      valid = false;
    }
    if (!objetivo) {
      setFieldError('aa-objetivo', 'El objetivo es obligatorio.');
      valid = false;
    }
    if (!alcance) {
      setFieldError('aa-alcance', 'El alcance es obligatorio.');
      valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('admin-audit-save');
    btn.disabled = true;
    try {
      const res = await api.createAuditoria({
        organizacion,
        id_auditor,
        fecha_inicio,
        fecha_fin,
        objetivo,
        alcance,
        referentes,
      });
      if (res?.data?.id_auditoria) setActiveAuditId(res.data.id_auditoria);
      showToast(res?.message || 'Auditoría creada y asignada correctamente.', 'success');
      closeModal(auditModal);
      await loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // Modal Reasignar Auditor
  const reassignModal = document.getElementById('admin-reassign-modal');
  const reassignForm = document.getElementById('admin-reassign-form');
  document.getElementById('admin-reassign-close')?.addEventListener('click', () => closeModal(reassignModal));
  document.getElementById('admin-reassign-cancel')?.addEventListener('click', () => closeModal(reassignModal));

  reassignForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idAud = Number(document.getElementById('reassign-audit-id').value);
    const id_auditor = Number(document.getElementById('reassign-auditor-select').value);
    const existing = auditsList.find((a) => a.id_auditoria === idAud);
    if (!existing || !id_auditor) return;

    const btn = document.getElementById('admin-reassign-save');
    btn.disabled = true;
    try {
      await api.updateAuditoria(idAud, {
        organizacion: existing.organizacion,
        objetivo: existing.objetivo,
        alcance: existing.alcance,
        fecha_inicio: String(existing.fecha_inicio).slice(0, 10),
        fecha_fin: String(existing.fecha_fin).slice(0, 10),
        referentes: existing.referentes || OFFICIAL_REFERENTES,
        id_auditor,
      });
      showToast('Auditor responsable reasignado correctamente.', 'success');
      closeModal(reassignModal);
      await loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

if (!window.__AUDITSYS_SOFT_NAV__) {
  bootstrap();
}
