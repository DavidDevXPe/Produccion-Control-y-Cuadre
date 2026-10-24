import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { kg100 } from '../model/calculations'
import type { ShiftCalculation } from '../model/types'
import { ProductionShiftCards } from './ProductionShiftCards'

function shift(overrides: Partial<ShiftCalculation> = {}): ShiftCalculation {
  return {
    reportedKg100: kg100(100_000),
    adjustmentKg100: kg100(0),
    previousBalanceProcessedKg100: kg100(0),
    ownProductionKg100: kg100(100_000),
    declaredReportedKg100: kg100(100_000),
    normalProductionKg100: kg100(100_000),
    tunnelProductionKg100: kg100(0),
    detailDifferenceKg100: kg100(0),
    ...overrides,
  }
}

describe('ProductionShiftCards', () => {
  it('hides Tunnel metrics and legend when the stage is not active', () => {
    render(
      <ProductionShiftCards
        dayShift={shift()}
        nightShift={shift()}
        dayHasReportData
        nightHasReportData
        showTunnel={false}
      />,
    )

    expect(screen.getAllByText('Flujo normal')).toHaveLength(2)
    expect(screen.queryAllByText('Túnel')).toHaveLength(0)
  })

  it('keeps Tunnel metrics visible when the stage is active', () => {
    render(
      <ProductionShiftCards
        dayShift={shift({ tunnelProductionKg100: kg100(10_000), ownProductionKg100: kg100(110_000) })}
        nightShift={shift()}
        dayHasReportData
        nightHasReportData
        showTunnel
      />,
    )

    expect(screen.getAllByText('Túnel').length).toBeGreaterThan(0)
  })
  it('uses the supervisor detail for reconciled totals when a previous balance is consumed', () => {
    render(
      <ProductionShiftCards
        dayShift={shift({
          reportedKg100: kg100(7_138_000),
          ownProductionKg100: kg100(5_738_000),
          previousBalanceProcessedKg100: kg100(1_400_000),
          declaredReportedKg100: kg100(7_138_000),
          normalProductionKg100: kg100(5_738_000),
        })}
        nightShift={shift()}
        dayHasReportData
        nightHasReportData
        showTunnel={false}
      />,
    )

    expect(screen.getAllByRole('progressbar')[0]).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
    expect(screen.getAllByText('71,380.00')).toHaveLength(2)
    expect(screen.getByText('71,380.00 kg')).toBeInTheDocument()
  })
})
