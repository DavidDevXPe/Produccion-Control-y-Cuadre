import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { kg } from '../../production/model/calculations'
import type { PerformanceRecord } from '../model/types'
import { ShiftComparisonTable } from './ShiftComparisonTable'

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

describe('ShiftComparisonTable', () => {
  it('renders table with day and night comparison and best shift badge', () => {
    const dayRecord = createPerformanceRecord({
      id: 'day-1',
      shift: 'DAY',
      kgPerWorkerHour: 105,
    })
    const nightRecord = createPerformanceRecord({
      id: 'night-1',
      shift: 'NIGHT',
      kgPerWorkerHour: 95,
    })

    render(
      <ShiftComparisonTable
        process="PACKING"
        records={[dayRecord, nightRecord]}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Envasado · Día vs Noche' }),
    ).toBeInTheDocument()
    expect(screen.getByText('MEJOR TURNO: DÍA')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Día' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Noche' })).toBeInTheDocument()

    // Table rows
    expect(screen.getByRole('rowheader', { name: 'Kg procesados' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Horas efectivas' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Persona-h' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Kg/h' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Kg/persona-h' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Benchmark (mejor Kg/persona-h del turno)' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Cumplimiento' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Producción potencial' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Brecha de productividad' })).toBeInTheDocument()
  })

  it('renders NO CALCULABLE badge and fallbacks when records have no complete data', () => {
    render(
      <ShiftComparisonTable
        process="PACKING"
        records={[]}
      />,
    )

    expect(screen.getByText('NO CALCULABLE')).toBeInTheDocument()
    // Indicators should display dashes
    const cells = screen.getAllByRole('cell')
    expect(cells.every((cell) => cell.textContent === '—')).toBe(true)
  })

  it('identifies night shift as best shift when night has higher productivity', () => {
    const dayRecord = createPerformanceRecord({
      id: 'day-1',
      shift: 'DAY',
      processedKg100: kg(15000),
      personHours: 200,
      kgPerWorkerHour: 75,
    })
    const nightRecord = createPerformanceRecord({
      id: 'night-1',
      shift: 'NIGHT',
      processedKg100: kg(30000),
      personHours: 200,
      kgPerWorkerHour: 150,
    })

    render(
      <ShiftComparisonTable
        process="PACKING"
        records={[dayRecord, nightRecord]}
      />,
    )

    expect(screen.getByText('MEJOR TURNO: NOCHE')).toBeInTheDocument()
  })
})
