import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { closedFreezingDay, closedPackingDay } from '../../../test/productionFixtures'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { kg } from '../model/calculations'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { ProductionDaysPage } from './ProductionDaysPage'

describe('production days page', () => {
  it('lists the four real squared journeys without inventing Sunday', () => {
    render(
      <MemoryRouter>
        <ProductionDaysPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('4 de 7 días de la semana')).toBeInTheDocument()
    expect(screen.getByText('Bajo referencia (<80%)')).toBeInTheDocument()

    const squaredStatuses = [
      ...screen.queryAllByText('CUADRADO'),
      ...screen.queryAllByText('CUADRADO · OBSERVADO'),
    ]

    expect(squaredStatuses).toHaveLength(4)
    expect(screen.getAllByRole('link', { name: /Ver detalle/i })).toHaveLength(4)
    expect(screen.getByText('Último registro disponible')).toBeInTheDocument()
    expect(screen.getByText('SÁBADO')).toBeInTheDocument()
    expect(screen.queryByText('DOMINGO')).not.toBeInTheDocument()
  })

  it('aligns the eight operational columns on one explicit desktop grid', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()

    render(
      <ProductionDataProvider>
        <MemoryRouter>
          <ProductionDaysPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    const table = screen.getByRole('table', {
      name: 'Jornadas de producción registradas',
    })
    const headers = within(table).getAllByRole('columnheader')

    expect(headers.slice(0, 8).map((header) => header.textContent)).toEqual([
      'Jornada',
      'Materia prima',
      'Producto terminado',
      'Saldo final',
      'Diferencia',
      'Cuadre',
      'Aprovechamiento',
      'Acción',
    ])
    expect(headers[8]).toHaveTextContent('Eliminar')
    expect(table).toHaveClass('table-fixed', 'min-w-[72rem]')
    expect(
      [...table.querySelectorAll('col')].map((column) => column.className),
    ).toEqual([
      'w-[13%]',
      'w-[10%]',
      'w-[11%]',
      'w-[10%]',
      'w-[8%]',
      'w-[16%]',
      'w-[13%]',
      'w-[14%]',
      'w-[5%]',
    ])

    headers.slice(0, 8).forEach((header) => {
      expect(header).toHaveClass('px-3', 'text-center', 'align-middle')
    })
    expect(headers[8]).toHaveClass('px-2', 'text-center', 'align-middle')

    const latestRow = screen.getByText('LUNES').closest('tr')
    expect(latestRow).not.toBeNull()

    const journeyCell = within(latestRow!).getByRole('rowheader')
    const cells = within(latestRow!).getAllByRole('cell')

    expect(journeyCell).toHaveClass('px-3', 'text-center', 'align-middle')
    expect(journeyCell).not.toHaveClass('border-l-4')
    expect(journeyCell.firstElementChild).toHaveClass(
      'w-full',
      'items-center',
      'text-center',
    )

    cells.slice(0, -1).forEach((cell) => {
      expect(cell).toHaveClass('px-3', 'text-center', 'align-middle')
    })
    expect(cells.at(-1)).toHaveClass('px-2', 'text-center', 'align-middle')

    expect(screen.getByText('615,239.00').parentElement).toHaveClass(
      'w-full',
      'justify-center',
      'text-center',
    )
    expect(screen.getByText('492,763.00').parentElement).toHaveClass(
      'w-full',
      'justify-center',
    )
    expect(screen.getByText('60,450.00').parentElement).toHaveClass(
      'w-full',
      'justify-center',
    )
    expect(screen.getByText('0.00').parentElement).toHaveClass(
      'w-full',
      'justify-center',
    )

    expect(
      within(latestRow!).getByText('CUADRADO').closest('td')?.firstElementChild,
    ).toHaveClass('w-full', 'justify-center')

    const utilization = within(latestRow!).getByLabelText(/^Aprovechamiento /)
    expect(utilization).toHaveClass(
      'w-full',
      'flex-col',
      'items-center',
      'justify-center',
    )
    expect(utilization).not.toHaveClass('xl:flex-row')

    expect(
      within(latestRow!).getByRole('link', { name: /Ver detalle/i })
        .parentElement,
    ).toHaveClass('flex', 'w-full', 'justify-center')
  })

  it('keeps past week 42 open and closes it manually without fictitious days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-14T12:00:00-05:00'))
    window.localStorage.clear()
    window.localStorage.setItem('trabunda-active-operational-week-v1', '42')

    render(
      <ProductionDataProvider>
        <MemoryRouter>
          <ProductionDaysPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(
      screen.getByText(/07 SEP — 13 SEP · Abierta · 1 de 7/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Nueva jornada' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar semana' }))
    const dialog = screen.getByRole('dialog', {
      name: 'Cerrar semana 42 · Envasado',
    })

    expect(
      within(dialog).getByText('Martes 08/09/2026 · SIN REGISTRO'),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText('Domingo 13/09/2026 · SIN REGISTRO'),
    ).toBeInTheDocument()

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Cerrar semana' }),
    )

    expect(
      screen.getByText(/07 SEP — 13 SEP · Cerrada · Solo lectura/),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Nueva jornada' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cerrar semana' }),
    ).not.toBeInTheDocument()
  })

  it('identifies a registered draft that blocks manual week closure', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-14T12:00:00-05:00'))
    window.localStorage.clear()
    window.localStorage.setItem('trabunda-active-operational-week-v1', '42')
    window.localStorage.setItem(
      'trabunda-production-days-v1',
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

    render(
      <ProductionDataProvider>
        <MemoryRouter>
          <ProductionDaysPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar semana' }))
    const dialog = screen.getByRole('dialog', {
      name: 'Cerrar semana 42 · Envasado',
    })

    expect(
      within(dialog).getByText(
        /Martes 08\/09\/2026 todavía está en estado DRAFT/,
      ),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole('button', { name: 'Cerrar semana' }),
    ).toBeDisabled()
  })

  it('shows the same journey status as the Dashboard: every closed week 41 journey carries its observations', () => {
    render(
      <MemoryRouter>
        <ProductionDaysPage />
      </MemoryRouter>,
    )

    const table = screen.getByRole('table', {
      name: 'Jornadas de producción registradas',
    })
    expect(within(table).getAllByText('CUADRADO · OBSERVADO')).toHaveLength(4)
    expect(within(table).queryByText('CUADRADO')).not.toBeInTheDocument()
  })

  it('shows an open journey as POR REVISAR in amber, never as a critical failure', () => {
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

    render(
      <ProductionDataProvider>
        <MemoryRouter>
          <ProductionDaysPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    const row = screen.getByText('MARTES').closest('tr')!
    const badge = within(row).getByText('POR REVISAR')
    expect(within(row).queryByText('POR CUADRAR')).not.toBeInTheDocument()
    expect(badge.closest('span[class*="ring-1"]')?.className).toMatch(/amber/)
    expect(badge.closest('span[class*="ring-1"]')?.className).not.toMatch(/rose/)
    expect(
      within(row).getByRole('button', { name: /Eliminar jornada del/ }),
    ).toHaveClass('size-9', 'shrink-0', 'border')
  })

  it('flags Freezing linked above the physical report in red inside the Freezing summary', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    const origin = closedPackingDay('2026-09-08', 100_000)
    const freezing = closedFreezingDay({
      date: '2026-09-09',
      reportedKg: 80_000,
      linkedKg: 100_000,
      origin,
    })
    window.localStorage.clear()
    window.localStorage.setItem('trabunda-active-operational-week-v1', '42')
    window.localStorage.setItem(
      'trabunda-production-days-v2',
      JSON.stringify([origin, freezing]),
    )

    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/jornadas?process=FREEZING']}>
          <ProductionDaysPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    const summary = screen
      .getByRole('heading', { name: 'Resumen de congelamiento' })
      .closest('section')!
    expect(
      within(summary).getByText('Vinculado por encima de lo reportado'),
    ).toBeInTheDocument()
    const difference = within(summary)
      .getByText('Diferencia de trazabilidad semanal')
      .nextElementSibling
    expect(difference).toHaveTextContent('-20,000.00')
    expect(difference?.className).toMatch(/rose/)
  })

  it('keeps an empty Freezing week visibly unverified instead of showing a reconciled zero', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-24T12:00:00-05:00'))
    window.localStorage.clear()
    window.localStorage.setItem('trabunda-active-operational-week-v1', '48')

    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/jornadas?process=FREEZING']}>
          <ProductionDaysPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Sin registros de congelamiento esta semana',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('Sin registros de congelamiento esta semana').length,
    ).toBeGreaterThanOrEqual(2)

    const metrics = screen.getByRole('region', { name: 'Resumen de jornadas' })
    const differenceCard = within(metrics)
      .getByRole('heading', { name: 'Diferencia de trazabilidad semanal' })
      .closest('article')!
    expect(within(differenceCard).getByText('—')).toBeInTheDocument()
    expect(
      within(differenceCard).getByText('Sin registros para verificar la diferencia'),
    ).toBeInTheDocument()
  })

  it('shows Freezing shift totals and linked kilograms under their matching footer columns', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-14T12:00:00-05:00'))
    window.localStorage.clear()
    window.localStorage.setItem('trabunda-active-operational-week-v1', '46')

    const mondayOrigin = closedPackingDay('2026-10-04', 14_870)
    const thursdayOrigin = closedPackingDay('2026-10-07', 33_650)
    const monday = closedFreezingDay({
      date: '2026-10-05',
      reportedKg: 14_940,
      linkedKg: 14_870,
      origin: mondayOrigin,
    })
    const thursday = closedFreezingDay({
      date: '2026-10-08',
      reportedKg: 33_650,
      linkedKg: 33_650,
      origin: thursdayOrigin,
    })
    const friday = closedFreezingDay({
      date: '2026-10-09',
      reportedKg: 0,
      linkedKg: 0,
      origin: thursdayOrigin,
    })
    const productionDays = [
      mondayOrigin,
      thursdayOrigin,
      {
        ...monday,
        declaredShiftTotalsKg100: { DAY: kg(0), NIGHT: kg(14_940) },
      },
      {
        ...thursday,
        declaredShiftTotalsKg100: { DAY: kg(24_740), NIGHT: kg(8_910) },
      },
      friday,
    ]
    window.localStorage.setItem(
      'trabunda-production-days-v2',
      JSON.stringify(productionDays),
    )

    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/jornadas?process=FREEZING']}>
          <ProductionDaysPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    const footerRow = screen.getByText('TOTAL ACUMULADO').closest('tr')!
    const footerCells = within(footerRow).getAllByRole('cell')

    expect(within(footerRow).getByRole('rowheader')).toHaveClass('text-center')
    footerRow.querySelectorAll('th, td').forEach((cell) => {
      expect(cell).toHaveClass('text-center')
    })
    expect(footerCells[0]).toHaveTextContent('24,740.00 kg')
    expect(footerCells[1]).toHaveTextContent('23,850.00 kg')
    expect(footerCells[2]).toHaveTextContent('48,590.00 kg')
    expect(footerCells[3]).toHaveTextContent('70.00 kg')
    expect(footerCells[4]).toHaveTextContent(/\d de 3 auditadas/)
    expect(footerCells[5]).toHaveTextContent('48,520.00 kg')
    expect(footerCells[6]).toHaveTextContent('3 jornadas')
    expect(footerCells[7]).toHaveTextContent('—')
  })
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})
