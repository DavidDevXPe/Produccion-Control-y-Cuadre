import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import {
  calculateProductionBusinessSummary,
  type FamilyYieldProjection,
  type ProductionBusinessSummary,
} from '../model/businessRules'
import { calculateProductionDay, kg100 } from '../model/calculations'
import {
  ClosingBalanceRowControl,
  ClosingBalanceYieldControl,
} from './ClosingBalanceYieldControl'
import { ClosingYieldOverallMetric } from './closingYield/ClosingYieldOverallMetric'
import { ClosingYieldSummaryMetric } from './closingYield/ClosingYieldSummaryMetric'

describe('ClosingBalanceYieldControl', () => {
  const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)
  const defaultSummary: ProductionBusinessSummary =
    calculateProductionBusinessSummary(WEDNESDAY_PRODUCTION_DAY, calculation)

  it('renders the header, key family metrics and overall utilization', () => {
    render(<ClosingBalanceYieldControl summary={defaultSummary} />)

    expect(screen.getAllByText('Control de rendimientos').length).toBeGreaterThan(0)
    expect(
      screen.getByText('Proyección en tiempo real con el saldo ingresado.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Aprovechamiento general')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Registra únicamente saldo real. Los kg faltantes son una referencia.',
      ),
    ).toBeInTheDocument()
  })

  it('toggles mobile expansion on button click', () => {
    render(<ClosingBalanceYieldControl summary={defaultSummary} />)

    const toggleButton = screen.getByRole('button', {
      name: /control de rendimientos/i,
    })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
  })

  describe('ClosingYieldSummaryMetric', () => {
    it('renders label, target and projected percent for a standard family', () => {
      const aletaMetric = defaultSummary.families.find(
        (fam) => fam.key === 'ALETA',
      )!
      render(<ClosingYieldSummaryMetric metric={aletaMetric} />)

      expect(screen.getByText(aletaMetric.label)).toBeInTheDocument()
      expect(screen.getByText(/Objetivo/i)).toBeInTheDocument()
    })

    it('renders informative notice for NUCA family', () => {
      const nucaMetric = defaultSummary.families.find(
        (fam) => fam.key === 'NUCA',
      )!
      render(<ClosingYieldSummaryMetric metric={nucaMetric} />)

      expect(
        screen.getByText(
          'Nuca Bikini 7%: referencia informativa; no bloquea el cierre.',
        ),
      ).toBeInTheDocument()
    })

    it('renders alert message when metric has INTEGRITY_ERROR', () => {
      const errorMetric: FamilyYieldProjection = {
        ...defaultSummary.families[0]!,
        status: 'INTEGRITY_ERROR',
        projectedYieldPercent: 125.5,
        excessKg100: kg100(15000),
      }
      render(<ClosingYieldSummaryMetric metric={errorMetric} />)

      expect(screen.getByText('ERROR DE INTEGRIDAD')).toBeInTheDocument()
      expect(
        screen.getByText(/Con este saldo el resultado alcanzaría 125[.,]50%/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/Exceso: 150[.,]00 kg/i)).toBeInTheDocument()
    })
  })

  describe('ClosingYieldOverallMetric', () => {
    it('renders overall utilization values and compliance note when COMPLIES', () => {
      const compliesSummary: ProductionBusinessSummary = {
        ...defaultSummary,
        overallControl: {
          ...defaultSummary.overallControl,
          status: 'COMPLIES',
        },
      }
      render(<ClosingYieldOverallMetric summary={compliesSummary} />)

      expect(screen.getByText('Aprovechamiento general')).toBeInTheDocument()
      expect(screen.getByText('CUMPLE')).toBeInTheDocument()
      expect(screen.getByText('Referencia general alcanzada')).toBeInTheDocument()
    })

    it('renders integrity alert when overallControl status is INTEGRITY_ERROR', () => {
      const errorSummary: ProductionBusinessSummary = {
        ...defaultSummary,
        overallControl: {
          ...defaultSummary.overallControl,
          status: 'INTEGRITY_ERROR',
          excessKg100: kg100(8000),
        },
        overallUtilization: {
          ...defaultSummary.overallUtilization,
          percent: 110.2,
        },
      }
      render(<ClosingYieldOverallMetric summary={errorSummary} />)

      expect(screen.getByText('ERROR DE INTEGRIDAD')).toBeInTheDocument()
      expect(
        screen.getByText(/Con este saldo el resultado alcanzaría 110[.,]20%/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/Exceso: 80[.,]00 kg/i)).toBeInTheDocument()
    })
  })

  describe('ClosingBalanceRowControl', () => {
    it('renders metrics and status for group ALETA', () => {
      render(
        <ClosingBalanceRowControl
          summary={defaultSummary}
          summaryGroupId="ALETA"
        />,
      )

      expect(screen.getByText('Rendimiento antes')).toBeInTheDocument()
      expect(screen.getByText('Rendimiento proyectado')).toBeInTheDocument()
      expect(screen.getByText('Capacidad hasta 100%')).toBeInTheDocument()
    })

    it('renders integrity error alert when row has excess yield', () => {
      const aletaIndex = defaultSummary.families.findIndex(
        (fam) => fam.key === 'ALETA',
      )
      const modifiedFamilies = [...defaultSummary.families]
      modifiedFamilies[aletaIndex] = {
        ...modifiedFamilies[aletaIndex]!,
        status: 'INTEGRITY_ERROR',
        projectedYieldPercent: 115.0,
        excessKg100: kg100(5000),
      }
      const errorSummary: ProductionBusinessSummary = {
        ...defaultSummary,
        families: modifiedFamilies,
      }

      render(
        <ClosingBalanceRowControl
          summary={errorSummary}
          summaryGroupId="ALETA"
        />,
      )

      expect(screen.getByText('ERROR DE INTEGRIDAD')).toBeInTheDocument()
      expect(
        screen.getByText(/Con este saldo el resultado alcanzaría 115[.,]00%/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/Exceso: 50[.,]00 kg/i)).toBeInTheDocument()
    })
  })
})
