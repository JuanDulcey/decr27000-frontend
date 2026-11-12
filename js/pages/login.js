/**
 * AuditSys Mini (DECR 27000) — Controlador de Login (RNF04, CP-13)
 */

import { api } from '../api.js';
import { getAuthToken, getCurrentUser, setSession } from '../auth.js';
import {
  getApiBaseUrl,
  getApiMode,
  resetApiBaseUrl,
  setApiBaseUrl,
  setApiMode,
} from '../config.js';
import { showToast } from '../ui.js';
import { attachLiveValidationClear, clearAllFieldErrors, setFieldError } from '../validators.js';

// Si ya hay sesión activa, redirigir al dashboard
if (getAuthToken() && getCurrentUser()) {
  window.location.replace('dashboard.html');
}

const form = document.getElementById('login-form');
const correoInput = document.getElementById('correo');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const loginAlert = document.getElementById('login-alert');
const healthPill = document.getElementById('health-pill');
const coldBanner = document.getElementById('cold-start-banner');

const apiInput = document.getElementById('api-base-url-input');
const apiModeSelect = document.getElementById('api-mode-select');

attachLiveValidationClear(form);

// Mostrar aviso si fue redirigido por sesión expirada
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('expired') === '1') {
  loginAlert.textContent = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
  loginAlert.classList.remove('hidden');
}

// Cargar configuración actual de API
if (apiInput) apiInput.value = getApiBaseUrl();
if (apiModeSelect) apiModeSelect.value = getApiMode();

document.getElementById('btn-save-api-config')?.addEventListener('click', () => {
  setApiBaseUrl(apiInput.value);
  setApiMode(apiModeSelect.value);
  showToast('Configuración de conexión actualizada.', 'success');
  checkBackendHealth();
});

document.getElementById('btn-reset-api-config')?.addEventListener('click', () => {
  resetApiBaseUrl();
  setApiMode('auto');
  apiInput.value = getApiBaseUrl();
  apiModeSelect.value = 'auto';
  showToast('Conexión restablecida al valor predeterminado.', 'info');
  checkBackendHealth();
});

async function checkBackendHealth() {
  if (!healthPill) return;
  healthPill.textContent = 'Verificando API...';
  healthPill.className = 'px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600';

  const slowTimer = setTimeout(() => {
    coldBanner?.classList.remove('hidden');
  }, 3000);

  try {
    const res = await api.checkHealth();
    clearTimeout(slowTimer);
    coldBanner?.classList.add('hidden');
    if (res && res.ok) {
      healthPill.textContent =
        res.service === 'auditsys-mini-local-engine' ? 'Modo Local Activo' : 'API En Línea';
      healthPill.className =
        'px-3 py-1 rounded-full text-[11px] font-bold bg-[#eaf6ef] text-[#1e6f40] border border-[#2E9E5B]/30';
    }
  } catch {
    clearTimeout(slowTimer);
    coldBanner?.classList.add('hidden');
    healthPill.textContent = 'Sin conexión remota';
    healthPill.className =
      'px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300';
  }
}

checkBackendHealth();

async function performLogin(correo, password) {
  clearAllFieldErrors(form);
  loginAlert.classList.add('hidden');

  let hasError = false;
  if (!correo || !correo.trim()) {
    setFieldError('correo', 'Ingrese su correo institucional.');
    hasError = true;
  }
  if (!password) {
    setFieldError('password', 'Ingrese su contraseña.');
    hasError = true;
  }
  if (hasError) return;

  try {
    btnLogin.disabled = true;
    btnLogin.textContent = 'Autenticando...';
    const res = await api.login(correo.trim(), password);
    if (res?.data?.token && res?.data?.usuario) {
      setSession(res.data.token, res.data.usuario);
      document.body.classList.add('login-leaving');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 180);
    } else {
      throw new Error('Respuesta de autenticación incompleta.');
    }
  } catch (err) {
    loginAlert.textContent = err.message || 'Credenciales inválidas.';
    loginAlert.classList.remove('hidden');
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Ingresar al Sistema';
  }
}

document.getElementById('btn-toggle-password')?.addEventListener('click', () => {
  if (!passwordInput) return;
  const isPass = passwordInput.type === 'password';
  passwordInput.type = isPass ? 'text' : 'password';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  performLogin(correoInput.value, passwordInput.value);
});

document.getElementById('btn-demo-auditor')?.addEventListener('click', () => {
  correoInput.value = 'ana.auditora@auditsys.edu.co';
  passwordInput.value = 'Audit2026*';
  performLogin(correoInput.value, passwordInput.value);
});

document.getElementById('btn-demo-admin')?.addEventListener('click', () => {
  correoInput.value = 'admin@auditsys.edu.co';
  passwordInput.value = 'Audit2026*';
  performLogin(correoInput.value, passwordInput.value);
});
