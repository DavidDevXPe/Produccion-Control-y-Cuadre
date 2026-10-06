import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { kg } from '../../production/model/calculations'
import type { PerformanceRecord } from '../model/types'
import { ProcessPerformanceSummaryCard } from './ProcessPerformanceSummaryCard'

function createPerformanceRecord(overrides: Partial<PerformanceRecord> = {}): PerformanceRecord {
  return {
    id: 'perf-1',
    productionDayId: 'day-1',
    date: '2026-09-16',
    weekNumber: 38,
    process: 'PACKING',
    shift: 'DAY',
    supervisor: 'Carlos Lopez',
    workerCount: 20,
    startTime: '07:00',
    endTime: '19:00',
    deadHours: 1,
    createdAt: '2026-09-16T00:00:00.000Z',
    updatedAt: '2026-09-16T00:00:00.000Z',
    scheduledHours: 12,
    effectiveHours: 11,
    processedKg100: kg(22000),
    personHours: 220,
    kgPerHour: 2000,
    kgPerWorkerHour: 100,
    benchmark: 90,
    benchmarkCompliance: 111.11,
    potentialKg100: kg(19800),
    productivityGapKg100: kg(-2200),
    benchmarkStatus: 'AT_OR_ABOVE_TARGET',
    isComplete: true,
    validationMessage: null,
    ...overrides,
  }
}

describe('ProcessPerformanceSummaryCard', () => {
  it('renders summary card with metrics and benchmark badge when complete records exist', () => {
    const record1 = createPerformanceRecord({ id: 'p1', shift: 'DAY' })
    const record2 = createPerformanceRecord({
      id: 'p2',
      shift: 'NIGHT',
      processedKg100: kg(15000),
      personHours: 150,
      effectiveHours: 10,
    })

    render(
      <ProcessPerformanceSummaryCard
        process="PACKING"
        records={[record1, record2]}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Envasado' })).toBeInTheDocument()
    expect(
      screen.getByText('2 de 2 turnos con información completa.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('BENCHMARK: MEJOR TURNO DE LA SEMANA'),
    ).toBeInTheDocument()
    expect(screen.getByText('Producto procesado semanal')).toBeInTheDocument()
    expect(screen.getByText('Kg/h semanal')).toBeInTheDocument()
    expect(screen.getByText('Kg/persona-h semanal')).toBeInTheDocument()
    expect(screen.getByText('Cumplimiento / brecha')).toBeInTheDocument()
  })

  it('renders fallback dashes and SIN BENCHMARK badge when no complete records exist', () => {
    const incompleteRecord = createPerformanceRecord({
      id: 'p-inc',
      isComplete: false,
      effectiveHours: null,
      personHours: null,
      kgPerHour: null,
      kgPerWorkerHour: null,
      benchmark: null,
      potentialKg100: null,
      productivityGapKg100: null,
      benchmarkStatus: 'NOT_CONFIGURED',
    })

    render(
      <ProcessPerformanceSummaryCard
        process="PACKING"
        records={[incompleteRecord]}
      />,
    )

    expect(
      screen.getByText('0 de 1 turnos con información completa.'),
    ).toBeInTheDocument()
    expect(screen.getByText('SIN BENCHMARK')).toBeInTheDocument()

    // 4 metric values fallback to "—"
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4)
  })

  it('renders freezing title correctly for FREEZING process', () => {
    render(
      <ProcessPerformanceSummaryCard
        process="FREEZING"
        records={[]}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Congelamiento' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('0 de 0 turnos con información completa.'),
    ).toBeInTheDocument()
  })
})
