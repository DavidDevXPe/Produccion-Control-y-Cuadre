import { describe, expect, it } from 'vitest'
import { kg, kg100 } from '../../production/model/calculations'
import type { ProductionDay, ProductionProcess, ShiftCode } from '../../production/model/types'
import { calculatePerformanceRecord } from './performanceCalculations'
import {
  aggregatePerformanceFor,
  formatPerformanceMetric,
  formatProductivityGap,
} from './performancePresentation'
import type { PerformanceAggregate, PerformanceRecordInput } from './types'

function createDay(
  process: ProductionProcess = 'PACKING',
  dayKg = 150_000,
  nightKg = 80_000,
): ProductionDay {
  return {
    id: `day-${process}`,
    date: '2026-09-14',
    displayName: '2026-09-14',
    status: 'CLOSED',
    process,
    rawMaterialEntries: [],
    declaredRawMaterialKg100: kg(0),
    declaredShiftTotalsKg100: { DAY: kg(dayKg), NIGHT: kg(nightKg) },
    declaredFinishedTotalKg100: kg(0),
    lines: [],
    receivedBalanceLots: [],
    nucaWashAuthorization: null,
    performanceReferenceBasisPoints: 8000,
    nucaBikiniReferenceBasisPoints: 700,
    rawMaterialAllocationOverridesKg100: {},
  }
}

function createInput(
  day: ProductionDay,
  shift: ShiftCode,
  overrides?: Partial<PerformanceRecordInput>,
): PerformanceRecordInput {
  return {
    id: `perf-${day.id}-${shift}`,
    productionDayId: day.id,
    date: day.date,
    weekNumber: 38,
    process: day.process ?? 'PACKING',
    shift,
    supervisor: 'Supervisor Test',
    workerCount: 40,
    startTime: shift === 'DAY' ? '07:00' : '19:00',
    endTime: shift === 'DAY' ? '19:00' : '07:00',
    deadHours: 0,
    createdAt: '2026-09-14T00:00:00.000Z',
    updatedAt: '2026-09-14T00:00:00.000Z',
    ...overrides,
  }
}

describe('performancePresentation', () => {
  describe('formatPerformanceMetric', () => {
    it('returns dash when value is null or not finite', () => {
      expect(formatPerformanceMetric(null)).toBe('—')
      expect(formatPerformanceMetric(Number.NaN)).toBe('—')
      expect(formatPerformanceMetric(Number.POSITIVE_INFINITY)).toBe('—')
    })

    it('formats numbers with 2 decimal places and optional suffix', () => {
      expect(formatPerformanceMetric(123.456)).toBe('123.46')
      expect(formatPerformanceMetric(100, '%')).toBe('100.00%')
      expect(formatPerformanceMetric(25.5, ' h')).toBe('25.50 h')
    })
  })

  describe('aggregatePerformanceFor', () => {
    it('filters records by process and shift before aggregating', () => {
      const packingDay = createDay('PACKING', 100_000, 50_000)
      const freezingDay = createDay('FREEZING', 40_000, 20_000)

      const rec1 = calculatePerformanceRecord(createInput(packingDay, 'DAY'), packingDay)
      const rec2 = calculatePerformanceRecord(createInput(packingDay, 'NIGHT'), packingDay)
      const rec3 = calculatePerformanceRecord(createInput(freezingDay, 'DAY'), freezingDay)

      const records = [rec1, rec2, rec3]

      const packingAll = aggregatePerformanceFor(records, 'PACKING')
      expect(packingAll.recordCount).toBe(2)
      expect(packingAll.completeRecordCount).toBe(2)
      expect(packingAll.processedKg100).toBe(15_000_000)

      const packingNight = aggregatePerformanceFor(records, 'PACKING', 'NIGHT')
      expect(packingNight.recordCount).toBe(1)
      expect(packingNight.processedKg100).toBe(5_000_000)

      const freezingAll = aggregatePerformanceFor(records, 'FREEZING')
      expect(freezingAll.recordCount).toBe(1)
      expect(freezingAll.processedKg100).toBe(4_000_000)
    })
  })

  describe('formatProductivityGap', () => {
    const baseAggregate: PerformanceAggregate = {
      processedKg100: kg(10_000),
      effectiveHours: 10,
      personHours: 100,
      kgPerHour: 1000,
      kgPerWorkerHour: 100,
      benchmark: 100,
      benchmarkCompliance: 100,
      potentialKg100: kg(10_000),
      productivityGapKg100: kg100(0),
      benchmarkStatus: 'AT_OR_ABOVE_TARGET',
      recordCount: 1,
      completeRecordCount: 1,
    }

    it('returns dash when productivityGapKg100 is null', () => {
      expect(formatProductivityGap({ ...baseAggregate, productivityGapKg100: null })).toBe('—')
    })

    it('formats negative gap as bonus over benchmark', () => {
      // Gap < 0 means processed > potential (favorable gap)
      const agg = {
        ...baseAggregate,
        productivityGapKg100: kg100(-250000), // -2500 kg in centiKg
      }
      expect(formatProductivityGap(agg)).toContain('sobre benchmark')
      expect(formatProductivityGap(agg)).toContain('+')
    })

    it('formats zero or positive gap normally', () => {
      const zeroGap = {
        ...baseAggregate,
        productivityGapKg100: kg100(0),
      }
      expect(formatProductivityGap(zeroGap)).toBe('0.00 kg')

      const positiveGap = {
        ...baseAggregate,
        productivityGapKg100: kg100(50000), // 500 kg deficit
      }
      expect(formatProductivityGap(positiveGap)).toBe('500.00 kg')
    })
  })
})
