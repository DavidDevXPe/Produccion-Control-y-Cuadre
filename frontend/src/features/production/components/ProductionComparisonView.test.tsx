import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  closedFreezingDay,
  closedPackingDay,
} from '../../../test/productionFixtures'
import { ProductionComparisonView } from './ProductionComparisonView'

const period = { startDate: '2026-09-07', endDate: '2026-09-13' } as const
const origin = closedPackingDay('2026-09-08', 100_000)

function renderView(reportedKg: number, linkedKg: number) {
  const freezing = closedFreezingDay({
    date: '2026-09-09',
    reportedKg,
    linkedKg,
    origin,
  })

  render(
    <ProductionComparisonView
      weekNumber={42}
      period={period}
      productionDays={[origin, freezing]}
      packingClosed
      freezingClosed
      selector={null}
    />,
  )
}

describe('production comparison view', () => {
  it('closes the cycle only when the comparison is balanced', () => {
    renderView(100_000, 100_000)

    expect(screen.getByText('CICLO CERRADO')).toBeInTheDocument()
    expect(screen.queryByText('REVISAR')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Motivos de revisión del comparativo' }),
    ).not.toBeInTheDocument()
  })

  it('shows REVISAR, not CONCILIADO, when 100 t are linked against 80 t physically reported', () => {
    renderView(80_000, 100_000)

    expect(screen.getByText('REVISAR')).toBeInTheDocument()
    expect(screen.queryByText('CONCILIADO')).not.toBeInTheDocument()
    expect(screen.queryByText('CICLO CERRADO')).not.toBeInTheDocument()

    const physical = screen.getByRole('region', {
      name: 'Conciliación física de Congelamiento',
    })
    const cards = within(physical)
    expect(
      cards.getByRole('heading', { name: 'Congelado físico reportado' }).closest('article'),
    ).toHaveTextContent('80,000.00')
    expect(
      cards.getByRole('heading', { name: 'Vinculado a Envasado' }).closest('article'),
    ).toHaveTextContent('100,000.00')
    expect(
      cards.getByRole('heading', { name: 'Exceso de vinculación' }).closest('article'),
    ).toHaveTextContent('20,000.00')

    const reasons = screen.getByRole('region', {
      name: 'Motivos de revisión del comparativo',
    })
    expect(within(reasons).getByText(/Vinculado por encima de lo reportado/)).toBeInTheDocument()
  })

  it('shows the linkage excess in the family table', () => {
    renderView(80_000, 100_000)

    const table = screen.getByRole('table', { name: 'Comparativo por familia' })
    expect(
      within(table).getByRole('columnheader', { name: 'Exceso vinculado' }),
    ).toBeInTheDocument()
    expect(within(table).getByText('20,000.00 kg')).toBeInTheDocument()
  })
})
