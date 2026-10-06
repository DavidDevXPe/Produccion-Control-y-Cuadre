import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { kg } from '../../production/model/calculations'
import type { PerformanceRecord } from '../model/types'
import { MultiWeekPerformanceTrend } from './MultiWeekPerformanceTrend'

function createPerformanceRecord(weekNumber: number, overrides: Partial<PerformanceRecord> = {}): PerformanceRecord {
  return {
    id: `perf-w${weekNumber}-${overrides.id ?? '1'}`,
    productionDayId: `day-w${weekNumber}`,
    date: `2026-09-${weekNumber}`,
    weekNumber,
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

describe('MultiWeekPerformanceTrend', () => {
  it('returns null when records span 1 or fewer distinct weeks', () => {
    const { container: emptyContainer } = render(
      <MultiWeekPerformanceTrend records={[]} />,
    )
    expect(emptyContainer).toBeEmptyDOMElement()

    const singleWeek = [createPerformanceRecord(36), createPerformanceRecord(36, { id: '2' })]
    const { container: singleContainer } = render(
      <MultiWeekPerformanceTrend records={singleWeek} />,
    )
    expect(singleContainer).toBeEmptyDOMElement()
  })

  it('renders multi-week trend table when records contain more than 1 week', () => {
    const week36 = createPerformanceRecord(36, { id: '36-1' })
    const week37 = createPerformanceRecord(37, { id: '37-1', kgPerWorkerHour: 110 })

    render(
      <MultiWeekPerformanceTrend records={[week36, week37]} />,
    )

    expect(
      screen.getByRole('heading', { name: 'Tendencia multi-semanal de rendimiento' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Semana 36' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Semana 37' })).toBeInTheDocument()
    expect(screen.getAllByText('1 / 1')).toHaveLength(2)
  })

  it('displays fallback dashes for weeks with no complete records', () => {
    const week36 = createPerformanceRecord(36, { id: '36-1' })
    const week37 = createPerformanceRecord(37, {
      id: '37-incomplete',
      isComplete: false,
      effectiveHours: null,
      personHours: null,
      kgPerHour: null,
      kgPerWorkerHour: null,
      benchmarkCompliance: null,
    })

    render(
      <MultiWeekPerformanceTrend records={[week36, week37]} />,
    )

    expect(screen.getByRole('rowheader', { name: 'Semana 36' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Semana 37' })).toBeInTheDocument()
    expect(screen.getByText('0 / 1')).toBeInTheDocument()
  })
})
