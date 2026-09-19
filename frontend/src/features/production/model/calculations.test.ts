import { describe, expect, it } from 'vitest'

import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { THURSDAY_PRODUCTION_DAY } from '../data/thursday'
import {
  calculateBalancePosition,
  calculateNucaBikiniReference,
  calculateProductionDay,
  calculateShiftEntry,
  calculateWeeklySummary,
  kg,
  kg100,
  toKilograms,
} from './calculations'
import type { BalanceLot, ProductionDay, ShiftProductEntry } from './types'

describe('integer kilogram quantities', () => {
  it('stores hundredths and rejects finer precision', () => {
    expect(kg(151.7)).toBe(15_170)
    expect(toKilograms(kg100(1_108_830))).toBe(11_088.3)
    expect(() => kg(1.001)).toThrow(/two decimal places/)
  })
})

describe('shift production and previous balances', () => {
  it('applies only explicit adjustments at entry level', () => {
    const entry: ShiftProductEntry = {
      reportedKg100: kg(100_000),
      adjustments: [
        {
          id: 'adjustment-1',
          direction: 'DECREASE',
          kg100: kg(1_000),
          reason: 'Corrección documentada del reporte',
          userId: 'user-1',
          createdAt: '2026-09-03T12:00:00-05:00',
        },
      ],
    }

    const result = calculateShiftEntry(entry)

    expect(result.reportedKg100).toBe(kg(100_000))
    expect(result.adjustmentKg100).toBe(kg(-1_000))
    expect(result.previousBalanceProcessedKg100).toBe(kg(0))
    expect(result.ownProductionKg100).toBe(kg(99_000))
  })

  it('derives previous balance deductions only from received lots', () => {
    const sourceLine = WEDNESDAY_PRODUCTION_DAY.lines[0]
    expect(sourceLine).toBeDefined()

    const dayWithReceivedBalance: ProductionDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      receivedBalanceLots: [
        {
          id: 'previous-aleta',
          originDayId: 'production-day-2026-09-01',
          familyId: sourceLine!.familyId,
          productId: sourceLine!.productId,
          originalKg100: kg(1_000),
          uses: [
            {
              id: 'previous-aleta-day-use',
              targetDayId: WEDNESDAY_PRODUCTION_DAY.id,
              shift: 'DAY',
              kg100: kg(600),
            },
            {
              id: 'previous-aleta-night-use',
              targetDayId: WEDNESDAY_PRODUCTION_DAY.id,
              shift: 'NIGHT',
              kg100: kg(400),
            },
          ],
        },
      ],
    }

    const result = calculateProductionDay(dayWithReceivedBalance)
    const aleta = result.products.find(
      (product) => product.productId === sourceLine!.productId,
    )

    expect(aleta?.day.previousBalanceProcessedKg100).toBe(kg(600))
    expect(aleta?.night.previousBalanceProcessedKg100).toBe(kg(400))
    expect(result.receivedPreviousBalanceKg100).toBe(kg(1_000))
    expect(result.processedPreviousBalanceKg100).toBe(kg(1_000))
    expect(result.pendingPreviousBalanceKg100).toBe(kg(0))
    expect(result.ownTurnProductionKg100).toBe(kg(181_010))
    expect(result.differenceKg100).toBe(kg(-1_000))
    expect(result.status).toBe('UNBALANCED')
  })

  it('tracks a balance split between day and night', () => {
    const lot: BalanceLot = {
      id: 'wednesday-balance',
      originDayId: 'production-day-2026-09-02',
      familyId: 'example-family',
      productId: 'example-product',
      originalKg100: kg(40_298.3),
      uses: [
        {
          id: 'day-use',
          targetDayId: 'production-day-2026-09-03',
          shift: 'DAY',
          kg100: kg(25_000),
        },
        {
          id: 'night-use',
          targetDayId: 'production-day-2026-09-03',
          shift: 'NIGHT',
          kg100: kg(15_298.3),
        },
      ],
    }

    expect(calculateBalancePosition(lot)).toEqual({
      originalKg100: kg(40_298.3),
      processedDayKg100: kg(25_000),
      processedNightKg100: kg(15_298.3),
      processedTotalKg100: kg(40_298.3),
      pendingKg100: kg(0),
      overusedKg100: kg(0),
      isValid: true,
    })
  })

  it('detects balance overuse without returning a negative pending amount', () => {
    const lot: BalanceLot = {
      id: 'overused-balance',
      originDayId: 'production-day-2026-09-02',
      familyId: 'example-family',
      productId: 'example-product',
      originalKg100: kg(40_298.3),
      uses: [
        {
          id: 'day-use',
          targetDayId: 'production-day-2026-09-03',
          shift: 'DAY',
          kg100: kg(25_000),
        },
        {
          id: 'night-use',
          targetDayId: 'production-day-2026-09-03',
          shift: 'NIGHT',
          kg100: kg(15_300),
        },
      ],
    }

    const result = calculateBalancePosition(lot)

    expect(result.pendingKg100).toBe(kg(0))
    expect(result.overusedKg100).toBe(kg(1.7))
    expect(result.isValid).toBe(false)
  })
})

describe('Wednesday production reconciliation', () => {
  it('reproduces every exact total from MIÉRCOLES', () => {
    const result = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)

    expect(WEDNESDAY_PRODUCTION_DAY.lines).toHaveLength(23)
    expect(result.day.reportedKg100).toBe(kg(67_680))
    expect(result.night.reportedKg100).toBe(kg(114_330))
    expect(result.ownTurnProductionKg100).toBe(kg(182_010))
    expect(result.treatmentKg100).toBe(kg(21_509.7))
    expect(result.newClosingBalanceKg100).toBe(kg(40_298.3))
    expect(result.expectedFinishedKg100).toBe(kg(243_818))
    expect(result.declaredFinishedKg100).toBe(kg(243_818))
    expect(result.calculatedClosingBalanceKg100).toBe(kg(40_298.3))
    expect(result.differenceKg100).toBe(kg(0))
    expect(result.products.every((product) => product.differenceKg100 === 0)).toBe(
      true,
    )
    expect(result.integrityIssues).toEqual([])
    expect(result.status).toBe('BALANCED')
  })

  it('keeps the 80 percent reference independent from the cuadre', () => {
    const result = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)

    expect(result.status).toBe('BALANCED')
    expect(result.performance.ratio).toBeCloseTo(
      243_818 / 323_440,
      12,
    )
    expect(result.performance.percent).toBeCloseTo(75.38276032649, 10)
    expect(result.performance.referencePercent).toBe(80)
    expect(result.performance.status).toBe('BELOW_REFERENCE')
  })

  it('reports a positive 550 kg difference with the Excel orientation', () => {
    const alteredDay: ProductionDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      declaredFinishedTotalKg100: kg(243_268),
    }

    const result = calculateProductionDay(alteredDay)

    expect(result.calculatedClosingBalanceKg100).toBe(kg(39_748.3))
    expect(result.differenceKg100).toBe(kg(550))
    expect(result.status).toBe('UNBALANCED')
  })
})

describe('daily integrity validation', () => {
  it('invalidates an otherwise squared day when raw-material entries do not match', () => {
    const invalidDay: ProductionDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      rawMaterialEntries: WEDNESDAY_PRODUCTION_DAY.rawMaterialEntries.slice(0, 1),
    }

    const result = calculateProductionDay(invalidDay)

    expect(result.differenceKg100).toBe(kg(0))
    expect(result.integrityIssues.map((issue) => issue.code)).toContain(
      'RAW_MATERIAL_TOTAL_MISMATCH',
    )
    expect(result.status).toBe('UNBALANCED')
  })

  it('detects orphan lots, overconsumption and negative own production', () => {
    const sourceLine = WEDNESDAY_PRODUCTION_DAY.lines[0]
    expect(sourceLine).toBeDefined()

    const invalidDay: ProductionDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      receivedBalanceLots: [
        {
          id: 'overused-aleta',
          originDayId: 'production-day-2026-09-01',
          familyId: sourceLine!.familyId,
          productId: sourceLine!.productId,
          originalKg100: kg(20_000),
          uses: [
            {
              id: 'overused-aleta-day',
              targetDayId: WEDNESDAY_PRODUCTION_DAY.id,
              shift: 'DAY',
              kg100: kg(21_000),
            },
          ],
        },
        {
          id: 'orphan-lot',
          originDayId: 'production-day-2026-09-01',
          familyId: 'missing-family',
          productId: 'missing-product',
          originalKg100: kg(100),
          uses: [
            {
              id: 'orphan-use',
              targetDayId: WEDNESDAY_PRODUCTION_DAY.id,
              shift: 'NIGHT',
              kg100: kg(100),
            },
          ],
        },
      ],
    }

    const result = calculateProductionDay(invalidDay)
    const codes = result.integrityIssues.map((issue) => issue.code)

    expect(codes).toContain('BALANCE_OVERUSED')
    expect(codes).toContain('BALANCE_PRODUCT_NOT_FOUND')
    expect(codes).toContain('NEGATIVE_OWN_PRODUCTION')
    expect(result.status).toBe('UNBALANCED')
    expect(
      result.integrityIssues.find(
        (issue) => issue.code === 'BALANCE_PRODUCT_NOT_FOUND',
      )?.message,
    ).toContain('REQUIERE DISTRIBUCIÓN')
  })

  it('detects duplicate product, lot and balance-use identifiers', () => {
    const sourceLine = WEDNESDAY_PRODUCTION_DAY.lines[0]
    expect(sourceLine).toBeDefined()

    const duplicatedLot: BalanceLot = {
      id: 'duplicated-lot',
      originDayId: 'production-day-2026-09-01',
      familyId: sourceLine!.familyId,
      productId: sourceLine!.productId,
      originalKg100: kg(1_000),
      uses: [
        {
          id: 'duplicated-use',
          targetDayId: WEDNESDAY_PRODUCTION_DAY.id,
          shift: 'DAY',
          kg100: kg(100),
        },
      ],
    }
    const invalidDay: ProductionDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      lines: [...WEDNESDAY_PRODUCTION_DAY.lines, sourceLine!],
      receivedBalanceLots: [duplicatedLot, duplicatedLot],
    }

    const codes = calculateProductionDay(invalidDay).integrityIssues.map(
      (issue) => issue.code,
    )

    expect(codes).toContain('DUPLICATE_PRODUCT_ID')
    expect(codes).toContain('DUPLICATE_BALANCE_LOT_ID')
    expect(codes).toContain('DUPLICATE_BALANCE_USE_ID')
  })
})

describe('Nuca Bikini reference', () => {
  it('calculates the conditional 7 percent reference for Wednesday', () => {
    const result = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY).nucaBikini

    expect(result.applicable).toBe(true)
    expect(result.actualKg100).toBe(kg(22_750))
    expect(result.referenceKg100).toBe(kg(22_640.8))
    expect(result.varianceKg100).toBe(kg(109.2))
    expect(result.shareOfRawMaterialPercent).toBeCloseTo(7.033762057878, 10)
    expect(result.status).toBe('AT_OR_ABOVE_REFERENCE')
  })

  it('returns not applicable when there is no washing order', () => {
    const result = calculateNucaBikiniReference(
      kg(323_440),
      kg(0),
      false,
    )

    expect(result.applicable).toBe(false)
    expect(result.referenceKg100).toBe(kg(0))
    expect(result.status).toBe('NOT_APPLICABLE')
  })

  it('invalidates Nuca production without active, documented washing', () => {
    const inactiveDay: ProductionDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      nucaWashAuthorization: null,
    }

    const inactiveResult = calculateProductionDay(inactiveDay)
    expect(inactiveResult.nucaBikini.status).toBe('NOT_APPLICABLE')
    expect(inactiveResult.integrityIssues.map((issue) => issue.code)).toContain(
      'NUCA_PRODUCTION_WITHOUT_ACTIVE_WASH',
    )
    expect(inactiveResult.status).toBe('UNBALANCED')

    const unauthorizedResult = calculateProductionDay({
      ...WEDNESDAY_PRODUCTION_DAY,
      nucaWashAuthorization: {
        kind: 'CUSTOMER_ORDER',
        reference: null,
        reason: 'Lavado solicitado, pendiente de número de pedido',
      },
    })
    expect(
      unauthorizedResult.integrityIssues.map((issue) => issue.code),
    ).toContain('NUCA_WASH_AUTHORIZATION_MISSING')
    expect(unauthorizedResult.status).toBe('UNBALANCED')
  })
})

describe('Nuca semilimpia reference', () => {
  it('uses 15 percent as an informative reference without changing the cuadre', () => {
    const calculation = calculateProductionDay(THURSDAY_PRODUCTION_DAY)

    expect(calculation.nucaSemilimpia.applicable).toBe(true)
    expect(calculation.nucaSemilimpia.referencePercent).toBe(15)
    expect(calculation.nucaSemilimpia.actualKg100).toBe(kg(12_000))
    expect(calculation.nucaSemilimpia.status).toBe('BELOW_REFERENCE')
    expect(calculation.status).toBe('BALANCED')
  })

  it('deducts historical product ids against the current canonical product', () => {
    const sourceLine = WEDNESDAY_PRODUCTION_DAY.lines[0]
    expect(sourceLine).toBeDefined()

    const dayWithLegacyReceivedBalance: ProductionDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      lines: [
        {
          ...sourceLine!,
          productId: 'aleta-cruda-block-1000-2000-e',
        },
        ...WEDNESDAY_PRODUCTION_DAY.lines.slice(1),
      ],
      receivedBalanceLots: [
        {
          id: 'previous-legacy-aleta',
          originDayId: 'production-day-2026-09-01',
          familyId: sourceLine!.familyId,
          productId: 'capture-seed-6',
          originalKg100: kg(1_000),
          uses: [
            {
              id: 'previous-legacy-aleta-day-use',
              targetDayId: WEDNESDAY_PRODUCTION_DAY.id,
              shift: 'DAY',
              kg100: kg(1_000),
            },
          ],
        },
      ],
    }

    const result = calculateProductionDay(dayWithLegacyReceivedBalance)
    const canonicalProduct = result.products.find(
      (product) => product.productId === 'aleta-cruda-block-1000-2000-e',
    )

    expect(canonicalProduct?.day.previousBalanceProcessedKg100).toBe(kg(1_000))
    expect(
      result.integrityIssues.map((issue) => issue.code),
    ).not.toContain('BALANCE_PRODUCT_NOT_FOUND')
  })

  it('prefers exact historical ids when a legacy and canonical product coexist in the same day', () => {
    const sourceLine = WEDNESDAY_PRODUCTION_DAY.lines[0]
    expect(sourceLine).toBeDefined()

    const legacyLine = {
      ...sourceLine!,
      productId: 'capture-seed-6',
      shifts: {
        DAY: { reportedKg100: kg(1_000), adjustments: [] },
        NIGHT: { reportedKg100: kg(0), adjustments: [] },
      },
      declaredFinishedKg100: kg(500),
    }
    const canonicalLine = {
      ...sourceLine!,
      productId: 'aleta-cruda-block-1000-2000-e',
      shifts: {
        DAY: { reportedKg100: kg(0), adjustments: [] },
        NIGHT: { reportedKg100: kg(0), adjustments: [] },
      },
      newClosingBalanceKg100: kg(500),
      declaredFinishedKg100: kg(500),
    }
    const coexistDay: ProductionDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      lines: [legacyLine, canonicalLine, ...WEDNESDAY_PRODUCTION_DAY.lines.slice(1)],
      receivedBalanceLots: [
        {
          id: 'previous-legacy-aleta',
          originDayId: 'production-day-2026-09-15',
          familyId: sourceLine!.familyId,
          productId: 'capture-seed-6',
          originalKg100: kg(500),
          uses: [
            {
              id: 'previous-legacy-aleta-day-use',
              targetDayId: WEDNESDAY_PRODUCTION_DAY.id,
              shift: 'DAY',
              kg100: kg(500),
            },
          ],
        },
      ],
    }

    const result = calculateProductionDay(coexistDay)
    const legacyProduct = result.products.find(
      (product) => product.productId === 'capture-seed-6',
    )
    const canonicalProduct = result.products.find(
      (product) => product.productId === 'aleta-cruda-block-1000-2000-e',
    )

    expect(legacyProduct?.day.previousBalanceProcessedKg100).toBe(kg(500))
    expect(canonicalProduct?.day.previousBalanceProcessedKg100).toBe(kg(0))
    expect(
      result.integrityIssues.map((issue) => issue.code),
    ).not.toContain('DUPLICATE_PRODUCT_ID')
  })
})

describe('weekly summary validation', () => {
  it('aggregates by stable product id and validates Wednesday as a partial week', () => {
    const summary = calculateWeeklySummary([WEDNESDAY_PRODUCTION_DAY])

    expect(summary.rawMaterialKg100).toBe(kg(323_440))
    expect(summary.distribution).toEqual({
      tubeKg100: kg(161_720),
      aletaKg100: kg(64_688),
      rejosKg100: kg(48_516),
      nucasKg100: kg(48_516),
    })
    expect(summary.detailFinishedKg100).toBe(kg(243_818))
    expect(summary.declaredFinishedKg100).toBe(kg(243_818))
    expect(summary.differenceKg100).toBe(kg(0))
    expect(summary.status).toBe('VALID')
    expect(summary.productTotalsById['anillas-iqf-tratamiento-usa-sm-cp-st']).toBe(
      kg(151.7),
    )
    expect(summary.productTotalsById['boton-usa-sm-cp-tratamiento']).toBe(kg(25))
    expect(summary.productTotalsById['boton-usa-cm-sp-tratamiento']).toBe(kg(2_130))
  })

  it('sums matching products instead of relying on row positions', () => {
    const secondDay: ProductionDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      id: 'production-day-2026-09-09',
      date: '2026-09-09',
      displayName: 'Miércoles 09/09/2026',
    }

    const summary = calculateWeeklySummary([
      WEDNESDAY_PRODUCTION_DAY,
      secondDay,
    ])

    expect(summary.productTotals).toHaveLength(23)
    expect(summary.productTotalsById['aleta-cruda-codificada']).toBe(
      kg(116_680),
    )
    expect(summary.detailFinishedKg100).toBe(kg(487_636))
    expect(summary.differenceKg100).toBe(kg(0))
    expect(summary.status).toBe('VALID')
  })

  it('detects the 2,306.70 kg omitted by the positional RESUMEN formulas', () => {
    const legacyOmittedProductIds = new Set([
      'anillas-iqf-tratamiento-usa-sm-cp-st',
      'boton-usa-sm-cp-tratamiento',
      'boton-usa-cm-sp-tratamiento',
    ])
    const incompleteDay: ProductionDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      lines: WEDNESDAY_PRODUCTION_DAY.lines.filter(
        (line) => !legacyOmittedProductIds.has(line.productId),
      ),
    }

    const summary = calculateWeeklySummary([incompleteDay])

    expect(summary.detailFinishedKg100).toBe(kg(241_511.3))
    expect(summary.differenceKg100).toBe(kg(2_306.7))
    expect(summary.status).toBe('INVALID')
  })

  it('invalidates duplicate days and dates even when their kilograms reconcile', () => {
    const summary = calculateWeeklySummary([
      WEDNESDAY_PRODUCTION_DAY,
      WEDNESDAY_PRODUCTION_DAY,
    ])
    const codes = summary.integrityIssues.map((issue) => issue.code)

    expect(summary.differenceKg100).toBe(kg(0))
    expect(codes).toContain('DUPLICATE_PRODUCTION_DAY_ID')
    expect(codes).toContain('DUPLICATE_PRODUCTION_DAY_DATE')
    expect(summary.status).toBe('INVALID')
  })

  it('invalidates a day outside the requested weekly range', () => {
    const summary = calculateWeeklySummary([WEDNESDAY_PRODUCTION_DAY], {
      startDate: '2026-09-07',
      endDate: '2026-09-13',
    })

    expect(summary.integrityIssues.map((issue) => issue.code)).toContain(
      'WEEK_DATE_OUT_OF_RANGE',
    )
    expect(summary.status).toBe('INVALID')
  })

  it('invalidates inconsistent product metadata across days', () => {
    const firstLine = WEDNESDAY_PRODUCTION_DAY.lines[0]
    expect(firstLine).toBeDefined()

    const secondDay: ProductionDay = {
      ...WEDNESDAY_PRODUCTION_DAY,
      id: 'production-day-2026-09-03',
      date: '2026-09-03',
      displayName: 'Jueves 03/09/2026',
      lines: [
        { ...firstLine!, familyId: 'changed-family' },
        ...WEDNESDAY_PRODUCTION_DAY.lines.slice(1),
      ],
    }

    const summary = calculateWeeklySummary([
      WEDNESDAY_PRODUCTION_DAY,
      secondDay,
    ])

    expect(summary.integrityIssues.map((issue) => issue.code)).toContain(
      'PRODUCT_METADATA_MISMATCH',
    )
    expect(summary.status).toBe('INVALID')
  })
})
