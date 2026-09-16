import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductionDataProvider } from '../state/ProductionDataContext'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { ProductionEntryPage } from './ProductionEntryPage'

function renderNewEntry(initialEntry = '/jornadas/nueva') {
  return render(
    <ProductionDataProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/jornadas/nueva" element={<ProductionEntryPage />} />
          <Route path="/jornadas/:date/editar" element={<ProductionEntryPage />} />
          <Route path="/jornadas/:date" element={<div>Detalle guardado</div>} />
        </Routes>
      </MemoryRouter>
    </ProductionDataProvider>,
  )
}

function completeShiftReport({
  rawMaterial = '100',
  dayReport = '80',
  nightReport = '0',
  productSearch = 'recorte crudo manto',
}: {
  rawMaterial?: string
  dayReport?: string
  nightReport?: string
  productSearch?: string
} = {}) {
  fireEvent.change(screen.getByLabelText(/^Materia prima/), {
    target: { value: rawMaterial },
  })
  fireEvent.change(screen.getByLabelText(/^Reporte Día/), {
    target: { value: dayReport },
  })
  fireEvent.change(screen.getByLabelText(/^Reporte Noche/), {
    target: { value: nightReport },
  })
  fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar producto' }), {
    target: { value: productSearch },
  })
  const productSelect = screen.getByRole('combobox', {
    name: 'Producto con movimiento',
  })
  const product = within(productSelect).getAllByRole('option')[1] as HTMLOptionElement
  fireEvent.change(productSelect, { target: { value: product.value } })
  fireEvent.click(screen.getByRole('button', { name: 'Agregar' }))

  const captureInputs = within(
    screen.getByRole('region', { name: 'Captura por producto y turno' }),
  ).getAllByRole('spinbutton')
  fireEvent.change(captureInputs[0]!, { target: { value: dayReport } })
  fireEvent.change(captureInputs[1]!, { target: { value: nightReport } })
}

function addClosingBalanceProduct(query: string) {
  const closingSection = screen
    .getByRole('heading', { name: 'Saldo generado al cierre' })
    .closest('section')!
  fireEvent.change(
    within(closingSection).getByRole('searchbox', {
      name: 'Buscar producto para saldo',
    }),
    { target: { value: query } },
  )
  const productSelect = within(closingSection).getByRole('combobox', {
    name: 'Producto exacto del catálogo',
  })
  const product = within(productSelect).getAllByRole(
    'option',
  )[1] as HTMLOptionElement
  fireEvent.change(productSelect, { target: { value: product.value } })
  fireEvent.click(within(closingSection).getByRole('button', { name: 'Agregar saldo' }))
}

function addTunnelProduct(query: string) {
  const tunnelSection = screen
    .getByRole('heading', { name: 'Túnel' })
    .closest('section')!

  fireEvent.change(
    within(tunnelSection).getByRole('searchbox', {
      name: 'Buscar producto de Túnel',
    }),
    {
      target: { value: query },
    },
  )

  const productSelect = within(tunnelSection).getByRole('combobox', {
    name: 'Producto exacto del catálogo',
  })

  const product = within(productSelect).getAllByRole(
    'option',
  )[1] as HTMLOptionElement

  fireEvent.change(productSelect, {
    target: { value: product.value },
  })

  fireEvent.click(
    within(tunnelSection).getByRole('button', {
      name: 'Agregar a Túnel',
    }),
  )
}

function addTreatmentProduct(query: string) {
  const treatmentSection = screen
    .getByRole('heading', { name: 'Tratamiento' })
    .closest('section')!

  fireEvent.change(
    within(treatmentSection).getByRole('searchbox', {
      name: 'Buscar producto de tratamiento',
    }),
    {
      target: { value: query },
    },
  )

  const productSelect = within(treatmentSection).getByRole('combobox', {
    name: 'Producto exacto del catálogo',
  })

  const product = within(productSelect).getAllByRole(
    'option',
  )[1] as HTMLOptionElement

  fireEvent.change(productSelect, {
    target: { value: product.value },
  })

  fireEvent.click(
    within(treatmentSection).getByRole('button', {
      name: 'Agregar tratamiento',
    }),
  )
}

describe('ProductionEntryPage product selector', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('filters the product list by any family or product word', () => {
    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/jornadas/nueva']}>
          <Routes>
            <Route path="/jornadas/nueva" element={<ProductionEntryPage />} />
          </Routes>
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Buscar producto' }),
      { target: { value: 'aleta' } },
    )

    const productSelect = screen.getByRole('combobox', {
      name: 'Producto con movimiento',
    })
    const options = within(productSelect).getAllByRole('option').slice(1)

    expect(options.length).toBeGreaterThan(0)
    expect(
      options.every((option) => option.textContent?.toLowerCase().includes('aleta')),
    ).toBe(true)
    expect(within(productSelect).queryByText(/manto japonés/i)).not.toBeInTheDocument()
  })

  it('adapts capture to Freezing and prioritizes traceable Packing availability', () => {
    renderNewEntry('/jornadas/nueva?process=FREEZING')

    expect(screen.getByRole('tab', { name: 'Congelamiento' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.queryByLabelText(/^MP descarga/)).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Disponibilidad para congelar' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Existe producto para Túnel')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Balance MP Tubo' })).toBeNull()

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Buscar producto' }),
      { target: { value: 'aleta 1000 2000' } },
    )
    const selector = screen.getByRole('combobox', {
      name: 'Producto con movimiento',
    })
    expect(within(selector).getAllByRole('option')[1]).toHaveTextContent(
      /Disponible:/,
    )
  })

  it('changes process immediately while the form is empty', () => {
    renderNewEntry()

    fireEvent.click(screen.getByRole('tab', { name: 'Congelamiento' }))

    expect(screen.getByRole('tab', { name: 'Congelamiento' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('confirms a process change with data and restores independent drafts', () => {
    renderNewEntry()
    fireEvent.change(screen.getByLabelText(/^Materia prima/), {
      target: { value: '123' },
    })

    fireEvent.click(screen.getByRole('tab', { name: 'Congelamiento' }))
    const freezingDialog = screen.getByRole('dialog', {
      name: 'Cambiar a Congelamiento',
    })
    fireEvent.click(
      within(freezingDialog).getByRole('button', { name: 'Cambiar proceso' }),
    )
    fireEvent.change(screen.getByLabelText(/^Reporte Día/), {
      target: { value: '45' },
    })

    fireEvent.click(screen.getByRole('tab', { name: 'Envasado' }))
    const packingDialog = screen.getByRole('dialog', {
      name: 'Cambiar a Envasado',
    })
    fireEvent.click(
      within(packingDialog).getByRole('button', { name: 'Cambiar proceso' }),
    )

    expect(screen.getByLabelText(/^Materia prima/)).toHaveValue(123)
    expect(screen.getByLabelText(/^Reporte Día/)).toHaveValue(null)
  })

  it('shows the Tube MP balance and distinguishes overall utilization', () => {
    renderNewEntry()
    completeShiftReport({
      rawMaterial: '100',
      dayReport: '32',
      productSearch: 'manto japonés crudo',
    })

    expect(screen.getByRole('heading', { name: 'Balance MP Tubo' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Aprovechamiento general' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Rendimiento técnico y aprovechamiento MP',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Detalle técnico de Anillas')).toBeInTheDocument()
    expect(screen.getByText('Salidas del proceso de Anillas')).toBeInTheDocument()
  })

  it('keeps the optional Tunnel stage hidden and at zero by default', () => {
    renderNewEntry()

    expect(screen.getByLabelText('Existe producto para Túnel')).not.toBeChecked()
    expect(screen.queryByRole('heading', { name: 'Túnel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Túnel total' })).not.toBeInTheDocument()
  })

  it('shows Tunnel only after its condition is enabled', () => {
    renderNewEntry()

    fireEvent.click(screen.getByLabelText('Existe producto para Túnel'))

    expect(screen.getByLabelText('Existe producto para Túnel')).toBeChecked()
    expect(screen.getByRole('heading', { name: 'Túnel' })).toBeInTheDocument()
  })

  it('blocks closing when Tunnel is enabled without a movement', () => {
    renderNewEntry()
    completeShiftReport()
    fireEvent.click(screen.getByLabelText('Existe producto para Túnel'))

    expect(
      screen.getByText(
        'Se indicó que existe producto para Túnel, pero no se registraron productos.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar jornada' })).toBeDisabled()
  })

  it('adapts the fixed action bar to the theme, viewport, and capture state', () => {
    renderNewEntry()

    const incompleteTitle = screen.getByText(
      'Completa los datos requeridos para validar la jornada.',
    )
    const actionBar = incompleteTitle.closest('[role="status"]')?.parentElement
      ?.parentElement
    const page = screen.getByRole('heading', { name: 'Nueva jornada' }).closest(
      '.space-y-5',
    )

    expect(
      screen.getByText('Puedes guardar un borrador válido y continuar después.'),
    ).toBeInTheDocument()
    expect(actionBar).toHaveClass(
      'dark:border-[#2b5268]',
      'dark:bg-[#0a1a27]',
    )
    expect(page).toHaveClass(
      'pb-[calc(var(--entry-action-bar-height)+1rem)]',
      '[--entry-action-bar-height:8.75rem]',
      'sm:[--entry-action-bar-height:4.25rem]',
      'xl:[--entry-action-bar-height:var(--sidebar-footer-height)]',
    )
    expect(screen.getByRole('button', { name: 'Cerrar jornada' })).toBeDisabled()

    completeShiftReport({ dayReport: '90' })

    const captureInputs = within(
      screen.getByRole('region', { name: 'Captura por producto y turno' }),
    ).getAllByRole('spinbutton')
    fireEvent.change(captureInputs[0]!, { target: { value: '80' } })

    expect(
      screen.getByText('Faltan 10.00 kg por registrar en Turno Día.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar jornada' })).toBeDisabled()

    expect(
      screen.getByText('La jornada todavía requiere revisión.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Revisa el cuadre y las validaciones pendientes antes de cerrar.',
      ),
    ).toBeInTheDocument()

    fireEvent.change(captureInputs[0]!, { target: { value: '90' } })

    expect(screen.getByText('La jornada está lista para cerrar.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'El cuadre es correcto y no existen diferencias pendientes.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar jornada' })).toBeEnabled()
  })

  it('keeps Treatment pending until both shift reports reconcile', () => {
    renderNewEntry()

    expect(screen.getByText('ESPERANDO CUADRE DE TURNOS')).toBeInTheDocument()
    completeShiftReport({ dayReport: '80' })

    expect(screen.getByText('DISPONIBLE')).toBeInTheDocument()
    expect(
      screen.getByRole('searchbox', { name: 'Buscar producto de tratamiento' }),
    ).not.toBeDisabled()
  })

  it('recalculates Aleta yield immediately as closing balance is typed', () => {
    renderNewEntry()
    completeShiftReport({
      rawMaterial: '100',
      dayReport: '15.6',
      productSearch: 'aleta 1000 2000',
    })
    addClosingBalanceProduct('aleta 1000 2000')

    const aletaCard = screen.getByRole('heading', { name: 'Aleta' }).closest('article')!
    expect(within(aletaCard).getAllByText('78.00%')).toHaveLength(3)

    fireEvent.change(screen.getByLabelText(/^Saldo al cierre/), {
      target: { value: '2.4' },
    })

    expect(within(aletaCard).getByText('90.00%')).toBeInTheDocument()
    expect(within(aletaCard).getByText('Objetivo alcanzado')).toBeInTheDocument()
  })

  it('updates the compact closing control and the general 80% gap in real time', () => {
    renderNewEntry()
    completeShiftReport({
      rawMaterial: '100',
      dayReport: '79',
      productSearch: 'recorte crudo manto',
    })
    addClosingBalanceProduct('recorte crudo manto')

    const control = screen
      .getAllByText('Control de rendimientos')[0]!
      .closest('aside')!
    expect(within(control).getByText('79.00%')).toBeInTheDocument()
    expect(within(control).getByText('PT mínimo')).toBeInTheDocument()
    expect(within(control).getByText('1.00 kg')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^Saldo al cierre/), {
      target: { value: '1' },
    })

    expect(within(control).getByText('80.00%')).toBeInTheDocument()
    expect(within(control).getByText('Referencia general alcanzada')).toBeInTheDocument()
  })

  it('clears a zero kg value on focus, restores it when left empty, and preserves positive values', () => {
    renderNewEntry()
    completeShiftReport()
    expect(screen.queryByLabelText(/^Saldo al cierre/)).not.toBeInTheDocument()
    addClosingBalanceProduct('recorte crudo manto')

    const closingInput = screen.getByLabelText(/^Saldo al cierre/)
    expect(closingInput).toHaveValue(0)

    fireEvent.focus(closingInput)
    expect(closingInput).toHaveValue(null)
    fireEvent.blur(closingInput)
    expect(closingInput).toHaveValue(0)

    fireEvent.change(closingInput, { target: { value: '2.5' } })
    fireEvent.focus(closingInput)
    expect(closingInput).toHaveValue(2.5)
  })

  it('updates Tunnel Day, Night and total reactively after reports reconcile', () => {
    renderNewEntry()
    completeShiftReport()
    fireEvent.click(screen.getByLabelText('Existe producto para Túnel'))

    addTunnelProduct('recorte crudo manto')

    const tunnelSection = screen
      .getByRole('heading', { name: 'Túnel' })
      .closest('section')!
    fireEvent.change(within(tunnelSection).getByLabelText(/^Kg Día/), {
      target: { value: '5' },
    })
    fireEvent.change(within(tunnelSection).getByLabelText(/^Kg Noche/), {
      target: { value: '7' },
    })

    const totalMetric = within(tunnelSection)
      .getByRole('heading', { name: 'Total Túnel' })
      .closest('article')!
    expect(within(totalMetric).getByText('12.00 kg')).toBeInTheDocument()
    expect(within(tunnelSection).getAllByText('12.00 kg')).toHaveLength(2)
    const finishedMetric = screen
      .getByRole('heading', { name: 'Producto terminado' })
      .closest('article')!
    expect(within(finishedMetric).getByText('92.00 kg')).toBeInTheDocument()
  })

  it('does not remove Tunnel movements when its checkbox is cleared', () => {
    renderNewEntry()
    completeShiftReport()
    const tunnelCheckbox = screen.getByLabelText('Existe producto para Túnel')
    fireEvent.click(tunnelCheckbox)

    addTunnelProduct('recorte crudo manto')

    const tunnelSection = screen.getByRole('heading', { name: 'Túnel' }).closest('section')!
    const dayInput = within(tunnelSection).getByLabelText(/^Kg Día/)
    fireEvent.change(dayInput, { target: { value: '5' } })

    fireEvent.click(tunnelCheckbox)

    expect(tunnelCheckbox).toBeChecked()
    expect(dayInput).toHaveValue(5)
    expect(
      screen.getByText(
        'Existen productos de Túnel registrados. Elimina estos movimientos antes de desactivar la opción.',
      ),
    ).toBeInTheDocument()
  })

  it('restores the Tunnel checkbox and movements when reopening a draft', () => {
    const firstRender = renderNewEntry()
    completeShiftReport()
    fireEvent.click(screen.getByLabelText('Existe producto para Túnel'))

    addTunnelProduct('recorte crudo manto')

    const tunnelSection = screen.getByRole('heading', { name: 'Túnel' }).closest('section')!
    fireEvent.change(within(tunnelSection).getByLabelText(/^Kg Día/), {
      target: { value: '5' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
    const stored = JSON.parse(
      window.localStorage.getItem('trabunda-production-days-v2') ?? '[]',
    )
    const storedDate = stored[0]?.date as string
    firstRender.unmount()

    renderNewEntry(`/jornadas/${storedDate}/editar`)

    expect(screen.getByLabelText('Existe producto para Túnel')).toBeChecked()
    const reopenedTunnel = screen.getByRole('heading', { name: 'Túnel' }).closest('section')!
    expect(within(reopenedTunnel).getByLabelText(/^Kg Día/)).toHaveValue(5)
  })

  it('preserves later-stage values when an earlier report becomes unbalanced', () => {
    renderNewEntry()
    completeShiftReport({
      rawMaterial: '100',
      dayReport: '15.6',
      productSearch: 'aleta 1000 2000',
    })

    addTunnelProduct('aleta 1000 2000')
    addTreatmentProduct('aleta 1000 2000')
      
    const treatmentSection = screen
      .getByRole('heading', { name: 'Tratamiento' })
      .closest('section')!
      
    const treatmentInput =
    within(treatmentSection).getByLabelText(/^Kg tratamiento/)
    fireEvent.change(treatmentInput, { target: { value: '1.2' } })

    const reportInput = within(
      screen.getByRole('region', { name: 'Captura por producto y turno' }),
    ).getAllByRole('spinbutton')[0]!
    fireEvent.change(reportInput, { target: { value: '14.6' } })

    expect(treatmentInput).toHaveValue(1.2)
    expect(treatmentInput).toBeDisabled()
    expect(screen.getByText('ESPERANDO CUADRE DE TURNOS')).toBeInTheDocument()

    fireEvent.change(reportInput, { target: { value: '15.6' } })
    expect(screen.getByLabelText(/^Kg tratamiento/)).toHaveValue(1.2)
    expect(screen.getByLabelText(/^Kg tratamiento/)).not.toBeDisabled()
  })

  it('asks for confirmation instead of blocking when only family targets are low', () => {
    renderNewEntry()
    completeShiftReport()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar jornada' }))

    expect(
      screen.getByRole('dialog', { name: 'Cerrar jornada' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver a revisar' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Cerrar de todas formas' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar de todas formas' }))
    expect(screen.getByText('Detalle guardado')).toBeInTheDocument()
    const stored = JSON.parse(
      window.localStorage.getItem('trabunda-production-days-v2') ?? '[]',
    )
    expect(stored[0]).toMatchObject({ status: 'CLOSED' })
  })

  it('saves an incomplete journey as a draft', () => {
    renderNewEntry()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))

    expect(screen.getByText('Detalle guardado')).toBeInTheDocument()
    const stored = JSON.parse(
      window.localStorage.getItem('trabunda-production-days-v2') ?? '[]',
    )
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ status: 'DRAFT' })
  })

  it('does not expose editing controls for a closed journey URL', () => {
    const closedDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      id: 'production-day-2026-09-07',
      date: '2026-09-07',
      status: 'CLOSED' as const,
    }
    window.localStorage.setItem(
      'trabunda-production-days-v1',
      JSON.stringify([closedDay]),
    )

    renderNewEntry('/jornadas/2026-09-07/editar')

    expect(
      screen.getByRole('heading', { name: 'Esta jornada no se puede editar' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar borrador' })).not.toBeInTheDocument()
  })

  it('blocks direct creation attempts when the selected week is closed', () => {
    window.localStorage.setItem('trabunda-active-operational-week-v1', '41')

    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/jornadas/nueva']}>
          <Routes>
            <Route path="/jornadas/nueva" element={<ProductionEntryPage />} />
          </Routes>
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Esta semana es de solo lectura' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('searchbox', { name: 'Buscar producto' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Nueva jornada' }),
    ).not.toBeInTheDocument()
  })

  it('suggests the next missing date inside a selected past open week', () => {
    vi.setSystemTime(new Date('2026-09-14T12:00:00-05:00'))
    window.localStorage.setItem('trabunda-active-operational-week-v1', '42')

    renderNewEntry()

    expect(screen.getByRole('heading', { name: 'Nueva jornada' })).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha')).toHaveValue('2026-09-08')
    expect(screen.getByLabelText('Fecha')).toHaveAttribute('min', '2026-09-07')
    expect(screen.getByLabelText('Fecha')).toHaveAttribute('max', '2026-09-13')
  })

  it('defaults Sunday to balance processing and enables the discharge exception explicitly', () => {
    renderNewEntry()

    fireEvent.change(screen.getByLabelText('Fecha'), {
      target: { value: '2026-09-13' },
    })

    expect(screen.getByText('DOMINGO · PROCESAMIENTO DE SALDOS')).toBeInTheDocument()
    const discharge = screen.getByLabelText(
      'Hubo descarga / producción nueva el domingo',
    )
    expect(discharge).not.toBeChecked()
    expect(screen.getByLabelText(/^Materia prima/)).toBeDisabled()
    expect(screen.getByLabelText(/^Materia prima/)).toHaveValue(0)
    expect(screen.queryByRole('heading', { name: 'Tratamiento' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Saldo generado al cierre' })).not.toBeInTheDocument()
    expect(screen.getByText('NO APLICA')).toBeInTheDocument()

    fireEvent.click(discharge)

    expect(discharge).toBeChecked()
    expect(screen.getByText('DOMINGO · PRODUCCIÓN NORMAL')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Materia prima/)).toBeEnabled()
    expect(screen.getAllByRole('heading', { name: 'Tratamiento' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Saldo generado al cierre' })).toBeInTheDocument()
  })

  it('closes a Sunday balance-only day with physical processing and zero own production', () => {
    renderNewEntry()
    fireEvent.change(screen.getByLabelText('Fecha'), {
      target: { value: '2026-09-13' },
    })

    const balancesSection = screen
      .getByRole('heading', { name: 'Saldos anteriores procesados' })
      .closest('section')!
    const balanceSelect = within(balancesSection).getByRole('combobox', {
      name: 'Saldo pendiente disponible',
    })
    const balanceOption = within(balanceSelect).getAllByRole(
      'option',
    )[1] as HTMLOptionElement
    fireEvent.change(balanceSelect, {
      target: { value: balanceOption.value },
    })

    fireEvent.click(
      within(balancesSection).getByRole('button', {
        name: 'Usar saldo',
      }),
    )

    // El primer saldo disponible es una Aleta histórica genérica.
    // Ahora debe reclasificarse antes de consumirse.
    const exactProductSelect = within(balancesSection).getByRole(
      'combobox',
      { name: 'Producto exacto' },
    )

    const exactProductOption = within(exactProductSelect)
      .getAllByRole('option')
      .find((option) =>
        option.textContent?.includes('1000 g - 2000 g'),
      ) as HTMLOptionElement
    
    expect(exactProductOption).toBeDefined()
    
    fireEvent.change(exactProductSelect, {
      target: { value: exactProductOption.value },
    })

    const processedDayInput =
      within(balancesSection).getByLabelText(/^Procesado Día/)

    const processedNightInput =
      within(balancesSection).getByLabelText(/^Procesado Noche/)

    expect(processedDayInput).toHaveValue(0)
    expect(processedNightInput).toHaveValue(0)

    const processedKg = '100'

    fireEvent.change(processedDayInput, {
      target: { value: processedKg },
    })

    fireEvent.change(screen.getByLabelText(/^Reporte Día/), {
      target: { value: processedKg },
    })

    fireEvent.change(screen.getByLabelText(/^Reporte Noche/), {
      target: { value: '0' },
    })

    const ownProduction = screen
      .getByRole('heading', { name: 'Producción productiva atribuida' })
      .closest('article')!
    expect(within(ownProduction).getByText('0.00 kg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar jornada' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar jornada' }))
    const closeDialog = screen.getByRole('dialog', { name: 'Cerrar jornada' })
    fireEvent.click(
      within(closeDialog).getByRole('button', { name: 'Cerrar jornada' }),
    )
    expect(screen.getByText('Detalle guardado')).toBeInTheDocument()
    const stored = JSON.parse(
      window.localStorage.getItem('trabunda-production-days-v2') ?? '[]',
    )
    expect(stored[0]).toMatchObject({
      date: '2026-09-13',
      status: 'CLOSED',
      operationMode: 'BALANCE_ONLY',
      declaredRawMaterialKg100: 0,
      declaredFinishedTotalKg100: 0,
    })
  })
})
