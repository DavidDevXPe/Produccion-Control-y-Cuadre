import { act, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { closedFreezingDay, closedPackingDay } from '../../../test/productionFixtures'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { DashboardPage } from './DashboardPage'

vi.mock('../components/WeeklyProductionChart', () => ({
  default: () => <div data-testid="weekly-production-chart" />,
}))

describe('dashboard page', () => {
  it('shows the closed week as a weekly operational dashboard with the four registered Packing journeys', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      )
    })

    expect(
      screen.getByText('Semana 41 · Cerrada · Solo lectura'),
    ).toBeInTheDocument()

    const indicators = screen.getByRole('region', {
      name: 'Indicadores principales de la semana',
    })

    expect(
      within(indicators).getByRole('heading', {
        name: 'Envasado de la semana',
      }),
    ).toBeInTheDocument()

    expect(
      within(indicators).getByRole('heading', {
        name: 'Congelado de la semana',
      }),
    ).toBeInTheDocument()

    expect(
      within(indicators).getByRole('heading', {
        name: 'Saldo pendiente trazable',
      }),
    ).toBeInTheDocument()

    expect(
      within(indicators).getByRole('heading', {
        name: 'Jornadas con observación',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Envasado vs Congelamiento',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Aún no hay jornadas de Congelamiento'),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Estado de jornadas',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Actividad y excepciones',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Últimas jornadas',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Detalle semanal de Envasado',
      }),
    ).toBeInTheDocument()

    const table = screen.getByRole('table', {
      name: 'Estado operativo de las jornadas de Envasado',
    })

    expect(within(table).getAllByRole('row')).toHaveLength(5)
    expect(within(table).getByText('SÁBADO')).toBeInTheDocument()
    expect(
      within(table).getAllByRole('link', { name: /^Ver jornada de /i }),
    ).toHaveLength(4)

    expect(
      await screen.findByTestId('weekly-production-chart'),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('link', { name: 'Nueva jornada' }),
    ).not.toBeInTheDocument()
  })

  it('shows the saved Monday inside the current editable week using the new weekly dashboard structure', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()

    render(
      <ProductionDataProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(
      screen.getByText(
        'Semana 42 · Estado general de Envasado y Congelamiento',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: 'Nueva jornada' }),
    ).toBeInTheDocument()

    const indicators = screen.getByRole('region', {
      name: 'Indicadores principales de la semana',
    })

    expect(
      within(indicators).getByRole('heading', {
        name: 'Envasado de la semana',
      }),
    ).toBeInTheDocument()

    expect(
      within(indicators).getByText('492,763.00'),
    ).toBeInTheDocument()

    const table = screen.getByRole('table', {
      name: 'Estado operativo de las jornadas de Envasado',
    })

    const headers = [...table.querySelectorAll('thead th')]

    expect(headers.map((header) => header.textContent)).toEqual([
      'Jornada',
      'Fecha',
      'Estado',
      'Producto terminado',
      'Aprovechamiento',
      'Acción',
    ])

    expect(table).toHaveClass('table-fixed', 'text-center')

    expect(
      [...table.querySelectorAll('col')].map((column) => column.className),
    ).toEqual([
      'w-[15%]',
      'w-[14%]',
      'w-[22%]',
      'w-[21%]',
      'w-[18%]',
      'w-[10%]',
    ])

    const mondayRow = within(table).getByText('LUNES').closest('tr')

    expect(mondayRow).not.toBeNull()
    expect(within(mondayRow!).getByText('492,763.00 kg')).toBeInTheDocument()
    expect(within(mondayRow!).getByText('80.09%')).toBeInTheDocument()
    expect(
      within(mondayRow!).getByRole('link', { name: /^Ver jornada de /i }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Saldos pendientes por familia',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Evolución semanal de Envasado',
      }),
    ).toBeInTheDocument()
  })

  it('identifies week 42 as past but open after the calendar rollover', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-14T12:00:00-05:00'))
    window.localStorage.clear()
    window.localStorage.setItem('trabunda-active-operational-week-v1', '42')

    render(
      <ProductionDataProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(
      screen.getByText('Semana 42 · Abierta · Seguimiento operativo'),
    ).toBeInTheDocument()

    expect(
      screen.queryByText(/Semana 42 · Cerrada/),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: 'Nueva jornada' }),
    ).toBeInTheDocument()
  })
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('dashboard journey status coherence', () => {
  it('counts the closed week 41 journeys, which only carry validation warnings, as observed', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      )
    })

    const indicators = screen.getByRole('region', {
      name: 'Indicadores principales de la semana',
    })
    const observedCard = within(indicators)
      .getByRole('heading', { name: 'Jornadas con observación' })
      .closest('article')!
    expect(within(observedCard).getByText('4')).toBeInTheDocument()
    expect(
      within(observedCard).getByText('0 críticas · 4 observadas'),
    ).toBeInTheDocument()

    const balanced = screen.getByText('Cuadradas').closest('div')!
    const observed = screen.getByText('Observadas').closest('div')!
    const review = screen.getByText('Por revisar').closest('div')!
    expect(within(balanced).getByText('0')).toBeInTheDocument()
    expect(within(observed).getByText('4')).toBeInTheDocument()
    expect(within(review).getByText('0')).toBeInTheDocument()

    const table = screen.getByRole('table', {
      name: 'Estado operativo de las jornadas de Envasado',
    })
    expect(within(table).getAllByText('CUADRADO · OBSERVADO')).toHaveLength(4)
    expect(screen.queryByText('CUADRADO')).not.toBeInTheDocument()
  })

  it('surfaces a traceability difference between Packing and Freezing as a critical exception', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    const origin = closedPackingDay('2026-09-08', 100_000)
    const freezing = closedFreezingDay({
      date: '2026-09-09',
      reportedKg: 120_000,
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
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    const exceptions = screen
      .getByRole('heading', { name: 'Actividad y excepciones' })
      .closest('section')!
    expect(
      within(exceptions).getByText('Diferencia de trazabilidad'),
    ).toBeInTheDocument()
    expect(
      within(exceptions).getByText(/sin explicar entre Envasado y Congelamiento/),
    ).toBeInTheDocument()
    expect(
      within(exceptions)
        .getAllByRole('link', { name: /Revisar/ })
        .some(
          (link) =>
            link.getAttribute('href') === '/resumen?view=COMPARISON',
        ),
    ).toBe(true)
    expect(within(exceptions).getByText('1 CRÍTICA')).toBeInTheDocument()
  })

  it('marks the weekly comparison as REVISAR when Freezing links more than it physically reported', () => {
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
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    const comparison = screen
      .getByRole('heading', { name: 'Envasado vs Congelamiento' })
      .closest('section')!
    expect(within(comparison).getByText('REVISAR')).toBeInTheDocument()
    expect(within(comparison).queryByText('CONCILIADO')).not.toBeInTheDocument()
    expect(
      within(comparison).getByRole('list', {
        name: 'Motivos de revisión del comparativo',
      }),
    ).toHaveTextContent('20,000.00 kg de exceso')

    const exceptions = screen
      .getByRole('heading', { name: 'Actividad y excepciones' })
      .closest('section')!
    expect(
      within(exceptions).getByText('Vinculado por encima de lo reportado'),
    ).toBeInTheDocument()
  })

  it('offers compact quick navigation without a create shortcut in a closed week', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      )
    })

    const nav = screen.getByRole('navigation', { name: 'Accesos rápidos' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Jornadas', 'Congelamiento', 'Saldos', 'Rendimiento', 'Resumen'])
  })

  it('exposes the weekly coverage as accessible progress bars', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      )
    })

    expect(
      screen.getByRole('progressbar', { name: 'Cobertura de Envasado' }),
    ).toHaveAttribute('aria-valuetext', '4 de 7 jornadas')
    expect(
      screen.getByRole('progressbar', { name: 'Cobertura de Congelamiento' }),
    ).toHaveAttribute('aria-valuenow', '0')
  })
})
