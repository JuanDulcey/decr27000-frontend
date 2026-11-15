/**
 * AuditSys SGSI (DECR 27000) — Utilidad Compartida de Exportación CSV (UTF-8 BOM)
 */

/**
 * Escapa un valor de celda CSV según RFC 4180.
 */
function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

/**
 * Genera y descarga un archivo CSV compatible con Excel (BOM UTF-8).
 * @param {string} filename Nombre del archivo (debe terminar en .csv)
 * @param {string[]} headers Encabezados de columna
 * @param {Array<Array<unknown>>} rows Filas de datos
 */
export function downloadCsv(filename, headers, rows) {
  const lines = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
