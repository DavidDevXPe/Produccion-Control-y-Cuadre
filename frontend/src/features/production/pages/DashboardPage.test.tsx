import { act, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatIsoDate } from '../../../utils/formatters'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { DashboardPage } from './DashboardPage'

vi.mock('../components/WeeklyProductionChart', () => ({
  default: () => <div data-testid="weekly-production-chart" />,
}))

describe('dashboard page', () => {
  it('uses Saturday as the latest close and lists all four registered days', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      )
    })

    const indicators = screen.getByRole('region', {
      name: 'Indicadores principales',
    })

    expect(within(indicators).getByText('456,983.00')).toBeInTheDocument()
    expect(within(indicators).getByText('44,660.00')).toBeInTheDocument()
    expect(within(indicators).getByText('93.55%')).toBeInTheDocument()
    expect(
      within(indicators).getByText('Pendiente para la siguiente jornada'),
    ).toBeInTheDocument()
    expect(within(indicators).getByText('REVISAR')).toBeInTheDocument()
    expect(screen.getByText('185,620.00 kg')).toBeInTheDocument()
    expect(screen.getByText('219,800.00 kg')).toBeInTheDocument()
    expect(screen.getByText('6,903.00 kg')).toBeInTheDocument()
    expect(screen.getByText('Producto terminado = Día + Noche + Tratamiento + Saldo')).toBeInTheDocument()
    expect(
      screen.getAllByText(formatIsoDate('2026-09-05')).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText('Se muestran solamente los 4 cierres reales registrados.'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Ver$/i })).toHaveLength(4)
    expect(await screen.findByTestId('weekly-production-chart')).toBeInTheDocument()
    expect(screen.getByText('Semana 41 · Cerrada · Solo lectura')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Requiere atención' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/ALERTA/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Nueva jornada' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Envasado vs Congelamiento' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Aún no hay jornadas de Congelamiento')).toBeInTheDocument()
  })

  it('shows the permanently saved Monday in the editable current week', () => {
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
        'Último registro disponible y consistencia de la semana 42.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText('492,763.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('60,450.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('80.09%').length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'Nueva jornada' })).not.toBeInTheDocument()

    const table = screen.getByRole('table', {
      name: 'Estado operativo de las jornadas registradas',
    })
    const headers = within(table).getAllByRole('columnheader')
    expect(table).toHaveClass('table-fixed', 'text-center')
    expect(
      [...table.querySelectorAll('col')].map((column) => column.className),
    ).toEqual([
      'w-[9%]',
      'w-[12%]',
      'w-[19%]',
      'w-[20%]',
      'w-[14%]',
      'w-[17%]',
      'w-[9%]',
    ])
    headers.forEach((header) => {
      expect(header).toHaveClass('px-2', 'text-center', 'align-middle')
    })

    const mondayRow = within(table).getByText('LUNES').closest('tr')
    expect(mondayRow).not.toBeNull()
    expect(within(mondayRow!).getByRole('rowheader')).toHaveClass(
      'px-2',
      'text-center',
      'align-middle',
    )
    within(mondayRow!).getAllByRole('cell').forEach((cell) => {
      expect(cell).toHaveClass('px-2', 'text-center', 'align-middle')
    })
    expect(
      within(mondayRow!).getByText('CUADRADO').closest('td')
        ?.firstElementChild,
    ).toHaveClass('w-full', 'justify-center')
    expect(
      within(mondayRow!).getByLabelText(/^Aprovechamiento /).firstElementChild,
    ).toHaveClass('w-full', 'items-center', 'justify-center', 'text-center')
    expect(
      within(mondayRow!).getByRole('link', { name: /^Ver$/i }).parentElement,
    ).toHaveClass('w-full', 'justify-center')
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
      screen.getByText('Semana 42 · Abierta · Reportes pendientes'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Semana 42 · Cerrada/)).not.toBeInTheDocument()
  })
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})
