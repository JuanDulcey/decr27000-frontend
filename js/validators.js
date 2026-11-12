/**
 * AuditSys Mini (DECR 27000) — Validación en Línea Conservando lo Digitado (RNF03)
 * Especificación: FRONTEND_SPEC.md §3.2 (Principio 4), CP-01, CP-02, CP-04, CP-05, CP-07
 */

/**
 * Muestra un mensaje de error debajo de un campo sin borrar lo digitado
 * @param {string} fieldName ID del input o nombre del campo
 * @param {string} message Mensaje claro en español
 */
export function setFieldError(fieldName, message) {
  const input =
    document.getElementById(fieldName) ||
    document.querySelector(`[name="${fieldName}"]`) ||
    document.getElementById(`field-${fieldName}`);

  const errorEl =
    document.getElementById(`error-${fieldName}`) ||
    (input && input.parentElement && input.parentElement.querySelector('.field-error'));

  if (input) {
    input.classList.add('input-error');
    input.setAttribute('aria-invalid', 'true');
  }

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    errorEl.setAttribute('role', 'alert');
  }
}

/**
 * Limpia el error de un campo específico
 */
export function clearFieldError(fieldName) {
  const input =
    document.getElementById(fieldName) ||
    document.querySelector(`[name="${fieldName}"]`) ||
    document.getElementById(`field-${fieldName}`);

  const errorEl =
    document.getElementById(`error-${fieldName}`) ||
    (input && input.parentElement && input.parentElement.querySelector('.field-error'));

  if (input) {
    input.classList.remove('input-error');
    input.removeAttribute('aria-invalid');
  }

  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }
}

/**
 * Limpia todos los errores de validación dentro de un formulario o contenedor
 */
export function clearAllFieldErrors(container = document) {
  container.querySelectorAll('.input-error').forEach((el) => {
    el.classList.remove('input-error');
    el.removeAttribute('aria-invalid');
  });
  container.querySelectorAll('.field-error').forEach((el) => {
    el.textContent = '';
    el.classList.add('hidden');
  });
}

/**
 * Registra listeners para limpiar automáticamente el error cuando el usuario corrige el campo
 */
export function attachLiveValidationClear(container = document) {
  container.querySelectorAll('input, select, textarea').forEach((el) => {
    const handler = () => {
      const id = el.id || el.name;
      if (id) clearFieldError(id);
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });
}

/**
 * Valida el formulario de Auditoría (RF01, CP-01, CP-02)
 */
export function validateAuditoriaForm(values) {
  let valid = true;
  const errors = {};

  if (!values.organizacion || !values.organizacion.trim()) {
    errors.organizacion = 'El nombre de la organización auditada es obligatorio.';
    valid = false;
  } else if (values.organizacion.trim().length > 120) {
    errors.organizacion = 'El nombre de la organización no puede exceder 120 caracteres.';
    valid = false;
  }

  if (!values.id_auditor) {
    errors.id_auditor = 'Debe seleccionar el auditor líder responsable.';
    valid = false;
  }

  if (!values.fecha_inicio) {
    errors.fecha_inicio = 'La fecha de inicio de la auditoría es obligatoria.';
    valid = false;
  }

  if (!values.fecha_fin) {
    errors.fecha_fin = 'La fecha de cierre es obligatoria para registrar la auditoría.';
    valid = false;
  } else if (values.fecha_inicio && values.fecha_fin < values.fecha_inicio) {
    errors.fecha_fin = 'La fecha de cierre debe ser igual o posterior a la fecha de inicio.';
    valid = false;
  }

  if (!values.objetivo || !values.objetivo.trim()) {
    errors.objetivo = 'El objetivo de la auditoría es obligatorio.';
    valid = false;
  }

  if (!values.alcance || !values.alcance.trim()) {
    errors.alcance = 'El alcance de la auditoría es obligatorio.';
    valid = false;
  }

  if (!values.referentes || !values.referentes.trim()) {
    errors.referentes = 'Los referentes normativos son obligatorios.';
    valid = false;
  }

  Object.entries(errors).forEach(([field, msg]) => setFieldError(field, msg));
  return { valid, errors };
}

/**
 * Valida la evaluación de un control (RF03, CP-04, CP-05)
 */
export function validateEvaluacionForm({ estado, observacion, justificacion_na }) {
  let valid = true;
  const errors = {};

  if (!estado || estado === 'PENDIENTE') {
    errors.estado = 'Debe seleccionar uno de los 4 estados de evaluación del control.';
    valid = false;
  }

  if (!observacion || !observacion.trim()) {
    errors.observacion = 'La observación del auditor es obligatoria para guardar la evaluación.';
    valid = false;
  }

  if (estado === 'NO_APLICABLE' && (!justificacion_na || !justificacion_na.trim())) {
    errors.justificacion_na = "El estado 'No aplicable' exige registrar una justificación formal.";
    valid = false;
  }

  Object.entries(errors).forEach(([field, msg]) => setFieldError(field, msg));
  return { valid, errors };
}

/**
 * Valida el formulario de Evidencia (RF04, CP-06)
 */
export function validateEvidenciaForm({ descripcion, fuente, fecha_evidencia }) {
  let valid = true;
  const errors = {};

  if (!descripcion || !descripcion.trim()) {
    errors['ev-descripcion'] = 'La descripción de la evidencia es obligatoria.';
    valid = false;
  }

  if (!fuente || !fuente.trim()) {
    errors['ev-fuente'] = 'La fuente de la evidencia es obligatoria.';
    valid = false;
  }

  if (!fecha_evidencia) {
    errors['ev-fecha'] = 'La fecha de la evidencia es obligatoria.';
    valid = false;
  }

  Object.entries(errors).forEach(([field, msg]) => setFieldError(field, msg));
  return { valid, errors };
}

/**
 * Valida el formulario de Hallazgo y Recomendación (RF05, RF06, CP-07)
 */
export function validateHallazgoForm(values, requireRecomendacion = false) {
  let valid = true;
  const errors = {};

  if (!values.id_evaluacion) {
    errors['h-evaluacion'] = 'Debe seleccionar el control evaluado asociado al hallazgo.';
    valid = false;
  }

  if (!values.severidad || !['ALTA', 'MEDIA', 'BAJA'].includes(values.severidad)) {
    errors['h-severidad'] = 'Debe seleccionar la severidad del hallazgo (Alta, Media o Baja).';
    valid = false;
  }

  if (!values.condicion || !values.condicion.trim()) {
    errors['h-condicion'] = 'La condición (qué se encontró) es obligatoria.';
    valid = false;
  }

  if (!values.criterio || !values.criterio.trim()) {
    errors['h-criterio'] = 'El criterio normativo es obligatorio.';
    valid = false;
  }

  if (!values.causa || !values.causa.trim()) {
    errors['h-causa'] = 'La causa raíz de la desviación es obligatoria (CP-07).';
    valid = false;
  }

  if (!values.efecto_riesgo || !values.efecto_riesgo.trim()) {
    errors['h-efecto'] = 'El efecto o riesgo asociado es obligatorio.';
    valid = false;
  }

  if (requireRecomendacion || (values.rec_descripcion && values.rec_descripcion.trim())) {
    if (!values.rec_descripcion || !values.rec_descripcion.trim()) {
      errors['rec-descripcion'] = 'La descripción de la recomendación es obligatoria.';
      valid = false;
    }
    const plazo = Number(values.rec_plazo_dias);
    if (!Number.isFinite(plazo) || plazo <= 0) {
      errors['rec-plazo'] = 'El plazo sugerido debe ser un número mayor a 0 días.';
      valid = false;
    }
  }

  Object.entries(errors).forEach(([field, msg]) => setFieldError(field, msg));
  return { valid, errors };
}
