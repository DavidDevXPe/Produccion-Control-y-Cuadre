import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MONDAY_WEEK_42_PRODUCTION_DAY } from '../data/mondayWeek42'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateProductionDay } from '../model/calculations'
import { PerformancePanel } from './PerformancePanel'

describe('PerformancePanel Nuca methodology', () => {
  it('shows the common 15% theoretical reference for Bikini-only production', () => {
    const calculation = calculateProductionDay({
      ...WEDNESDAY_PRODUCTION_DAY,
      nucaWashAuthorization: null,
    })

    render(<PerformancePanel calculation={calculation} />)

    const performanceHeading = screen.getByRole('heading', {
      name: 'Aprovechamiento general',
    })
    const performance = performanceHeading.closest('section')

    expect(performance).not.toBeNull()
    expect(
      within(performance!).getByText('MP de referencia (15.00%)'),
    ).toBeInTheDocument()
    expect(
      within(performance!).queryByText(/Referencia ponderada/),
    ).not.toBeInTheDocument()
    expect(within(performance!).getByText('Producción física')).toBeInTheDocument()
    expect(within(performance!).getByText('Producción equivalente')).toBeInTheDocument()
    expect(within(performance!).getByText('Rendimiento obtenido:')).toBeInTheDocument()
    expect(within(performance!).getByText('Factor experimental:')).toBeInTheDocument()
  })
  it('uses the same equivalent reference when Bikini and semi-clean production coexist', () => {
    const calculation = calculateProductionDay(MONDAY_WEEK_42_PRODUCTION_DAY)
    const referenceLabel = `MP de referencia (${calculation.nucas.referencePercent.toFixed(2)}%)`

    render(<PerformancePanel calculation={calculation} />)

    const performanceHeading = screen.getByRole('heading', {
      name: 'Aprovechamiento general',
    })
    const performance = performanceHeading.closest('section')

    expect(performance).not.toBeNull()
    expect(
      within(performance!).getByText(referenceLabel),
    ).toBeInTheDocument()
    expect(within(performance!).getByText('Nuca Bikini')).toBeInTheDocument()
    expect(
      within(performance!).getByText('Nuca semi-limpia'),
    ).toBeInTheDocument()
    expect(within(performance!).getByText('Rendimiento obtenido:')).toBeInTheDocument()
    expect(within(performance!).getByText('Distribución teórica:')).toBeInTheDocument()
    expect(within(performance!).getByText('Factor experimental:')).toBeInTheDocument()
    expect(within(performance!).queryByText('Referencia 7%')).not.toBeInTheDocument()
    expect(within(performance!).queryByText('Referencia 15%')).not.toBeInTheDocument()
  })

  it('shows the common 15% theoretical reference for semi-clean-only production', () => {
    const calculation = calculateProductionDay({
      ...MONDAY_WEEK_42_PRODUCTION_DAY,
      lines: MONDAY_WEEK_42_PRODUCTION_DAY.lines.filter(
        (line) => line.summaryGroupId === 'NUCA_SEMILIMPIA',
      ),
    })

    render(<PerformancePanel calculation={calculation} />)

    const performanceHeading = screen.getByRole('heading', {
      name: 'Aprovechamiento general',
    })
    const performance = performanceHeading.closest('section')

    expect(performance).not.toBeNull()
    expect(
      within(performance!).getByText('MP de referencia (15.00%)'),
    ).toBeInTheDocument()
    expect(within(performance!).queryByText('Referencia 7%')).not.toBeInTheDocument()
  })
})
