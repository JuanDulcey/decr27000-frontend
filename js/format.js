/**
 * AuditSys Mini (DECR 27000) — Formateadores Oficiales (es-CO, coma decimal)
 * Especificación: FRONTEND_SPEC.md §7.2 y PLAN_DESARROLLO.md §2.2
 */

const pctFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Formatea un porcentaje usando coma decimal (ej. 33.3 -> "33,3 %")
 */
export function formatPercent(value, includeSymbol = true) {
  const num = Number(value);
  const safeNum = Number.isFinite(num) ? num : 0;
  const formatted = pctFormatter.format(safeNum);
  return includeSymbol ? `${formatted} %` : formatted;
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD o timestamp) a dd/mm/aaaa
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const raw = String(dateStr).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formatea fecha y hora para versiones de informes
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return formatDate(dateStr);
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Normaliza fecha para input type="date" (YYYY-MM-DD)
 */
export function toInputDate(dateStr) {
  if (!dateStr) return '';
  const raw = String(dateStr).trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Normaliza texto para búsqueda sin acentos y en minúsculas
 */
export function normalizeSearchText(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
