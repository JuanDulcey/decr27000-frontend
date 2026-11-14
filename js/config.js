/**
 * AuditSys SGSI — Configuración Global y Resolución de API_BASE_URL
 */

const DEFAULT_API_URL =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:4000/api'
    : 'https://decr27000-backend.onrender.com/api';

export const getApiBaseUrl = () => DEFAULT_API_URL.replace(/\/+$/, '');

export const OFFICIAL_REFERENTES = 'ISO 19011:2026; ISO/IEC 27001:2022; ISO/IEC 27002:2022';
