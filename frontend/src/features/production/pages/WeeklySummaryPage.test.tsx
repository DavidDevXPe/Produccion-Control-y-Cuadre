import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductionDataProvider } from '../state/ProductionDataContext'
import { WeeklySummaryPage } from './WeeklySummaryPage'

describe('weekly summary page', () => {
  it('validates Wednesday through Saturday against the independent product detail', () => {
    render(<MemoryRouter><WeeklySummaryPage /></MemoryRouter>)

    const validationHeading = screen.getByRole('heading', {
      name: 'Validación de consistencia',
    })
    const validation = validationHeading.closest('section')

    expect(validation).not.toBeNull()
    expect(
      within(validation!).getByText('INFORMACIÓN CONSISTENTE'),
    ).toBeInTheDocument()
    expect(within(validation!).getByText('PT por jornadas')).toBeInTheDocument()
    expect(within(validation!).getByText('PT por productos')).toBeInTheDocument()
    expect(
      within(validation!).getAllByText('1,422,629.90 kg'),
    ).toHaveLength(2)
    expect(within(validation!).getByText('0.00 kg')).toBeInTheDocument()
    expect(
      within(validation!).getByText(/35 líneas de producto en 4 jornadas/),
    ).toBeInTheDocument()
    const validationLabels = ['PT por jornadas', 'PT por productos', 'Diferencia']
    validationLabels.forEach((label) => {
      expect(within(validation!).getByText(label).parentElement).toHaveClass(
        'items-center',
        'justify-center',
        'text-center',
      )
    })

    const daysTable = screen.getByRole('table', {
      name: 'Producto terminado diario de la semana 41',
    })
    const headers = within(daysTable).getAllByRole('columnheader')
    expect(daysTable).toHaveClass('table-fixed', 'text-center')
    expect(
      [...daysTable.querySelectorAll('col')].map((column) => column.className),
    ).toEqual(['w-[18%]', 'w-[20%]', 'w-[38%]', 'w-[24%]'])
    headers.forEach((header) => {
      expect(header).toHaveClass('px-3', 'text-center', 'align-middle')
    })

    const registeredRow = within(daysTable)
      .getByText('243,818.00 kg')
      .closest('tr')
    expect(registeredRow).not.toBeNull()
    expect(within(registeredRow!).getByRole('rowheader')).toHaveClass(
      'px-3',
      'text-center',
      'align-middle',
    )
    within(registeredRow!).getAllByRole('cell').forEach((cell) => {
      expect(cell).toHaveClass('px-3', 'text-center', 'align-middle')
    })
    expect(
      within(registeredRow!).getByText('CUADRADO · OBSERVADO').closest('td')
        ?.firstElementChild,
    ).toHaveClass('w-full', 'justify-center')
    expect(screen.getByText('SEMANA CERRADA · 4 JORNADAS')).toBeInTheDocument()
    expect(screen.getByText('CERRADA')).toBeInTheDocument()
    expect(screen.queryByText('PARCIAL')).not.toBeInTheDocument()

    const productTable = screen.getByRole('table', {
      name: 'Consolidado semanal por grupo y producto',
    })
    const productHeaders = within(productTable).getAllByRole('columnheader')

    expect(productTable).toHaveClass('table-fixed', 'min-w-[64rem]')
    expect(
      [...productTable.querySelectorAll('col')].map((column) => column.className),
    ).toEqual(['w-[44%]', 'w-[15%]', 'w-[13%]', 'w-[12%]', 'w-[16%]'])
    productHeaders.slice(1).forEach((header) => {
      expect(header).toHaveClass('px-3', 'text-center', 'align-middle')
    })

    const firstProductGroup = productTable.querySelector<HTMLElement>('tbody tr')
    expect(firstProductGroup).not.toBeNull()
    within(firstProductGroup!).getAllByRole('cell').forEach((cell) => {
      expect(cell).toHaveClass('px-3', 'text-center', 'align-middle')
    })

    const weeklyYield = productTable.querySelector<HTMLElement>(
      'tfoot td:last-child > div',
    )
    expect(weeklyYield).toHaveClass(
      'w-full',
      'flex-col',
      'items-center',
      'justify-center',
      'text-center',
    )
  })

  it('separates the 15% semilimpia and 7% Bikini references', () => {
    render(<MemoryRouter><WeeklySummaryPage /></MemoryRouter>)

    const nucaHeading = screen.getByRole('heading', {
      name: 'Referencias de Nuca',
    })
    const nucaSection = nucaHeading.closest('section')

    expect(nucaSection).not.toBeNull()
    const semilimpia = within(nucaSection!).getByRole('heading', {
      name: 'Nuca semilimpia',
    }).closest('article')
    const bikini = within(nucaSection!).getByRole('heading', {
      name: 'Nuca Bikini',
    }).closest('article')

    expect(semilimpia).not.toBeNull()
    expect(within(semilimpia!).getByText('Referencia 15%')).toBeInTheDocument()
    expect(within(semilimpia!).getByText('261,636.75 kg')).toBeInTheDocument()
    expect(within(semilimpia!).getByText('45,660.00 kg')).toBeInTheDocument()

    expect(bikini).not.toBeNull()
    expect(within(bikini!).getByText('LAVADO ACTIVO')).toBeInTheDocument()
    expect(within(bikini!).getByText('Referencia 7%')).toBeInTheDocument()
    expect(within(bikini!).getByText('122,097.15 kg')).toBeInTheDocument()
    expect(within(bikini!).getByText('92,360.00 kg')).toBeInTheDocument()
    expect(
      within(nucaSection!).getByText(/no cambia el estado CUADRADO/),
    ).toBeInTheDocument()
  })

  it('keeps a past open week as a partial week instead of marking it closed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-14T12:00:00-05:00'))
    window.localStorage.clear()
    window.localStorage.setItem('trabunda-active-operational-week-v1', '42')

    render(
      <ProductionDataProvider>
        <MemoryRouter>
          <WeeklySummaryPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(screen.getByText('SEMANA PARCIAL · 1 DE 7')).toBeInTheDocument()
    expect(screen.queryByText(/SEMANA CERRADA/)).not.toBeInTheDocument()
  })

  it('opens the Freezing and comparative summaries from the process selector URL', () => {
    const freezingRender = render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/resumen?view=FREEZING']}>
          <WeeklySummaryPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    expect(screen.getByText('Reportes · Congelamiento')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Congelado por producto' })).toBeInTheDocument()
    freezingRender.unmount()

    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/resumen?view=COMPARISON']}>
          <WeeklySummaryPage />
        </MemoryRouter>
      </ProductionDataProvider>,
    )
    expect(
      screen.getByRole('heading', { name: 'Envasado vs Congelamiento' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Comparativo por familia' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Comparativo por producto' })).toBeInTheDocument()
  })

  it('shows the same journey status as Dashboard and Jornadas for every registered day', () => {
    render(
      <MemoryRouter initialEntries={['/resumen?view=PACKING']}>
        <WeeklySummaryPage />
      </MemoryRouter>,
    )

    const daysTable = screen.getByRole('table', {
      name: 'Producto terminado diario de la semana 41',
    })
    expect(within(daysTable).getAllByText('CUADRADO · OBSERVADO')).toHaveLength(4)
    expect(within(daysTable).getAllByText('SIN REGISTRO')).toHaveLength(3)
    expect(within(daysTable).queryByText('CUADRADO')).not.toBeInTheDocument()
  })

  it('follows the view in the URL instead of a stale copy of it', () => {
    render(
      <MemoryRouter initialEntries={['/resumen?view=COMPARISON']}>
        <WeeklySummaryPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('tab', { name: 'Comparativo' }),
    ).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Envasado' }))
    expect(
      screen.getByRole('tab', { name: 'Envasado' }),
    ).toHaveAttribute('aria-selected', 'true')
  })
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})
