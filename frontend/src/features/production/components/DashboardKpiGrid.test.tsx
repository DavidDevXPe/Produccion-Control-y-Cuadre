import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { kg100 } from '../model/calculations'
import {
  DashboardKpiGrid,
  type DashboardKpiGridProps,
} from './DashboardKpiGrid'

describe('DashboardKpiGrid', () => {
  const defaultProps: DashboardKpiGridProps = {
    packedWeekKg100: kg100(150000),
    frozenWeekKg100: kg100(120000),
    pendingTraceableKg100: kg100(30000),
    totalAvailableKg100: kg100(150000),
    packingDaysCount: 5,
    freezingDaysCount: 4,
    pendingBalancesByFamilyCount: 3,
    observedJourneyCount: 1,
    notBalancedJourneyCount: 0,
    reviewJourneyCount: 0,
    registeredJourneyCount: 9,
    weeklyYieldPercent: 82.5,
    weeklyYieldDelta: 2.1,
  }

  it('renders section landmark with correct accessible name', () => {
    render(<DashboardKpiGrid {...defaultProps} />)
    expect(
      screen.getByRole('region', {
        name: 'Indicadores principales de la semana',
      }),
    ).toBeInTheDocument()
  })

  it('renders all 5 primary metric cards with formatted values', () => {
    render(<DashboardKpiGrid {...defaultProps} />)

    expect(screen.getByText('Envasado de la semana')).toBeInTheDocument()
    expect(screen.getByText('1,500.00')).toBeInTheDocument()
    expect(screen.getByText('5/7 jornadas de Envasado')).toBeInTheDocument()

    expect(screen.getByText('Congelado de la semana')).toBeInTheDocument()
    expect(screen.getByText('1,200.00')).toBeInTheDocument()
    expect(
      screen.getByText('4/7 jornadas de Congelamiento'),
    ).toBeInTheDocument()

    expect(screen.getByText('Saldo pendiente trazable')).toBeInTheDocument()
    expect(screen.getByText('300.00')).toBeInTheDocument()
    expect(screen.getByText('3 familias con pendiente')).toBeInTheDocument()

    expect(screen.getByText('Jornadas con observación')).toBeInTheDocument()
    expect(screen.getByText('0 sin cuadrar · 1 con nota')).toBeInTheDocument()

    expect(screen.getByText('Rendimiento semanal')).toBeInTheDocument()
    expect(screen.getAllByText('82.5%').length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByText('▲ +2.1 pp vs. semana anterior'),
    ).toBeInTheDocument()
  })

  it('renders negative yield delta with down indicator', () => {
    render(
      <DashboardKpiGrid
        {...defaultProps}
        weeklyYieldDelta={-1.5}
      />,
    )
    expect(
      screen.getByText('▼ -1.5 pp vs. semana anterior'),
    ).toBeInTheDocument()
  })

  it('renders fallback when weekly yield percent and delta are null', () => {
    render(
      <DashboardKpiGrid
        {...defaultProps}
        weeklyYieldPercent={null}
        weeklyYieldDelta={null}
      />,
    )
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(
      screen.getByText('Referencia de aprovechamiento: 80%'),
    ).toBeInTheDocument()
  })

  it('displays "Sin saldo trazable pendiente" when pendingTraceableKg100 is 0', () => {
    render(
      <DashboardKpiGrid
        {...defaultProps}
        pendingTraceableKg100={kg100(0)}
      />,
    )
    expect(
      screen.getByText('Sin saldo trazable pendiente'),
    ).toBeInTheDocument()
  })
})
