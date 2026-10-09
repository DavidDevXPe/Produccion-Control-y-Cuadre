import { describe, expect, it } from 'vitest'
import { kg100 } from './calculations'
import { buildPalletizingRowsFromWeekDays } from './palletizingWeekAggregation'
import type { ProductionDay, ProductionLine } from './types'

function makeMockLine(overrides: Partial<ProductionLine> = {}): ProductionLine {
  return {
    familyId: 'manto',
    familyName: 'Manto',
    productId: 'prod-1',
    productName: 'MANTO ESTANDAR CRUDO CONGELADO BLOCK',
    summaryGroupId: 'MANTO',
    source: { sheet: 'RESUMEN', cell: 'B10' },
    shiftBreakdownConfidence: 'EXPLICIT',
    shifts: {
      DAY: { reportedKg100: kg100(10_00), adjustments: [] },
      NIGHT: { reportedKg100: kg100(0), adjustments: [] },
    },
    treatmentKg100: kg100(0),
    newClosingBalanceKg100: kg100(0),
    declaredFinishedKg100: kg100(10_00),
    ...overrides,
  }
}

function makeMockDay(
  date: string,
  process: 'PACKING' | 'FREEZING' | 'VIDEOJET' | 'PALLETIZING',
  lines: ProductionLine[],
): ProductionDay {
  return {
    id: `day-${date}-${process}`,
    date,
    displayName: date,
    status: 'CLOSED',
    process,
    rawMaterialEntries: [],
    declaredRawMaterialKg100: kg100(0),
    declaredShiftTotalsKg100: { DAY: kg100(0), NIGHT: kg100(0) },
    declaredFinishedTotalKg100: kg100(0),
    lines,
    receivedBalanceLots: [],
    nucaWashAuthorization: null,
    performanceReferenceBasisPoints: 8000,
    nucaBikiniReferenceBasisPoints: 700,
    rawMaterialAllocationOverridesKg100: {},
  }
}

describe('palletizingWeekAggregation', () => {
  it('returns undefined if no days in week', () => {
    const result = buildPalletizingRowsFromWeekDays(42, [])
    expect(result).toBeUndefined()
  })

  it('aggregates packing, freezing, videojet and palletizing days for week 42', () => {
    const date = '2026-10-12' // Week 42 Monday
    const days: ProductionDay[] = [
      makeMockDay(date, 'PACKING', [
        makeMockLine({ declaredFinishedKg100: kg100(10_00) }),
      ]),
      makeMockDay(date, 'FREEZING', [
        makeMockLine({ declaredFinishedKg100: kg100(10_00) }),
      ]),
      makeMockDay(date, 'VIDEOJET', [
        makeMockLine({
          videojetBagsCount: 1,
          videojetQrKg100: kg100(20_00),
          looseBlockWithoutQrKg100: kg100(0),
        }),
      ]),
      makeMockDay(date, 'PALLETIZING', [
        makeMockLine({
          initialCameraBalanceKg100: kg100(10_00),
          palletizedBagsCount: 1,
          palletizedKg100: kg100(20_00),
          finalCameraBalanceKg100: kg100(0),
        }),
      ]),
    ]

    const result = buildPalletizingRowsFromWeekDays(47, days)
    expect(result).toBeDefined()
    expect(result).toHaveLength(1)
    const row = result![0]!
    expect(row.productId).toBe('prod-1')
    expect(row.packingKg100).toBe(kg100(10_00))
    expect(row.freezingKg100).toBe(kg100(10_00))
    expect(row.videojetBagsCount).toBe(1)
    expect(row.videojetQrKg100).toBe(kg100(20_00))
    expect(row.looseBlockWithoutQrKg100).toBe(kg100(0))
    expect(row.initialCameraBalanceKg100).toBe(kg100(10_00))
    expect(row.palletizedBagsCount).toBe(1)
    expect(row.palletizedKg100).toBe(kg100(20_00))
    expect(row.finalCameraBalanceKg100).toBe(kg100(0))
  })

  it('correctly aggregates physical shift kg for palletizing even if declaredFinishedKg100 is smaller', () => {
    const date = '2026-10-12'
    const days: ProductionDay[] = [
      makeMockDay(date, 'PALLETIZING', [
        makeMockLine({
          shifts: {
            DAY: { reportedKg100: kg100(5_120_00), adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
          declaredFinishedKg100: kg100(60_00), // Previous residual after balance consumption
        }),
      ]),
    ]

    const result = buildPalletizingRowsFromWeekDays(47, days)
    expect(result).toBeDefined()
    const row = result![0]!
    expect(row.palletizedKg100).toBe(kg100(5_120_00))
    expect(row.palletizedBagsCount).toBe(256)
  })
})
