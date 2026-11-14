/**
 * AuditSys SGSI — Controlador de Informe Consolidado y Exportación PDF
 */

import { api } from '../api.js';
import { OFFICIAL_REFERENTES } from '../config.js';
import { formatDate, formatDateTime, formatPercent } from '../format.js';
import { initLayout } from '../layout.js';
import {
  escapeHtml,
  renderCategoryBadge,
  renderControlStateChip,
  renderSeverityBadge,
  showToast,
} from '../ui.js';

let activeAuditId = null;
let liveReportData = null;

export async function bootstrap() {
  const ctx = await initLayout({
    activeStep: 6,
    onAuditChange: async (nextId) => {
      activeAuditId = nextId;
      await loadInforme();
    },
  });
  if (!ctx) return;

  activeAuditId = ctx.activeAuditId;
  bindActions();
  await loadInforme();
}

function bindActions() {
  document.getElementById('btn-print-pdf')?.addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btn-download-html2pdf')?.addEventListener('click', () => {
    const el = document.getElementById('report-document');
    if (!el || typeof html2pdf === 'undefined') {
      window.print();
      return;
    }
    const org = (liveReportData?.datos_auditoria?.organizacion || 'Auditoria')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 32);
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Informe_AuditSys_${org}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
    };
    showToast('Generando archivo PDF...', 'info');
    html2pdf().set(opt).from(el).save();
  });

  document.getElementById('btn-generate-version')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-generate-version');
    try {
      btn.disabled = true;
      const res = await api.generateInforme(activeAuditId);
      showToast(res?.message || 'Nueva versión del informe guardada en BD.', 'success');
      await loadInforme();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('version-selector')?.addEventListener('change', async (e) => {
    const val = e.target.value;
    if (val === 'live') {
      renderReportDocument(liveReportData);
      return;
    }
    const ver = (liveReportData?.versiones || []).find((v) => String(v.id_informe) === val);
    if (ver && ver.snapshot_json) {
      renderReportDocument(ver.snapshot_json);
      showToast(`Visualizando versión congelada v${ver.version}`, 'info');
      return;
    }
    try {
      const res = await api.getInformeById(val);
      const fetched = res?.data;
      if (fetched?.snapshot_json) {
        renderReportDocument(fetched.snapshot_json);
        showToast(`Visualizando versión congelada v${fetched.version}`, 'info');
        return;
      }
    } catch (err) {
      showToast(`No se pudo cargar la versión histórica: ${err.message}`, 'error');
    }
    renderReportDocument(liveReportData);
  });

  document.querySelectorAll('#section-toggles [data-sec]').forEach((chk) => {
    chk.addEventListener('change', () => {
      const secId = chk.getAttribute('data-sec');
      const secEl = document.getElementById(secId);
      if (secEl) secEl.classList.toggle('hidden', !chk.checked);
    });
  });
}

async function loadInforme() {
  try {
    const res = await api.getInformes(activeAuditId);
    liveReportData = res?.data;
    if (!liveReportData) return;

    populateVersionSelector(liveReportData.versiones || []);
    renderReportDocument(liveReportData);
  } catch (err) {
    showToast(`Error al cargar el informe: ${err.message}`, 'error');
  }
}

function populateVersionSelector(versiones) {
  const select = document.getElementById('version-selector');
  if (!select) return;
  select.innerHTML = '<option value="live">Datos en tiempo real (En vivo)</option>';
  for (const v of versiones) {
    const opt = document.createElement('option');
    opt.value = String(v.id_informe);
    opt.textContent = `Versión v${v.version} — ${formatDateTime(v.fecha_generacion)} (${formatPercent(
      v.cumplimiento_base
    )})`;
    select.appendChild(opt);
  }
}

function renderReportDocument(data) {
  const container = document.getElementById('report-document');
  if (!container || !data) return;

  const aud = data.datos_auditoria || {};
  const ind = data.resultados_indicadores || {};
  const alcance = data.alcance_criterios || [];
  const evaluaciones = data.evaluacion_por_control || [];
  const hallazgos = data.hallazgos || [];
  const recomendaciones = data.recomendaciones || [];
  const evidencias = data.anexo_evidencias || [];

  const formulaBase =
    ind.formula_base ||
    `(${ind.implementados || 0} / ${ind.aplicables || 0}) × 100 = ${formatPercent(
      ind.cumplimiento_base_pct || 0
    )}`;
  const formulaPond =
    ind.formula_ponderada ||
    `((${ind.implementados || 0} × 1.0 + ${ind.parciales || 0} × 0.5) / ${
      ind.aplicables || 0
    }) × 100 = ${formatPercent(ind.indice_ponderado_pct || 0)}`;

  const sealConfig =
    aud.estado === 'CERRADA'
      ? {
          label: 'INFORME DEFINITIVO CERRADO',
          sublabel: 'Validez Oficial · Registro Inmutable',
          cls: 'border-[#1F8A4D] bg-[#e9f6ee] text-[#14532d]',
        }
      : aud.estado === 'EN_REVISION'
        ? {
            label: 'EN REVISIÓN TÉCNICA',
            sublabel: 'Documento Preliminar Sujeto a Aprobación',
            cls: 'border-[#D9822B] bg-[#fdf3e7] text-[#7c2d12]',
          }
        : {
            label: 'DOCUMENTO EN BORRADOR',
            sublabel: 'Auditoría en Ejecución · No Definitivo',
            cls: 'border-slate-400 bg-slate-100 text-slate-700',
          };

  container.innerHTML = `
    <!-- Portada / Cabecera Institucional del Informe -->
    <header class="border-b-4 border-[#003366] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="text-xs font-bold uppercase tracking-widest text-[#00C6D0] mb-1">
          AuditSys SGSI · Informe Consolidado de Auditoría
        </div>
        <h2 class="text-2xl font-extrabold text-[#003366]">${escapeHtml(
          aud.organizacion || 'Organización Auditada'
        )}</h2>
        <p class="text-xs text-slate-600 mt-1">
          Referentes: <strong>${escapeHtml(aud.referentes || OFFICIAL_REFERENTES)}</strong>
        </p>
      </div>
      <div class="text-left sm:text-right space-y-1.5 text-xs">
        <div class="inline-block border-2 ${sealConfig.cls} px-3 py-1.5 rounded-md text-center" style="-webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <div class="font-extrabold tracking-wider text-[11px] uppercase">${sealConfig.label}</div>
          <div class="text-[10px] font-medium opacity-85">${sealConfig.sublabel}</div>
        </div>
        <div class="text-slate-600 font-semibold">
          Versión: <span class="text-[#003366]">v${escapeHtml(data.version_actual || 1)}</span>
        </div>
        <div class="text-slate-500">Generado: ${escapeHtml(formatDateTime(data.fecha_generacion))}</div>
      </div>
    </header>

    <!-- Sección 1 — Datos Generales de la Auditoría -->
    <section id="sec-1" class="space-y-3 print-break-inside-avoid">
      <h3 class="text-base font-extrabold text-[#003366] border-b border-slate-200 pb-1">
        1. Datos Generales de la Auditoría
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span class="text-slate-500 block text-xs">Organización Auditada</span>
          <strong class="text-slate-900">${escapeHtml(aud.organizacion)}</strong>
        </div>
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span class="text-slate-500 block text-xs">Auditor Líder Responsable</span>
          <strong class="text-slate-900">${escapeHtml(aud.auditor_nombre || 'Auditor Líder')}</strong>
        </div>
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span class="text-slate-500 block text-xs">Periodo de Auditoría</span>
          <strong class="text-slate-900">${escapeHtml(formatDate(aud.fecha_inicio))} al ${escapeHtml(
    formatDate(aud.fecha_fin)
  )}</strong>
        </div>
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span class="text-slate-500 block text-xs">Referentes Normativos</span>
          <strong class="text-slate-900">${escapeHtml(aud.referentes || OFFICIAL_REFERENTES)}</strong>
        </div>
      </div>
      <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs sm:text-sm space-y-2">
        <div><strong class="text-[#003366]">Objetivo:</strong> ${escapeHtml(aud.objetivo)}</div>
        <div><strong class="text-[#003366]">Alcance:</strong> ${escapeHtml(aud.alcance)}</div>
      </div>
    </section>

    <!-- Sección 2 — Alcance y Criterios Evaluados -->
    <section id="sec-2" class="space-y-3">
      <h3 class="text-base font-extrabold text-[#003366] border-b border-slate-200 pb-1">
        2. Alcance y Criterios Evaluados (${alcance.length} controles ISO/IEC 27002:2022)
      </h3>
      <div class="table-responsive">
        <table class="w-full text-xs text-left border border-slate-200">
          <thead class="bg-[#003366] text-white">
            <tr>
              <th class="px-3 py-2">ISO</th>
              <th class="px-3 py-2">Categoría</th>
              <th class="px-3 py-2">Control</th>
              <th class="px-3 py-2">Criterio Normativo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            ${alcance
              .map(
                (c) => `
              <tr>
                <td class="px-3 py-2 font-mono font-bold text-[#003366]">${escapeHtml(c.codigo_iso)}</td>
                <td class="px-3 py-2">${renderCategoryBadge(c.categoria)}</td>
                <td class="px-3 py-2 font-semibold text-slate-900">${escapeHtml(c.nombre)}</td>
                <td class="px-3 py-2 text-slate-700">${escapeHtml(c.criterio)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Sección 3 — Resultados e Indicadores de Cumplimiento -->
    <section id="sec-3" class="space-y-4 print-break-inside-avoid">
      <h3 class="text-base font-extrabold text-[#003366] border-b border-slate-200 pb-1">
        3. Resultados e Indicadores de Cumplimiento
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 rounded-xl bg-[#e6eef5] border border-[#003366]/20 space-y-1">
          <div class="text-xs font-bold uppercase text-[#003366]">Indicador Base de Cumplimiento</div>
          <div class="text-3xl font-extrabold text-[#003366]">${escapeHtml(
            formatPercent(ind.cumplimiento_base_pct)
          )}</div>
          <div class="text-xs font-mono text-slate-700 bg-white px-2.5 py-1.5 rounded border border-slate-200">
            Fórmula: ${escapeHtml(formulaBase)}
          </div>
        </div>

        <div class="p-4 rounded-xl bg-[#e0f9fa] border border-[#00C6D0] space-y-1">
          <div class="text-xs font-bold uppercase text-[#003366]">Índice Ponderado de Avance</div>
          <div class="text-3xl font-extrabold text-[#003366]">${escapeHtml(
            formatPercent(ind.indice_ponderado_pct)
          )}</div>
          <div class="text-xs font-mono text-slate-700 bg-white px-2.5 py-1.5 rounded border border-slate-200">
            Fórmula: ${escapeHtml(formulaPond)}
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="w-full text-xs text-center border border-slate-200">
          <thead class="bg-slate-100 text-slate-700">
            <tr>
              <th class="px-3 py-2">Seleccionados</th>
              <th class="px-3 py-2 text-[#2E9E5B]">Implementados</th>
              <th class="px-3 py-2 text-amber-700">Parciales</th>
              <th class="px-3 py-2 text-[#D64545]">No implementados</th>
              <th class="px-3 py-2 text-slate-600">No aplicables (Excluidos)</th>
              <th class="px-3 py-2 text-[#003366]">Total Aplicables</th>
            </tr>
          </thead>
          <tbody>
            <tr class="font-extrabold text-sm">
              <td class="px-3 py-2">${escapeHtml(ind.total_seleccionados)}</td>
              <td class="px-3 py-2 text-[#2E9E5B]">${escapeHtml(ind.implementados)}</td>
              <td class="px-3 py-2 text-amber-700">${escapeHtml(ind.parciales)}</td>
              <td class="px-3 py-2 text-[#D64545]">${escapeHtml(ind.no_implementados)}</td>
              <td class="px-3 py-2 text-slate-600">${escapeHtml(ind.no_aplicables)}</td>
              <td class="px-3 py-2 text-[#003366]">${escapeHtml(ind.aplicables)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="p-4 rounded-lg bg-slate-50 border-l-4 border-l-[#003366] text-xs sm:text-sm text-slate-800 leading-relaxed">
        <strong class="block text-[#003366] mb-1">Resumen Ejecutivo:</strong>
        ${escapeHtml(ind.resumen_ejecutivo)}
      </div>
    </section>

    <!-- Sección 4 — Evaluación Detallada por Control -->
    <section id="sec-4" class="space-y-3">
      <h3 class="text-base font-extrabold text-[#003366] border-b border-slate-200 pb-1">
        4. Evaluación Detallada por Control
      </h3>
      <div class="table-responsive">
        <table class="w-full text-xs text-left border border-slate-200">
          <thead class="bg-[#003366] text-white">
            <tr>
              <th class="px-3 py-2">ISO</th>
              <th class="px-3 py-2">Control</th>
              <th class="px-3 py-2">Estado</th>
              <th class="px-3 py-2">Observación del Auditor / Justificación N/A</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            ${evaluaciones
              .map(
                (e) => `
              <tr>
                <td class="px-3 py-2 font-mono font-bold text-[#003366]">${escapeHtml(e.codigo_iso)}</td>
                <td class="px-3 py-2 font-semibold text-slate-900">${escapeHtml(e.nombre)}</td>
                <td class="px-3 py-2">${renderControlStateChip(e.estado)}</td>
                <td class="px-3 py-2 text-slate-700">
                  <div>${escapeHtml(e.observacion || '—')}</div>
                  ${
                    e.estado === 'NO_APLICABLE' && e.justificacion_na
                      ? `<div class="mt-1 text-slate-600 italic"><strong>Justificación N/A:</strong> ${escapeHtml(
                          e.justificacion_na
                        )}</div>`
                      : ''
                  }
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Sección 5 — Relación de Hallazgos de Auditoría -->
    <section id="sec-5" class="space-y-3">
      <h3 class="text-base font-extrabold text-[#003366] border-b border-slate-200 pb-1">
        5. Relación de Hallazgos de Auditoría (${hallazgos.length})
      </h3>
      ${
        hallazgos.length === 0
          ? '<p class="text-xs text-slate-500">No se registraron hallazgos en esta auditoría.</p>'
          : hallazgos
              .map(
                (h) => `
              <div class="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs print-break-inside-avoid">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-[#003366] text-white font-mono font-bold">${escapeHtml(
                      h.codigo
                    )}</span>
                    <span class="font-bold text-slate-900">Control ${escapeHtml(
                      h.codigo_iso
                    )} — ${escapeHtml(h.control_nombre)}</span>
                  </div>
                  ${renderSeverityBadge(h.severidad)}
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div><strong>Condición:</strong> ${escapeHtml(h.condicion)}</div>
                  <div><strong>Criterio:</strong> ${escapeHtml(h.criterio)}</div>
                  <div><strong>Causa:</strong> ${escapeHtml(h.causa)}</div>
                  <div><strong>Efecto / Riesgo:</strong> ${escapeHtml(h.efecto_riesgo)}</div>
                </div>
              </div>
            `
              )
              .join('')
      }
    </section>

    <!-- Sección 6 — Plan de Recomendaciones -->
    <section id="sec-6" class="space-y-3">
      <h3 class="text-base font-extrabold text-[#003366] border-b border-slate-200 pb-1">
        6. Plan de Recomendaciones (${recomendaciones.length})
      </h3>
      <div class="table-responsive">
        <table class="w-full text-xs text-left border border-slate-200">
          <thead class="bg-[#003366] text-white">
            <tr>
              <th class="px-3 py-2">Hallazgo</th>
              <th class="px-3 py-2">Recomendación</th>
              <th class="px-3 py-2">Prioridad</th>
              <th class="px-3 py-2">Plazo</th>
              <th class="px-3 py-2">Responsable Sugerido</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            ${
              recomendaciones.length === 0
                ? '<tr><td colspan="5" class="px-3 py-3 text-center text-slate-500">Sin recomendaciones registradas.</td></tr>'
                : recomendaciones
                    .map(
                      (r) => `
                  <tr>
                    <td class="px-3 py-2 font-mono font-bold text-[#003366]">${escapeHtml(
                      r.hallazgo_codigo
                    )}</td>
                    <td class="px-3 py-2 text-slate-800">${escapeHtml(r.descripcion)}</td>
                    <td class="px-3 py-2">${renderSeverityBadge(r.prioridad, '')}</td>
                    <td class="px-3 py-2 font-semibold whitespace-nowrap">${escapeHtml(
                      r.plazo_dias
                    )} días</td>
                    <td class="px-3 py-2 text-slate-700">${escapeHtml(
                      r.responsable_sug || 'Líder TI'
                    )}</td>
                  </tr>
                `
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- Sección 7 — Anexo de Evidencias (CP-10: Marca explícita de evidencia simulada) -->
    <section id="sec-7" class="space-y-3">
      <h3 class="text-base font-extrabold text-[#003366] border-b border-slate-200 pb-1">
        7. Anexo de Evidencias (${evidencias.length})
      </h3>
      <div class="table-responsive">
        <table class="w-full text-xs text-left border border-slate-200">
          <thead class="bg-[#003366] text-white">
            <tr>
              <th class="px-3 py-2">Código</th>
              <th class="px-3 py-2">Control</th>
              <th class="px-3 py-2">Descripción</th>
              <th class="px-3 py-2">Fuente</th>
              <th class="px-3 py-2">Fecha</th>
              <th class="px-3 py-2">Referencia</th>
              <th class="px-3 py-2">Carácter de la Evidencia</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            ${
              evidencias.length === 0
                ? '<tr><td colspan="7" class="px-3 py-3 text-center text-slate-500">Sin evidencias registradas.</td></tr>'
                : evidencias
                    .map(
                      (ev) => `
                  <tr>
                    <td class="px-3 py-2 font-mono font-bold text-[#003366]">${escapeHtml(
                      ev.codigo_evidencia
                    )}</td>
                    <td class="px-3 py-2 font-mono">${escapeHtml(ev.codigo_iso)}</td>
                    <td class="px-3 py-2">${escapeHtml(ev.descripcion)}</td>
                    <td class="px-3 py-2">${escapeHtml(ev.fuente)}</td>
                    <td class="px-3 py-2 whitespace-nowrap">${escapeHtml(
                      formatDate(ev.fecha_evidencia)
                    )}</td>
                    <td class="px-3 py-2 font-mono text-[11px]">${escapeHtml(
                      ev.referencia_url || '—'
                    )}</td>
                    <td class="px-3 py-2 font-bold text-[#003366]">
                      ${
                        ev.es_simulada !== false
                          ? 'Referencial'
                          : 'Documental'
                      }
                    </td>
                  </tr>
                `
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- Sección 8 — Salvaguarda y Limitaciones Normativas (Obligatoria según Rúbrica) -->
    <section id="sec-8" class="p-4 rounded-xl bg-amber-50 border-2 border-[#F2A900] text-amber-950 text-xs sm:text-sm print-break-inside-avoid">
      <h3 class="font-extrabold uppercase tracking-wider text-xs mb-1">
        8. Salvaguarda y Limitaciones Normativas
      </h3>
      <p class="leading-relaxed">
        ${escapeHtml(
          data.limitaciones ||
            'LIMITACIONES Y SALVAGUARDA ACADÉMICA: El porcentaje e indicador de cumplimiento presentado en este informe es estrictamente descriptivo y se fundamenta en la muestra de controles evaluados durante el ejercicio académico. No constituye una certificación en ISO/IEC 27001:2022 ni sustituye el juicio profesional del auditor ni una auditoría de tercera parte acreditada.'
        )}
      </p>
    </section>
  `;
}

if (!window.__AUDITSYS_SOFT_NAV__) {
  bootstrap();
}
