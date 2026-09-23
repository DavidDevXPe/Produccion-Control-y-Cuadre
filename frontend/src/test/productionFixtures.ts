import {
  buildProductionDayFromCapture,
  createEmptyCaptureDraft,
  type ProductionCaptureBalanceUse,
  type ProductionCaptureDraft,
} from '../features/production/capture/productionCapture'
import { PRODUCTION_CATALOG_ITEMS } from '../features/production/capture/productionCatalog'
import { kg, kg100 } from '../features/production/model/calculations'
import { calculateFreezingAvailability } from '../features/production/model/freezing'
import type { ProductionDay } from '../features/production/model/types'

export const fixtureProduct = PRODUCTION_CATALOG_ITEMS.find(
  (item) => item.summaryGroupId === 'RECORTE_CRUDO',
)!

/** A closed and balanced Packing journey with only Day production. */
export function closedPackingDay(date: string, amountKg: number): ProductionDay {
  const amount = kg(amountKg)

  return {
    id: `production-day-${date}`,
    date,
    displayName: date,
    status: 'CLOSED',
    process: 'PACKING',
    operationMode: 'NORMAL',
    rawMaterialEntries: [],
    declaredRawMaterialKg100: kg100(0),
    declaredShiftTotalsKg100: { DAY: amount, NIGHT: kg100(0) },
    declaredFinishedTotalKg100: amount,
    hasTunnelProduction: false,
    lines: [
      {
        ...fixtureProduct,
        source: { sheet: 'TEST', cell: 'A1' },
        shiftBreakdownConfidence: 'EXPLICIT',
        shifts: {
          DAY: { reportedKg100: amount, adjustments: [] },
          NIGHT: { reportedKg100: kg100(0), adjustments: [] },
        },
        tunnelShifts: {
          DAY: { reportedKg100: kg100(0), adjustments: [] },
          NIGHT: { reportedKg100: kg100(0), adjustments: [] },
        },
        treatmentKg100: kg100(0),
        newClosingBalanceKg100: kg100(0),
        declaredFinishedKg100: amount,
      },
    ],
    receivedBalanceLots: [],
    nucaWashAuthorization: null,
    performanceReferenceBasisPoints: 8000,
    nucaBikiniReferenceBasisPoints: 700,
    rawMaterialAllocationOverridesKg100: {},
  }
}

/**
 * A closed Freezing journey that reports `reportedKg` but only links
 * `linkedKg` of it to the Packing origin.
 */
export function closedFreezingDay({
  date,
  reportedKg,
  linkedKg,
  origin,
}: {
  date: string
  reportedKg: number
  linkedKg: number
  origin: ProductionDay
}): ProductionDay {
  const available = calculateFreezingAvailability([origin], date).find(
    (position) =>
      position.originDayId === origin.id &&
      position.productId === fixtureProduct.productId,
  )
  const balanceUse: ProductionCaptureBalanceUse = {
    key: `${origin.id}-${fixtureProduct.productId}`,
    originDayId: origin.id,
    originDate: origin.date,
    familyId: fixtureProduct.familyId,
    familyName: fixtureProduct.familyName,
    productId: fixtureProduct.productId,
    productName: fixtureProduct.productName,
    availableKg100: available?.pendingKg100 ?? kg100(0),
    dayKg: String(linkedKg),
    nightKg: '0',
  }
  const draft: ProductionCaptureDraft = {
    ...createEmptyCaptureDraft(date, 'FREEZING'),
    declaredDayTotalKg: String(reportedKg),
    declaredNightTotalKg: '0',
    rows: [
      {
        key: `freeze-${reportedKg}`,
        product: fixtureProduct,
        dayReportedKg: String(reportedKg),
        dayPreviousBalanceKg: '0',
        nightReportedKg: '0',
        nightPreviousBalanceKg: '0',
        tunnelDayKg: '0',
        tunnelNightKg: '0',
        treatmentKg: '0',
        closingBalanceKg: '0',
        finishedKg: '',
      },
    ],
    balanceUses: [balanceUse],
  }

  return buildProductionDayFromCapture(draft, [origin], [], 'CLOSED').productionDay
}
