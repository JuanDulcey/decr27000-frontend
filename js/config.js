/**
 * AuditSys Mini (DECR 27000) — Configuración Global y Resolución Inteligente de API_BASE_URL
 * Especificación: FRONTEND_SPEC.md §6
 */

const DEFAULT_API_URL =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:4000/api'
    : (typeof localStorage !== 'undefined' && localStorage.getItem('auditsys_api_url')) ||
      'https://decr27000-backend.onrender.com/api';

export const getApiBaseUrl = () => {
  if (typeof localStorage === 'undefined') return DEFAULT_API_URL;
  return (localStorage.getItem('auditsys_api_url') || DEFAULT_API_URL).replace(/\/+$/, '');
};

export const setApiBaseUrl = (url) => {
  if (typeof localStorage === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem('auditsys_api_url');
    return;
  }
  localStorage.setItem('auditsys_api_url', url.trim().replace(/\/+$/, ''));
};

export const resetApiBaseUrl = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('auditsys_api_url');
};

export const getApiMode = () => {
  if (typeof localStorage === 'undefined') return 'auto';
  return localStorage.getItem('auditsys_api_mode') || 'auto';
};

export const setApiMode = (mode) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('auditsys_api_mode', mode);
};

export const OFFICIAL_REFERENTES = 'ISO 19011:2026; ISO/IEC 27001:2022; ISO/IEC 27002:2022';

export const EMPRESA_ABC_SUGGESTED_IDS = [1, 15, 18, 24, 40, 47, 64, 66, 67, 72, 74, 82, 90];

export const EMPRESA_ABC_SUGGESTED_CODES = [
  '5.1',
  '5.15',
  '5.18',
  '5.24',
  '6.3',
  '7.2',
  '8.5',
  '8.7',
  '8.8',
  '8.13',
  '8.15',
  '8.23',
  '8.31',
];
