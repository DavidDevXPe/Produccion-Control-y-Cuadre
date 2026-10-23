import { expect, test } from '@playwright/test'

test.describe('TRABUNDA Producción smoke flows', () => {
  test('loads the dashboard and navigates to production days', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Dashboard/)
    await expect(page.locator('#contenido-principal')).toBeVisible()
    await expect(page.locator('#contenido-principal')).toContainText(/En resumen|Sin actividad registrada/)

    if ((page.viewportSize()?.width ?? 1440) < 1280) {
      await page.getByRole('button', { name: /Abrir.*navegaci/i }).click()
    }
    await page.getByRole('link', { name: 'Jornadas', exact: true }).click()
    await expect(page).toHaveURL(/\/jornadas$/)
    await expect(page.getByRole('heading', { name: /Jornadas de/ })).toBeVisible()
  })

  test('opens a packing journey with the critical capture sections and footer actions', async ({ page }) => {
    await page.goto('jornadas/nueva?process=PACKING')

    await expect(page.getByRole('heading', { name: 'Nueva jornada' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Ingreso manual' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByRole('combobox', { name: /Buscar producto de tratamiento/ })).toBeVisible()

    await page.getByRole('checkbox', { name: 'Existe producto para Túnel' }).check()
    await expect(page.getByRole('combobox', { name: /Buscar producto de .*nel/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Guardar borrador' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cerrar jornada' })).toBeVisible()

    const actionBar = page.locator('.production-entry-action-bar__layout')
    await expect(actionBar).toBeVisible()
    await expect(actionBar.locator(':scope > .production-entry-action-bar__status')).toBeVisible()
    await expect(actionBar.locator(':scope > .production-entry-action-bar__shifts')).toBeVisible()
    await expect(actionBar.locator(':scope > .production-entry-action-bar__actions')).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    )
    expect(hasHorizontalOverflow).toBe(false)
  })
})
