/**
 * AuditSys Mini (DECR 27000) — Gestión de Sesión, Roles y Protección de Rutas (RNF04 / CP-13)
 * Especificación: FRONTEND_SPEC.md §4.0 y §4.1
 */

import { api } from './api.js';

const TOKEN_KEY = 'auditsys_token';
const USER_KEY = 'auditsys_user';
const ACTIVE_AUDIT_KEY = 'auditsys_active_audit_id';

export function getAuthToken() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(token, usuario) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  if (!localStorage.getItem(ACTIVE_AUDIT_KEY)) {
    localStorage.setItem(ACTIVE_AUDIT_KEY, '1');
  }
}

export function clearSession() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function logout() {
  clearSession();
  window.location.href = 'login.html';
}

export function getActiveAuditId() {
  if (typeof localStorage === 'undefined') return 1;
  const val = Number(localStorage.getItem(ACTIVE_AUDIT_KEY));
  return Number.isFinite(val) && val > 0 ? val : 1;
}

export function setActiveAuditId(id) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ACTIVE_AUDIT_KEY, String(id));
}

export function isAdmin() {
  const user = getCurrentUser();
  return user?.rol === 'admin';
}

/**
 * Verifica que exista sesión activa en páginas privadas; si no existe, redirige a login.html
 */
export function requireAuth() {
  const token = getAuthToken();
  const user = getCurrentUser();
  if (!token || !user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

/**
 * Permite cambiar rápidamente entre Auditora Líder y Administrador SGSI durante la sustentación
 */
export async function quickSwitchDemoRole(targetRole = 'auditor') {
  const creds =
    targetRole === 'admin'
      ? { correo: 'admin@auditsys.edu.co', password: 'Audit2026*' }
      : { correo: 'ana.auditora@auditsys.edu.co', password: 'Audit2026*' };

  const res = await api.login(creds.correo, creds.password);
  if (res?.data?.token && res?.data?.usuario) {
    setSession(res.data.token, res.data.usuario);
    return res.data.usuario;
  }
  throw new Error('No se pudo cambiar de perfil demo.');
}
