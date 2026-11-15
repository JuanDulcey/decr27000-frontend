/**
 * AuditSys SGSI (DECR 27000) — Guardia de Cambios Sin Guardar
 */

import { confirmModal } from './ui.js';

let dirty = false;
let beforeUnloadBound = false;

export function isDirty() {
  return dirty;
}

export function setDirty(nextState) {
  dirty = Boolean(nextState);
  if (dirty && !beforeUnloadBound && typeof window !== 'undefined') {
    beforeUnloadBound = true;
    window.addEventListener('beforeunload', (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }
}

/**
 * Si existen cambios sin guardar, solicita confirmación antes de abandonar la vista.
 * @returns {Promise<boolean>} true si se puede continuar la navegación
 */
export async function confirmLeaveIfDirty() {
  if (!dirty) return true;
  const ok = await confirmModal({
    title: 'Cambios sin guardar',
    message: 'Tiene modificaciones pendientes sin guardar en esta pantalla. ¿Desea salir y descartar los cambios?',
    confirmText: 'Salir sin guardar',
    cancelText: 'Seguir editando',
    danger: true,
  });
  if (ok) {
    dirty = false;
  }
  return ok;
}
