import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductionDataProvider } from '../state/ProductionDataContext'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { ProductionDayPage } from './ProductionDayPage'

function renderWednesdayPage() {
  return render(
    <MemoryRouter initialEntries={['/jornadas/2026-09-02']}>
      <Routes>
        <Route path="/jornadas/:date" element={<ProductionDayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderThursdayPage() {
  return render(
    <MemoryRouter initialEntries={['/jornadas/2026-09-03']}>
      <Routes>
        <Route path="/jornadas/:date" element={<ProductionDayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderDayPage(date: string) {
  return render(
    <MemoryRouter initialEntries={[`/jornadas/${date}`]}>
      <Routes>
        <Route path="/jornadas/:date" element={<ProductionDayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function expectMetricValue(label: string, value: string) {
  const metric = screen.getByRole('heading', { name: label }).closest('article')

  expect(metric).not.toBeNull()
  expect(within(metric!).getByText(value)).toBeInTheDocument()
}

describe('Wednesday production day page', () => {
  it('shows a zero difference and a balanced reconciliation', () => {
    renderWednesdayPage()

    expect(
      screen.getByRole('heading', { level: 1, name: /miércoles/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Exportar Excel' }),
    ).toBeEnabled()

    const reconciliationHeading = screen.getByRole('heading', {
      name: 'Cuadre de producción',
    })
    const reconciliation = reconciliationHeading.closest('section')

    expect(reconciliation).not.toBeNull()
    expect(within(reconciliation!).getByText('CUADRADO')).toBeInTheDocument()
    expect(
      within(reconciliation!).getAllByText('0.00 kg').length,
    ).toBeGreaterThan(0)
    expect(
      within(reconciliation!).getByText(
        'El saldo al cierre declarado coincide con el saldo calculado producto por producto.',
      ),
    ).toBeInTheDocument()

    const differenceCard = screen
      .getByRole('heading', { name: 'Diferencia' })
      .closest('article')

    expect(differenceCard).not.toBeNull()
    expect(within(differenceCard!).getByText('0.00 kg')).toBeInTheDocument()
    expect(screen.getByText('Sin saldo anterior recibido')).toBeInTheDocument()
  })

  it('presents 75.38% as acceptable without invalidating the cuadre', () => {
    renderWednesdayPage()

    const performanceHeading = screen.getByRole('heading', {
      name: 'Aprovechamiento general',
    })
    const performance = performanceHeading.closest('section')

    expect(performance).not.toBeNull()
    expect(within(performance!).getByText('75.38%')).toBeInTheDocument()
    expect(
      within(performance!).getByText('ACEPTABLE'),
    ).toBeInTheDocument()
    expect(
      within(performance!).getByText('Operación razonable, pero debajo del objetivo'),
    ).toBeInTheDocument()
    expect(screen.queryByText('NO CUADRADO')).not.toBeInTheDocument()
    expect(screen.getAllByText('CUADRADO').length).toBeGreaterThan(0)
  })
})

describe('Thursday production day page', () => {
  it('shows the closed Thursday production and fully processed prior balance', () => {
    renderThursdayPage()

    expect(
      screen.getByRole('heading', { level: 1, name: /jueves/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('CUADRADO').length).toBeGreaterThan(0)

    const receivedBalanceHeading = screen.getByRole('heading', {
      name: 'Saldo recibido de jornadas anteriores',
    })
    const receivedBalance = receivedBalanceHeading.closest('section')

    expect(receivedBalance).not.toBeNull()
    expect(
      within(receivedBalance!).getAllByText('40,298.30 kg').length,
    ).toBeGreaterThanOrEqual(2)
    expect(within(receivedBalance!).getByText('Procesado Día')).toBeInTheDocument()
    expect(
      within(receivedBalance!).getAllByText('0.00 kg').length,
    ).toBeGreaterThan(0)
  })
})

describe('Friday and Saturday production day pages', () => {
  it('shows Friday squared after processing the complete Thursday balance', () => {
    renderDayPage('2026-09-04')

    expect(
      screen.getByRole('heading', { level: 1, name: /viernes/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('CUADRADO').length).toBeGreaterThan(0)

    const receivedBalance = screen
      .getByRole('heading', { name: 'Saldo recibido de jornadas anteriores' })
      .closest('section')

    expect(receivedBalance).not.toBeNull()
    expect(
      within(receivedBalance!).getAllByText('23,770.00 kg').length,
    ).toBeGreaterThan(0)
    expect(
      within(receivedBalance!).getAllByText('23,770.00 kg').length,
    ).toBeGreaterThan(0)
    expect(
      within(receivedBalance!).getAllByText('0.00 kg').length,
    ).toBeGreaterThan(0)
  })

  it('shows Saturday as the latest squared close', () => {
    renderDayPage('2026-09-05')

    expect(
      screen.getByRole('heading', { level: 1, name: /sábado/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('CUADRADO').length).toBeGreaterThan(0)
    expectMetricValue('Materia prima', '488,476.00 kg')
    expectMetricValue('Producto terminado', '456,983.00 kg')
    expectMetricValue('Saldo al cierre', '44,660.00 kg')
    expectMetricValue('Producción Día', '185,620.00 kg')
    expectMetricValue('Producción Noche', '219,800.00 kg')
    expectMetricValue('Tratamiento', '6,903.00 kg')
    expectMetricValue('Saldo anterior procesado', '10,820.00 kg')
    expectMetricValue('Diferencia', '0.00 kg')
    expect(screen.getByText('93.55%')).toBeInTheDocument()
    const closingBalance = screen
      .getByRole('heading', {
        name: 'Saldo generado al cierre por producto',
      })
      .closest('section')

    expect(closingBalance).not.toBeNull()
    expect(
      within(closingBalance!).getByText(
        'Producto pendiente que esta jornada dejó como saldo al momento de su cierre.',
      ),
    ).toBeInTheDocument()
    expect(
      within(closingBalance!).getAllByText('44,660.00 kg').length,
    ).toBeGreaterThan(0)
    expect(
      within(closingBalance!).getAllByText('0.00 kg').length,
    ).toBeGreaterThan(0)
    expect(
      within(closingBalance!).getByText('Saldo pendiente actual'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Producción Día').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Producción Noche').length).toBeGreaterThan(0)
    expect(
      screen.getByText(
        'Los totales de Día y Noche son explícitos. El reparto por producto fue reconstruido para conciliar los totales cuando el origen no identifica el turno.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/MIÉRCOLES/)).not.toBeInTheDocument()
    const productionTable = screen.getByRole('region', {
      name: 'Producción por familia, turno y concepto de cuadre',
    })
    const firstColumnCells = productionTable.querySelectorAll(
      'thead tr:first-child > th:first-child, tbody th:first-child',
    )

    expect(productionTable).toHaveClass(
      'overflow-x-auto',
      'data-scroll-clean-edge',
    )
    expect(productionTable.querySelectorAll('.overflow-x-auto')).toHaveLength(0)
    expect(within(productionTable).getByRole('table')).toHaveClass(
      'min-w-[86rem]',
    )
    expect(within(productionTable).queryByText('TÃºnel')).not.toBeInTheDocument()
    const columnHeaders = productionTable.querySelectorAll('thead th')

    columnHeaders.forEach((header) => {
      const classNames = [...header.classList]

      expect(classNames).not.toContain('sticky')
      expect(classNames.some((className) => /^top-/.test(className))).toBe(false)
      expect(classNames.some((className) => /^z-/.test(className))).toBe(false)
      expect(classNames).toContain('md:sticky')
      expect(classNames.some((className) => /^md:top-/.test(className))).toBe(true)
      expect(classNames.some((className) => /^md:z-/.test(className))).toBe(true)
    })
    expect(firstColumnCells.length).toBeGreaterThan(1)
    firstColumnCells.forEach((cell) => {
      const classNames = [...cell.classList]

      expect(classNames).not.toContain('sticky')
      expect(classNames).not.toContain('left-0')
      expect(classNames.some((className) => /^z-/.test(className))).toBe(false)
      expect(classNames).toContain('lg:left-0')
    })
    const performance = screen
      .getByRole('heading', { name: 'Aprovechamiento general' })
      .closest('section')
    expect(performance).not.toBeNull()
    expect(within(performance!).getByText('REVISAR')).toBeInTheDocument()
    expect(
      within(performance!).getByText(
        'No necesariamente es malo, pero puede indicar arrastre de saldos o MP asignada de otro día',
      ),
    ).toBeInTheDocument()
    const consumptionIndicator = within(closingBalance!).getByText(
      'Consumos posteriores incorporados',
    )
    expect(consumptionIndicator).toBeInTheDocument()
    expect(consumptionIndicator).toHaveAttribute(
      'title',
      'El saldo mostrado corresponde al cierre de esta jornada. Los consumos posteriores permiten conocer cuánto permanece pendiente actualmente.',
    )
  })
})

describe('Freezing production day page', () => {
  it('shows the process-specific detail without Packing panels', () => {
    const freezingDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      id: 'production-day-freezing-2026-09-08',
      date: '2026-09-08',
      displayName: 'Martes 08/09/2026',
      process: 'FREEZING' as const,
      status: 'DRAFT' as const,
    }
    window.localStorage.setItem(
      'trabunda-production-days-v2',
      JSON.stringify([freezingDay]),
    )

    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/jornadas/2026-09-08?process=FREEZING']}>
          <Routes>
            <Route path="/jornadas/:date" element={<ProductionDayPage />} />
          </Routes>
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(screen.getByText('Detalle de jornada · Congelamiento')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Productos congelados' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Origen del congelamiento' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Detalle FIFO por origen' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Aprovechamiento general' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Exportar Excel' })).toBeNull()
    window.localStorage.clear()
  })
})

describe('Packing day closing dialog', () => {
  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  function renderDraft() {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()
    window.localStorage.setItem(
      'trabunda-production-days-v2',
      JSON.stringify([
        {
          ...WEDNESDAY_PRODUCTION_DAY,
          id: 'production-day-2026-09-08',
          date: '2026-09-08',
          displayName: 'Martes 08/09/2026',
          status: 'DRAFT',
        },
      ]),
    )

    return render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/jornadas/2026-09-08']}>
          <Routes>
            <Route path="/jornadas/:date" element={<ProductionDayPage />} />
          </Routes>
        </MemoryRouter>
      </ProductionDataProvider>,
    )
  }

  it('opens an accessible dialog, closes it with Escape and returns focus to the trigger', () => {
    renderDraft()
    const trigger = screen.getByRole('button', { name: 'Cerrar jornada' })
    trigger.focus()

    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Cerrar jornada' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog).getByText('Advertencias antes del cierre')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(
      JSON.parse(window.localStorage.getItem('trabunda-production-days-v2') ?? '[]')[0].status,
    ).toBe('DRAFT')
  })

  it('closes with observation, keeping the accepted warnings as the journey record', () => {
    renderDraft()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar jornada' }))
    const dialog = screen.getByRole('dialog', { name: 'Cerrar jornada' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar con observación' }))

    const [saved] = JSON.parse(
      window.localStorage.getItem('trabunda-production-days-v2') ?? '[]',
    )
    expect(saved.status).toBe('CLOSED')
    expect(saved.closureObservations.length).toBeGreaterThan(0)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
