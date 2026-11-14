/**
 * AuditSys Mini (DECR 27000) — Cliente HTTP Fetch Centralizado
 * Especificación: FRONTEND_SPEC.md §5 y PLAN_DESARROLLO.md §2.2 (F1.2)
 */

import { getApiBaseUrl } from './config.js';
import { showToast } from './ui.js';

const REQUEST_TIMEOUT_MS = 70000; // 70s para soportar el arranque en frío de Render
const COLD_START_NOTICE_MS = 3000; // 3s para mostrar aviso de "Despertando servidor..."

export class ApiError extends Error {
  constructor(message, status = 400, field = null, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.field = field;
    this.payload = payload;
  }
}

function getToken() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('auditsys_token');
}

function isLoginPage() {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname.toLowerCase();
  return p.endsWith('/login.html') || p.endsWith('/index.html') || p === '/';
}

/**
 * Ejecuta una petición HTTP hacia API_BASE_URL
 */
export async function request(method, path, body = null, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const baseUrl = getApiBaseUrl();
  const fullUrl = `${baseUrl}${normalizedPath}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let coldStartToast = null;
  const coldStartTimer = setTimeout(() => {
    if (!options.silentColdStart) {
      coldStartToast = showToast(
        'Despertando el servidor en Render (puede tardar hasta 1 minuto en plan gratuito)…',
        'warning',
        15000
      );
    }
  }, COLD_START_NOTICE_MS);

  const headers = {
    Accept: 'application/json',
  };

  if (body !== null && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: body !== null && body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    clearTimeout(coldStartTimer);
    if (coldStartToast && coldStartToast.parentNode) coldStartToast.remove();

    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok || (json && json.ok === false)) {
      const errMsg =
        json?.error ||
        json?.message ||
        `Error HTTP ${res.status}: no se pudo completar la operación.`;
      const field = json?.field || null;

      if (res.status === 401 && !isLoginPage() && normalizedPath !== '/auth/login') {
        localStorage.removeItem('auditsys_token');
        localStorage.removeItem('auditsys_user');
        window.location.href = 'login.html?expired=1';
      }

      throw new ApiError(errMsg, res.status, field, json);
    }

    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    clearTimeout(coldStartTimer);
    if (coldStartToast && coldStartToast.parentNode) coldStartToast.remove();

    if (err instanceof ApiError) {
      throw err;
    }

    const netMsg =
      err.name === 'AbortError'
        ? 'Tiempo de espera agotado (70 s) al conectar con el servidor.'
        : `Error de red al conectar con ${baseUrl}: ${err.message}`;
    throw new ApiError(netMsg, 0);
  }
}

export const api = {
  checkHealth: () => request('GET', '/health', null, { silentColdStart: true }),

  login: (correo, password) => request('POST', '/auth/login', { correo, password }),

  getMe: () => request('GET', '/auth/me'),

  getUsuarios: () => request('GET', '/usuarios'),

  getDashboard: (idAuditoria) => {
    const query = idAuditoria ? `?id_auditoria=${encodeURIComponent(idAuditoria)}` : '';
    return request('GET', `/dashboard${query}`);
  },

  getAuditorias: () => request('GET', '/auditorias'),

  getAuditoria: (id) => request('GET', `/auditorias/${encodeURIComponent(id)}`),

  getVerificacionCierre: (id) =>
    request('GET', `/auditorias/${encodeURIComponent(id)}/verificacion-cierre`),

  createAuditoria: (payload) => request('POST', '/auditorias', payload),

  updateAuditoria: (id, payload) =>
    request('PUT', `/auditorias/${encodeURIComponent(id)}`, payload),

  changeEstadoAuditoria: (id, estado) =>
    request('PATCH', `/auditorias/${encodeURIComponent(id)}/estado`, { estado }),

  getControles: (params = {}) => {
    const sp = new URLSearchParams();
    if (params.categoria && params.categoria !== 'TODOS') {
      sp.set('categoria', params.categoria);
    }
    if (params.q && params.q.trim()) {
      sp.set('q', params.q.trim());
    }
    const qs = sp.toString();
    return request('GET', `/controles${qs ? `?${qs}` : ''}`);
  },

  updateControlCatalogo: (id, payload) =>
    request('PUT', `/controles/${encodeURIComponent(id)}`, payload),

  getEvaluaciones: (idAuditoria) =>
    request('GET', `/auditorias/${encodeURIComponent(idAuditoria)}/evaluaciones`),

  saveSeleccionControles: (idAuditoria, ids) =>
    request('PUT', `/auditorias/${encodeURIComponent(idAuditoria)}/seleccion-controles`, {
      controles_ids: ids,
    }),

  updateEvaluacion: (idEval, payload) =>
    request('PUT', `/evaluaciones/${encodeURIComponent(idEval)}`, payload),

  createEvidencia: (idEval, payload) =>
    request('POST', `/evaluaciones/${encodeURIComponent(idEval)}/evidencias`, payload),

  deleteEvidencia: (idEvidencia) =>
    request('DELETE', `/evidencias/${encodeURIComponent(idEvidencia)}`),

  getHallazgos: (idAuditoria) =>
    request('GET', `/auditorias/${encodeURIComponent(idAuditoria)}/hallazgos`),

  createHallazgo: (idEval, payload) =>
    request('POST', `/evaluaciones/${encodeURIComponent(idEval)}/hallazgos`, payload),

  updateHallazgo: (idHallazgo, payload) =>
    request('PUT', `/hallazgos/${encodeURIComponent(idHallazgo)}`, payload),

  deleteHallazgo: (idHallazgo) =>
    request('DELETE', `/hallazgos/${encodeURIComponent(idHallazgo)}`),

  createRecomendacion: (idHallazgo, payload) =>
    request('POST', `/hallazgos/${encodeURIComponent(idHallazgo)}/recomendaciones`, payload),

  deleteRecomendacion: (idRec) =>
    request('DELETE', `/recomendaciones/${encodeURIComponent(idRec)}`),

  getTrazabilidad: (idAuditoria) =>
    request('GET', `/auditorias/${encodeURIComponent(idAuditoria)}/trazabilidad`),

  getIndicadores: (idAuditoria) =>
    request('GET', `/auditorias/${encodeURIComponent(idAuditoria)}/indicadores`),

  getInformes: (idAuditoria) =>
    request('GET', `/auditorias/${encodeURIComponent(idAuditoria)}/informes`),

  getInformeById: (idInforme) =>
    request('GET', `/informes/${encodeURIComponent(idInforme)}`),

  generateInforme: (idAuditoria) =>
    request('POST', `/auditorias/${encodeURIComponent(idAuditoria)}/informes`, {}),
};

export default api;
