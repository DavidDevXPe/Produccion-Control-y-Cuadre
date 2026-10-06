import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { kg, kg100 } from '../../../production/model/calculations'
import type { PerformanceRecord } from '../../model/types'
import { PerformanceShiftMetricsDl } from './PerformanceShiftMetricsDl'

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
    productivityGapKg100: kg100(-220000),
    benchmarkStatus: 'AT_OR_ABOVE_TARGET',
    isComplete: true,
    validationMessage: null,
    ...overrides,
  }
}

describe('PerformanceShiftMetricsDl', () => {
  it('renders all 11 performance metrics correctly when benchmark is configured and surpassed', () => {
    const record = createPerformanceRecord()
    render(<PerformanceShiftMetricsDl performance={record} />)

    expect(screen.getByText('Producto procesado')).toBeInTheDocument()
    expect(screen.getByText('Horas programadas')).toBeInTheDocument()
    expect(screen.getByText('Horas efectivas')).toBeInTheDocument()
    expect(screen.getByText('Persona-h')).toBeInTheDocument()
    expect(screen.getByText('Kg/h')).toBeInTheDocument()
    expect(screen.getByText('Kg/persona-h')).toBeInTheDocument()
    expect(screen.getByText('Benchmark (mejor del turno)')).toBeInTheDocument()
    expect(screen.getByText('Estado benchmark')).toBeInTheDocument()
    expect(screen.getByText('Cumplimiento')).toBeInTheDocument()
    expect(screen.getByText('Potencial')).toBeInTheDocument()
    expect(screen.getByText('Brecha')).toBeInTheDocument()

    expect(screen.getByText('OBJETIVO / SOBRE OBJETIVO')).toBeInTheDocument()
    // When productivityGapKg100 < 0, it renders with "+... sobre benchmark"
    expect(screen.getByText(/\+.*sobre benchmark/)).toBeInTheDocument()
  })

  it('renders fallback when benchmark is null', () => {
    const record = createPerformanceRecord({
      benchmark: null,
      benchmarkCompliance: null,
      potentialKg100: null,
      productivityGapKg100: null,
      benchmarkStatus: 'NOT_CONFIGURED',
    })
    render(<PerformanceShiftMetricsDl performance={record} />)

    expect(screen.getByText('SIN DATOS')).toBeInTheDocument()
    expect(screen.getByText('NO CONFIGURADO')).toBeInTheDocument()
    // Potential and gap render dash fallback '—'
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('renders positive gap without "+ sobre benchmark" prefix when productivityGapKg100 >= 0', () => {
    const record = createPerformanceRecord({
      productivityGapKg100: kg100(50000), // 500 kg gap deficit
      benchmarkStatus: 'BELOW_TARGET',
    })
    render(<PerformanceShiftMetricsDl performance={record} />)

    expect(screen.getByText('BAJO OBJETIVO')).toBeInTheDocument()
    expect(screen.queryByText(/sobre benchmark/)).not.toBeInTheDocument()
  })
})
