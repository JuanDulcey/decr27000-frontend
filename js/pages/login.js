/**
 * AuditSys SGSI — Controlador de Acceso
 */

import { api } from '../api.js';
import { getAuthToken, getCurrentUser, setSession } from '../auth.js';
import { attachLiveValidationClear, clearAllFieldErrors, setFieldError } from '../validators.js';

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

attachLiveValidationClear(form);

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('expired') === '1') {
  loginAlert.textContent = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
  loginAlert.classList.remove('hidden');
}

async function checkBackendHealth() {
  if (!healthPill) return;
  healthPill.textContent = 'Verificando servicio...';
  healthPill.className = 'px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-200 border border-white/15';

  const slowTimer = setTimeout(() => {
    coldBanner?.classList.remove('hidden');
  }, 3000);

  try {
    const res = await api.checkHealth();
    clearTimeout(slowTimer);
    coldBanner?.classList.add('hidden');
    if (res && res.ok) {
      healthPill.textContent = 'Servicio En Línea';
      healthPill.className =
        'px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30';
    }
  } catch {
    clearTimeout(slowTimer);
    coldBanner?.classList.add('hidden');
    healthPill.textContent = 'Servicio No Disponible';
    healthPill.className =
      'px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-200 border border-amber-400/30';
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
  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  performLogin(correoInput.value, passwordInput.value);
});
