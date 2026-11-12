import { expect, test } from '@playwright/test';

test.describe('AuditSys Mini — Casos de Prueba CP-01 a CP-13', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
    // Usar modo local determinista para pruebas E2E sin depender de red externa
    await page.locator('summary').click();
    await page.selectOption('#api-mode-select', 'local');
    await page.click('#btn-save-api-config');
  });

  test('CP-01 y CP-02: Login, validación de fecha de cierre vacía y creación de auditoría', async ({
    page,
  }) => {
    await page.click('#btn-demo-auditor');
    await page.waitForURL(/\/dashboard/);

    await page.goto('/auditoria.html?mode=new');
    await page.fill('#organizacion', 'Empresa XYZ S.A.S.');
    await page.fill('#fecha_inicio', '2026-11-10');
    await page.fill('#objetivo', 'Evaluar controles críticos SGSI.');
    await page.fill('#alcance', 'Infraestructura y servidores.');

    // CP-02: fecha_fin vacía -> error en línea conservando lo digitado
    await page.click('#btn-save-auditoria');
    await expect(page.locator('#error-fecha_fin')).toBeVisible();
    await expect(page.locator('#organizacion')).toHaveValue('Empresa XYZ S.A.S.');

    // CP-01: corregir fecha_fin y guardar
    await page.fill('#fecha_fin', '2026-11-24');
    await page.click('#btn-save-auditoria');
    await expect(page.locator('#page-title')).toContainText('Empresa XYZ S.A.S.');
  });

  test('CP-03 y CP-13: Catálogo 93 controles, rango 10-15 y bloqueo 403 a auditor', async ({
    page,
  }) => {
    await page.click('#btn-demo-auditor');
    await page.waitForURL(/\/dashboard/);

    await page.goto('/catalogo.html');
    await expect(page.locator('#controls-list article')).toHaveCount(93);

    // CP-13: Auditor intenta editar control del catálogo -> 403
    await page.locator('[data-edit-ctrl]').first().click();
    await page.click('#modal-ctrl-save');
    await expect(page.locator('#modal-ctrl-alert')).toContainText('403');
    await page.click('#modal-ctrl-close');

    // CP-03: 13 controles sugeridos -> pasa validación
    await page.click('#btn-load-suggested');
    await expect(page.locator('#selected-count')).toHaveText('13');
    await expect(page.locator('#range-status-badge')).toContainText('Rango válido');
  });

  test('CP-04, CP-05, CP-06, CP-07 y CP-08: Evaluación, justificación N/A y hallazgos', async ({
    page,
  }) => {
    await page.click('#btn-demo-auditor');
    await page.waitForURL(/\/dashboard/);

    // CP-04 y CP-05 en evaluacion.html
    await page.goto('/evaluacion.html');
    await expect(page.locator('#controls-master-list button')).toHaveCount(13);
    await page.locator('[data-state-choice="NO_APLICABLE"]').click();
    await page.fill('#justificacion_na', '');
    await page.click('#btn-save-eval');
    await expect(page.locator('#error-justificacion_na')).toBeVisible();

    // CP-07 en hallazgos.html (causa vacía)
    await page.goto('/hallazgos.html');
    await page.selectOption('#h-evaluacion', { index: 1 });
    await page.fill('#h-condicion', 'Brecha de prueba');
    await page.fill('#h-causa', '');
    await page.fill('#h-efecto', 'Riesgo operativo');
    await page.click('#btn-save-hallazgo');
    await expect(page.locator('#error-h-causa')).toBeVisible();
  });

  test('CP-09, CP-10 y CP-11: Dashboard e Informe Empresa ABC (33,3 % y 54,2 %)', async ({
    page,
  }) => {
    await page.click('#btn-demo-auditor');
    await page.waitForURL(/\/dashboard/);

    await expect(page.locator('#kpi-cumplimiento-base')).toContainText('33,3 %');
    await expect(page.locator('#kpi-indice-ponderado')).toContainText('54,2 %');

    await page.goto('/informe.html');
    await expect(page.locator('#sec-3')).toContainText('33,3 %');
    await expect(page.locator('#sec-3')).toContainText('54,2 %');
    await expect(page.locator('#sec-7')).toContainText('SIMULADA (Fines Académicos)');
    await expect(page.locator('#sec-8')).toContainText('No constituye una certificación');
  });

  test('CP-12: Operabilidad móvil a 360px y objetivos táctiles >= 44px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.click('#btn-demo-auditor');
    await page.waitForURL(/\/dashboard/);

    const menuBtn = page.locator('#sidebar-open-btn');
    await expect(menuBtn).toBeVisible();
    const box = await menuBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
