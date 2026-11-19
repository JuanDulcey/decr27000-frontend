/**
 * Mock de red para pruebas E2E en Playwright (sin código simulado en producción)
 */

function buildControls() {
  const specs = [
    { cat: 'ORGANIZACIONAL', prefix: '5', count: 37 },
    { cat: 'PERSONAS', prefix: '6', count: 8 },
    { cat: 'FISICO', prefix: '7', count: 14 },
    { cat: 'TECNOLOGICO', prefix: '8', count: 34 },
  ];
  const list = [];
  let id = 1;
  for (const s of specs) {
    for (let i = 1; i <= s.count; i++) {
      list.push({
        id_control: id,
        codigo_iso: `${s.prefix}.${i}`,
        categoria: s.cat,
        nombre: `Control ${s.prefix}.${i}`,
        criterio: `Criterio normativo ISO/IEC 27002:2022 para ${s.prefix}.${i}.`,
        pregunta_orientadora: `¿Se encuentra implementado el control ${s.prefix}.${i}?`,
        ejemplo_aplicacion: `Aplicación de ejemplo para ${s.prefix}.${i}.`,
        evidencia_sugerida: `Registro o política asociada a ${s.prefix}.${i}.`,
      });
      id++;
    }
  }
  return list;
}

export async function installApiMock(page) {
  const controles = buildControls();
  const usuarios = [
    {
      id_usuario: 1,
      nombre: 'Ana Rodríguez',
      correo: 'ana.auditora@auditsys.edu.co',
      rol: 'auditor',
    },
    {
      id_usuario: 2,
      nombre: 'Carlos Mendoza',
      correo: 'admin@auditsys.edu.co',
      rol: 'admin',
    },
  ];

  const auditorias = [
    {
      id_auditoria: 1,
      organizacion: 'Empresa ABC S.A.S.',
      fecha_inicio: '2026-11-01',
      fecha_fin: '2026-11-15',
      objetivo: 'Evaluar cumplimiento SGSI.',
      alcance: 'Infraestructura y servicios corporativos.',
      referentes: 'ISO 19011:2026; ISO/IEC 27001:2022; ISO/IEC 27002:2022',
      estado: 'EN_EJECUCION',
      id_auditor: 1,
      auditor_nombre: 'Ana Rodríguez',
      total_controles: 13,
      total_hallazgos: 4,
    },
  ];

  // 13 controles: 4 IMPLEMENTADO, 5 PARCIAL, 3 NO_IMPLEMENTADO, 1 NO_APLICABLE
  // Base = 4/12 = 33.3%, Ponderado = (4 + 2.5)/12 = 54.2%
  const states13 = [
    'IMPLEMENTADO',
    'IMPLEMENTADO',
    'IMPLEMENTADO',
    'IMPLEMENTADO',
    'PARCIAL',
    'PARCIAL',
    'PARCIAL',
    'PARCIAL',
    'PARCIAL',
    'NO_IMPLEMENTADO',
    'NO_IMPLEMENTADO',
    'NO_IMPLEMENTADO',
    'NO_APLICABLE',
  ];

  const evaluaciones = states13.map((estado, idx) => ({
    id_evaluacion: idx + 1,
    id_auditoria: 1,
    id_control: idx + 1,
    codigo_iso: controles[idx].codigo_iso,
    categoria: controles[idx].categoria,
    nombre: controles[idx].nombre,
    criterio: controles[idx].criterio,
    pregunta_orientadora: controles[idx].pregunta_orientadora,
    ejemplo_aplicacion: controles[idx].ejemplo_aplicacion,
    evidencia_sugerida: controles[idx].evidencia_sugerida,
    estado,
    observacion: `Observación de prueba ${idx + 1}.`,
    justificacion_na: estado === 'NO_APLICABLE' ? 'No aplica al alcance.' : null,
    evidencias:
      estado === 'IMPLEMENTADO' || estado === 'PARCIAL'
        ? [
            {
              id_evidencia: idx + 1,
              codigo_evidencia: `EV-${String(idx + 1).padStart(2, '0')}`,
              descripcion: `Evidencia documental ${idx + 1}`,
              fuente: 'Repositorio SGSI',
              fecha_evidencia: '2026-11-05',
              referencia_url: `DOC-${idx + 1}.pdf`,
              es_simulada: true,
            },
          ]
        : [],
    hallazgos: [],
  }));

  const hallazgos = [
    {
      id_hallazgo: 1,
      codigo_hallazgo: 'H-01',
      id_auditoria: 1,
      id_evaluacion: 5,
      codigo_iso: '5.5',
      control_nombre: 'Control 5.5',
      severidad: 'ALTA',
      criterio: controles[4].criterio,
      condicion: 'Falta revisión formal.',
      causa: 'Ausencia de calendario.',
      efecto_riesgo: 'Riesgo de cumplimiento.',
      recomendaciones: [
        {
          id_recomendacion: 1,
          descripcion: 'Definir calendario trimestral.',
          prioridad: 'ALTA',
          plazo_dias: 30,
          responsable: 'Líder SGSI',
        },
      ],
    },
    {
      id_hallazgo: 2,
      codigo_hallazgo: 'H-02',
      id_auditoria: 1,
      id_evaluacion: 6,
      codigo_iso: '5.6',
      control_nombre: 'Control 5.6',
      severidad: 'MEDIA',
      criterio: controles[5].criterio,
      condicion: 'Registro incompleto.',
      causa: 'Proceso manual.',
      efecto_riesgo: 'Trazabilidad parcial.',
      recomendaciones: [
        {
          id_recomendacion: 2,
          descripcion: 'Automatizar bitácora.',
          prioridad: 'MEDIA',
          plazo_dias: 45,
          responsable: 'TI',
        },
      ],
    },
    {
      id_hallazgo: 3,
      codigo_hallazgo: 'H-03',
      id_auditoria: 1,
      id_evaluacion: 10,
      codigo_iso: '5.10',
      control_nombre: 'Control 5.10',
      severidad: 'ALTA',
      criterio: controles[9].criterio,
      condicion: 'Sin política vigente.',
      causa: 'Falta de aprobación.',
      efecto_riesgo: 'Exposición operativa.',
      recomendaciones: [
        {
          id_recomendacion: 3,
          descripcion: 'Aprobar política.',
          prioridad: 'ALTA',
          plazo_dias: 15,
          responsable: 'Dirección',
        },
      ],
    },
    {
      id_hallazgo: 4,
      codigo_hallazgo: 'H-04',
      id_auditoria: 1,
      id_evaluacion: 11,
      codigo_iso: '5.11',
      control_nombre: 'Control 5.11',
      severidad: 'BAJA',
      criterio: controles[10].criterio,
      condicion: 'Inventario desactualizado.',
      causa: 'Sin responsable asignado.',
      efecto_riesgo: 'Demora en devolución.',
      recomendaciones: [
        {
          id_recomendacion: 4,
          descripcion: 'Asignar custodio.',
          prioridad: 'BAJA',
          plazo_dias: 60,
          responsable: 'Talento Humano',
        },
      ],
    },
  ];

  function computeIndicadores() {
    return {
      total_seleccionados: 13,
      evaluados: 13,
      implementados: 4,
      parciales: 5,
      no_implementados: 3,
      no_aplicables: 1,
      pendientes: 0,
      aplicables: 12,
      cumplimiento_base_pct: 33.3,
      indice_ponderado_pct: 54.2,
      formula_base: '(4 / 12) × 100 = 33,3 %',
      formula_ponderado: '((4 + 0,5 × 5) / 12) × 100 = 54,2 %',
      total_hallazgos: hallazgos.length,
    };
  }

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = req.method();
    const authHeader = req.headers().authorization || '';
    const isAdmin = authHeader.includes('token-admin');
    let body = null;
    try {
      body = req.postDataJSON();
    } catch {
      body = null;
    }

    const json = (status, payload) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });

    if (method === 'GET' && path === '/health') {
      return json(200, { ok: true, service: 'auditsys-backend' });
    }

    if (method === 'POST' && path === '/auth/login') {
      const correo = (body?.correo || '').toLowerCase();
      const user = usuarios.find((u) => u.correo === correo);
      if (!user || !body?.password) {
        return json(401, { ok: false, error: 'Credenciales inválidas.' });
      }
      return json(200, {
        ok: true,
        data: {
          token: user.rol === 'admin' ? 'token-admin' : 'token-auditor',
          usuario: user,
        },
      });
    }

    if (method === 'GET' && path === '/auth/me') {
      const user = isAdmin ? usuarios.find((u) => u.rol === 'admin') : usuarios[0];
      return json(200, { ok: true, data: user });
    }

    if (method === 'GET' && path === '/usuarios') {
      return json(200, { ok: true, data: usuarios });
    }

    if (method === 'POST' && path === '/usuarios') {
      if (!isAdmin) return json(403, { ok: false, error: 'Solo el Administrador SGSI puede gestionar usuarios.' });
      const nextId = usuarios.length + 1;
      const created = {
        id_usuario: nextId,
        nombre: body.nombre,
        correo: String(body.correo || '').toLowerCase(),
        rol: body.rol || 'auditor',
        auditorias_asignadas: 0,
      };
      usuarios.push(created);
      return json(201, { ok: true, data: created, message: `Usuario "${created.nombre}" creado.` });
    }

    if (method === 'PUT' && /^\/usuarios\/\d+$/.test(path)) {
      if (!isAdmin) return json(403, { ok: false, error: 'Solo el Administrador SGSI puede gestionar usuarios.' });
      const id = Number(path.split('/')[2]);
      const idx = usuarios.findIndex((u) => u.id_usuario === id);
      if (idx === -1) return json(404, { ok: false, error: 'Usuario no encontrado.' });
      usuarios[idx] = { ...usuarios[idx], nombre: body.nombre, correo: body.correo, rol: body.rol };
      return json(200, { ok: true, data: usuarios[idx], message: 'Usuario actualizado.' });
    }

    if (method === 'PATCH' && /^\/usuarios\/\d+\/password$/.test(path)) {
      if (!isAdmin) return json(403, { ok: false, error: 'Solo el Administrador SGSI puede gestionar usuarios.' });
      return json(200, { ok: true, message: 'Contraseña actualizada.' });
    }

    if (method === 'DELETE' && /^\/usuarios\/\d+$/.test(path)) {
      if (!isAdmin) return json(403, { ok: false, error: 'Solo el Administrador SGSI puede gestionar usuarios.' });
      const id = Number(path.split('/')[2]);
      const idx = usuarios.findIndex((u) => u.id_usuario === id);
      if (idx !== -1) usuarios.splice(idx, 1);
      return json(200, { ok: true, message: 'Usuario eliminado.' });
    }

    if (method === 'GET' && path === '/controles') {
      return json(200, { ok: true, data: controles });
    }

    if (method === 'POST' && path === '/controles') {
      if (!isAdmin) {
        return json(403, { ok: false, error: 'Solo el Administrador SGSI puede crear controles.' });
      }
      const nextId = controles.length + 1;
      const created = { id_control: nextId, ...body };
      controles.push(created);
      return json(201, { ok: true, data: created, message: 'Control creado.' });
    }

    if (method === 'PUT' && /^\/controles\/\d+$/.test(path)) {
      if (!isAdmin) {
        return json(403, { ok: false, error: 'Solo el Administrador SGSI puede editar el catálogo.' });
      }
      return json(200, { ok: true, message: 'Control actualizado.' });
    }

    if (method === 'GET' && path === '/auditorias') {
      return json(200, { ok: true, data: auditorias });
    }

    if (method === 'POST' && path === '/auditorias') {
      const nextId = auditorias.length + 1;
      const assigned = usuarios.find((u) => u.id_usuario === Number(body?.id_auditor));
      const created = {
        id_auditoria: nextId,
        ...body,
        estado: 'BORRADOR',
        auditor_nombre: assigned?.nombre || 'Ana Rodríguez',
      };
      auditorias.push(created);
      return json(201, { ok: true, data: created, message: 'Auditoría creada.' });
    }

    if (method === 'PUT' && /^\/auditorias\/\d+$/.test(path)) {
      const id = Number(path.split('/')[2]);
      const idx = auditorias.findIndex((a) => a.id_auditoria === id);
      if (idx !== -1) {
        const assigned = usuarios.find((u) => u.id_usuario === Number(body?.id_auditor));
        auditorias[idx] = {
          ...auditorias[idx],
          ...body,
          auditor_nombre: assigned?.nombre || auditorias[idx].auditor_nombre,
        };
      }
      return json(200, { ok: true, data: auditorias[idx], message: 'Auditoría actualizada.' });
    }

    if (method === 'GET' && /^\/auditorias\/\d+$/.test(path)) {
      const id = Number(path.split('/')[2]);
      const found = auditorias.find((a) => a.id_auditoria === id) || auditorias[0];
      return json(200, { ok: true, data: found });
    }

    if (method === 'GET' && /^\/auditorias\/\d+\/verificacion-cierre$/.test(path)) {
      return json(200, {
        ok: true,
        data: {
          total_seleccionados: 13,
          pendientes: [],
          sin_evidencia: [],
          total_hallazgos: hallazgos.length,
          hallazgos_sin_recomendacion: [],
          puede_revisar: true,
          puede_cerrar: true,
        },
      });
    }

    if (method === 'GET' && /^\/auditorias\/\d+\/evaluaciones$/.test(path)) {
      return json(200, { ok: true, data: evaluaciones });
    }

    if (method === 'POST' && /^\/evaluaciones\/\d+\/evidencias$/.test(path)) {
      const idEval = Number(path.split('/')[2]);
      const targetEval = evaluaciones.find((e) => e.id_evaluacion === idEval) || evaluaciones[0];
      const nextId =
        evaluaciones.reduce((max, ev) => Math.max(max, ...ev.evidencias.map((x) => x.id_evidencia || 0)), 0) + 1;
      const created = {
        id_evidencia: nextId,
        id_evaluacion: targetEval.id_evaluacion,
        codigo_evidencia: `EV-${String(nextId).padStart(2, '0')}`,
        descripcion: body?.descripcion || 'Evidencia',
        fuente: body?.fuente || 'Fuente',
        fecha_evidencia: body?.fecha_evidencia || '2026-11-19',
        referencia_url: body?.referencia_url || null,
        es_simulada: body?.es_simulada ?? true,
        tiene_archivo: false,
        archivo_nombre: null,
        archivo_tipo: null,
        archivo_tamano: null,
      };
      targetEval.evidencias.push(created);
      return json(201, { ok: true, data: created, message: `Evidencia ${created.codigo_evidencia} registrada.` });
    }

    if (method === 'POST' && /^\/evidencias\/\d+\/archivo$/.test(path)) {
      const idEv = Number(path.split('/')[2]);
      const rawBuf = req.postDataBuffer();
      const rawText = rawBuf ? rawBuf.toString('utf8') : '';
      const nameMatch = /filename="([^"]+)"/.exec(rawText);
      const filename = nameMatch ? nameMatch[1] : 'evidencia.mp4';
      const isVideo = /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(filename);
      const tipo = isVideo ? 'video/mp4' : 'image/png';
      let updated = null;
      for (const ev of evaluaciones) {
        const found = ev.evidencias.find((x) => x.id_evidencia === idEv);
        if (found) {
          found.tiene_archivo = true;
          found.archivo_nombre = filename;
          found.archivo_tipo = tipo;
          found.archivo_tamano = rawBuf ? rawBuf.length : 1024;
          updated = found;
          break;
        }
      }
      if (!updated) return json(404, { ok: false, error: 'Evidencia no encontrada.' });
      return json(201, {
        ok: true,
        data: updated,
        message: `Archivo "${updated.archivo_nombre}" adjuntado a la evidencia ${updated.codigo_evidencia}.`,
      });
    }

    if (method === 'GET' && /^\/evidencias\/\d+\/archivo$/.test(path)) {
      const idEv = Number(path.split('/')[2]);
      for (const ev of evaluaciones) {
        const found = ev.evidencias.find((x) => x.id_evidencia === idEv);
        if (found && found.tiene_archivo) {
          return json(200, {
            ok: true,
            data: {
              url: `https://bucket.example.com/${encodeURIComponent(found.archivo_nombre)}`,
              expira_en_segundos: 300,
              archivo_nombre: found.archivo_nombre,
              archivo_tipo: found.archivo_tipo,
              archivo_tamano: found.archivo_tamano,
            },
          });
        }
      }
      return json(404, { ok: false, error: 'La evidencia no tiene un archivo adjunto.' });
    }

    if (method === 'DELETE' && /^\/evidencias\/\d+\/archivo$/.test(path)) {
      const idEv = Number(path.split('/')[2]);
      for (const ev of evaluaciones) {
        const found = ev.evidencias.find((x) => x.id_evidencia === idEv);
        if (found && found.tiene_archivo) {
          found.tiene_archivo = false;
          found.archivo_nombre = null;
          found.archivo_tipo = null;
          found.archivo_tamano = null;
          return json(200, {
            ok: true,
            data: found,
            message: `Archivo quitado de la evidencia ${found.codigo_evidencia}.`,
          });
        }
      }
      return json(404, { ok: false, error: 'La evidencia no tiene un archivo adjunto.' });
    }

    if (method === 'DELETE' && /^\/evidencias\/\d+$/.test(path)) {
      const idEv = Number(path.split('/')[2]);
      for (const ev of evaluaciones) {
        const idx = ev.evidencias.findIndex((x) => x.id_evidencia === idEv);
        if (idx !== -1) {
          const [removed] = ev.evidencias.splice(idx, 1);
          return json(200, { ok: true, data: removed, message: 'Evidencia eliminada.' });
        }
      }
      return json(404, { ok: false, error: 'Evidencia no encontrada.' });
    }

    if (method === 'PUT' && /^\/auditorias\/\d+\/seleccion-controles$/.test(path)) {
      return json(200, { ok: true, message: 'Selección guardada.' });
    }

    if (method === 'GET' && /^\/auditorias\/\d+\/hallazgos$/.test(path)) {
      return json(200, { ok: true, data: hallazgos });
    }

    if (method === 'GET' && /^\/auditorias\/\d+\/trazabilidad$/.test(path)) {
      return json(200, { ok: true, data: [] });
    }

    if (method === 'GET' && path === '/dashboard') {
      return json(200, {
        ok: true,
        data: {
          auditoria_activa: auditorias[0],
          indicadores: computeIndicadores(),
          hallazgos_por_severidad: { ALTA: 2, MEDIA: 1, BAJA: 1 },
          auditorias_recientes: auditorias,
        },
      });
    }

    if (method === 'GET' && /^\/auditorias\/\d+\/informes$/.test(path)) {
      const ind = computeIndicadores();
      return json(200, {
        ok: true,
        data: {
          datos_auditoria: auditorias[0],
          resultados_indicadores: ind,
          alcance_criterios: evaluaciones,
          evaluacion_por_control: evaluaciones,
          hallazgos,
          recomendaciones: hallazgos.flatMap((h) =>
            h.recomendaciones.map((r) => ({ ...r, codigo_hallazgo: h.codigo_hallazgo }))
          ),
          anexo_evidencias: evaluaciones.flatMap((ev) =>
            ev.evidencias.map((e) => ({ ...e, codigo_iso: ev.codigo_iso }))
          ),
          resumen_ejecutivo: 'Resumen ejecutivo de la auditoría SGSI.',
          limitaciones:
            'El porcentaje de cumplimiento es descriptivo de la muestra evaluada y no constituye una certificación en ISO/IEC 27001:2022.',
          versiones: [],
        },
      });
    }

    return json(200, { ok: true, data: {} });
  });
}
