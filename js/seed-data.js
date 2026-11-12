/**
 * AuditSys Mini (DECR 27000) — Semilla Completa (93 Controles ISO/IEC 27002:2022 + Empresa ABC)
 * y Motor de Persistencia Local de Respaldo (100% compatible con BACKEND_SPEC.md y CP-01..CP-13)
 */

import { OFFICIAL_REFERENTES } from './config.js';
import { formatPercent, normalizeSearchText } from './format.js';

const STORAGE_KEY = 'auditsys_local_db_v1';

export const INITIAL_CONTROLES = [
  { id_control: 1, codigo_iso: '5.1', categoria: 'ORGANIZACIONAL', nombre: 'Políticas para la seguridad de la información', criterio: 'La política de seguridad de la información y las políticas específicas por tema deben definirse, ser aprobadas por la dirección, publicarse, comunicarse y ser reconocidas por el personal y las partes interesadas pertinentes, y revisarse a intervalos planificados y cuando ocurran cambios significativos.', pregunta_orientadora: '¿Existe una política aprobada por la dirección, comunicada y revisada en intervalos planificados?', ejemplo_aplicacion: 'Desarrollo de una política de seguridad de la información', evidencia_sugerida: 'Documento de política aprobado y comunicado' },
  { id_control: 2, codigo_iso: '5.2', categoria: 'ORGANIZACIONAL', nombre: 'Roles y responsabilidades de seguridad de la información', criterio: 'Los roles y responsabilidades de seguridad de la información deben definirse y asignarse de acuerdo con las necesidades de la organización.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.2 (Roles y responsabilidades de seguridad de la información)?', ejemplo_aplicacion: 'Asignación de roles de seguridad a empleados', evidencia_sugerida: 'Organigrama y descripciones de roles' },
  { id_control: 3, codigo_iso: '5.3', categoria: 'ORGANIZACIONAL', nombre: 'Segregación de deberes', criterio: 'Deben segregarse los deberes conflictivos y las áreas conflictivas de responsabilidad.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.3 (Segregación de deberes)?', ejemplo_aplicacion: 'Separación de funciones de desarrollo y producción', evidencia_sugerida: 'Procedimientos documentados de segregación de deberes' },
  { id_control: 4, codigo_iso: '5.4', categoria: 'ORGANIZACIONAL', nombre: 'Responsabilidades de la dirección', criterio: 'La gerencia debe exigir a todo el personal que aplique la seguridad de la información de acuerdo con la política de seguridad de la información establecida, las políticas y los procedimientos específicos del tema de la organización.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.4 (Responsabilidades de la dirección)?', ejemplo_aplicacion: 'Reuniones de gestión sobre seguridad de la información', evidencia_sugerida: 'Actas de reuniones y decisiones tomadas' },
  { id_control: 5, codigo_iso: '5.5', categoria: 'ORGANIZACIONAL', nombre: 'Contacto con las autoridades', criterio: 'La organización debe establecer y mantener contacto con las autoridades pertinentes.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.5 (Contacto con las autoridades)?', ejemplo_aplicacion: 'Establecimiento de un canal de comunicación con autoridades', evidencia_sugerida: 'Registros de comunicación y contactos establecidos' },
  { id_control: 6, codigo_iso: '5.6', categoria: 'ORGANIZACIONAL', nombre: 'Contacto con grupos de interés especial', criterio: 'La organización debe establecer y mantener contacto con grupos de interés especial u otros foros especializados en seguridad y asociaciones profesionales.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.6 (Contacto con grupos de interés especial)?', ejemplo_aplicacion: 'Colaboración con grupos de ciberseguridad', evidencia_sugerida: 'Informes de colaboración y reuniones' },
  { id_control: 7, codigo_iso: '5.7', categoria: 'ORGANIZACIONAL', nombre: 'Inteligencia de amenazas', criterio: 'La información relacionada con las amenazas a la seguridad de la información debe recopilarse y analizarse para generar información sobre amenazas.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.7 (Inteligencia de amenazas)?', ejemplo_aplicacion: 'Implementación de un sistema de monitoreo de amenazas', evidencia_sugerida: 'Informes de análisis de amenazas y acciones tomadas' },
  { id_control: 8, codigo_iso: '5.8', categoria: 'ORGANIZACIONAL', nombre: 'Seguridad de la información en la gestión de proyectos', criterio: 'La seguridad de la información debe integrarse en la gestión de proyectos.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.8 (Seguridad de la información en la gestión de proyectos)?', ejemplo_aplicacion: 'Evaluación de riesgos de seguridad en proyectos', evidencia_sugerida: 'Informes de evaluación de riesgos' },
  { id_control: 9, codigo_iso: '5.9', categoria: 'ORGANIZACIONAL', nombre: 'Inventario de información y otros activos asociados', criterio: 'Se debe desarrollar y mantener un inventario de información y otros activos asociados, incluidos los propietarios.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.9 (Inventario de información y otros activos asociados)?', ejemplo_aplicacion: 'Mantenimiento de un inventario de activos de información', evidencia_sugerida: 'Registro de inventario actualizado' },
  { id_control: 10, codigo_iso: '5.10', categoria: 'ORGANIZACIONAL', nombre: 'Uso aceptable de información y otros activos asociados', criterio: 'Deben identificarse, documentarse e implementarse reglas para el uso aceptable y procedimientos para el manejo de la información y otros activos asociados.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.10 (Uso aceptable de información y otros activos asociados)?', ejemplo_aplicacion: 'Políticas de uso aceptable para empleados', evidencia_sugerida: 'Documento de política de uso aceptable' },
  { id_control: 11, codigo_iso: '5.11', categoria: 'ORGANIZACIONAL', nombre: 'Retorno de los activos', criterio: 'El personal y otras partes interesadas, según corresponda, deben devolver todos los activos de la organización que estén en su poder al cambiar o terminar su empleo, contrato o acuerdo.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.11 (Retorno de los activos)?', ejemplo_aplicacion: 'Proceso de devolución de equipos al finalizar el empleo', evidencia_sugerida: 'Registros de devolución de activos' },
  { id_control: 12, codigo_iso: '5.12', categoria: 'ORGANIZACIONAL', nombre: 'Clasificación de información', criterio: 'La información debe clasificarse de acuerdo con las necesidades de seguridad de la información de la organización en función de la confidencialidad, la integridad, la disponibilidad y los requisitos pertinentes de las partes interesadas.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.12 (Clasificación de información)?', ejemplo_aplicacion: 'Clasificación de documentos según su sensibilidad', evidencia_sugerida: 'Registros de clasificación y etiquetado de documentos' },
  { id_control: 13, codigo_iso: '5.13', categoria: 'ORGANIZACIONAL', nombre: 'Etiquetado de información', criterio: 'Se debe desarrollar e implementar un conjunto apropiado de procedimientos para el etiquetado de la información de acuerdo con el esquema de clasificación de la información adoptado por la organización.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.13 (Etiquetado de información)?', ejemplo_aplicacion: 'Etiquetado de documentos confidenciales', evidencia_sugerida: 'Ejemplos de documentos etiquetados' },
  { id_control: 14, codigo_iso: '5.14', categoria: 'ORGANIZACIONAL', nombre: 'Transferencia de información', criterio: 'Deben existir reglas, procedimientos o acuerdos de transferencia de información para todos los tipos de instalaciones de transferencia dentro de la organización y entre la organización y otras partes.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.14 (Transferencia de información)?', ejemplo_aplicacion: 'Procedimientos para la transferencia segura de datos', evidencia_sugerida: 'Registros de transferencias y protocolos de seguridad' },
  { id_control: 15, codigo_iso: '5.15', categoria: 'ORGANIZACIONAL', nombre: 'Control de acceso', criterio: 'Las reglas para controlar el acceso físico y lógico a la información y otros activos asociados deben establecerse e implementarse en función de los requisitos comerciales y de seguridad de la información.', pregunta_orientadora: '¿Hay reglas de acceso basadas en requisitos del negocio y de seguridad?', ejemplo_aplicacion: 'Implementación de controles de acceso a sistemas', evidencia_sugerida: 'Registros de acceso y auditorías de seguridad' },
  { id_control: 16, codigo_iso: '5.16', categoria: 'ORGANIZACIONAL', nombre: 'Gestión de identidad', criterio: 'Debe gestionarse el ciclo de vida completo de las identidades.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.16 (Gestión de identidad)?', ejemplo_aplicacion: 'Uso de sistemas de gestión de identidades', evidencia_sugerida: 'Registros de gestión de identidades' },
  { id_control: 17, codigo_iso: '5.17', categoria: 'ORGANIZACIONAL', nombre: 'Información de autenticación', criterio: 'La asignación y gestión de la información de autenticación debe controlarse mediante un proceso de gestión, incluido el asesoramiento al personal sobre el manejo adecuado de la información de autenticación.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.17 (Información de autenticación)?', ejemplo_aplicacion: 'Almacenamiento seguro de contraseñas', evidencia_sugerida: 'Registros de contraseñas y políticas de gestión' },
  { id_control: 18, codigo_iso: '5.18', categoria: 'ORGANIZACIONAL', nombre: 'Derechos de acceso', criterio: 'Los derechos de acceso a la información y otros activos asociados deben proporcionarse, revisarse, modificarse y eliminarse de acuerdo con la política y las reglas de control de acceso específicas del tema de la organización.', pregunta_orientadora: '¿Se aprueban, revisan y retiran los derechos de acceso mediante un procedimiento?', ejemplo_aplicacion: 'Asignación de derechos de acceso basados en roles', evidencia_sugerida: 'Registros de derechos de acceso y auditorías' },
  { id_control: 19, codigo_iso: '5.19', categoria: 'ORGANIZACIONAL', nombre: 'Seguridad de la información en las relaciones con los proveedores', criterio: 'Deben definirse e implementarse procesos y procedimientos para gestionar los riesgos de seguridad de la información asociados con el uso de los productos o servicios del proveedor.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.19 (Seguridad de la información en las relaciones con los proveedores)?', ejemplo_aplicacion: 'Evaluación de seguridad de proveedores', evidencia_sugerida: 'Informes de evaluación de proveedores' },
  { id_control: 20, codigo_iso: '5.20', categoria: 'ORGANIZACIONAL', nombre: 'Abordar la seguridad de la información dentro de los acuerdos de proveedores', criterio: 'Los requisitos de seguridad de la información pertinentes deben establecerse y acordarse con cada proveedor en función del tipo de relación con el proveedor.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.20 (Abordar la seguridad de la información dentro de los acuerdos de proveedores)?', ejemplo_aplicacion: 'Inclusión de cláusulas de seguridad en contratos', evidencia_sugerida: 'Copias de contratos con cláusulas de seguridad' },
  { id_control: 21, codigo_iso: '5.21', categoria: 'ORGANIZACIONAL', nombre: 'Gestión de la seguridad de la información en la cadena de suministro de las TIC', criterio: 'Deben definirse e implementarse procesos y procedimientos para gestionar los riesgos de seguridad de la información asociados con la cadena de suministro de productos y servicios de TIC.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.21 (Gestión de la seguridad de la información en la cadena de suministro de las TIC)?', ejemplo_aplicacion: 'Evaluación de riesgos en la cadena de suministro', evidencia_sugerida: 'Informes de evaluación de riesgos en la cadena de suministro' },
  { id_control: 22, codigo_iso: '5.22', categoria: 'ORGANIZACIONAL', nombre: 'Monitoreo, revisión y gestión de cambios de servicios de proveedores', criterio: 'La organización debe monitorear, revisar, evaluar y gestionar periódicamente los cambios en las prácticas de seguridad de la información del proveedor y la prestación de servicios.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.22 (Monitoreo, revisión y gestión de cambios de servicios de proveedores)?', ejemplo_aplicacion: 'Revisión periódica de servicios de proveedores', evidencia_sugerida: 'Informes de revisión y auditorías' },
  { id_control: 23, codigo_iso: '5.23', categoria: 'ORGANIZACIONAL', nombre: 'Seguridad de la información para el uso de servicios en la nube', criterio: 'Los procesos de adquisición, uso, gestión y salida de los servicios en la nube deben establecerse de acuerdo con los requisitos de seguridad de la información de la organización.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.23 (Seguridad de la información para el uso de servicios en la nube)?', ejemplo_aplicacion: 'Evaluación de proveedores de servicios en la nube', evidencia_sugerida: 'Informes de evaluación de proveedores de nube' },
  { id_control: 24, codigo_iso: '5.24', categoria: 'ORGANIZACIONAL', nombre: 'Planificación y preparación de la gestión de incidentes de seguridad de la información', criterio: 'La organización debe planificar y prepararse para la gestión de incidentes de seguridad de la información definiendo, estableciendo y comunicando procesos, funciones y responsabilidades de gestión de incidentes de seguridad de la información.', pregunta_orientadora: '¿Hay procesos, roles y responsabilidades definidos para gestionar incidentes?', ejemplo_aplicacion: 'Establecimiento de un plan de respuesta a incidentes', evidencia_sugerida: 'Plan de respuesta documentado y pruebas realizadas' },
  { id_control: 25, codigo_iso: '5.25', categoria: 'ORGANIZACIONAL', nombre: 'Evaluación y decisión sobre eventos de seguridad de la información', criterio: 'La organización debe evaluar los eventos de seguridad de la información y decidir si se clasificarán como incidentes de seguridad de la información.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.25 (Evaluación y decisión sobre eventos de seguridad de la información)?', ejemplo_aplicacion: 'Proceso de evaluación de incidentes', evidencia_sugerida: 'Registros de incidentes y decisiones tomadas' },
  { id_control: 26, codigo_iso: '5.26', categoria: 'ORGANIZACIONAL', nombre: 'Respuesta a incidentes de seguridad de la información', criterio: 'Se debe responder a los incidentes de seguridad de la información de acuerdo con los procedimientos documentados.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.26 (Respuesta a incidentes de seguridad de la información)?', ejemplo_aplicacion: 'Ejecución de un plan de respuesta a incidentes', evidencia_sugerida: 'Informes de incidentes y acciones correctivas' },
  { id_control: 27, codigo_iso: '5.27', categoria: 'ORGANIZACIONAL', nombre: 'Aprender de los incidentes de seguridad de la información', criterio: 'El conocimiento obtenido de los incidentes de seguridad de la información debe utilizarse para fortalecer y mejorar los controles de seguridad de la información.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.27 (Aprender de los incidentes de seguridad de la información)?', ejemplo_aplicacion: 'Análisis post-incidente para mejorar procesos', evidencia_sugerida: 'Informes de análisis post-incidente' },
  { id_control: 28, codigo_iso: '5.28', categoria: 'ORGANIZACIONAL', nombre: 'Recopilación de evidencia', criterio: 'La organización debe establecer e implementar procedimientos para la identificación, recopilación, adquisición y preservación de evidencia relacionada con eventos de seguridad de la información.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.28 (Recopilación de evidencia)?', ejemplo_aplicacion: 'Documentación de incidentes y recopilación de evidencia', evidencia_sugerida: 'Registros de incidentes y evidencia recopilada' },
  { id_control: 29, codigo_iso: '5.29', categoria: 'ORGANIZACIONAL', nombre: 'Seguridad de la información durante eventos disruptivos', criterio: 'La organización debe planificar cómo mantener la seguridad de la información en un nivel adecuado durante la interrupción.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.29 (Seguridad de la información durante eventos disruptivos)?', ejemplo_aplicacion: 'Planificación de continuidad del negocio', evidencia_sugerida: 'Plan de continuidad del negocio documentado' },
  { id_control: 30, codigo_iso: '5.30', categoria: 'ORGANIZACIONAL', nombre: 'Preparación para las TIC para la continuidad del negocio', criterio: 'La preparación de las TIC debe planificarse, implementarse, mantenerse y probarse en función de los objetivos de continuidad del negocio y los requisitos de continuidad de las TIC.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.30 (Preparación para las TIC para la continuidad del negocio)?', ejemplo_aplicacion: 'Evaluación de riesgos de TIC para continuidad', evidencia_sugerida: 'Informes de evaluación de riesgos de TIC' },
  { id_control: 31, codigo_iso: '5.31', categoria: 'ORGANIZACIONAL', nombre: 'Requisitos legales, estatutarios, reglamentarios y contractuales', criterio: 'Los requisitos legales, estatutarios, reglamentarios y contractuales relevantes para la seguridad de la información y el enfoque de la organización para cumplir con estos requisitos deben identificarse, documentarse y mantenerse actualizados.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.31 (Requisitos legales, estatutarios, reglamentarios y contractuales)?', ejemplo_aplicacion: 'Cumplimiento de normativas de seguridad', evidencia_sugerida: 'Registros de cumplimiento y auditorías' },
  { id_control: 32, codigo_iso: '5.32', categoria: 'ORGANIZACIONAL', nombre: 'Derechos de propiedad intelectual', criterio: 'La organización debe implementar procedimientos apropiados para proteger los derechos de propiedad intelectual.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.32 (Derechos de propiedad intelectual)?', ejemplo_aplicacion: 'Protección de propiedad intelectual en contratos', evidencia_sugerida: 'Documentación de derechos de propiedad intelectual' },
  { id_control: 33, codigo_iso: '5.33', categoria: 'ORGANIZACIONAL', nombre: 'Protección de registros', criterio: 'Los registros deben protegerse contra pérdida, destrucción, falsificación, acceso no autorizado y publicación no autorizada.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.33 (Protección de registros)?', ejemplo_aplicacion: 'Implementación de controles de acceso a registros', evidencia_sugerida: 'Registros de acceso y auditorías de seguridad' },
  { id_control: 34, codigo_iso: '5.34', categoria: 'ORGANIZACIONAL', nombre: 'Privacidad y protección de PII', criterio: 'La organización debe identificar y cumplir los requisitos relacionados con la preservación de la privacidad y la protección de la PII de acuerdo con las leyes y reglamentos aplicables y los requisitos contractuales.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.34 (Privacidad y protección de PII)?', ejemplo_aplicacion: 'Implementar políticas de privacidad y tratamiento de datos personales (PII) conforme a la ley.', evidencia_sugerida: 'Política de tratamiento de datos personales, avisos de privacidad y registro de bases de datos.' },
  { id_control: 35, codigo_iso: '5.35', categoria: 'ORGANIZACIONAL', nombre: 'Revisión independiente de la seguridad de la información', criterio: 'El enfoque de la organización para gestionar la seguridad de la información y su implementación, incluidas las personas, los procesos y las tecnologías, debe revisarse de forma independiente a intervalos planificados o cuando se produzcan cambios significativos.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.35 (Revisión independiente de la seguridad de la información)?', ejemplo_aplicacion: 'Realizar auditorías internas o externas independientes sobre el SGSI anualmente.', evidencia_sugerida: 'Informes de auditoría independiente y planes de acción derivados.' },
  { id_control: 36, codigo_iso: '5.36', categoria: 'ORGANIZACIONAL', nombre: 'Cumplimiento de las políticas, reglas y estándares para la seguridad de la información', criterio: 'El cumplimiento de la política de seguridad de la información de la organización, las políticas específicas del tema, las reglas y los estándares debe revisarse periódicamente.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.36 (Cumplimiento de las políticas, reglas y estándares para la seguridad de la información)?', ejemplo_aplicacion: 'Ejecutar revisiones periódicas de cumplimiento de políticas y estándares de seguridad por área.', evidencia_sugerida: 'Listas de verificación de cumplimiento e informes de revisión periódica.' },
  { id_control: 37, codigo_iso: '5.37', categoria: 'ORGANIZACIONAL', nombre: 'Procedimientos operativos documentados', criterio: 'Los procedimientos operativos para las instalaciones de procesamiento de información deben documentarse y ponerse a disposición del personal que los necesite.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 5.37 (Procedimientos operativos documentados)?', ejemplo_aplicacion: 'Documentar manuales y procedimientos operativos estándar para administración de servidores y redes.', evidencia_sugerida: 'Manuales de procedimientos operativos documentados, versionados y socializados.' },
  { id_control: 38, codigo_iso: '6.1', categoria: 'PERSONAS', nombre: 'Selección', criterio: 'Los controles de verificación de antecedentes de todos los candidatos para convertirse en personal deben llevarse a cabo antes de unirse a la organización y de manera continua, teniendo en cuenta las leyes, regulaciones y ética aplicables, y deben ser proporcionales a los requisitos comerciales, la clasificación de la información a la que se accede y los riesgos percibidos.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 6.1 (Selección)?', ejemplo_aplicacion: 'Realizar entrevistas y verificaciones de antecedentes antes de la contratación.', evidencia_sugerida: 'Registros de entrevistas y resultados de verificaciones de antecedentes.' },
  { id_control: 39, codigo_iso: '6.2', categoria: 'PERSONAS', nombre: 'Términos y condiciones de empleo', criterio: 'Los acuerdos contractuales de empleo deben establecer las responsabilidades del personal y de la organización para la seguridad de la información.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 6.2 (Términos y condiciones de empleo)?', ejemplo_aplicacion: 'Incluir cláusulas de seguridad de la información en los contratos laborales.', evidencia_sugerida: 'Copias de contratos laborales con cláusulas de seguridad.' },
  { id_control: 40, codigo_iso: '6.3', categoria: 'PERSONAS', nombre: 'Concienciación, educación y formación en seguridad de la información', criterio: 'El personal de la organización y las partes interesadas relevantes deben recibir la conciencia, educación y capacitación adecuadas sobre la seguridad de la información y actualizaciones regulares de la política de seguridad de la información de la organización, las políticas y los procedimientos específicos del tema, según sea relevante para su función laboral.', pregunta_orientadora: '¿El personal recibe formación periódica y pertinente en seguridad de la información?', ejemplo_aplicacion: 'Implementar un programa de capacitación en seguridad de la información para todos los empleados.', evidencia_sugerida: 'Registros de asistencia a capacitaciones y materiales de capacitación.' },
  { id_control: 41, codigo_iso: '6.4', categoria: 'PERSONAS', nombre: 'Proceso Disciplinario', criterio: 'Se debe formalizar y comunicar un proceso disciplinario para tomar acciones contra el personal y otras partes interesadas relevantes que hayan cometido una violación de la política de seguridad de la información.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 6.4 (Proceso Disciplinario)?', ejemplo_aplicacion: 'Establecer un procedimiento para manejar violaciones de seguridad.', evidencia_sugerida: 'Documentación del procedimiento disciplinario y registros de incidentes.' },
  { id_control: 42, codigo_iso: '6.5', categoria: 'PERSONAS', nombre: 'Responsabilidades después de la terminación o cambio de empleo', criterio: 'Las responsabilidades y deberes de seguridad de la información que siguen siendo válidos después de la terminación o el cambio de empleo deben definirse, aplicarse y comunicarse al personal pertinente y otras partes interesadas.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 6.5 (Responsabilidades después de la terminación o cambio de empleo)?', ejemplo_aplicacion: 'Revocar accesos y recuperar activos de la empresa al finalizar la relación laboral.', evidencia_sugerida: 'Registros de revocación de accesos y recuperación de activos.' },
  { id_control: 43, codigo_iso: '6.6', categoria: 'PERSONAS', nombre: 'Acuerdos de confidencialidad o no divulgación', criterio: 'Los acuerdos de confidencialidad o no divulgación que reflejen las necesidades de la organización para la protección de la información deben ser identificados, documentados, revisados regularmente y firmados por el personal y otras partes interesadas relevantes.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 6.6 (Acuerdos de confidencialidad o no divulgación)?', ejemplo_aplicacion: 'Hacer firmar acuerdos de confidencialidad a todos los empleados.', evidencia_sugerida: 'Copias firmadas de acuerdos de confidencialidad.' },
  { id_control: 44, codigo_iso: '6.7', categoria: 'PERSONAS', nombre: 'Trabajo remoto', criterio: 'Se deben implementar medidas de seguridad cuando el personal trabaja de forma remota para proteger la información a la que se accede, procesa o almacena fuera de las instalaciones de la organización.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 6.7 (Trabajo remoto)?', ejemplo_aplicacion: 'Proporcionar directrices de seguridad para el trabajo remoto.', evidencia_sugerida: 'Documentación de políticas de trabajo remoto y registros de capacitación.' },
  { id_control: 45, codigo_iso: '6.8', categoria: 'PERSONAS', nombre: 'Reporte de eventos de seguridad de la información', criterio: 'La organización debe proporcionar un mecanismo para que el personal informe eventos de seguridad de la información observados o sospechados a través de los canales apropiados de manera oportuna.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 6.8 (Reporte de eventos de seguridad de la información)?', ejemplo_aplicacion: 'Establecer un procedimiento para reportar incidentes de seguridad.', evidencia_sugerida: 'Registros de incidentes reportados y acciones tomadas.' },
  { id_control: 46, codigo_iso: '7.1', categoria: 'FISICO', nombre: 'Perímetros de seguridad física', criterio: 'Los perímetros de seguridad deben definirse y utilizarse para proteger las áreas que contienen información y otros activos asociados.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.1 (Perímetros de seguridad física)?', ejemplo_aplicacion: 'Implementar cercas y sistemas de control de acceso en las instalaciones.', evidencia_sugerida: 'Informes de auditoría de seguridad y planos de las instalaciones.' },
  { id_control: 47, codigo_iso: '7.2', categoria: 'FISICO', nombre: 'Entrada física', criterio: 'Las áreas seguras deben estar protegidas por controles de entrada y puntos de acceso apropiados.', pregunta_orientadora: '¿Las áreas seguras tienen controles de entrada y registro de accesos?', ejemplo_aplicacion: 'Controlar el acceso a las instalaciones mediante tarjetas de identificación.', evidencia_sugerida: 'Registros de acceso y listas de control de visitantes.' },
  { id_control: 48, codigo_iso: '7.3', categoria: 'FISICO', nombre: 'Seguridad de oficinas, salas e instalaciones', criterio: 'Debe diseñarse e implementarse la seguridad física de las oficinas, salas e instalaciones.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.3 (Seguridad de oficinas, salas e instalaciones)?', ejemplo_aplicacion: 'Instalar cerraduras y sistemas de alarma en áreas sensibles.', evidencia_sugerida: 'Informes de instalación de sistemas de seguridad y mantenimiento.' },
  { id_control: 49, codigo_iso: '7.4', categoria: 'FISICO', nombre: 'Monitoreo de seguridad física', criterio: 'Las instalaciones deben ser monitoreadas continuamente para detectar accesos físicos no autorizados.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.4 (Monitoreo de seguridad física)?', ejemplo_aplicacion: 'Utilizar cámaras de vigilancia para monitorear áreas críticas.', evidencia_sugerida: 'Grabaciones de video y registros de monitoreo.' },
  { id_control: 50, codigo_iso: '7.5', categoria: 'FISICO', nombre: 'Protección contra amenazas físicas y ambientales', criterio: 'Se debe diseñar e implementar la protección contra amenazas físicas y ambientales, como desastres naturales y otras amenazas físicas intencionales o no intencionales a la infraestructura.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.5 (Protección contra amenazas físicas y ambientales)?', ejemplo_aplicacion: 'Implementar medidas contra incendios y desastres naturales.', evidencia_sugerida: 'Certificados de inspección de seguridad y planes de emergencia.' },
  { id_control: 51, codigo_iso: '7.6', categoria: 'FISICO', nombre: 'Trabajo en áreas seguras', criterio: 'Se deben diseñar e implementar medidas de seguridad para trabajar en áreas seguras.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.6 (Trabajo en áreas seguras)?', ejemplo_aplicacion: 'Designar áreas específicas para el manejo de información sensible.', evidencia_sugerida: 'Documentación de políticas de seguridad y asignación de áreas.' },
  { id_control: 52, codigo_iso: '7.7', categoria: 'FISICO', nombre: 'Escritorio limpio y pantalla limpia', criterio: 'Deben definirse y aplicarse adecuadamente reglas de escritorio limpio para documentos y medios de almacenamiento extraíbles y reglas de pantalla limpia para las instalaciones de procesamiento de información.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.7 (Escritorio limpio y pantalla limpia)?', ejemplo_aplicacion: 'Asegurar que las pantallas de computadoras no sean visibles desde el exterior.', evidencia_sugerida: 'Fotografías de las áreas de trabajo y políticas de seguridad.' },
  { id_control: 53, codigo_iso: '7.8', categoria: 'FISICO', nombre: 'Ubicación y protección de equipos', criterio: 'El equipo debe estar ubicado de forma segura y protegida.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.8 (Ubicación y protección de equipos)?', ejemplo_aplicacion: 'Establecer procedimientos para el manejo seguro de equipos sensibles.', evidencia_sugerida: 'Documentación de procedimientos y registros de capacitación.' },
  { id_control: 54, codigo_iso: '7.9', categoria: 'FISICO', nombre: 'Seguridad de activos fuera de las instalaciones', criterio: 'Los activos fuera del sitio deben estar protegidos.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.9 (Seguridad de activos fuera de las instalaciones)?', ejemplo_aplicacion: 'Implementar políticas para el transporte seguro de activos.', evidencia_sugerida: 'Registros de transporte y auditorías de seguridad.' },
  { id_control: 55, codigo_iso: '7.10', categoria: 'FISICO', nombre: 'Medios de almacenamiento', criterio: 'Los medios de almacenamiento deben gestionarse a lo largo de su ciclo de vida de adquisición, uso, transporte y eliminación de acuerdo con el esquema de clasificación y los requisitos de manipulación de la organización.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.10 (Medios de almacenamiento)?', ejemplo_aplicacion: 'Asegurar que los medios de almacenamiento sean protegidos y cifrados.', evidencia_sugerida: 'Inventarios de medios y registros de acceso.' },
  { id_control: 56, codigo_iso: '7.11', categoria: 'FISICO', nombre: 'Servicios de suministro', criterio: 'Los equipos se deben proteger contra fallas de energía y otras interrupciones causadas por fallas en los servicios de suministro.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.11 (Servicios de suministro)?', ejemplo_aplicacion: 'Asegurar que los servicios públicos (agua, electricidad) no comprometan la seguridad.', evidencia_sugerida: 'Informes de auditoría de servicios y planes de contingencia.' },
  { id_control: 57, codigo_iso: '7.12', categoria: 'FISICO', nombre: 'Seguridad del cableado', criterio: 'Los cables que transportan energía, datos o servicios de información de apoyo deben protegerse contra intercepciones, interferencias o daños.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.12 (Seguridad del cableado)?', ejemplo_aplicacion: 'Utilizar cableado seguro y protegido para evitar interferencias.', evidencia_sugerida: 'Informes de instalación y mantenimiento de cableado.' },
  { id_control: 58, codigo_iso: '7.13', categoria: 'FISICO', nombre: 'Mantenimiento de equipo', criterio: 'El equipo debe mantenerse correctamente para garantizar la disponibilidad, integridad y confidencialidad de la información.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.13 (Mantenimiento de equipo)?', ejemplo_aplicacion: 'Realizar mantenimiento regular de equipos de seguridad.', evidencia_sugerida: 'Registros de mantenimiento y auditorías de equipos.' },
  { id_control: 59, codigo_iso: '7.14', categoria: 'FISICO', nombre: 'Eliminación o reutilización segura del equipo', criterio: 'Los elementos del equipo que contengan medios de almacenamiento deben verificarse para garantizar que todos los datos confidenciales y el software con licencia se hayan eliminado o sobrescrito de forma segura antes de su eliminación o reutilización.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 7.14 (Eliminación o reutilización segura del equipo)?', ejemplo_aplicacion: 'Implementar procedimientos para la eliminación segura de equipos obsoletos.', evidencia_sugerida: 'Documentación de eliminación y registros de activos.' },
  { id_control: 60, codigo_iso: '8.1', categoria: 'TECNOLOGICO', nombre: 'Dispositivos finales de usuario', criterio: 'La información almacenada, procesada o accesible a través de los dispositivos finales de los usuarios debe protegerse.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.1 (Dispositivos finales de usuario)?', ejemplo_aplicacion: 'Implementar políticas de seguridad para el uso de dispositivos personales.', evidencia_sugerida: 'Documentación de políticas y registros de cumplimiento.' },
  { id_control: 61, codigo_iso: '8.2', categoria: 'TECNOLOGICO', nombre: 'Derechos de acceso privilegiados', criterio: 'La asignación y el uso de derechos de acceso privilegiado deben restringirse y gestionarse.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.2 (Derechos de acceso privilegiados)?', ejemplo_aplicacion: 'Limitar el acceso a sistemas críticos solo a personal autorizado.', evidencia_sugerida: 'Registros de acceso y auditorías de permisos.' },
  { id_control: 62, codigo_iso: '8.3', categoria: 'TECNOLOGICO', nombre: 'Restricción de acceso a la información', criterio: 'El acceso a la información y otros activos asociados debe estar restringido de acuerdo con la política específica del tema establecida sobre control de acceso.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.3 (Restricción de acceso a la información)?', ejemplo_aplicacion: 'Utilizar controles de acceso basados en roles para la información sensible.', evidencia_sugerida: 'Informes de auditoría de acceso y registros de permisos.' },
  { id_control: 63, codigo_iso: '8.4', categoria: 'TECNOLOGICO', nombre: 'Acceso al código fuente', criterio: 'El acceso de lectura y escritura al código fuente, las herramientas de desarrollo y las bibliotecas de software debe administrarse adecuadamente.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.4 (Acceso al código fuente)?', ejemplo_aplicacion: 'Proteger el acceso al código fuente mediante autenticación multifactor.', evidencia_sugerida: 'Registros de acceso y auditorías de seguridad.' },
  { id_control: 64, codigo_iso: '8.5', categoria: 'TECNOLOGICO', nombre: 'Autenticación segura', criterio: 'Las tecnologías y los procedimientos de autenticación segura deben implementarse en función de las restricciones de acceso a la información y la política específica del tema sobre el control de acceso.', pregunta_orientadora: '¿La autenticación es acorde con el riesgo (por ejemplo, múltiple factor en accesos privilegiados)?', ejemplo_aplicacion: 'Implementar autenticación de dos factores para el acceso a sistemas críticos.', evidencia_sugerida: 'Registros de autenticación y auditorías de acceso.' },
  { id_control: 65, codigo_iso: '8.6', categoria: 'TECNOLOGICO', nombre: 'Gestión de capacidad', criterio: 'El uso de los recursos debe monitorearse y ajustarse de acuerdo con los requisitos de capacidad actuales y esperados.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.6 (Gestión de capacidad)?', ejemplo_aplicacion: 'Monitorear el uso de recursos para evitar sobrecargas en sistemas.', evidencia_sugerida: 'Informes de capacidad y registros de monitoreo.' },
  { id_control: 66, codigo_iso: '8.7', categoria: 'TECNOLOGICO', nombre: 'Protección contra malware', criterio: 'La protección contra el malware debe implementarse y respaldarse mediante la conciencia adecuada del usuario.', pregunta_orientadora: '¿Existe protección contra malware actualizada en equipos y servidores?', ejemplo_aplicacion: 'Instalar y actualizar software antivirus en todos los dispositivos.', evidencia_sugerida: 'Informes de escaneo y registros de actualizaciones.' },
  { id_control: 67, codigo_iso: '8.8', categoria: 'TECNOLOGICO', nombre: 'Gestión de vulnerabilidades técnicas', criterio: 'Se debe obtener información sobre las vulnerabilidades técnicas de los sistemas de información en uso, se debe evaluar la exposición de la organización a tales vulnerabilidades y se deben tomar las medidas apropiadas.', pregunta_orientadora: '¿Se identifican, evalúan y tratan periódicamente las vulnerabilidades técnicas?', ejemplo_aplicacion: 'Realizar análisis de vulnerabilidades periódicos en sistemas.', evidencia_sugerida: 'Informes de análisis y registros de remediación.' },
  { id_control: 68, codigo_iso: '8.9', categoria: 'TECNOLOGICO', nombre: 'Gestión de configuración', criterio: 'Las configuraciones, incluidas las configuraciones de seguridad, de hardware, software, servicios y redes deben establecerse, documentarse, implementarse, monitorearse y revisarse.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.9 (Gestión de configuración)?', ejemplo_aplicacion: 'Mantener un inventario de configuraciones de sistemas y aplicaciones.', evidencia_sugerida: 'Registros de configuración y auditorías de cumplimiento.' },
  { id_control: 69, codigo_iso: '8.10', categoria: 'TECNOLOGICO', nombre: 'Eliminación de información', criterio: 'La información almacenada en sistemas de información, dispositivos o en cualquier otro medio de almacenamiento debe ser eliminada cuando ya no sea necesaria.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.10 (Eliminación de información)?', ejemplo_aplicacion: 'Implementar políticas para la eliminación segura de datos obsoletos.', evidencia_sugerida: 'Registros de eliminación y auditorías de datos.' },
  { id_control: 70, codigo_iso: '8.11', categoria: 'TECNOLOGICO', nombre: 'Enmascaramiento de datos', criterio: 'El enmascaramiento de datos se debe utilizar de acuerdo con la política específica del tema de la organización sobre el control de acceso y otras políticas relacionadas con el tema específico, y los requisitos comerciales, teniendo en cuenta la legislación aplicable.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.11 (Enmascaramiento de datos)?', ejemplo_aplicacion: 'Utilizar enmascaramiento de datos en entornos de desarrollo.', evidencia_sugerida: 'Documentación de procesos y registros de enmascaramiento.' },
  { id_control: 71, codigo_iso: '8.12', categoria: 'TECNOLOGICO', nombre: 'Prevención de fuga de datos', criterio: 'Las medidas de prevención de fuga de datos deben aplicarse a los sistemas, redes y cualquier otro dispositivo que procese, almacene o transmita información confidencial.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.12 (Prevención de fuga de datos)?', ejemplo_aplicacion: 'Implementar soluciones DLP (Data Loss Prevention) en la red.', evidencia_sugerida: 'Informes de incidentes y registros de monitoreo.' },
  { id_control: 72, codigo_iso: '8.13', categoria: 'TECNOLOGICO', nombre: 'Copia de seguridad de la información', criterio: 'Las copias de respaldo de la información, el software y los sistemas deben mantenerse y probarse regularmente de acuerdo con la política de respaldo específica del tema acordada.', pregunta_orientadora: '¿Las copias se realizan según una política y se prueba su restauración?', ejemplo_aplicacion: 'Realizar copias de seguridad automáticas de datos críticos.', evidencia_sugerida: 'Registros de copias de seguridad y auditorías de recuperación.' },
  { id_control: 73, codigo_iso: '8.14', categoria: 'TECNOLOGICO', nombre: 'Redundancia de instalaciones de procesamiento de información', criterio: 'Las instalaciones de procesamiento de información deben implementarse con suficiente redundancia para cumplir con los requisitos de disponibilidad.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.14 (Redundancia de instalaciones de procesamiento de información)?', ejemplo_aplicacion: 'Implementar sistemas de respaldo para garantizar la disponibilidad.', evidencia_sugerida: 'Informes de pruebas de recuperación y registros de redundancia.' },
  { id_control: 74, codigo_iso: '8.15', categoria: 'TECNOLOGICO', nombre: 'Registro de eventos', criterio: 'Se deben producir, almacenar, proteger y analizar registros que registren actividades, excepciones, fallas y otros eventos relevantes.', pregunta_orientadora: '¿Se generan, protegen y revisan los registros de actividad?', ejemplo_aplicacion: 'Mantener registros de acceso y cambios en sistemas críticos.', evidencia_sugerida: 'Registros de auditoría y documentación de cambios.' },
  { id_control: 75, codigo_iso: '8.16', categoria: 'TECNOLOGICO', nombre: 'Actividades de monitoreo', criterio: 'Las redes, los sistemas y las aplicaciones deben monitorearse para detectar comportamientos anómalos y deben tomarse las medidas apropiadas para evaluar posibles incidentes de seguridad de la información.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.16 (Actividades de monitoreo)?', ejemplo_aplicacion: 'Monitorear el tráfico de red para detectar actividades sospechosas.', evidencia_sugerida: 'Informes de monitoreo y registros de incidentes.' },
  { id_control: 76, codigo_iso: '8.17', categoria: 'TECNOLOGICO', nombre: 'Sincronización de reloj', criterio: 'Los relojes de los sistemas de procesamiento de información utilizados por la organización deben sincronizarse con las fuentes de tiempo aprobadas.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.17 (Sincronización de reloj)?', ejemplo_aplicacion: 'Utilizar servidores de tiempo para sincronizar todos los sistemas.', evidencia_sugerida: 'Registros de sincronización y auditorías de tiempo.' },
  { id_control: 77, codigo_iso: '8.18', categoria: 'TECNOLOGICO', nombre: 'Uso de programas de utilidad privilegiados', criterio: 'El uso de programas de utilidad que puedan anular los controles del sistema y de las aplicaciones debe restringirse y controlarse estrictamente.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.18 (Uso de programas de utilidad privilegiados)?', ejemplo_aplicacion: 'Restringir el uso de herramientas administrativas a personal autorizado.', evidencia_sugerida: 'Registros de acceso y auditorías de uso de herramientas.' },
  { id_control: 78, codigo_iso: '8.19', categoria: 'TECNOLOGICO', nombre: 'Instalación de software en sistemas operativos', criterio: 'Deben implementarse procedimientos y medidas para gestionar de forma segura la instalación de software en los sistemas operativos.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.19 (Instalación de software en sistemas operativos)?', ejemplo_aplicacion: 'Implementar un proceso de aprobación para la instalación de software.', evidencia_sugerida: 'Registros de instalación y auditorías de cumplimiento.' },
  { id_control: 79, codigo_iso: '8.20', categoria: 'TECNOLOGICO', nombre: 'Seguridad de las redes', criterio: 'Las redes y los dispositivos de red deben protegerse, administrarse y controlarse para proteger la información en los sistemas y aplicaciones.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.20 (Seguridad de las redes)?', ejemplo_aplicacion: 'Implementar firewalls y sistemas de detección de intrusos.', evidencia_sugerida: 'Informes de configuración de red y auditorías de seguridad.' },
  { id_control: 80, codigo_iso: '8.21', categoria: 'TECNOLOGICO', nombre: 'Seguridad de los servicios de red', criterio: 'Los mecanismos de seguridad, los niveles de servicio y los requisitos de servicio de los servicios de red deben identificarse, implementarse y monitorearse.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.21 (Seguridad de los servicios de red)?', ejemplo_aplicacion: 'Asegurar que los servicios de red estén protegidos contra ataques.', evidencia_sugerida: 'Informes de seguridad y registros de incidentes.' },
  { id_control: 81, codigo_iso: '8.22', categoria: 'TECNOLOGICO', nombre: 'Segregación de redes', criterio: 'Los grupos de servicios de información, usuarios y sistemas de información deben estar segregados en las redes de la organización.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.22 (Segregación de redes)?', ejemplo_aplicacion: 'Crear redes separadas para diferentes niveles de seguridad.', evidencia_sugerida: 'Documentación de la arquitectura de red y auditorías.' },
  { id_control: 82, codigo_iso: '8.23', categoria: 'TECNOLOGICO', nombre: 'Filtrado web', criterio: 'El acceso a sitios web externos debe administrarse para reducir la exposición a contenido malicioso.', pregunta_orientadora: '¿Se gestiona el acceso a sitios web externos para reducir la exposición a contenido malicioso?', ejemplo_aplicacion: 'Implementar filtros de contenido para restringir el acceso a sitios peligrosos.', evidencia_sugerida: 'Registros de filtrado y auditorías de uso de internet.' },
  { id_control: 83, codigo_iso: '8.24', categoria: 'TECNOLOGICO', nombre: 'Uso de la criptografía', criterio: 'Deben definirse e implementarse reglas para el uso eficaz de la criptografía, incluida la gestión de claves criptográficas.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.24 (Uso de la criptografía)?', ejemplo_aplicacion: 'Cifrar datos sensibles en reposo y en tránsito.', evidencia_sugerida: 'Registros de cifrado y auditorías de seguridad.' },
  { id_control: 84, codigo_iso: '8.25', categoria: 'TECNOLOGICO', nombre: 'Ciclo de vida de desarrollo seguro', criterio: 'Deben establecerse y aplicarse reglas para el desarrollo seguro de software y sistemas.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.25 (Ciclo de vida de desarrollo seguro)?', ejemplo_aplicacion: 'Integrar prácticas de seguridad en el ciclo de vida del desarrollo de software.', evidencia_sugerida: 'Documentación de procesos y auditorías de desarrollo.' },
  { id_control: 85, codigo_iso: '8.26', categoria: 'TECNOLOGICO', nombre: 'Requisitos de seguridad de la aplicación', criterio: 'Los requisitos de seguridad de la información deben identificarse, especificarse y aprobarse al desarrollar o adquirir aplicaciones.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.26 (Requisitos de seguridad de la aplicación)?', ejemplo_aplicacion: 'Definir y documentar requisitos de seguridad para nuevas aplicaciones.', evidencia_sugerida: 'Documentación de requisitos y auditorías de cumplimiento.' },
  { id_control: 86, codigo_iso: '8.27', categoria: 'TECNOLOGICO', nombre: 'Principios de arquitectura e ingeniería de sistema seguro', criterio: 'Los principios para diseñar sistemas seguros deben establecerse, documentarse, mantenerse y aplicarse a cualquier actividad de desarrollo de sistemas de información.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.27 (Principios de arquitectura e ingeniería de sistema seguro)?', ejemplo_aplicacion: 'Aplicar principios de diseño seguro en la arquitectura de sistemas.', evidencia_sugerida: 'Documentación de diseño y auditorías de arquitectura.' },
  { id_control: 87, codigo_iso: '8.28', categoria: 'TECNOLOGICO', nombre: 'Codificación segura', criterio: 'Los principios de codificación segura deben aplicarse al desarrollo de software.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.28 (Codificación segura)?', ejemplo_aplicacion: 'Capacitar a los desarrolladores en prácticas de codificación segura.', evidencia_sugerida: 'Registros de capacitación y auditorías de código.' },
  { id_control: 88, codigo_iso: '8.29', categoria: 'TECNOLOGICO', nombre: 'Pruebas de seguridad en desarrollo y aceptación', criterio: 'Los procesos de prueba de seguridad deben definirse e implementarse en el ciclo de vida del desarrollo.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.29 (Pruebas de seguridad en desarrollo y aceptación)?', ejemplo_aplicacion: 'Realizar pruebas de seguridad en aplicaciones antes de su implementación.', evidencia_sugerida: 'Informes de pruebas y registros de aceptación.' },
  { id_control: 89, codigo_iso: '8.30', categoria: 'TECNOLOGICO', nombre: 'Desarrollo subcontratado', criterio: 'La organización debe dirigir, monitorear y revisar las actividades relacionadas con el desarrollo de sistemas subcontratados.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.30 (Desarrollo subcontratado)?', ejemplo_aplicacion: 'Asegurar que los subcontratistas cumplan con los requisitos de seguridad.', evidencia_sugerida: 'Contratos y auditorías de cumplimiento.' },
  { id_control: 90, codigo_iso: '8.31', categoria: 'TECNOLOGICO', nombre: 'Separación de entornos de desarrollo, prueba y producción', criterio: 'Los entornos de desarrollo, prueba y producción deben estar separados y protegidos.', pregunta_orientadora: '¿Los entornos están separados y protegidos? (puede resultar no aplicable)', ejemplo_aplicacion: 'Mantener entornos separados para desarrollo, prueba y producción.', evidencia_sugerida: 'Documentación de entornos y auditorías de configuración.' },
  { id_control: 91, codigo_iso: '8.32', categoria: 'TECNOLOGICO', nombre: 'Gestión de cambios', criterio: 'Los cambios en las instalaciones de procesamiento de información y los sistemas de información deben estar sujetos a procedimientos de gestión de cambios.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.32 (Gestión de cambios)?', ejemplo_aplicacion: 'Implementar un proceso formal para la gestión de cambios en sistemas.', evidencia_sugerida: 'Registros de cambios y auditorías de gestión.' },
  { id_control: 92, codigo_iso: '8.33', categoria: 'TECNOLOGICO', nombre: 'Información de prueba', criterio: 'La información de las pruebas debe seleccionarse, protegerse y gestionarse adecuadamente.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.33 (Información de prueba)?', ejemplo_aplicacion: 'Asegurar que la información utilizada en pruebas no contenga datos sensibles.', evidencia_sugerida: 'Documentación de pruebas y auditorías de datos.' },
  { id_control: 93, codigo_iso: '8.34', categoria: 'TECNOLOGICO', nombre: 'Protección de los sistemas de información durante las pruebas de auditoría', criterio: 'Las pruebas de auditoría y otras actividades de aseguramiento que involucren la evaluación de sistemas operacionales deben planificarse y acordarse entre el evaluador y la gerencia correspondiente.', pregunta_orientadora: '¿La organización ha implementado y mantiene evidencias verificables para el control 8.34 (Protección de los sistemas de información durante las pruebas de auditoría)?', ejemplo_aplicacion: 'Implementar controles para proteger sistemas durante auditorías.', evidencia_sugerida: 'Informes de auditoría y registros de seguridad.' },
];

export function buildInitialSeedState() {
  return {
    usuarios: [
      {
        id_usuario: 1,
        nombre: 'Ana R. (Auditora Líder)',
        correo: 'ana.auditora@auditsys.edu.co',
        rol: 'auditor',
      },
      {
        id_usuario: 2,
        nombre: 'Administrador SGSI',
        correo: 'admin@auditsys.edu.co',
        rol: 'admin',
      },
    ],
    controles: JSON.parse(JSON.stringify(INITIAL_CONTROLES)),
    auditorias: [
      {
        id_auditoria: 1,
        organizacion: 'Empresa ABC (Prestadora de Servicios Tecnológicos)',
        objetivo:
          'Evaluar el estado de implementación de 13 controles seleccionados de ISO/IEC 27002:2022 en los servicios de TI de la organización.',
        alcance:
          'Servidores, estaciones de trabajo, aplicaciones empresariales, bases de datos de clientes, red corporativa y usuarios internos y externos.',
        fecha_inicio: '2026-11-09',
        fecha_fin: '2026-11-23',
        referentes: OFFICIAL_REFERENTES,
        estado: 'EN_REVISION',
        id_auditor: 1,
        creado_en: '2026-11-09T08:00:00.000Z',
      },
    ],
    evaluacion_control: [
      { id_evaluacion: 1, id_auditoria: 1, id_control: 1, estado: 'IMPLEMENTADO', observacion: 'Política vigente, aprobada por la gerencia y revisada en 2026.', justificacion_na: null },
      { id_evaluacion: 2, id_auditoria: 1, id_control: 15, estado: 'IMPLEMENTADO', observacion: 'Matriz de roles y permisos aprobada; accesos por perfil.', justificacion_na: null },
      { id_evaluacion: 3, id_auditoria: 1, id_control: 18, estado: 'PARCIAL', observacion: 'Altas y bajas gestionadas; la revisión de accesos no es periódica.', justificacion_na: null },
      { id_evaluacion: 4, id_auditoria: 1, id_control: 24, estado: 'NO_IMPLEMENTADO', observacion: 'No hay procedimiento ni roles definidos para incidentes.', justificacion_na: null },
      { id_evaluacion: 5, id_auditoria: 1, id_control: 40, estado: 'PARCIAL', observacion: 'Inducción inicial sin refuerzo anual ni evaluación.', justificacion_na: null },
      { id_evaluacion: 6, id_auditoria: 1, id_control: 47, estado: 'IMPLEMENTADO', observacion: 'Acceso al cuarto de servidores con tarjeta y bitácora.', justificacion_na: null },
      { id_evaluacion: 7, id_auditoria: 1, id_control: 64, estado: 'PARCIAL', observacion: 'Autenticación multifactor solo en cuentas administrativas.', justificacion_na: null },
      { id_evaluacion: 8, id_auditoria: 1, id_control: 66, estado: 'IMPLEMENTADO', observacion: 'Antimalware centralizado y actualizado en toda la muestra.', justificacion_na: null },
      { id_evaluacion: 9, id_auditoria: 1, id_control: 67, estado: 'NO_IMPLEMENTADO', observacion: 'No se realizan escaneos periódicos de vulnerabilidades.', justificacion_na: null },
      { id_evaluacion: 10, id_auditoria: 1, id_control: 72, estado: 'PARCIAL', observacion: 'Respaldos diarios; sin pruebas de restauración documentadas.', justificacion_na: null },
      { id_evaluacion: 11, id_auditoria: 1, id_control: 74, estado: 'NO_IMPLEMENTADO', observacion: 'Registros locales sin centralización ni revisión.', justificacion_na: null },
      { id_evaluacion: 12, id_auditoria: 1, id_control: 82, estado: 'PARCIAL', observacion: 'Filtrado web solo en la sede principal.', justificacion_na: null },
      { id_evaluacion: 13, id_auditoria: 1, id_control: 90, estado: 'NO_APLICABLE', observacion: 'Control fuera del alcance operativo de desarrollo interno.', justificacion_na: 'Justificación: la empresa adquiere soluciones como servicio (SaaS) y no desarrolla software propio.' },
    ],
    evidencias: [
      { id_evidencia: 1, id_evaluacion: 1, codigo_evidencia: 'EV-01', descripcion: 'Política de seguridad v2.0 (documental)', fuente: 'Repositorio Documental SGSI', fecha_evidencia: '2026-11-10', referencia_url: 'SGI-POL-001_v2.pdf', es_simulada: true },
      { id_evidencia: 2, id_evaluacion: 2, codigo_evidencia: 'EV-02', descripcion: 'Matriz de roles y permisos (documental)', fuente: 'Dirección de TI', fecha_evidencia: '2026-11-10', referencia_url: 'TI-MAT-002_Roles.xlsx', es_simulada: true },
      { id_evidencia: 3, id_evaluacion: 3, codigo_evidencia: 'EV-03', descripcion: 'Entrevista al líder de TI sobre gestión de accesos', fuente: 'Entrevista directa / Acta', fecha_evidencia: '2026-11-11', referencia_url: 'ACTA-ENT-001.pdf', es_simulada: true },
      { id_evidencia: 4, id_evaluacion: 4, codigo_evidencia: 'EV-04', descripcion: 'Acta de entrevista (ausencia de procedimiento)', fuente: 'Líder de Operaciones TI', fecha_evidencia: '2026-11-11', referencia_url: 'ACTA-ENT-002.pdf', es_simulada: true },
      { id_evidencia: 5, id_evaluacion: 5, codigo_evidencia: 'EV-05', descripcion: 'Lista de asistencia a inducción de personal', fuente: 'Gestión del Talento Humano', fecha_evidencia: '2026-11-12', referencia_url: 'TTHH-IND-2026.pdf', es_simulada: true },
      { id_evidencia: 6, id_evaluacion: 6, codigo_evidencia: 'EV-06', descripcion: 'Registro fotográfico y bitácora de acceso físico', fuente: 'Seguridad Física / Data Center', fecha_evidencia: '2026-11-12', referencia_url: 'FOT-DC-006.jpg', es_simulada: true },
      { id_evidencia: 7, id_evaluacion: 7, codigo_evidencia: 'EV-07', descripcion: 'Captura de configuración de MFA en consola', fuente: 'Administrador de Directorio', fecha_evidencia: '2026-11-13', referencia_url: 'IMG-MFA-007.png', es_simulada: true },
      { id_evidencia: 8, id_evaluacion: 8, codigo_evidencia: 'EV-08', descripcion: 'Consola centralizada de antimalware corporativo', fuente: 'Consola EDR / Antimalware', fecha_evidencia: '2026-11-13', referencia_url: 'REP-EDR-008.pdf', es_simulada: true },
      { id_evidencia: 9, id_evaluacion: 9, codigo_evidencia: 'EV-09', descripcion: 'Acta de entrevista (sin reportes de vulnerabilidad)', fuente: 'Administrador de Infraestructura', fecha_evidencia: '2026-11-14', referencia_url: 'ACTA-ENT-003.pdf', es_simulada: true },
      { id_evidencia: 10, id_evaluacion: 10, codigo_evidencia: 'EV-10', descripcion: 'Bitácora automatizada de respaldos diarios', fuente: 'Servidor de Backups', fecha_evidencia: '2026-11-14', referencia_url: 'LOG-BKP-010.txt', es_simulada: true },
      { id_evidencia: 11, id_evaluacion: 11, codigo_evidencia: 'EV-11', descripcion: 'Captura de configuración de registros locales', fuente: 'Servidores de Producción', fecha_evidencia: '2026-11-15', referencia_url: 'IMG-LOGS-011.png', es_simulada: true },
      { id_evidencia: 12, id_evaluacion: 12, codigo_evidencia: 'EV-12', descripcion: 'Configuración del proxy y reglas de filtrado web', fuente: 'Firewall / Proxy Sede Principal', fecha_evidencia: '2026-11-15', referencia_url: 'CFG-PROXY-012.conf', es_simulada: true },
    ],
    hallazgos: [
      {
        id_hallazgo: 1,
        codigo: 'H-01',
        id_evaluacion: 9,
        condicion: 'No se evidencian escaneos ni reportes periódicos de vulnerabilidades en los servidores expuestos.',
        criterio: 'ISO/IEC 27002:2022, control 8.8: obtener información sobre vulnerabilidades técnicas, evaluar la exposición y tomar medidas apropiadas.',
        causa: 'No hay responsable asignado ni procedimiento formal de gestión de parches y vulnerabilidades.',
        efecto_riesgo: 'Mayor probabilidad de explotación de vulnerabilidades conocidas, con impacto en la disponibilidad y confidencialidad de los datos de clientes.',
        severidad: 'ALTA',
        creado_en: '2026-11-14T10:00:00.000Z',
      },
      {
        id_hallazgo: 2,
        codigo: 'H-02',
        id_evaluacion: 4,
        condicion: 'No existe procedimiento documentado ni roles definidos para gestionar incidentes de seguridad; los eventos se atienden de manera informal.',
        criterio: 'ISO/IEC 27002:2022, control 5.24: definir procesos, roles y responsabilidades para la planificación y preparación de la gestión de incidentes.',
        causa: 'Falta de definición de responsabilidades y de un canal único de reporte de incidentes.',
        efecto_riesgo: 'Respuesta tardía o inconsistente, pérdida de evidencia forense y posible incumplimiento de obligaciones de notificación.',
        severidad: 'ALTA',
        creado_en: '2026-11-14T11:00:00.000Z',
      },
      {
        id_hallazgo: 3,
        codigo: 'H-03',
        id_evaluacion: 10,
        condicion: 'Se ejecutan respaldos diarios, pero no hay pruebas de restauración registradas ni documentadas.',
        criterio: 'ISO/IEC 27002:2022, control 8.13: mantener y probar periódicamente las copias de seguridad de la información.',
        causa: 'No existe procedimiento ni responsable asignado para la ejecución de pruebas periódicas de restauración.',
        efecto_riesgo: 'Imposibilidad o demora crítica para recuperar información de clientes ante una falla grave o ataque de ransomware.',
        severidad: 'MEDIA',
        creado_en: '2026-11-15T09:00:00.000Z',
      },
      {
        id_hallazgo: 4,
        codigo: 'H-04',
        id_evaluacion: 11,
        condicion: 'Los registros de eventos se almacenan localmente en cada servidor, sin centralización ni revisión periódica.',
        criterio: 'ISO/IEC 27002:2022, control 8.15: producir, proteger y analizar los registros de actividad (logs).',
        causa: 'No se ha implementado una solución centralizada de gestión de registros ni rutinas de revisión.',
        efecto_riesgo: 'Dificultad para detectar y reconstruir incidentes de seguridad, y posibilidad de alteración local de los registros.',
        severidad: 'MEDIA',
        creado_en: '2026-11-15T10:30:00.000Z',
      },
    ],
    recomendaciones: [
      { id_recomendacion: 1, id_hallazgo: 1, descripcion: 'Designar responsable, definir el procedimiento de gestión de vulnerabilidades y ejecutar escaneos mensuales con plazos de remediación según criticidad.', prioridad: 'ALTA', plazo_dias: 60, responsable_sug: 'Líder de Infraestructura y Seguridad' },
      { id_recomendacion: 2, id_hallazgo: 2, descripcion: 'Formalizar el procedimiento de gestión de incidentes, designar el equipo de respuesta, habilitar un canal único de reporte y realizar un simulacro semestral.', prioridad: 'ALTA', plazo_dias: 60, responsable_sug: 'Oficial de Seguridad de la Información' },
      { id_recomendacion: 3, id_hallazgo: 3, descripcion: 'Definir el procedimiento formal de respaldo y ejecutar pruebas de restauración trimestrales debidamente documentadas.', prioridad: 'MEDIA', plazo_dias: 90, responsable_sug: 'Administrador de Servidores y BD' },
      { id_recomendacion: 4, id_hallazgo: 4, descripcion: 'Centralizar los registros críticos en un servidor dedicado (Syslog/SIEM), proteger su integridad y definir una revisión periódica.', prioridad: 'MEDIA', plazo_dias: 120, responsable_sug: 'Líder de Operaciones TI' },
    ],
    informes: [
      {
        id_informe: 1,
        id_auditoria: 1,
        version: 1,
        fecha_generacion: '2026-11-16T14:00:00.000Z',
        total_evaluados: 13,
        total_aplicables: 12,
        implementados: 4,
        parciales: 5,
        no_implementados: 3,
        no_aplicables: 1,
        cumplimiento_base: 33.3,
        indice_ponderado: 54.2,
        resumen_ejecutivo:
          'De los 12 controles aplicables evaluados, 4 (33,3 %) están implementados, 5 parcialmente y 3 no implementados. Se documentaron cuatro hallazgos, dos de severidad alta, relacionados con la gestión de vulnerabilidades y de incidentes. El indicador es descriptivo y no constituye certificación.',
        limitaciones:
          'LIMITACIONES Y SALVAGUARDA ACADÉMICA: El porcentaje e indicador de cumplimiento presentado en este informe es estrictamente descriptivo y se fundamenta en la muestra de controles evaluados durante el ejercicio académico. No constituye una certificación en ISO/IEC 27001:2022 ni sustituye el juicio profesional del auditor ni una auditoría de tercera parte acreditada.',
      },
    ],
  };
}

export function getLocalDb() {
  if (typeof localStorage === 'undefined') return buildInitialSeedState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = buildInitialSeedState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return buildInitialSeedState();
  }
}

export function saveLocalDb(db) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetLocalDb() {
  const initial = buildInitialSeedState();
  saveLocalDb(initial);
  return initial;
}

function compareIsoCode(a, b) {
  const [a1, a2] = String(a).split('.').map(Number);
  const [b1, b2] = String(b).split('.').map(Number);
  if (a1 !== b1) return a1 - b1;
  return (a2 || 0) - (b2 || 0);
}

function computeIndicadores(db, idAuditoria) {
  const evals = db.evaluacion_control.filter((e) => e.id_auditoria === Number(idAuditoria));
  const total_seleccionados = evals.length;
  const pendientes = evals.filter((e) => e.estado === 'PENDIENTE').length;
  const total_evaluados = total_seleccionados - pendientes;
  const implementados = evals.filter((e) => e.estado === 'IMPLEMENTADO').length;
  const parciales = evals.filter((e) => e.estado === 'PARCIAL').length;
  const no_implementados = evals.filter((e) => e.estado === 'NO_IMPLEMENTADO').length;
  const no_aplicables = evals.filter((e) => e.estado === 'NO_APLICABLE').length;
  const aplicables = implementados + parciales + no_implementados;

  const cumplimiento_base_pct =
    aplicables > 0 ? Number(((100.0 * implementados) / aplicables).toFixed(1)) : 0.0;
  const indice_ponderado_pct =
    aplicables > 0
      ? Number(((100.0 * (implementados * 1.0 + parciales * 0.5)) / aplicables).toFixed(1))
      : 0.0;

  const evalIds = new Set(evals.map((e) => e.id_evaluacion));
  const hallazgos = db.hallazgos.filter((h) => evalIds.has(h.id_evaluacion));
  const hallazgoIds = new Set(hallazgos.map((h) => h.id_hallazgo));
  const recomendaciones = db.recomendaciones.filter((r) => hallazgoIds.has(r.id_hallazgo));
  const evidencias = db.evidencias.filter((ev) => evalIds.has(ev.id_evaluacion));

  const formula_base =
    aplicables > 0
      ? `(${implementados} / ${aplicables}) × 100 = ${formatPercent(cumplimiento_base_pct)}`
      : '(0 / 0) × 100 = 0,0 %';
  const formula_ponderada =
    aplicables > 0
      ? `((${implementados} × 1.0 + ${parciales} × 0.5) / ${aplicables}) × 100 = ${formatPercent(
          indice_ponderado_pct
        )}`
      : '((0 × 1.0 + 0 × 0.5) / 0) × 100 = 0,0 %';

  const altas = hallazgos.filter((h) => h.severidad === 'ALTA').length;
  const resumen_ejecutivo = `De los ${aplicables} controles aplicables evaluados, ${implementados} (${formatPercent(
    cumplimiento_base_pct
  )}) están implementados, ${parciales} parcialmente y ${no_implementados} no implementados. Se documentaron ${
    hallazgos.length
  } hallazgo(s), ${altas} de severidad alta, vinculados a los controles evaluados. El indicador es descriptivo y no constituye certificación.`;

  return {
    total_seleccionados,
    total_evaluados,
    pendientes,
    aplicables,
    implementados,
    parciales,
    no_implementados,
    no_aplicables,
    cumplimiento_base_pct,
    indice_ponderado_pct,
    total_hallazgos: hallazgos.length,
    total_recomendaciones: recomendaciones.length,
    total_evidencias: evidencias.length,
    formula_base,
    formula_ponderada,
    resumen_ejecutivo,
  };
}

function computeVerificacionCierre(db, idAuditoria) {
  const evals = db.evaluacion_control.filter((e) => e.id_auditoria === Number(idAuditoria));
  const pendientes = evals
    .filter((e) => e.estado === 'PENDIENTE')
    .map((e) => {
      const c = db.controles.find((ct) => ct.id_control === e.id_control);
      return c ? c.codigo_iso : String(e.id_control);
    });

  const sin_evidencia = evals
    .filter((e) => e.estado === 'IMPLEMENTADO' || e.estado === 'PARCIAL')
    .filter((e) => db.evidencias.filter((ev) => ev.id_evaluacion === e.id_evaluacion).length === 0)
    .map((e) => {
      const c = db.controles.find((ct) => ct.id_control === e.id_control);
      return c ? c.codigo_iso : String(e.id_control);
    });

  const evalIds = new Set(evals.map((e) => e.id_evaluacion));
  const hallazgos = db.hallazgos.filter((h) => evalIds.has(h.id_evaluacion));
  const hallazgos_sin_recomendacion = hallazgos
    .filter((h) => db.recomendaciones.filter((r) => r.id_hallazgo === h.id_hallazgo).length === 0)
    .map((h) => h.codigo);

  const puede_revisar =
    evals.length >= 10 &&
    evals.length <= 15 &&
    pendientes.length === 0 &&
    sin_evidencia.length === 0;

  const puede_cerrar =
    puede_revisar && hallazgos.length >= 3 && hallazgos_sin_recomendacion.length === 0;

  return {
    total_seleccionados: evals.length,
    pendientes,
    sin_evidencia,
    total_hallazgos: hallazgos.length,
    hallazgos_sin_recomendacion,
    puede_revisar,
    puede_cerrar,
  };
}

function getCurrentSessionUser(db) {
  try {
    const raw = localStorage.getItem('auditsys_user');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return db.usuarios[0];
}

function checkAuditNotClosed(db, idAuditoria) {
  const aud = db.auditorias.find((a) => a.id_auditoria === Number(idAuditoria));
  if (!aud) {
    return { status: 404, body: { ok: false, error: 'Auditoría no encontrada.' } };
  }
  if (aud.estado === 'CERRADA') {
    return {
      status: 403,
      body: {
        ok: false,
        error:
          'Operación denegada: la auditoría se encuentra CERRADA y su registro es inmutable.',
      },
    };
  }
  return null;
}

/**
 * Procesa una petición REST contra el motor local cuando el backend remoto no tiene la ruta activa
 */
export function handleLocalApiRequest(method, rawPath, body = null) {
  const db = getLocalDb();
  const user = getCurrentSessionUser(db);

  const urlObj = new URL(rawPath, 'http://localhost');
  const pathname = urlObj.pathname.replace(/^\/api/, '');
  const params = urlObj.searchParams;

  // 1. Health & Seed Reset
  if (method === 'GET' && pathname === '/health') {
    return {
      status: 200,
      body: {
        ok: true,
        status: 'UP',
        service: 'auditsys-mini-local-engine',
        db: 'UP',
        timestamp: new Date().toISOString(),
      },
    };
  }

  if (method === 'POST' && pathname === '/seed/reset') {
    resetLocalDb();
    return {
      status: 200,
      body: {
        ok: true,
        message: 'Base de datos restaurada con los 93 controles ISO 27002:2022 y el caso Empresa ABC.',
      },
    };
  }

  // 2. Auth & Usuarios
  if (method === 'POST' && pathname === '/auth/login') {
    const correo = String(body?.correo || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const found = db.usuarios.find((u) => u.correo.toLowerCase() === correo);
    if (!found || password !== 'Audit2026*') {
      return {
        status: 401,
        body: { ok: false, error: 'Credenciales inválidas. Verifique su correo y contraseña.' },
      };
    }
    return {
      status: 200,
      body: {
        ok: true,
        data: {
          token: `demo-jwt-token-${found.id_usuario}-${found.rol}-${Date.now()}`,
          usuario: found,
        },
      },
    };
  }

  if (method === 'GET' && pathname === '/auth/me') {
    return { status: 200, body: { ok: true, data: user } };
  }

  if (method === 'GET' && pathname === '/usuarios') {
    return { status: 200, body: { ok: true, data: db.usuarios } };
  }

  // 3. Dashboard
  if (method === 'GET' && pathname === '/dashboard') {
    const reqId = Number(params.get('id_auditoria')) || db.auditorias[0]?.id_auditoria || 1;
    const aud =
      db.auditorias.find((a) => a.id_auditoria === reqId) || db.auditorias[0] || null;
    if (!aud) {
      return {
        status: 200,
        body: {
          ok: true,
          data: {
            auditoria_activa: null,
            indicadores: computeIndicadores(db, 0),
            hallazgos_por_severidad: { ALTA: 0, MEDIA: 0, BAJA: 0 },
            auditorias_recientes: [],
          },
        },
      };
    }

    const auditor = db.usuarios.find((u) => u.id_usuario === aud.id_auditor);
    const indicadores = computeIndicadores(db, aud.id_auditoria);
    const evalIds = new Set(
      db.evaluacion_control
        .filter((e) => e.id_auditoria === aud.id_auditoria)
        .map((e) => e.id_evaluacion)
    );
    const hallazgosAud = db.hallazgos.filter((h) => evalIds.has(h.id_evaluacion));

    const hallazgos_por_severidad = {
      ALTA: hallazgosAud.filter((h) => h.severidad === 'ALTA').length,
      MEDIA: hallazgosAud.filter((h) => h.severidad === 'MEDIA').length,
      BAJA: hallazgosAud.filter((h) => h.severidad === 'BAJA').length,
    };

    const auditorias_recientes = db.auditorias.map((a) => {
      const ind = computeIndicadores(db, a.id_auditoria);
      const u = db.usuarios.find((usr) => usr.id_usuario === a.id_auditor);
      return {
        ...a,
        auditor_nombre: u ? u.nombre : 'Auditor Asignado',
        total_controles: ind.total_seleccionados,
        cumplimiento_base_pct: ind.cumplimiento_base_pct,
        indice_ponderado_pct: ind.indice_ponderado_pct,
        total_hallazgos: ind.total_hallazgos,
      };
    });

    return {
      status: 200,
      body: {
        ok: true,
        data: {
          auditoria_activa: {
            ...aud,
            auditor_nombre: auditor ? auditor.nombre : 'Auditor Asignado',
          },
          indicadores,
          hallazgos_por_severidad,
          auditorias_recientes,
        },
      },
    };
  }

  // 4. Auditorías
  if (method === 'GET' && pathname === '/auditorias') {
    const list = db.auditorias.map((a) => {
      const ind = computeIndicadores(db, a.id_auditoria);
      const u = db.usuarios.find((usr) => usr.id_usuario === a.id_auditor);
      return {
        ...a,
        auditor_nombre: u ? u.nombre : 'Auditor Asignado',
        total_controles: ind.total_seleccionados,
        cumplimiento_base_pct: ind.cumplimiento_base_pct,
        indice_ponderado_pct: ind.indice_ponderado_pct,
        total_hallazgos: ind.total_hallazgos,
      };
    });
    return { status: 200, body: { ok: true, data: list } };
  }

  if (method === 'POST' && pathname === '/auditorias') {
    const org = String(body?.organizacion || '').trim();
    const obj = String(body?.objetivo || '').trim();
    const alc = String(body?.alcance || '').trim();
    const fi = String(body?.fecha_inicio || '').trim();
    const ff = String(body?.fecha_fin || '').trim();
    const ref = String(body?.referentes || OFFICIAL_REFERENTES).trim();
    const id_auditor = Number(body?.id_auditor) || 1;

    if (!org) {
      return { status: 400, body: { ok: false, error: 'La organización es obligatoria.', field: 'organizacion' } };
    }
    if (!fi) {
      return { status: 400, body: { ok: false, error: 'La fecha de inicio es obligatoria.', field: 'fecha_inicio' } };
    }
    if (!ff || ff < fi) {
      return {
        status: 400,
        body: {
          ok: false,
          error: 'La fecha de cierre debe ser igual o posterior a la fecha de inicio.',
          field: 'fecha_fin',
        },
      };
    }
    if (!obj) {
      return { status: 400, body: { ok: false, error: 'El objetivo es obligatorio.', field: 'objetivo' } };
    }
    if (!alc) {
      return { status: 400, body: { ok: false, error: 'El alcance es obligatorio.', field: 'alcance' } };
    }

    const nextId = db.auditorias.reduce((m, a) => Math.max(m, a.id_auditoria), 0) + 1;
    const nueva = {
      id_auditoria: nextId,
      organizacion: org,
      objetivo: obj,
      alcance: alc,
      fecha_inicio: fi,
      fecha_fin: ff,
      referentes: ref,
      estado: 'BORRADOR',
      id_auditor,
      creado_en: new Date().toISOString(),
    };
    db.auditorias.push(nueva);
    saveLocalDb(db);
    return {
      status: 201,
      body: { ok: true, message: 'Auditoría creada en estado BORRADOR.', data: nueva },
    };
  }

  const audMatch = pathname.match(/^\/auditorias\/(\d+)$/);
  if (audMatch) {
    const idAud = Number(audMatch[1]);
    const audIdx = db.auditorias.findIndex((a) => a.id_auditoria === idAud);
    if (audIdx === -1) {
      return { status: 404, body: { ok: false, error: 'Auditoría no encontrada.' } };
    }
    const aud = db.auditorias[audIdx];

    if (method === 'GET') {
      const u = db.usuarios.find((usr) => usr.id_usuario === aud.id_auditor);
      return {
        status: 200,
        body: {
          ok: true,
          data: {
            ...aud,
            auditor_nombre: u ? u.nombre : 'Auditor Asignado',
            indicadores: computeIndicadores(db, idAud),
            verificacion_cierre: computeVerificacionCierre(db, idAud),
          },
        },
      };
    }

    if (method === 'PUT') {
      const lockErr = checkAuditNotClosed(db, idAud);
      if (lockErr) return lockErr;

      const org = String(body?.organizacion || '').trim();
      const obj = String(body?.objetivo || '').trim();
      const alc = String(body?.alcance || '').trim();
      const fi = String(body?.fecha_inicio || '').trim();
      const ff = String(body?.fecha_fin || '').trim();
      const ref = String(body?.referentes || aud.referentes).trim();
      const id_auditor = Number(body?.id_auditor) || aud.id_auditor;

      if (!org) {
        return { status: 400, body: { ok: false, error: 'La organización es obligatoria.', field: 'organizacion' } };
      }
      if (!ff || ff < fi) {
        return {
          status: 400,
          body: {
            ok: false,
            error: 'La fecha de cierre debe ser igual o posterior a la fecha de inicio.',
            field: 'fecha_fin',
          },
        };
      }

      db.auditorias[audIdx] = {
        ...aud,
        organizacion: org,
        objetivo: obj,
        alcance: alc,
        fecha_inicio: fi,
        fecha_fin: ff,
        referentes: ref,
        id_auditor,
      };
      saveLocalDb(db);
      return {
        status: 200,
        body: { ok: true, message: 'Datos de la auditoría actualizados correctamente.', data: db.auditorias[audIdx] },
      };
    }
  }

  // Verificación de cierre
  const verifMatch = pathname.match(/^\/auditorias\/(\d+)\/verificacion-cierre$/);
  if (method === 'GET' && verifMatch) {
    const idAud = Number(verifMatch[1]);
    return {
      status: 200,
      body: { ok: true, data: computeVerificacionCierre(db, idAud) },
    };
  }

  // Cambio de Estado de Auditoría (RN02, RN04, RN06, RN07)
  const estadoMatch = pathname.match(/^\/auditorias\/(\d+)\/estado$/);
  if (method === 'PATCH' && estadoMatch) {
    const idAud = Number(estadoMatch[1]);
    const audIdx = db.auditorias.findIndex((a) => a.id_auditoria === idAud);
    if (audIdx === -1) {
      return { status: 404, body: { ok: false, error: 'Auditoría no encontrada.' } };
    }
    const aud = db.auditorias[audIdx];
    if (aud.estado === 'CERRADA') {
      return {
        status: 403,
        body: {
          ok: false,
          error: 'Operación denegada: la auditoría se encuentra CERRADA y su registro es inmutable.',
        },
      };
    }

    const nuevoEstado = String(body?.estado || '').toUpperCase();
    const verif = computeVerificacionCierre(db, idAud);

    if (nuevoEstado === 'EN_EJECUCION') {
      if (verif.total_seleccionados < 10 || verif.total_seleccionados > 15) {
        return {
          status: 400,
          body: {
            ok: false,
            error: `Debe seleccionar entre 10 y 15 controles del catálogo ISO/IEC 27002:2022 para pasar a ejecución (actualmente seleccionó ${verif.total_seleccionados}).`,
          },
        };
      }
    } else if (nuevoEstado === 'EN_REVISION') {
      if (verif.total_seleccionados < 10 || verif.total_seleccionados > 15) {
        return {
          status: 400,
          body: {
            ok: false,
            error: `El rango obligatorio es de 10 a 15 controles seleccionados (actual: ${verif.total_seleccionados}).`,
          },
        };
      }
      if (verif.pendientes.length > 0) {
        return {
          status: 400,
          body: {
            ok: false,
            error: `No se puede avanzar a EN_REVISION: existen controles pendientes de evaluar (${verif.pendientes.join(', ')}).`,
          },
        };
      }
      if (verif.sin_evidencia.length > 0) {
        return {
          status: 400,
          body: {
            ok: false,
            error: `Regla RN04 / CP-06: Los siguientes controles en estado Implementado o Parcial carecen de evidencia registrada: ${verif.sin_evidencia.join(', ')}.`,
          },
        };
      }
    } else if (nuevoEstado === 'CERRADA') {
      if (verif.pendientes.length > 0) {
        return {
          status: 400,
          body: {
            ok: false,
            error: `No se puede cerrar la auditoría: hay controles pendientes de evaluar (${verif.pendientes.join(', ')}).`,
          },
        };
      }
      if (verif.sin_evidencia.length > 0) {
        return {
          status: 400,
          body: {
            ok: false,
            error: `No se puede cerrar la auditoría (CP-06): controles Implementado/Parcial sin evidencia (${verif.sin_evidencia.join(', ')}).`,
          },
        };
      }
      if (verif.total_hallazgos < 3) {
        return {
          status: 400,
          body: {
            ok: false,
            error: `Regla RN06 / CP-08: Para cerrar la auditoría se exigen al menos 3 hallazgos documentados (actualmente hay ${verif.total_hallazgos}).`,
          },
        };
      }
      if (verif.hallazgos_sin_recomendacion.length > 0) {
        return {
          status: 400,
          body: {
            ok: false,
            error: `Regla RN06 / CP-08: Todos los hallazgos deben tener al menos una recomendación asociada. Faltan recomendaciones en: ${verif.hallazgos_sin_recomendacion.join(', ')}.`,
          },
        };
      }
    }

    db.auditorias[audIdx].estado = nuevoEstado;
    saveLocalDb(db);
    return {
      status: 200,
      body: {
        ok: true,
        message: `Estado de la auditoría actualizado a ${nuevoEstado}.`,
        data: db.auditorias[audIdx],
      },
    };
  }

  // 5. Catálogo de 93 controles
  if (method === 'GET' && pathname === '/controles') {
    const cat = params.get('categoria') || '';
    const q = normalizeSearchText(params.get('q') || '');
    let list = [...db.controles];
    if (cat && cat !== 'TODOS') {
      list = list.filter((c) => c.categoria === cat);
    }
    if (q) {
      list = list.filter((c) => {
        const hay = normalizeSearchText(
          `${c.codigo_iso} ${c.nombre} ${c.criterio} ${c.pregunta_orientadora}`
        );
        return hay.includes(q);
      });
    }
    list.sort((a, b) => a.id_control - b.id_control);
    return { status: 200, body: { ok: true, data: list } };
  }

  const ctrlMatch = pathname.match(/^\/controles\/(\d+)$/);
  if (method === 'PUT' && ctrlMatch) {
    if (user?.rol !== 'admin') {
      return {
        status: 403,
        body: {
          ok: false,
          error:
            'Acceso denegado: solo el rol Administrador puede modificar el catálogo normativo ISO/IEC 27002:2022.',
        },
      };
    }
    const idCtrl = Number(ctrlMatch[1]);
    const idx = db.controles.findIndex((c) => c.id_control === idCtrl);
    if (idx === -1) {
      return { status: 404, body: { ok: false, error: 'Control no encontrado.' } };
    }
    db.controles[idx] = {
      ...db.controles[idx],
      nombre: body?.nombre?.trim() || db.controles[idx].nombre,
      criterio: body?.criterio?.trim() || db.controles[idx].criterio,
      pregunta_orientadora:
        body?.pregunta_orientadora?.trim() || db.controles[idx].pregunta_orientadora,
      ejemplo_aplicacion:
        body?.ejemplo_aplicacion !== undefined
          ? body.ejemplo_aplicacion
          : db.controles[idx].ejemplo_aplicacion,
      evidencia_sugerida:
        body?.evidencia_sugerida !== undefined
          ? body.evidencia_sugerida
          : db.controles[idx].evidencia_sugerida,
    };
    saveLocalDb(db);
    return {
      status: 200,
      body: {
        ok: true,
        message: `Control ${db.controles[idx].codigo_iso} actualizado en el catálogo maestro.`,
        data: db.controles[idx],
      },
    };
  }

  // 6. Selección y Evaluación de Controles
  const evalsAudMatch = pathname.match(/^\/auditorias\/(\d+)\/evaluaciones$/);
  if (method === 'GET' && evalsAudMatch) {
    const idAud = Number(evalsAudMatch[1]);
    const evals = db.evaluacion_control
      .filter((e) => e.id_auditoria === idAud)
      .map((e) => {
        const ctrl = db.controles.find((c) => c.id_control === e.id_control) || {};
        const evs = db.evidencias.filter((ev) => ev.id_evaluacion === e.id_evaluacion);
        const halls = db.hallazgos
          .filter((h) => h.id_evaluacion === e.id_evaluacion)
          .map((h) => ({
            ...h,
            recomendaciones: db.recomendaciones.filter((r) => r.id_hallazgo === h.id_hallazgo),
          }));
        return {
          ...e,
          codigo_iso: ctrl.codigo_iso,
          categoria: ctrl.categoria,
          nombre: ctrl.nombre,
          criterio: ctrl.criterio,
          pregunta_orientadora: ctrl.pregunta_orientadora,
          ejemplo_aplicacion: ctrl.ejemplo_aplicacion,
          evidencia_sugerida: ctrl.evidencia_sugerida,
          requiere_evidencia_faltante:
            (e.estado === 'IMPLEMENTADO' || e.estado === 'PARCIAL') && evs.length === 0,
          evidencias: evs,
          hallazgos: halls,
        };
      });
    evals.sort((a, b) => compareIsoCode(a.codigo_iso, b.codigo_iso));
    return { status: 200, body: { ok: true, data: evals } };
  }

  const selMatch = pathname.match(/^\/auditorias\/(\d+)\/seleccion-controles$/);
  if (method === 'PUT' && selMatch) {
    const idAud = Number(selMatch[1]);
    const lockErr = checkAuditNotClosed(db, idAud);
    if (lockErr) return lockErr;

    const ids = Array.isArray(body?.controles_ids)
      ? [...new Set(body.controles_ids.map(Number))]
      : [];

    if (ids.length < 10 || ids.length > 15) {
      return {
        status: 400,
        body: {
          ok: false,
          error: `Debe seleccionar entre 10 y 15 controles del catálogo ISO/IEC 27002:2022 para la auditoría (actualmente seleccionó ${ids.length}).`,
        },
      };
    }

    const currentEvals = db.evaluacion_control.filter((e) => e.id_auditoria === idAud);
    const toRemove = currentEvals.filter((e) => !ids.includes(e.id_control));

    for (const rem of toRemove) {
      const hasEv = db.evidencias.some((ev) => ev.id_evaluacion === rem.id_evaluacion);
      const hasHall = db.hallazgos.some((h) => h.id_evaluacion === rem.id_evaluacion);
      if (hasEv || hasHall) {
        const c = db.controles.find((ct) => ct.id_control === rem.id_control);
        return {
          status: 409,
          body: {
            ok: false,
            error: `No se puede retirar el control ${c?.codigo_iso || rem.id_control} porque ya tiene evidencias o hallazgos asociados.`,
          },
        };
      }
    }

    const removeEvalIds = new Set(toRemove.map((r) => r.id_evaluacion));
    db.evaluacion_control = db.evaluacion_control.filter(
      (e) => !removeEvalIds.has(e.id_evaluacion)
    );

    let maxEvalId = db.evaluacion_control.reduce((m, e) => Math.max(m, e.id_evaluacion), 0);
    for (const idCtrl of ids) {
      const exists = db.evaluacion_control.some(
        (e) => e.id_auditoria === idAud && e.id_control === idCtrl
      );
      if (!exists) {
        maxEvalId += 1;
        db.evaluacion_control.push({
          id_evaluacion: maxEvalId,
          id_auditoria: idAud,
          id_control: idCtrl,
          estado: 'PENDIENTE',
          observacion: '',
          justificacion_na: null,
        });
      }
    }

    const audIdx = db.auditorias.findIndex((a) => a.id_auditoria === idAud);
    if (audIdx !== -1 && db.auditorias[audIdx].estado === 'BORRADOR') {
      db.auditorias[audIdx].estado = 'EN_EJECUCION';
    }

    saveLocalDb(db);
    return {
      status: 200,
      body: {
        ok: true,
        message: `Selección de ${ids.length} controles guardada. Auditoría en ejecución.`,
        data: { controles_seleccionados: ids.length, estado: db.auditorias[audIdx]?.estado },
      },
    };
  }

  const evalItemMatch = pathname.match(/^\/evaluaciones\/(\d+)$/);
  if (method === 'PUT' && evalItemMatch) {
    const idEval = Number(evalItemMatch[1]);
    const idx = db.evaluacion_control.findIndex((e) => e.id_evaluacion === idEval);
    if (idx === -1) {
      return { status: 404, body: { ok: false, error: 'Evaluación no encontrada.' } };
    }
    const lockErr = checkAuditNotClosed(db, db.evaluacion_control[idx].id_auditoria);
    if (lockErr) return lockErr;

    const estado = String(body?.estado || '').toUpperCase();
    const observacion = String(body?.observacion || '').trim();
    const justificacion_na =
      estado === 'NO_APLICABLE' ? String(body?.justificacion_na || '').trim() : null;

    if (!observacion) {
      return {
        status: 400,
        body: {
          ok: false,
          error: 'La observación del auditor es obligatoria para guardar la evaluación.',
          field: 'observacion',
        },
      };
    }

    if (estado === 'NO_APLICABLE' && !justificacion_na) {
      return {
        status: 400,
        body: {
          ok: false,
          error: "El estado 'No aplicable' exige registrar una justificación formal.",
          field: 'justificacion_na',
        },
      };
    }

    db.evaluacion_control[idx] = {
      ...db.evaluacion_control[idx],
      estado,
      observacion,
      justificacion_na,
      actualizado_en: new Date().toISOString(),
    };
    saveLocalDb(db);
    return {
      status: 200,
      body: {
        ok: true,
        message: 'Evaluación del control guardada correctamente.',
        data: db.evaluacion_control[idx],
      },
    };
  }

  // 7. Evidencias
  const createEvMatch = pathname.match(/^\/evaluaciones\/(\d+)\/evidencias$/);
  if (method === 'POST' && createEvMatch) {
    const idEval = Number(createEvMatch[1]);
    const evalObj = db.evaluacion_control.find((e) => e.id_evaluacion === idEval);
    if (!evalObj) {
      return { status: 404, body: { ok: false, error: 'Evaluación no encontrada.' } };
    }
    const lockErr = checkAuditNotClosed(db, evalObj.id_auditoria);
    if (lockErr) return lockErr;

    const descripcion = String(body?.descripcion || '').trim();
    const fuente = String(body?.fuente || '').trim();
    const fecha_evidencia = String(body?.fecha_evidencia || '').trim();
    const referencia_url = String(body?.referencia_url || '').trim();
    const es_simulada = body?.es_simulada !== undefined ? Boolean(body.es_simulada) : true;

    if (!descripcion) {
      return { status: 400, body: { ok: false, error: 'La descripción es obligatoria.', field: 'ev-descripcion' } };
    }
    if (!fuente) {
      return { status: 400, body: { ok: false, error: 'La fuente es obligatoria.', field: 'ev-fuente' } };
    }

    const audEvalIds = new Set(
      db.evaluacion_control
        .filter((e) => e.id_auditoria === evalObj.id_auditoria)
        .map((e) => e.id_evaluacion)
    );
    const maxNum = db.evidencias
      .filter((ev) => audEvalIds.has(ev.id_evaluacion))
      .reduce((m, ev) => {
        const num = Number(String(ev.codigo_evidencia).split('-')[1]) || 0;
        return Math.max(m, num);
      }, 0);

    const codigo_evidencia =
      body?.codigo_evidencia && String(body.codigo_evidencia).trim()
        ? String(body.codigo_evidencia).trim()
        : `EV-${String(maxNum + 1).padStart(2, '0')}`;

    const nextId = db.evidencias.reduce((m, ev) => Math.max(m, ev.id_evidencia), 0) + 1;
    const nuevaEv = {
      id_evidencia: nextId,
      id_evaluacion: idEval,
      codigo_evidencia,
      descripcion,
      fuente,
      fecha_evidencia: fecha_evidencia || new Date().toISOString().split('T')[0],
      referencia_url,
      es_simulada,
    };
    db.evidencias.push(nuevaEv);
    saveLocalDb(db);
    return {
      status: 201,
      body: { ok: true, message: `Evidencia ${codigo_evidencia} registrada.`, data: nuevaEv },
    };
  }

  const delEvMatch = pathname.match(/^\/evidencias\/(\d+)$/);
  if (method === 'DELETE' && delEvMatch) {
    const idEv = Number(delEvMatch[1]);
    const evObj = db.evidencias.find((ev) => ev.id_evidencia === idEv);
    if (!evObj) {
      return { status: 404, body: { ok: false, error: 'Evidencia no encontrada.' } };
    }
    const evalObj = db.evaluacion_control.find((e) => e.id_evaluacion === evObj.id_evaluacion);
    if (evalObj) {
      const lockErr = checkAuditNotClosed(db, evalObj.id_auditoria);
      if (lockErr) return lockErr;
    }
    db.evidencias = db.evidencias.filter((ev) => ev.id_evidencia !== idEv);
    saveLocalDb(db);
    return { status: 200, body: { ok: true, message: 'Evidencia eliminada.' } };
  }

  // 8. Hallazgos y Recomendaciones
  const hallAudMatch = pathname.match(/^\/auditorias\/(\d+)\/hallazgos$/);
  if (method === 'GET' && hallAudMatch) {
    const idAud = Number(hallAudMatch[1]);
    const evals = db.evaluacion_control.filter((e) => e.id_auditoria === idAud);
    const evalMap = new Map(evals.map((e) => [e.id_evaluacion, e]));

    const list = db.hallazgos
      .filter((h) => evalMap.has(h.id_evaluacion))
      .map((h) => {
        const ev = evalMap.get(h.id_evaluacion);
        const ctrl = db.controles.find((c) => c.id_control === ev.id_control) || {};
        const recs = db.recomendaciones.filter((r) => r.id_hallazgo === h.id_hallazgo);
        return {
          ...h,
          id_control: ctrl.id_control,
          codigo_iso: ctrl.codigo_iso,
          control_nombre: ctrl.nombre,
          estado_control: ev.estado,
          recomendaciones: recs,
        };
      });
    return { status: 200, body: { ok: true, data: list } };
  }

  const createHallMatch = pathname.match(/^\/evaluaciones\/(\d+)\/hallazgos$/);
  if (method === 'POST' && createHallMatch) {
    const idEval = Number(createHallMatch[1]);
    const evalObj = db.evaluacion_control.find((e) => e.id_evaluacion === idEval);
    if (!evalObj) {
      return { status: 404, body: { ok: false, error: 'Control evaluado no encontrado.' } };
    }
    const lockErr = checkAuditNotClosed(db, evalObj.id_auditoria);
    if (lockErr) return lockErr;

    const condicion = String(body?.condicion || '').trim();
    const criterio = String(body?.criterio || '').trim();
    const causa = String(body?.causa || '').trim();
    const efecto_riesgo = String(body?.efecto_riesgo || '').trim();
    const severidad = String(body?.severidad || '').toUpperCase();

    if (!condicion) {
      return { status: 400, body: { ok: false, error: 'La condición es obligatoria.', field: 'h-condicion' } };
    }
    if (!criterio) {
      return { status: 400, body: { ok: false, error: 'El criterio es obligatorio.', field: 'h-criterio' } };
    }
    if (!causa) {
      return {
        status: 400,
        body: { ok: false, error: 'La causa raíz del hallazgo es obligatoria (CP-07).', field: 'h-causa' },
      };
    }
    if (!efecto_riesgo) {
      return { status: 400, body: { ok: false, error: 'El efecto o riesgo es obligatorio.', field: 'h-efecto' } };
    }
    if (!['ALTA', 'MEDIA', 'BAJA'].includes(severidad)) {
      return { status: 400, body: { ok: false, error: 'Severidad inválida.', field: 'h-severidad' } };
    }

    const audEvalIds = new Set(
      db.evaluacion_control
        .filter((e) => e.id_auditoria === evalObj.id_auditoria)
        .map((e) => e.id_evaluacion)
    );
    const maxNum = db.hallazgos
      .filter((h) => audEvalIds.has(h.id_evaluacion))
      .reduce((m, h) => {
        const num = Number(String(h.codigo).split('-')[1]) || 0;
        return Math.max(m, num);
      }, 0);

    const codigo = `H-${String(maxNum + 1).padStart(2, '0')}`;
    const nextId = db.hallazgos.reduce((m, h) => Math.max(m, h.id_hallazgo), 0) + 1;
    const nuevoHall = {
      id_hallazgo: nextId,
      codigo,
      id_evaluacion: idEval,
      condicion,
      criterio,
      causa,
      efecto_riesgo,
      severidad,
      creado_en: new Date().toISOString(),
    };
    db.hallazgos.push(nuevoHall);

    if (body?.recomendacion && String(body.recomendacion.descripcion || '').trim()) {
      const nextRecId =
        db.recomendaciones.reduce((m, r) => Math.max(m, r.id_recomendacion), 0) + 1;
      db.recomendaciones.push({
        id_recomendacion: nextRecId,
        id_hallazgo: nextId,
        descripcion: String(body.recomendacion.descripcion).trim(),
        prioridad: String(body.recomendacion.prioridad || severidad).toUpperCase(),
        plazo_dias: Number(body.recomendacion.plazo_dias) || 60,
        responsable_sug:
          String(body.recomendacion.responsable_sug || '').trim() ||
          'Líder de TI / Seguridad de la Información',
      });
    }

    saveLocalDb(db);
    return {
      status: 201,
      body: { ok: true, message: `Hallazgo ${codigo} registrado exitosamente.`, data: nuevoHall },
    };
  }

  const delHallMatch = pathname.match(/^\/hallazgos\/(\d+)$/);
  if (delHallMatch) {
    const idHall = Number(delHallMatch[1]);
    const hObj = db.hallazgos.find((h) => h.id_hallazgo === idHall);
    if (!hObj) {
      return { status: 404, body: { ok: false, error: 'Hallazgo no encontrado.' } };
    }
    const evalObj = db.evaluacion_control.find((e) => e.id_evaluacion === hObj.id_evaluacion);
    if (evalObj) {
      const lockErr = checkAuditNotClosed(db, evalObj.id_auditoria);
      if (lockErr) return lockErr;
    }

    if (method === 'DELETE') {
      db.hallazgos = db.hallazgos.filter((h) => h.id_hallazgo !== idHall);
      db.recomendaciones = db.recomendaciones.filter((r) => r.id_hallazgo !== idHall);
      saveLocalDb(db);
      return { status: 200, body: { ok: true, message: 'Hallazgo eliminado.' } };
    }

    if (method === 'PUT') {
      const idx = db.hallazgos.findIndex((h) => h.id_hallazgo === idHall);
      db.hallazgos[idx] = {
        ...db.hallazgos[idx],
        condicion: body?.condicion?.trim() || db.hallazgos[idx].condicion,
        criterio: body?.criterio?.trim() || db.hallazgos[idx].criterio,
        causa: body?.causa?.trim() || db.hallazgos[idx].causa,
        efecto_riesgo: body?.efecto_riesgo?.trim() || db.hallazgos[idx].efecto_riesgo,
        severidad: body?.severidad || db.hallazgos[idx].severidad,
      };
      saveLocalDb(db);
      return { status: 200, body: { ok: true, data: db.hallazgos[idx] } };
    }
  }

  const createRecMatch = pathname.match(/^\/hallazgos\/(\d+)\/recomendaciones$/);
  if (method === 'POST' && createRecMatch) {
    const idHall = Number(createRecMatch[1]);
    const hObj = db.hallazgos.find((h) => h.id_hallazgo === idHall);
    if (!hObj) {
      return { status: 404, body: { ok: false, error: 'Hallazgo no encontrado.' } };
    }
    const evalObj = db.evaluacion_control.find((e) => e.id_evaluacion === hObj.id_evaluacion);
    if (evalObj) {
      const lockErr = checkAuditNotClosed(db, evalObj.id_auditoria);
      if (lockErr) return lockErr;
    }

    const descripcion = String(body?.descripcion || '').trim();
    const prioridad = String(body?.prioridad || 'MEDIA').toUpperCase();
    const plazo_dias = Number(body?.plazo_dias) || 60;
    const responsable_sug =
      String(body?.responsable_sug || '').trim() || 'Líder de TI / Seguridad de la Información';

    if (!descripcion) {
      return { status: 400, body: { ok: false, error: 'La descripción de la recomendación es obligatoria.' } };
    }

    const nextRecId = db.recomendaciones.reduce((m, r) => Math.max(m, r.id_recomendacion), 0) + 1;
    const nuevaRec = {
      id_recomendacion: nextRecId,
      id_hallazgo: idHall,
      descripcion,
      prioridad,
      plazo_dias,
      responsable_sug,
    };
    db.recomendaciones.push(nuevaRec);
    saveLocalDb(db);
    return {
      status: 201,
      body: { ok: true, message: 'Recomendación asociada al hallazgo.', data: nuevaRec },
    };
  }

  const delRecMatch = pathname.match(/^\/recomendaciones\/(\d+)$/);
  if (method === 'DELETE' && delRecMatch) {
    const idRec = Number(delRecMatch[1]);
    const recObj = db.recomendaciones.find((r) => r.id_recomendacion === idRec);
    if (!recObj) {
      return { status: 404, body: { ok: false, error: 'Recomendación no encontrada.' } };
    }
    const hObj = db.hallazgos.find((h) => h.id_hallazgo === recObj.id_hallazgo);
    const evalObj = hObj
      ? db.evaluacion_control.find((e) => e.id_evaluacion === hObj.id_evaluacion)
      : null;
    if (evalObj) {
      const lockErr = checkAuditNotClosed(db, evalObj.id_auditoria);
      if (lockErr) return lockErr;
    }
    db.recomendaciones = db.recomendaciones.filter((r) => r.id_recomendacion !== idRec);
    saveLocalDb(db);
    return { status: 200, body: { ok: true, message: 'Recomendación eliminada.' } };
  }

  // 9. Trazabilidad (RNF05)
  const trazMatch = pathname.match(/^\/auditorias\/(\d+)\/trazabilidad$/);
  if (method === 'GET' && trazMatch) {
    const idAud = Number(trazMatch[1]);
    const aud = db.auditorias.find((a) => a.id_auditoria === idAud);
    if (!aud) {
      return { status: 404, body: { ok: false, error: 'Auditoría no encontrada.' } };
    }
    const evals = db.evaluacion_control
      .filter((e) => e.id_auditoria === idAud)
      .map((e) => ({
        ...e,
        ctrl: db.controles.find((c) => c.id_control === e.id_control) || {},
      }))
      .sort((a, b) => compareIsoCode(a.ctrl.codigo_iso, b.ctrl.codigo_iso));

    const rows = [];
    for (const ev of evals) {
      const evs = db.evidencias.filter((x) => x.id_evaluacion === ev.id_evaluacion);
      const halls = db.hallazgos.filter((h) => h.id_evaluacion === ev.id_evaluacion);

      const evList = evs.length > 0 ? evs : [null];
      const hallList = halls.length > 0 ? halls : [null];

      for (const evItem of evList) {
        for (const hItem of hallList) {
          const recs = hItem
            ? db.recomendaciones.filter((r) => r.id_hallazgo === hItem.id_hallazgo)
            : [];
          const recList = recs.length > 0 ? recs : [null];
          for (const rItem of recList) {
            rows.push({
              id_auditoria: aud.id_auditoria,
              organizacion: aud.organizacion,
              id_control: ev.id_control,
              codigo_iso: ev.ctrl.codigo_iso,
              categoria: ev.ctrl.categoria,
              control_nombre: ev.ctrl.nombre,
              id_evaluacion: ev.id_evaluacion,
              estado: ev.estado,
              observacion: ev.observacion,
              justificacion_na: ev.justificacion_na,
              id_evidencia: evItem ? evItem.id_evidencia : null,
              codigo_evidencia: evItem ? evItem.codigo_evidencia : null,
              evidencia_descripcion: evItem ? evItem.descripcion : null,
              evidencia_fuente: evItem ? evItem.fuente : null,
              es_simulada: evItem ? evItem.es_simulada : null,
              id_hallazgo: hItem ? hItem.id_hallazgo : null,
              hallazgo_codigo: hItem ? hItem.codigo : null,
              hallazgo_severidad: hItem ? hItem.severidad : null,
              hallazgo_condicion: hItem ? hItem.condicion : null,
              id_recomendacion: rItem ? rItem.id_recomendacion : null,
              recomendacion_descripcion: rItem ? rItem.descripcion : null,
              recomendacion_prioridad: rItem ? rItem.prioridad : null,
              recomendacion_plazo_dias: rItem ? rItem.plazo_dias : null,
              recomendacion_responsable: rItem ? rItem.responsable_sug : null,
            });
          }
        }
      }
    }

    return { status: 200, body: { ok: true, data: rows } };
  }

  // 10. Indicadores e Informes (RF07, RF08, CP-09, CP-10)
  const infByIdMatch = pathname.match(/^\/informes\/(\d+)$/);
  if (method === 'GET' && infByIdMatch) {
    const idInf = Number(infByIdMatch[1]);
    const inf = db.informes.find((i) => i.id_informe === idInf);
    if (!inf) {
      return { status: 404, body: { ok: false, error: 'Versión de informe no encontrada.' } };
    }
    return { status: 200, body: { ok: true, data: inf } };
  }

  const indMatch = pathname.match(/^\/auditorias\/(\d+)\/indicadores$/);
  if (method === 'GET' && indMatch) {
    const idAud = Number(indMatch[1]);
    return { status: 200, body: { ok: true, data: computeIndicadores(db, idAud) } };
  }

  const infMatch = pathname.match(/^\/auditorias\/(\d+)\/informes$/);
  if (infMatch) {
    const idAud = Number(infMatch[1]);
    const aud = db.auditorias.find((a) => a.id_auditoria === idAud);
    if (!aud) {
      return { status: 404, body: { ok: false, error: 'Auditoría no encontrada.' } };
    }
    const auditor = db.usuarios.find((u) => u.id_usuario === aud.id_auditor);
    const indicadores = computeIndicadores(db, idAud);

    const evals = db.evaluacion_control
      .filter((e) => e.id_auditoria === idAud)
      .map((e) => {
        const ctrl = db.controles.find((c) => c.id_control === e.id_control) || {};
        return { ...e, ...ctrl };
      })
      .sort((a, b) => compareIsoCode(a.codigo_iso, b.codigo_iso));

    const evalIds = new Set(evals.map((e) => e.id_evaluacion));
    const hallazgos = db.hallazgos
      .filter((h) => evalIds.has(h.id_evaluacion))
      .map((h) => {
        const ev = evals.find((e) => e.id_evaluacion === h.id_evaluacion) || {};
        const recs = db.recomendaciones.filter((r) => r.id_hallazgo === h.id_hallazgo);
        return {
          ...h,
          codigo_iso: ev.codigo_iso,
          control_nombre: ev.nombre,
          recomendaciones: recs,
        };
      });

    const recomendaciones = [];
    for (const h of hallazgos) {
      for (const r of h.recomendaciones) {
        recomendaciones.push({
          ...r,
          hallazgo_codigo: h.codigo,
          hallazgo_severidad: h.severidad,
          codigo_iso: h.codigo_iso,
          control_nombre: h.control_nombre,
        });
      }
    }

    const anexo_evidencias = db.evidencias
      .filter((ev) => evalIds.has(ev.id_evaluacion))
      .map((ev) => {
        const eObj = evals.find((e) => e.id_evaluacion === ev.id_evaluacion) || {};
        return {
          ...ev,
          codigo_iso: eObj.codigo_iso,
          control_nombre: eObj.nombre,
        };
      });

    const limitaciones =
      'LIMITACIONES Y SALVAGUARDA ACADÉMICA: El porcentaje e indicador de cumplimiento presentado en este informe es estrictamente descriptivo y se fundamenta en la muestra de controles evaluados durante el ejercicio académico. No constituye una certificación en ISO/IEC 27001:2022 ni sustituye el juicio profesional del auditor ni una auditoría de tercera parte acreditada.';

    const versiones = db.informes
      .filter((inf) => inf.id_auditoria === idAud)
      .sort((a, b) => b.version - a.version);

    const estructuraInforme = {
      version_actual: versiones[0]?.version || 1,
      fecha_generacion: versiones[0]?.fecha_generacion || new Date().toISOString(),
      datos_auditoria: {
        ...aud,
        auditor_nombre: auditor ? auditor.nombre : 'Auditor Líder',
        auditor_correo: auditor ? auditor.correo : '',
      },
      alcance_criterios: evals.map((e) => ({
        id_control: e.id_control,
        codigo_iso: e.codigo_iso,
        categoria: e.categoria,
        nombre: e.nombre,
        criterio: e.criterio,
      })),
      resultados_indicadores: indicadores,
      evaluacion_por_control: evals,
      hallazgos,
      recomendaciones,
      anexo_evidencias,
      limitaciones,
      versiones,
    };

    if (method === 'GET') {
      return { status: 200, body: { ok: true, data: estructuraInforme } };
    }

    if (method === 'POST') {
      const nextVersion =
        versiones.reduce((m, v) => Math.max(m, v.version), 0) + 1;
      const nextInfId =
        db.informes.reduce((m, v) => Math.max(m, v.id_informe), 0) + 1;
      const nuevoInf = {
        id_informe: nextInfId,
        id_auditoria: idAud,
        version: nextVersion,
        fecha_generacion: new Date().toISOString(),
        total_evaluados: indicadores.total_evaluados,
        total_aplicables: indicadores.aplicables,
        implementados: indicadores.implementados,
        parciales: indicadores.parciales,
        no_implementados: indicadores.no_implementados,
        no_aplicables: indicadores.no_aplicables,
        cumplimiento_base: indicadores.cumplimiento_base_pct,
        indice_ponderado: indicadores.indice_ponderado_pct,
        resumen_ejecutivo: indicadores.resumen_ejecutivo,
        limitaciones,
        snapshot_json: {
          ...estructuraInforme,
          version_actual: nextVersion,
          fecha_generacion: new Date().toISOString(),
        },
      };
      db.informes.push(nuevoInf);
      saveLocalDb(db);
      return {
        status: 201,
        body: {
          ok: true,
          message: `Versión v${nextVersion} del informe consolidado generada y almacenada en base de datos.`,
          data: {
            ...estructuraInforme,
            version_actual: nextVersion,
            fecha_generacion: nuevoInf.fecha_generacion,
            versiones: [nuevoInf, ...versiones],
          },
        },
      };
    }
  }

  return { status: 404, body: { ok: false, error: `Endpoint no encontrado: ${method} ${pathname}` } };
}
