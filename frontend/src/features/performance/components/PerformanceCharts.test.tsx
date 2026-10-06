import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { kg } from '../../production/model/calculations'
import type { PerformanceRecord } from '../model/types'
import { PerformanceCharts } from './PerformanceCharts'

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

describe('PerformanceCharts', () => {
  it('renders empty message card when records have no complete data', () => {
    render(<PerformanceCharts records={[]} />)

    expect(screen.getByText('Sin información para graficar')).toBeInTheDocument()
    expect(
      screen.getByText('Completa al menos un turno para activar la evolución semanal.'),
    ).toBeInTheDocument()
  })

  it('renders charts section and line chart titles when complete records are provided', () => {
    const dayRecord = createPerformanceRecord({
      id: 'p1',
      date: '2026-09-16',
      shift: 'DAY',
      kgPerWorkerHour: 105,
      kgPerHour: 2100,
    })
    const nightRecord = createPerformanceRecord({
      id: 'p2',
      date: '2026-09-16',
      shift: 'NIGHT',
      kgPerWorkerHour: 95,
      kgPerHour: 1900,
    })

    render(<PerformanceCharts records={[dayRecord, nightRecord]} />)

    expect(
      screen.getByRole('region', { name: 'Gráficos de rendimiento' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Kg/persona-h por día' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Kg/h por día' }),
    ).toBeInTheDocument()
  })
})
