import { expect, test } from '@playwright/test';
import { installApiMock } from './mock-api.js';

async function loginAs(page, correo) {
  await page.fill('#correo', correo);
  await page.fill('#password', 'ClaveSegura2026*');
  await page.click('#btn-login');
  await page.waitForURL(/\/dashboard/);
}

test.describe('AuditSys SGSI — Pruebas Integrales E2E', () => {
  test.beforeEach(async ({ page }) => {
    await installApiMock(page);
    await page.goto('/login.html');
  });

  test('CP-01 y CP-02: Login corporativo, validación de fecha de cierre y creación de auditoría', async ({
    page,
  }) => {
    await loginAs(page, 'ana.auditora@auditsys.edu.co');

    await page.goto('/auditoria.html?mode=new');
    await page.fill('#organizacion', 'Empresa XYZ S.A.S.');
    await page.fill('#fecha_inicio', '2026-11-10');
    await page.fill('#objetivo', 'Evaluar controles críticos SGSI.');
    await page.fill('#alcance', 'Infraestructura y servidores.');

    // Fecha de cierre vacía -> error en línea conservando lo digitado
    await page.click('#btn-save-auditoria');
    await expect(page.locator('#error-fecha_fin')).toBeVisible();
    await expect(page.locator('#organizacion')).toHaveValue('Empresa XYZ S.A.S.');

    // Corregir fecha_fin y guardar
    await page.fill('#fecha_fin', '2026-11-24');
    await page.click('#btn-save-auditoria');
    await expect(page.locator('#page-title')).toContainText('Empresa XYZ S.A.S.');
  });

  test('CP-03 y CP-13: Catálogo 93 controles, rango 10-15 y coherencia de roles', async ({
    page,
  }) => {
    await loginAs(page, 'ana.auditora@auditsys.edu.co');

    await page.goto('/catalogo.html');
    await expect(page.locator('#controls-list article')).toHaveCount(93);

    // Coherencia de rol: el perfil auditor no ve botones de edición del catálogo
    await expect(page.locator('[data-edit-ctrl]')).toHaveCount(0);

    // Selección inicial de 13 controles -> rango válido
    await expect(page.locator('#selected-count')).toHaveText('13');
    await expect(page.locator('#range-status-badge')).toContainText('Rango válido');
  });

  test('CP-04, CP-05, CP-06, CP-07 y CP-08: Evaluación, justificación N/A y hallazgos', async ({
    page,
  }) => {
    await loginAs(page, 'ana.auditora@auditsys.edu.co');

    // Evaluación: NO_APLICABLE sin justificación
    await page.goto('/evaluacion.html');
    await expect(page.locator('#controls-master-list button')).toHaveCount(13);
    await page.locator('[data-state-choice="NO_APLICABLE"]').click();
    await page.fill('#justificacion_na', '');
    await page.click('#btn-save-eval');
    await expect(page.locator('#error-justificacion_na')).toBeVisible();

    // Hallazgos: causa vacía
    await page.goto('/hallazgos.html');
    await page.selectOption('#h-evaluacion', { index: 1 });
    await page.fill('#h-condicion', 'Brecha de prueba');
    await page.fill('#h-causa', '');
    await page.fill('#h-efecto', 'Riesgo operativo');
    await page.click('#btn-save-hallazgo');
    await expect(page.locator('#error-h-causa')).toBeVisible();
  });

  test('CP-09, CP-10 y CP-11: Dashboard e Informe Consolidado (33,3 % y 54,2 %)', async ({
    page,
  }) => {
    await loginAs(page, 'ana.auditora@auditsys.edu.co');

    await expect(page.locator('#kpi-cumplimiento-base')).toContainText('33,3 %');
    await expect(page.locator('#kpi-indice-ponderado')).toContainText('54,2 %');

    await page.goto('/informe.html');
    await expect(page.locator('#sec-3')).toContainText('33,3 %');
    await expect(page.locator('#sec-3')).toContainText('54,2 %');
    await expect(page.locator('#sec-7')).toContainText('Referencial');
    await expect(page.locator('#sec-8')).toContainText('no constituye una certificación');
  });

  test('CP-12: Operabilidad móvil a 360px y objetivos táctiles >= 44px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await loginAs(page, 'ana.auditora@auditsys.edu.co');

    const menuBtn = page.locator('#sidebar-open-btn');
    await expect(menuBtn).toBeVisible();
    const box = await menuBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
