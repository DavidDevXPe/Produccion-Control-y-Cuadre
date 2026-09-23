import { describe, expect, it } from 'vitest'
import { kg } from '../../production/model/calculations'
import type { ProductionDay, ShiftCode } from '../../production/model/types'
import {
  aggregatePerformanceRecords,
  applyWeeklyShiftBenchmarks,
  calculatePerformanceRecord,
  findWeeklyShiftBenchmark,
} from './performanceCalculations'
import type { PerformanceRecord } from './types'

/**
 * Real week from "Rendimiento_Envasado_Congelamiento_13-07-2026.xlsx",
 * sheet "Rendimiento - Envasado" (13/07 to 19/07). One dead hour per shift,
 * as in the workbook.
 */
const WEEK: readonly [string, ShiftCode, number, string, string, number][] = [
  ['2026-07-13', 'DAY', 76, '08:30', '19:15', 163_430],
  ['2026-07-13', 'NIGHT', 75, '22:40', '08:45', 172_050],
  ['2026-07-14', 'DAY', 90, '09:00', '21:30', 230_840],
  ['2026-07-14', 'NIGHT', 83, '21:00', '08:30', 169_350],
  ['2026-07-15', 'DAY', 88, '08:30', '19:15', 250_360],
  ['2026-07-15', 'NIGHT', 85, '21:30', '09:10', 231_610],
  ['2026-07-16', 'DAY', 85, '08:50', '19:15', 259_760],
  ['2026-07-16', 'NIGHT', 98, '21:00', '09:27', 236_130],
  ['2026-07-17', 'DAY', 99, '08:30', '19:00', 273_930],
  ['2026-07-17', 'NIGHT', 90, '20:30', '07:30', 249_070],
  ['2026-07-18', 'DAY', 99, '08:20', '19:30', 285_890],
  ['2026-07-18', 'NIGHT', 105, '21:00', '07:30', 214_740],
  ['2026-07-19', 'DAY', 68, '08:30', '19:15', 180_120],
]

function productionDay(date: string, shift: ShiftCode, amountKg: number): ProductionDay {
  return {
    id: `production-day-${date}`,
    date,
    displayName: date,
    status: 'CLOSED',
    process: 'PACKING',
    rawMaterialEntries: [],
    declaredRawMaterialKg100: kg(0),
    declaredShiftTotalsKg100: {
      DAY: shift === 'DAY' ? kg(amountKg) : kg(0),
      NIGHT: shift === 'NIGHT' ? kg(amountKg) : kg(0),
    },
    declaredFinishedTotalKg100: kg(0),
    lines: [],
    receivedBalanceLots: [],
    nucaWashAuthorization: null,
    performanceReferenceBasisPoints: 8_000,
    nucaBikiniReferenceBasisPoints: 700,
    rawMaterialAllocationOverridesKg100: {},
  }
}

function weekRecords(): readonly PerformanceRecord[] {
  return applyWeeklyShiftBenchmarks(
    WEEK.map(([date, shift, workers, start, end, amountKg]) =>
      calculatePerformanceRecord(
        {
          id: `performance-${date}-${shift}`,
          productionDayId: `production-day-${date}`,
          date,
          weekNumber: 35,
          process: 'PACKING',
          shift,
          supervisor: 'Supervisor',
          workerCount: workers,
          startTime: start,
          endTime: end,
          deadHours: 1,
          createdAt: '',
          updatedAt: '',
        },
        productionDay(date, shift, amountKg),
      ),
    ),
  )
}

describe('weekly shift benchmark (same logic as the performance workbook)', () => {
  it('uses the best Kg/persona-h of each shift as that shift benchmark', () => {
    const records = weekRecords()

    // Day: 16/07 → 259,760 / (85 × 9.4167 h) = 324.53
    expect(findWeeklyShiftBenchmark(records, 'PACKING', 'DAY', 35)).toBeCloseTo(324.531, 3)
    // Night: 17/07 → 249,070 / (90 × 10 h) = 276.74
    expect(findWeeklyShiftBenchmark(records, 'PACKING', 'NIGHT', 35)).toBeCloseTo(276.744, 3)

    const day13 = records.find((r) => r.date === '2026-07-13' && r.shift === 'DAY')!
    const night13 = records.find((r) => r.date === '2026-07-13' && r.shift === 'NIGHT')!
    expect(day13.benchmarkCompliance).toBeCloseTo(67.9606, 3)
    expect(night13.benchmarkCompliance).toBeCloseTo(91.2576, 3)
    expect(
      records.find((r) => r.date === '2026-07-16' && r.shift === 'DAY')!.benchmarkCompliance,
    ).toBeCloseTo(100, 6)
  })

  it('calculates potential and gap per shift, as in the workbook', () => {
    const records = weekRecords()
    const day13 = records.find((r) => r.date === '2026-07-13' && r.shift === 'DAY')!

    // Potential = benchmark × workers × effective hours = 324.53 × 76 × 9.75
    expect(day13.potentialKg100! / 100).toBeCloseTo(240_477.45, 1)
    // Gap = potential − real = 240,477.45 − 163,430
    expect(day13.productivityGapKg100! / 100).toBeCloseTo(77_047.45, 1)
  })

  it('aggregates the week weighted: sum of potentials and real kg over potential', () => {
    const records = weekRecords()
    const day = aggregatePerformanceRecords(records.filter((r) => r.shift === 'DAY'))
    const night = aggregatePerformanceRecords(records.filter((r) => r.shift === 'NIGHT'))

    // Matches the workbook Day totals L22 and M22.
    expect(day.potentialKg100! / 100).toBeCloseTo(1_961_600.42, 1)
    expect(day.productivityGapKg100! / 100).toBeCloseTo(317_270.42, 1)
    expect(day.benchmarkCompliance).toBeCloseTo(83.8259, 3)
    expect(day.benchmark).toBeCloseTo(324.531, 3)

    // Night uses its own best shift (the workbook referenced the Day cell).
    expect(night.potentialKg100! / 100).toBeCloseTo(1_516_287.42, 1)
    expect(night.productivityGapKg100! / 100).toBeCloseTo(243_337.42, 1)
    expect(night.benchmarkCompliance).toBeCloseTo(83.9518, 3)

    // Both shifts together: potentials add up, benchmark is mixed.
    const week = aggregatePerformanceRecords(records)
    expect(week.potentialKg100).toBe(
      (day.potentialKg100 ?? 0) + (night.potentialKg100 ?? 0),
    )
    expect(week.benchmark).toBeNull()
  })

  it('keeps a benchmark configured by Operations instead of the weekly best', () => {
    const configured = applyWeeklyShiftBenchmarks([
      calculatePerformanceRecord(
        {
          id: 'performance-configured',
          productionDayId: 'production-day-2026-07-13',
          date: '2026-07-13',
          weekNumber: 35,
          process: 'PACKING',
          shift: 'DAY',
          supervisor: 'Supervisor',
          workerCount: 76,
          startTime: '08:30',
          endTime: '19:15',
          deadHours: 1,
          createdAt: '',
          updatedAt: '',
        },
        productionDay('2026-07-13', 'DAY', 163_430),
        [{ process: 'PACKING', kgPerWorkerHour: 300 }],
      ),
    ])

    expect(configured[0]?.benchmark).toBe(300)
  })

  it('applies the same shift benchmark logic to Freezing (workbook sheet "Rendimiento - Congelamiento")', () => {
    const FREEZING_WEEK: readonly [string, ShiftCode, number, string, string, number][] = [
      ['2026-07-13', 'DAY', 35, '07:30', '19:30', 131_630],
      ['2026-07-13', 'NIGHT', 45, '19:30', '07:15', 189_900],
      ['2026-07-14', 'DAY', 42, '07:30', '19:30', 230_840],
      ['2026-07-14', 'NIGHT', 48, '19:30', '07:30', 178_880],
      ['2026-07-15', 'DAY', 43, '07:30', '19:30', 227_530],
      ['2026-07-15', 'NIGHT', 47, '19:30', '07:30', 230_760],
      ['2026-07-16', 'DAY', 43, '07:30', '19:30', 239_970],
      ['2026-07-16', 'NIGHT', 46, '19:20', '07:15', 231_540],
      ['2026-07-17', 'DAY', 45, '07:30', '19:30', 249_090],
      ['2026-07-17', 'NIGHT', 47, '19:30', '07:00', 222_600],
      ['2026-07-18', 'DAY', 45, '07:25', '19:00', 266_350],
      ['2026-07-18', 'NIGHT', 45, '19:30', '07:00', 207_960],
      ['2026-07-19', 'DAY', 42, '07:45', '21:00', 201_130],
    ]
    const records = applyWeeklyShiftBenchmarks(
      FREEZING_WEEK.map(([date, shift, workers, start, end, amountKg]) =>
        calculatePerformanceRecord(
          {
            id: `performance-freezing-${date}-${shift}`,
            productionDayId: `production-day-${date}`,
            date,
            weekNumber: 35,
            process: 'FREEZING',
            shift,
            supervisor: 'Supervisor',
            workerCount: workers,
            startTime: start,
            endTime: end,
            deadHours: 1,
            createdAt: '',
            updatedAt: '',
          },
          { ...productionDay(date, shift, amountKg), process: 'FREEZING' },
        ),
      ),
    )
    const day = aggregatePerformanceRecords(records.filter((r) => r.shift === 'DAY'))
    const night = aggregatePerformanceRecords(records.filter((r) => r.shift === 'NIGHT'))

    // Day benchmark: 18/07 → 266,350 / (45 × 10.5833 h) = 559.27, as J10.
    expect(day.benchmark).toBeCloseTo(559.265, 3)
    // Matches the workbook Day totals L22 and M22.
    expect(day.potentialKg100! / 100).toBeCloseTo(1_833_690.42, 1)
    expect(day.productivityGapKg100! / 100).toBeCloseTo(287_150.42, 1)
    expect(day.benchmarkCompliance).toBeCloseTo(84.3403, 3)
    // Night uses its own best shift: 16/07 → 461.08.
    expect(night.benchmark).toBeCloseTo(461.082, 3)
    expect(night.productivityGapKg100! / 100).toBeCloseTo(120_184.26, 1)
  })

  it('shows 100% when a shift has a single record in the week (it is its own best)', () => {
    const [single] = applyWeeklyShiftBenchmarks([
      calculatePerformanceRecord(
        {
          id: 'performance-single',
          productionDayId: 'production-day-2026-07-13',
          date: '2026-07-13',
          weekNumber: 35,
          process: 'FREEZING',
          shift: 'DAY',
          supervisor: 'Supervisor',
          workerCount: 35,
          startTime: '07:30',
          endTime: '19:30',
          deadHours: 1,
          createdAt: '',
          updatedAt: '',
        },
        { ...productionDay('2026-07-13', 'DAY', 131_630), process: 'FREEZING' },
      ),
    ])

    expect(single?.benchmarkCompliance).toBeCloseTo(100, 6)
    expect(single?.productivityGapKg100).toBe(0)
  })
})
