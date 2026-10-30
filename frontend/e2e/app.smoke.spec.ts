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

  test('does not show Tunnel metrics until there is a real Tunnel movement', async ({ page }) => {
    await page.goto('jornadas/nueva?process=PACKING')

    const shiftCards = page.getByTestId('production-shift-cards')
    await expect(shiftCards).toBeVisible()
    await expect(shiftCards.getByText('Túnel', { exact: true })).toHaveCount(0)

    await page.getByRole('checkbox', { name: 'Existe producto para Túnel' }).check()
    await expect(page.getByRole('combobox', { name: /Buscar producto de .*nel/ })).toBeVisible()
    await expect(shiftCards.getByText('Túnel', { exact: true })).toHaveCount(0)
  })

  test('keeps a normal report product when the same product is removed from Tunnel', async ({ page }) => {
    await page.goto('jornadas/nueva?process=PACKING')

    const reportPicker = page.getByRole('combobox', {
      name: 'Buscar producto',
      exact: true,
    })
    await reportPicker.fill('MANTO ESTANDAR')
    await reportPicker.press('Enter')

    const reportDayInput = page
      .locator('input[data-grid-id="capture-grid"][data-grid-col="0"]')
      .first()
    await expect(reportDayInput).toBeVisible()
    await reportDayInput.fill('100')

    await page
      .getByRole('checkbox', { name: /Existe producto para T.nel/ })
      .check()

    const tunnelPicker = page.getByRole('combobox', {
      name: /Buscar producto de T.nel/,
    })
    await tunnelPicker.fill('MANTO ESTANDAR')
    await tunnelPicker.press('Enter')

    const tunnelInputs = page.locator('input[data-grid-id="tunnel-grid"]')
    await expect(tunnelInputs).toHaveCount(2)
    await tunnelInputs.first().fill('25')

    await page
      .getByRole('button', { name: /Eliminar producto de T.nel/ })
      .click()

    await expect(tunnelInputs).toHaveCount(0)
    await expect(reportDayInput).toHaveValue('100')
  })

  test('creates a catalog product and finds it through the catalog search', async ({ page }) => {
    await page.goto('catalogos')

    await expect(page.getByRole('heading', { name: 'Administración de Catálogos' })).toBeVisible()
    await page.getByRole('button', { name: 'Nuevo Producto' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo Producto en Catálogo' })).toBeVisible()

    await page.getByLabel('Nombre del Producto').fill('PRODUCTO E2E TEMPORAL')
    await page.getByRole('button', { name: 'Guardar Cambios' }).click()

    const search = page.getByRole('textbox', { name: 'Buscar productos por nombre, familia o alias' })
    await search.fill('PRODUCTO E2E TEMPORAL')
    await expect(page.getByText('PRODUCTO E2E TEMPORAL', { exact: true })).toBeVisible()
  })
})
