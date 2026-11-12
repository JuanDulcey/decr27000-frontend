/**
 * AuditSys Mini (DECR 27000) — Controlador de Dashboard (RF09, CP-11)
 */

import { api } from '../api.js';
import { getActiveAuditId, setActiveAuditId } from '../auth.js';
import { formatDate, formatPercent } from '../format.js';
import { icon } from '../icons.js';
import { initLayout, populateAuditSelector } from '../layout.js';
import { confirmModal, escapeHtml, renderAuditStateBadge, showToast } from '../ui.js';

let chartEstados = null;
let chartSeveridad = null;
let currentUser = null;

export async function bootstrap() {
  const ctx = await initLayout({
    activeStep: 1,
    onAuditChange: (nextId) => loadDashboard(nextId),
  });
  if (!ctx) return;

  currentUser = ctx.user;
  bindResetDemoButton();
  await loadDashboard(ctx.activeAuditId);
}

function bindResetDemoButton() {
  const btn = document.getElementById('btn-reset-demo');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const isAdminUser = currentUser?.rol === 'admin';
    const confirmed = await confirmModal({
      title: 'Restaurar Datos Demo (Empresa ABC)',
      message: isAdminUser
        ? 'Esta acción restablecerá la base de datos al estado limpio de sustentación: 93 controles ISO/IEC 27002:2022 y la auditoría completa de Empresa ABC.'
        : 'Esta acción restablecerá la base de datos de demostración al estado inicial de Empresa ABC. (Nota: en producción con backend restringido requiere perfil Administrador).',
      confirmText: 'Restaurar Datos Demo',
      danger: true,
      requirePhrase: 'RESTAURAR-EMPRESA-ABC',
    });

    if (!confirmed) return;

    try {
      btn.disabled = true;
      const res = await api.resetDemoSeed('RESTAURAR-EMPRESA-ABC');
      setActiveAuditId(1);
      showToast(res?.message || 'Datos demo restaurados correctamente.', 'success');
      const audRes = await api.getAuditorias();
      const list = audRes?.data || [];
      populateAuditSelector(list, list[0] || null);
      await loadDashboard(1);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

async function loadDashboard(idAuditoria) {
  try {
    const res = await api.getDashboard(idAuditoria || getActiveAuditId());
    const data = res?.data;
    if (!data) return;

    renderBanner(data.auditoria_activa, data.indicadores);
    renderKpis(data.indicadores);
    renderCharts(data.indicadores, data.hallazgos_por_severidad);
    renderAuditoriasTable(data.auditorias_recientes || [], data.auditoria_activa?.id_auditoria);
  } catch (err) {
    showToast(`Error al cargar el dashboard: ${err.message}`, 'error');
  }
}

function renderBanner(audit, ind) {
  const banner = document.getElementById('active-audit-banner');
  if (!banner) return;

  if (!audit) {
    banner.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold">No hay auditorías registradas</h2>
          <p class="text-sm text-slate-200 mt-1">Cree una nueva auditoría para iniciar el flujo ISO/IEC 27002:2022.</p>
        </div>
        <a href="auditoria.html?mode=new" class="btn btn-accent">+ Crear Primera Auditoría</a>
      </div>
    `;
    return;
  }

  const totalSel = ind?.total_seleccionados || 0;
  const totalEval = ind?.total_evaluados || 0;
  const pctProgress = totalSel > 0 ? Math.round((totalEval / totalSel) * 100) : 0;

  banner.innerHTML = `
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div class="space-y-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-white/15 text-[#00C6D0]">
            Auditoría Activa #${escapeHtml(audit.id_auditoria)}
          </span>
          ${renderAuditStateBadge(audit.estado)}
        </div>
        <h2 class="text-xl font-extrabold text-white">${escapeHtml(audit.organizacion)}</h2>
        <p class="text-xs sm:text-sm text-slate-200">
          Periodo: <strong>${escapeHtml(formatDate(audit.fecha_inicio))}</strong> al <strong>${escapeHtml(
    formatDate(audit.fecha_fin)
  )}</strong> · Auditor: <strong>${escapeHtml(audit.auditor_nombre || 'Asignado')}</strong>
        </p>
      </div>

      <div class="w-full lg:w-72 bg-white/10 rounded-xl p-3.5 border border-white/15">
        <div class="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span>Avance de Evaluación</span>
          <span>${totalEval} / ${totalSel} controles (${pctProgress}%)</span>
        </div>
        <div class="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div class="h-full bg-[#00C6D0] rounded-full transition-all" style="width: ${pctProgress}%"></div>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <a href="${
            totalSel < 10 ? 'catalogo.html' : 'evaluacion.html'
          }" class="btn btn-accent text-xs py-1.5 flex-1">
            ${totalSel < 10 ? 'Seleccionar Controles' : 'Ir a Evaluación'}
          </a>
          <a href="informe.html" class="btn bg-white/15 hover:bg-white/25 text-white text-xs py-1.5">
            Ver Informe
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderKpis(ind) {
  if (!ind) return;
  const baseEl = document.getElementById('kpi-cumplimiento-base');
  const baseSub = document.getElementById('kpi-cumplimiento-sub');
  const pondEl = document.getElementById('kpi-indice-ponderado');
  const pondSub = document.getElementById('kpi-indice-sub');
  const evalEl = document.getElementById('kpi-evaluados');
  const evalSub = document.getElementById('kpi-evaluados-sub');
  const hallEl = document.getElementById('kpi-hallazgos');
  const hallSub = document.getElementById('kpi-hallazgos-sub');

  if (baseEl) baseEl.textContent = formatPercent(ind.cumplimiento_base_pct);
  if (baseSub) {
    baseSub.textContent = `${ind.implementados} de ${ind.aplicables} controles aplicables implementados (${ind.no_aplicables} N/A excluido)`;
  }

  if (pondEl) pondEl.textContent = formatPercent(ind.indice_ponderado_pct);
  if (pondSub) {
    pondSub.textContent = `Reconoce el 50 % de avance en los ${ind.parciales} controles parciales`;
  }

  if (evalEl) evalEl.textContent = `${ind.total_evaluados} / ${ind.total_seleccionados}`;
  if (evalSub) {
    evalSub.textContent = `${ind.implementados} Impl. · ${ind.parciales} Parc. · ${ind.no_implementados} No Impl. · ${ind.no_aplicables} N/A`;
  }

  if (hallEl) hallEl.textContent = `${ind.total_hallazgos} Hallazgo${ind.total_hallazgos === 1 ? '' : 's'}`;
  if (hallSub) {
    hallSub.textContent = `${ind.total_recomendaciones} Recomendaciones · ${ind.total_evidencias} Evidencias`;
  }
}

function renderCharts(ind, sev) {
  const ctxEstados = document.getElementById('chart-estados');
  const ctxSev = document.getElementById('chart-severidad');

  if (typeof Chart !== 'undefined' && ctxEstados) {
    if (chartEstados) chartEstados.destroy();
    chartEstados = new Chart(ctxEstados, {
      type: 'doughnut',
      data: {
        labels: ['Implementado', 'Parcial', 'No implementado', 'No aplicable', 'Pendiente'],
        datasets: [
          {
            data: [
              ind.implementados || 0,
              ind.parciales || 0,
              ind.no_implementados || 0,
              ind.no_aplicables || 0,
              ind.pendientes || 0,
            ],
            backgroundColor: ['#2E9E5B', '#F2A900', '#D64545', '#8A98A3', '#CBD5E1'],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        },
      },
    });
  }

  if (typeof Chart !== 'undefined' && ctxSev) {
    if (chartSeveridad) chartSeveridad.destroy();
    const alta = sev?.ALTA || 0;
    const media = sev?.MEDIA || 0;
    const baja = sev?.BAJA || 0;
    chartSeveridad = new Chart(ctxSev, {
      type: 'bar',
      data: {
        labels: ['Severidad Alta', 'Severidad Media', 'Severidad Baja'],
        datasets: [
          {
            label: 'Hallazgos',
            data: [alta, media, baja],
            backgroundColor: ['#D64545', '#F2A900', '#2E9E5B'],
            borderRadius: 6,
            barThickness: 38,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
        },
      },
    });
  }

  // Tablas accesibles alternativas (F3.1)
  const fallbackEstados = document.getElementById('table-estados-fallback');
  if (fallbackEstados) {
    fallbackEstados.innerHTML = `
      <table class="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
        <thead class="bg-slate-50 text-slate-600">
          <tr>
            <th class="px-3 py-2">Estado</th>
            <th class="px-3 py-2 text-right">Cantidad</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr><td class="px-3 py-1.5 font-medium text-[#2E9E5B] inline-flex items-center gap-1.5">${icon('check', 'w-3.5 h-3.5')} Implementado</td><td class="px-3 py-1.5 text-right font-bold">${ind.implementados}</td></tr>
          <tr><td class="px-3 py-1.5 font-medium text-amber-700 inline-flex items-center gap-1.5">${icon('circleHalf', 'w-3.5 h-3.5')} Parcial</td><td class="px-3 py-1.5 text-right font-bold">${ind.parciales}</td></tr>
          <tr><td class="px-3 py-1.5 font-medium text-[#D64545] inline-flex items-center gap-1.5">${icon('x', 'w-3.5 h-3.5')} No implementado</td><td class="px-3 py-1.5 text-right font-bold">${ind.no_implementados}</td></tr>
          <tr><td class="px-3 py-1.5 font-medium text-slate-600 inline-flex items-center gap-1.5">${icon('minus', 'w-3.5 h-3.5')} No aplicable (excluido)</td><td class="px-3 py-1.5 text-right font-bold">${ind.no_aplicables}</td></tr>
          <tr><td class="px-3 py-1.5 font-medium text-slate-500 inline-flex items-center gap-1.5">${icon('circle', 'w-3.5 h-3.5')} Pendiente de evaluar</td><td class="px-3 py-1.5 text-right font-bold">${ind.pendientes}</td></tr>
        </tbody>
      </table>
    `;
  }

  const fallbackSev = document.getElementById('table-severidad-fallback');
  if (fallbackSev) {
    fallbackSev.innerHTML = `
      <table class="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
        <thead class="bg-slate-50 text-slate-600">
          <tr>
            <th class="px-3 py-2">Criticidad</th>
            <th class="px-3 py-2 text-right">Hallazgos</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr><td class="px-3 py-1.5 font-medium text-[#D64545] inline-flex items-center gap-1.5">${icon('arrowUp', 'w-3.5 h-3.5')} Severidad Alta</td><td class="px-3 py-1.5 text-right font-bold">${sev?.ALTA || 0}</td></tr>
          <tr><td class="px-3 py-1.5 font-medium text-amber-700 inline-flex items-center gap-1.5">${icon('diamond', 'w-3.5 h-3.5')} Severidad Media</td><td class="px-3 py-1.5 text-right font-bold">${sev?.MEDIA || 0}</td></tr>
          <tr><td class="px-3 py-1.5 font-medium text-[#2E9E5B] inline-flex items-center gap-1.5">${icon('arrowDown', 'w-3.5 h-3.5')} Severidad Baja</td><td class="px-3 py-1.5 text-right font-bold">${sev?.BAJA || 0}</td></tr>
        </tbody>
      </table>
    `;
  }
}

function renderAuditoriasTable(auditorias, activeId) {
  const container = document.getElementById('auditorias-table-container');
  if (!container) return;

  if (!auditorias || auditorias.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-sm text-slate-500">No existen auditorías registradas.</div>`;
    return;
  }

  const rowsHtml = auditorias
    .map((a) => {
      const isCurrent = a.id_auditoria === activeId;
      return `
        <tr class="${isCurrent ? 'bg-[#e0f9fa]/35' : 'hover:bg-slate-50'}">
          <td class="px-4 py-3 font-bold text-[#003366]">#${escapeHtml(a.id_auditoria)}</td>
          <td class="px-4 py-3">
            <div class="font-bold text-slate-900">${escapeHtml(a.organizacion)}</div>
            <div class="text-xs text-slate-500">${escapeHtml(a.auditor_nombre || 'Auditor')}</div>
          </td>
          <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
            ${escapeHtml(formatDate(a.fecha_inicio))} – ${escapeHtml(formatDate(a.fecha_fin))}
          </td>
          <td class="px-4 py-3 text-center font-semibold">${escapeHtml(a.total_controles ?? 0)}</td>
          <td class="px-4 py-3 text-right font-bold text-[#003366]">${escapeHtml(
            formatPercent(a.cumplimiento_base_pct ?? 0)
          )}</td>
          <td class="px-4 py-3 text-center font-semibold">${escapeHtml(a.total_hallazgos ?? 0)}</td>
          <td class="px-4 py-3">${renderAuditStateBadge(a.estado)}</td>
          <td class="px-4 py-3">
            <div class="flex flex-wrap gap-1.5 justify-end">
              <button type="button" data-select-audit="${escapeHtml(a.id_auditoria)}"
                class="btn btn-outline text-xs py-1 px-2.5 ${isCurrent ? 'border-[#003366]' : ''}">
                ${isCurrent ? 'Activa' : 'Seleccionar'}
              </button>
              <a href="auditoria.html?id=${escapeHtml(a.id_auditoria)}" class="btn btn-ghost text-xs py-1 px-2.5">
                Editar
              </a>
              <a href="informe.html?id=${escapeHtml(a.id_auditoria)}" class="btn btn-primary text-xs py-1 px-2.5">
                Informe
              </a>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `
    <table class="w-full text-sm text-left">
      <thead class="bg-slate-50 text-xs uppercase text-slate-600 border-b border-slate-200">
        <tr>
          <th class="px-4 py-3">ID</th>
          <th class="px-4 py-3">Organización / Auditor</th>
          <th class="px-4 py-3">Fechas</th>
          <th class="px-4 py-3 text-center">Controles</th>
          <th class="px-4 py-3 text-right">Cumpl. Base</th>
          <th class="px-4 py-3 text-center">Hallazgos</th>
          <th class="px-4 py-3">Estado</th>
          <th class="px-4 py-3 text-right">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200">
        ${rowsHtml}
      </tbody>
    </table>
  `;

  container.querySelectorAll('[data-select-audit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.getAttribute('data-select-audit'));
      setActiveAuditId(id);
      const selector = document.getElementById('global-audit-selector');
      if (selector) selector.value = String(id);
      await loadDashboard(id);
      showToast(`Auditoría #${id} seleccionada como activa.`, 'info');
    });
  });
}

if (!window.__AUDITSYS_SOFT_NAV__) {
  bootstrap();
}
