import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import {
  calculateProductionBusinessSummary,
  type FamilyYieldProjection,
  type ProductionBusinessSummary,
} from '../model/businessRules'
import { calculateProductionDay, kg100 } from '../model/calculations'
import { FamilyYieldCard } from './familyYield/FamilyYieldCard'
import { GroupUtilizationFooter } from './familyYield/GroupUtilizationFooter'
import { FamilyYieldPanel } from './FamilyYieldPanel'

describe('FamilyYieldPanel', () => {
  const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)
  const defaultSummary: ProductionBusinessSummary =
    calculateProductionBusinessSummary(WEDNESDAY_PRODUCTION_DAY, calculation)

  it('renders section title and cards for each family without tunnel by default', () => {
    render(<FamilyYieldPanel summary={defaultSummary} />)

    expect(
      screen.getByText('Rendimiento técnico y aprovechamiento MP'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Evolución por Reportes, Tratamiento y saldo; el aprovechamiento siempre usa la MP total.',
      ),
    ).toBeInTheDocument()

    for (const family of defaultSummary.families) {
      expect(screen.getAllByText(family.label).length).toBeGreaterThan(0)
    }
    expect(screen.queryByText('Túnel incorporado')).not.toBeInTheDocument()
  })

  it('renders tunnel columns in description and cards when showTunnel is true', () => {
    render(<FamilyYieldPanel summary={defaultSummary} showTunnel={true} />)

    expect(
      screen.getByText(
        'Evolución por Reportes, Túnel, Tratamiento y saldo; el aprovechamiento siempre usa la MP total.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Túnel incorporado').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Después de Túnel').length).toBeGreaterThan(0)
  })

  describe('FamilyYieldCard', () => {
    it('renders Aleta cruda metrics and compliance status', () => {
      const aletaMetric = defaultSummary.families.find(
        (fam) => fam.key === 'ALETA',
      )!
      render(
        <FamilyYieldCard
          metric={aletaMetric}
          summary={defaultSummary}
          showTunnel={false}
        />,
      )

      expect(screen.getByText(aletaMetric.label)).toBeInTheDocument()
      expect(screen.getByText(/MP de referencia:/i)).toBeInTheDocument()
      expect(screen.getByText('Después de Reportes')).toBeInTheDocument()
      expect(screen.getByText('Producción antes de saldo')).toBeInTheDocument()
      expect(screen.getByText('Tratamiento incluido')).toBeInTheDocument()
    })

    it('renders shared Rejo + Reproductor data', () => {
      const rejoMetric = defaultSummary.families.find(
        (fam) => fam.key === 'REJO_REPRODUCTOR',
      )!
      render(
        <FamilyYieldCard
          metric={rejoMetric}
          summary={defaultSummary}
          showTunnel={false}
        />,
      )

      expect(screen.getByText(/Reproductor:/i)).toBeInTheDocument()
    })

    it('renders Manto breakdown and theoretical reference', () => {
      const mantoMetric = defaultSummary.families.find(
        (fam) => fam.key === 'MANTO',
      )!
      render(
        <FamilyYieldCard
          metric={mantoMetric}
          summary={defaultSummary}
          showTunnel={false}
        />,
      )

      expect(
        screen.getByText(/Rendimiento técnico Manto:/i),
      ).toBeInTheDocument()
    })

    it('renders integrity error alert when family has excess yield', () => {
      const errorMetric: FamilyYieldProjection = {
        ...defaultSummary.families[0]!,
        status: 'INTEGRITY_ERROR',
        projectedYieldPercent: 120.0,
        excessKg100: kg100(9500),
      }

      render(
        <FamilyYieldCard
          metric={errorMetric}
          summary={defaultSummary}
          showTunnel={false}
        />,
      )

      expect(screen.getByText('ERROR DE INTEGRIDAD')).toBeInTheDocument()
      expect(screen.getByText(/Exceso detectado:/i)).toBeInTheDocument()
    })
  })

  describe('GroupUtilizationFooter', () => {
    it('renders general utilization and individual group items', () => {
      render(<GroupUtilizationFooter summary={defaultSummary} />)

      expect(screen.getByText('Aprovechamiento MP por grupo')).toBeInTheDocument()
      expect(screen.getByText(/General:/i)).toBeInTheDocument()

      for (const group of defaultSummary.groupUtilizations) {
        expect(screen.getByText(group.label)).toBeInTheDocument()
      }
    })
  })
})
