import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { closedFreezingDay, closedPackingDay } from '../../../test/productionFixtures'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
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

    expect(headers.map((header) => header.textContent)).toEqual([
      'Jornada',
      'Materia prima',
      'Producto terminado',
      'Saldo final',
      'Diferencia',
      'Cuadre',
      'Aprovechamiento',
      'Acción',
    ])
    expect(table).toHaveClass('table-fixed', 'min-w-[68rem]')
    expect(
      [...table.querySelectorAll('col')].map((column) => column.className),
    ).toEqual([
      'w-[14%]',
      'w-[11%]',
      'w-[12%]',
      'w-[10%]',
      'w-[9%]',
      'w-[17%]',
      'w-[15%]',
      'w-[12%]',
    ])

    headers.forEach((header) => {
      expect(header).toHaveClass('px-3', 'text-center', 'align-middle')
    })

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

    cells.forEach((cell) => {
      expect(cell).toHaveClass('px-3', 'text-center', 'align-middle')
    })

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
    const difference = within(summary).getByText('Dif. trazabilidad').nextElementSibling
    expect(difference).toHaveTextContent('-20,000.00')
    expect(difference?.className).toMatch(/rose/)
  })
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})
