import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { closedFreezingDay, closedPackingDay } from '../../../test/productionFixtures'
import { formatIsoDate } from '../../../utils/formatters'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { BalancesPage } from './BalancesPage'

describe('balances page', () => {
  it('consolidates current and inherited pending balances by origin day', () => {
    render(<MemoryRouter><BalancesPage /></MemoryRouter>)

    const summary = screen.getByRole('region', { name: 'Resumen de saldos' })
    const totalCard = within(summary)
      .getByRole('heading', { name: 'Saldo total pendiente' })
      .closest('article')

    expect(totalCard).not.toBeNull()
    expect(within(totalCard!).getByText('0.00 kg')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Sin saldos pendientes' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/El saldo del sábado fue envasado completamente/),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Saldo pendiente por producto' }),
    ).not.toBeInTheDocument()
  })

  it('centers balance quantities on one explicit column grid', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()

    render(
      <ProductionDataProvider>
        <MemoryRouter><BalancesPage /></MemoryRouter>
      </ProductionDataProvider>,
    )

    const table = screen.getByRole('table', {
      name: 'Detalle del saldo pendiente por producto',
    })
    const headers = within(table).getAllByRole('columnheader')

    expect(table).toHaveClass('table-fixed', 'min-w-[48rem]')
    expect(
      [...table.querySelectorAll('col')].map((column) => column.className),
    ).toEqual(['w-[48%]', 'w-[13%]', 'w-[13%]', 'w-[13%]', 'w-[13%]'])
    headers.slice(1).forEach((header) => {
      expect(header).toHaveClass('px-3', 'text-center', 'align-middle')
    })

    const firstProductRow = table.querySelector<HTMLElement>(
      'tbody tr:nth-child(2)',
    )
    expect(firstProductRow).not.toBeNull()
    within(firstProductRow!).getAllByRole('cell').forEach((cell) => {
      expect(cell).toHaveClass('px-3', 'text-center', 'align-middle')
    })
  })

  function renderFreezing(days: unknown[]) {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()
    window.localStorage.setItem('trabunda-active-operational-week-v1', '42')
    window.localStorage.setItem('trabunda-production-days-v2', JSON.stringify(days))

    return render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/saldos?process=FREEZING']}>
          <BalancesPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )
  }

  it('lists Freezing origins oldest first and links each one to its Packing journey', () => {
    const older = closedPackingDay('2026-09-08', 100_000)
    const newer = closedPackingDay('2026-09-09', 100_000)
    const freezing = closedFreezingDay({
      date: '2026-09-10',
      reportedKg: 60_000,
      linkedKg: 60_000,
      origin: older,
    })

    renderFreezing([newer, older, freezing])

    const table = screen.getByRole('table', {
      name: 'Producto envasado, congelado y pendiente por jornada de origen',
    })
    // The seeded historical week also has pending product: every origin must
    // come in ascending date order (FIFO) and link to its Packing journey.
    const dates = within(table)
      .getAllByRole('link')
      .map((link) => link.getAttribute("href")!.slice(10, 20))
    expect(dates).toEqual([...dates].sort())
    expect(dates.filter((date) => date >= '2026-09-08')).toEqual([
      '2026-09-08',
      '2026-09-09',
    ])
    expect(
      within(table).getAllByRole('link').at(-2)?.getAttribute('href'),
    ).toBe('/jornadas/2026-09-08?process=PACKING')
    expect(within(table).getByText('40,000.00 kg')).toBeInTheDocument()
    expect(screen.queryByText('Consumido en exceso')).not.toBeInTheDocument()
  })

  it('keeps an origin consumed above what Packing generated visible instead of reporting no pending product', () => {
    const origin = closedPackingDay('2026-09-08', 100_000)
    const freezing = closedFreezingDay({
      date: '2026-09-09',
      reportedKg: 150_000,
      linkedKg: 150_000,
      origin,
    })

    renderFreezing([origin, freezing])

    expect(
      screen.queryByRole('heading', { name: 'Sin producto pendiente de congelar' }),
    ).not.toBeInTheDocument()
    const summary = screen.getByRole('region', { name: 'Resumen de saldos' })
    expect(
      within(summary).getByRole('heading', { name: 'Consumido en exceso' }).closest('article'),
    ).toHaveTextContent('50,000.00 kg')
    expect(screen.getByText('1 EXCESO')).toBeInTheDocument()
    expect(screen.getByText(/Exceso 50,000.00 kg/)).toBeInTheDocument()
    expect(screen.getByText('Congelado por encima del origen')).toBeInTheDocument()

    // Inconsistencies are listed before the FIFO pending origins.
    const table = screen.getByRole('table', {
      name: 'Producto envasado, congelado y pendiente por jornada de origen',
    })
    const firstBodyRow = within(table).getAllByRole('row')[1]!
    expect(within(firstBodyRow).getByText(/Exceso 50,000.00 kg/)).toBeInTheDocument()
  })

  it('explains the Freezing reconciliation of each open Packing origin', () => {
    const origin = closedPackingDay('2026-09-08', 100_000)
    const freezing = closedFreezingDay({
      date: '2026-09-09',
      reportedKg: 60_000,
      linkedKg: 60_000,
      origin,
    })

    renderFreezing([origin, freezing])

    expect(
      screen.getByRole('heading', {
        name: 'Cuadre Envasado → Congelamiento por jornada',
      }),
    ).toBeInTheDocument()
    const card = screen
      .getAllByRole('article')
      .find((article) =>
        article
          .getAttribute('aria-label')
          ?.endsWith(formatIsoDate('2026-09-08')),
      )
    expect(card).toBeDefined()
    const rows = within(card!)
    expect(rows.getByText('Disponible para congelar').closest('div')).toHaveTextContent('100,000.00 kg')
    expect(rows.getByText('Congelado').closest('div')).toHaveTextContent('60,000.00 kg')
    expect(rows.getByText('Pendiente de congelar').closest('div')).toHaveTextContent('40,000.00 kg')
    expect(rows.getByText('PENDIENTE DE CONGELAR')).toBeInTheDocument()
  })

  it('offers to register Freezing only when there is product to freeze', () => {
    const origin = closedPackingDay('2026-09-08', 100_000)

    renderFreezing([origin])

    expect(
      screen.getByRole('link', { name: 'Registrar Congelamiento' }),
    ).toHaveAttribute('href', '/jornadas/nueva?process=FREEZING')
  })
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})
