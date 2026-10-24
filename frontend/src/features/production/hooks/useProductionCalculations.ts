import { useMemo } from 'react'
import { useGridKeyboardNavigation } from './useGridKeyboardNavigation'
import { useFreezingTraceability } from './useFreezingTraceability'
import {
  formatCentiKg,
} from '../../../utils/formatters'
import {
  buildProductionDayFromCapture,
  hasSufficientCaptureData,
  sumImportedBalances,
  type ProductionCaptureDraft,
} from '../capture/productionCapture'
import { captureQuantityKg100 } from '../capture/productionEntryHelpers'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import {
  buildBalanceShiftDiagnostics,
  buildProductionDiagnostics,
  calculateReportFamilySubtotals,
  calculateProductionBusinessSummary,
  validateProductionClosure,
} from '../model/businessRules'
import {
  calculateOutstandingBalances,
  kg100,
  sumKg100,
} from '../model/calculations'
import {
  getPreviousProcess,
  getProductionProcess,
  hasPreviousProcess,
  isPackingProductionDay,
  productionDayKey,
} from '../model/productionProcess'
import type { BalanceLot, ProductionDay } from '../model/types'
import { isTreatmentOnlyProduct } from '../capture/freezingExcelPreview'
import { captureBalancePosition } from '../capture/productionEntryHelpers'

export interface UseProductionCalculationsParams {
  draft: ProductionCaptureDraft
  allProductionDays: readonly ProductionDay[]
  subsequentBalanceLots: readonly BalanceLot[]
  catalogItems: readonly ProductionCatalogItem[]
  isFreezing: boolean
  usesExternalAvailability: boolean
  nonReportProductIds?: readonly string[]
}

type ProductionCaptureRow = ProductionCaptureDraft['rows'][number]
type ReportFamilySubtotals = ReturnType<typeof calculateReportFamilySubtotals>
type ClosureValidation = ReturnType<typeof validateProductionClosure>
type ProductionDiagnostics = ReturnType<typeof buildProductionDiagnostics>

function getOtherProductionDays(
  draft: ProductionCaptureDraft,
  allProductionDays: readonly ProductionDay[],
) {
  const currentDayKey = productionDayKey(draft.date, draft.process)
  return allProductionDays.filter(
    (day) => productionDayKey(day.date, getProductionProcess(day)) !== currentDayKey,
  )
}

function hasCaptureMovement(row: ProductionCaptureRow) {
  const hasNormalMovement =
    captureQuantityKg100(row.dayReportedKg) > 0 ||
    captureQuantityKg100(row.nightReportedKg) > 0 ||
    captureQuantityKg100(row.treatmentKg) > 0 ||
    captureQuantityKg100(row.closingBalanceKg) > 0 ||
    captureQuantityKg100(row.finishedKg) > 0
  const hasTunnelMovement =
    captureQuantityKg100(row.tunnelDayKg) > 0 ||
    captureQuantityKg100(row.tunnelNightKg) > 0
  return { hasNormalMovement, hasTunnelMovement }
}

function getOrderedProductIds(
  reportFamilySubtotals: ReportFamilySubtotals,
  rows: readonly ProductionCaptureRow[],
  nonReportProductIds: readonly string[],
) {
  const nonReportProductIdSet = new Set(nonReportProductIds)
  return reportFamilySubtotals.flatMap((subtotal) =>
    subtotal.productIds.filter((productId) => {
      const row = rows.find(
        (candidate) => candidate.product.productId === productId,
      )
      if (!row) return false
      const { hasNormalMovement, hasTunnelMovement } = hasCaptureMovement(row)
      const hasReportMovement =
        captureQuantityKg100(row.dayReportedKg) > 0 ||
        captureQuantityKg100(row.nightReportedKg) > 0
      return (
        !nonReportProductIdSet.has(productId) || hasReportMovement
      ) && (hasNormalMovement || !hasTunnelMovement)
    }),
  )
}

function buildFreezingBalanceUseSummary(
  process: ProductionCaptureDraft['process'],
  balanceUses: ProductionCaptureDraft['balanceUses'],
  balanceShiftDiagnostics: ReturnType<typeof buildBalanceShiftDiagnostics>,
) {
  if (!hasPreviousProcess(process)) return null

  const diagnosticProductIds = new Set(
    balanceShiftDiagnostics.map((diagnostic) => diagnostic.productId),
  )

  return balanceUses.reduce(
    (summary, balance) => {
      const position = captureBalancePosition(balance)
      const requiresReview =
        balance.requiresProductDistribution === true ||
        position.overusedKg100 > 0 ||
        diagnosticProductIds.has(balance.productId)

      return {
        originCount: summary.originCount + 1,
        availableKg100: kg100(summary.availableKg100 + balance.availableKg100),
        usedKg100: kg100(summary.usedKg100 + position.processedKg100),
        remainingKg100: kg100(summary.remainingKg100 + position.pendingKg100),
        reviewCount: summary.reviewCount + (requiresReview ? 1 : 0),
      }
    },
    {
      originCount: 0,
      availableKg100: kg100(0),
      usedKg100: kg100(0),
      remainingKg100: kg100(0),
      reviewCount: 0,
    },
  )
}

function buildPendingClosureReasons(
  canClose: boolean,
  dayHasReportData: boolean,
  nightHasReportData: boolean,
  dayDifferenceKg100: number,
  nightDifferenceKg100: number,
  closureValidation: ClosureValidation,
  diagnostics: ProductionDiagnostics,
) {
  if (canClose) return []
  const items: string[] = []
  const addShiftDifference = (
    label: string,
    hasReportData: boolean,
    differenceKg100: number,
  ) => {
    if (!hasReportData || differenceKg100 === 0) return
    items.push(
      differenceKg100 > 0
        ? `Turno ${label}: faltan ${formatCentiKg(differenceKg100)}`
        : `Turno ${label}: excede ${formatCentiKg(kg100(-differenceKg100))}`,
    )
  }

  addShiftDifference('Día', dayHasReportData, dayDifferenceKg100)
  addShiftDifference('Noche', nightHasReportData, nightDifferenceKg100)

  const otherBlockers = [
    ...closureValidation.blockers
      .filter((blocker) => blocker.code !== 'TUNNEL_MOVEMENTS_REQUIRED')
      .map((blocker) => blocker.message),
    ...diagnostics
      .filter((diagnostic) => diagnostic.code !== 'SHIFT_BALANCED')
      .map((diagnostic) => diagnostic.message),
  ].filter((message, index, messages) => messages.indexOf(message) === index)

  for (const blocker of otherBlockers) {
    const lower = blocker.toLowerCase()
    if (
      lower.includes('turno día') &&
      items.some((item) => item.toLowerCase().includes('turno día'))
    ) {
      continue
    }
    if (
      lower.includes('turno noche') &&
      items.some((item) => item.toLowerCase().includes('turno noche'))
    ) {
      continue
    }
    if (
      !items.some(
        (item) =>
          item.toLowerCase().includes(lower) || lower.includes(item.toLowerCase()),
      )
    ) {
      items.push(blocker)
    }
  }
  return items
}

function getFooterStatus(
  canClose: boolean,
  hasWarnings: boolean,
  hasSufficientData: boolean,
  usesExternalAvailability: boolean,
  isFreezing: boolean,
) {
  if (canClose && hasWarnings) {
    return {
      title: 'La jornada puede cerrarse con observaciones.',
      description:
        'El cuadre principal es válido, pero existen advertencias que quedarán sujetas a revisión.',
    }
  }
  if (canClose) {
    return {
      title: 'La jornada está lista para cerrar.',
      description: usesExternalAvailability
        ? isFreezing
          ? 'Los reportes coinciden y todo el producto congelado tiene origen trazable en Envasado.'
          : 'Los reportes y consumos de saldo están conciliados sin producción propia.'
        : 'El cuadre es correcto y no existen diferencias pendientes.',
    }
  }
  if (hasSufficientData) {
    return {
      title: 'La jornada todavía requiere revisión.',
      description: 'Revisa el cuadre y las validaciones pendientes antes de cerrar.',
    }
  }
  return {
    title: 'Completa los datos requeridos para validar la jornada.',
    description: 'Puedes guardar un borrador válido y continuar después.',
  }
}

export function useProductionCalculations({
  draft,
  allProductionDays,
  subsequentBalanceLots,
  catalogItems,
  isFreezing,
  usesExternalAvailability,
  nonReportProductIds = [],
}: UseProductionCalculationsParams) {
  const buildResult = useMemo(
    () =>
      buildProductionDayFromCapture(
        draft,
        getOtherProductionDays(draft, allProductionDays),
        subsequentBalanceLots,
      ),
    [allProductionDays, draft, subsequentBalanceLots],
  )

  const hasSufficientData = hasSufficientCaptureData(draft)

  const businessSummary = useMemo(
    () =>
      calculateProductionBusinessSummary(
        buildResult.productionDay,
        buildResult.calculation,
      ),
    [buildResult],
  )

  const reportFamilySubtotals = useMemo(
    () =>
      calculateReportFamilySubtotals(
        buildResult.productionDay,
        buildResult.calculation,
      ),
    [buildResult],
  )

  const orderedProductIds = useMemo(
    () => getOrderedProductIds(reportFamilySubtotals, draft.rows, nonReportProductIds),
    [draft.rows, nonReportProductIds, reportFamilySubtotals],
  )

  const { getGridCellProps: getCaptureCellProps } = useGridKeyboardNavigation({
    totalRows: orderedProductIds.length,
    columns: 2,
    gridId: 'capture-grid',
  })

  const closureValidation = useMemo(
    () =>
      validateProductionClosure(
        buildResult.productionDay,
        buildResult.calculation,
        {
          requiredDataComplete: hasSufficientData,
          inputErrors: buildResult.inputErrors,
          hasSameDaySource: allProductionDays.some(
            (day) =>
              day.date === draft.date &&
              getProductionProcess(day) === getPreviousProcess(draft.process),
          ),
        },
      ),
    [allProductionDays, buildResult, draft.date, draft.process, hasSufficientData],
  )

  const canClose = closureValidation.canClose

  const diagnostics = useMemo(
    () =>
      usesExternalAvailability
        ? []
        : buildProductionDiagnostics(buildResult.calculation, businessSummary),
    [buildResult.calculation, businessSummary, usesExternalAvailability],
  )

  const balanceShiftDiagnostics = useMemo(
    () => buildBalanceShiftDiagnostics(buildResult.calculation, draft.process),
    [buildResult.calculation, draft.process],
  )

  const freezingBalanceUseSummary = useMemo(
    () =>
      buildFreezingBalanceUseSummary(
        draft.process,
        draft.balanceUses,
        balanceShiftDiagnostics,
      ),
    [balanceShiftDiagnostics, draft.balanceUses, draft.process],
  )

  const dayHasReportData =
    draft.declaredDayTotalKg.trim() !== '' && draft.rows.length > 0
  const nightHasReportData =
    draft.declaredNightTotalKg.trim() !== '' && draft.rows.length > 0
  const hasReportData = dayHasReportData && nightHasReportData

  const reportsReconciled =
    hasReportData &&
    buildResult.calculation.day.detailDifferenceKg100 === 0 &&
    buildResult.calculation.night.detailDifferenceKg100 === 0

  const tunnelMovementRequired =
    draft.hasTunnelProduction && buildResult.calculation.tunnel.totalKg100 === 0

  const pendingClosureReasons = useMemo(
    () =>
      buildPendingClosureReasons(
        canClose,
        dayHasReportData,
        nightHasReportData,
        buildResult.calculation.day.detailDifferenceKg100,
        buildResult.calculation.night.detailDifferenceKg100,
        closureValidation,
        diagnostics,
      ),
    [
      canClose,
      dayHasReportData,
      nightHasReportData,
      buildResult.calculation.day.detailDifferenceKg100,
      buildResult.calculation.night.detailDifferenceKg100,
      closureValidation,
      diagnostics,
    ],
  )

  const reviewReasons = useMemo(() => {
    const warningMessages = closureValidation.warnings.map(
      (warning) => warning.message,
    )

    return [...pendingClosureReasons, ...warningMessages].filter(
      (message, index, messages) => messages.indexOf(message) === index,
    )
  }, [closureValidation.warnings, pendingClosureReasons])

  const footerStatus = getFooterStatus(
    canClose,
    closureValidation.warnings.length > 0,
    hasSufficientData,
    usesExternalAvailability,
    isFreezing,
  )

  const importedBalanceTotal = sumImportedBalances(draft.importedBalances)
  const importedBalanceMatches =
    importedBalanceTotal === buildResult.calculation.newClosingBalanceKg100

  const totalReportedKg100 = sumKg100([
    buildResult.calculation.day.declaredReportedKg100,
    buildResult.calculation.night.declaredReportedKg100,
  ])

  const freezing = useFreezingTraceability({
    isFreezing,
    allProductionDays,
    draft,
    catalogItems,
    totalReportedKg100,
  })

  const reportCatalogItems = useMemo(
    () =>
      catalogItems
        .filter(
          (product) =>
            !isTreatmentOnlyProduct(product) &&
            !draft.rows.some(
              (row) => row.product.productId === product.productId,
            ),
        )
        .sort((first, second) =>
          hasPreviousProcess(draft.process)
            ? (freezing.freezingAvailabilityByProduct.get(second.productId) ?? 0) -
              (freezing.freezingAvailabilityByProduct.get(first.productId) ?? 0)
            : 0,
        ),
    [
      catalogItems,
      draft.process,
      draft.rows,
      freezing.freezingAvailabilityByProduct,
    ],
  )

  const availableBalances = useMemo(() => {
    const selectedKeys = new Set(
      draft.balanceUses.map(
        (balance) =>
          `${balance.originDayId}|${
            balance.sourceProductId ?? balance.productId
          }`,
      ),
    )

    const positions = hasPreviousProcess(draft.process)
      ? freezing.freezingAutomaticOriginPositions.filter(
          (pos) => pos.originDate < draft.date,
        )
      : calculateOutstandingBalances(
          allProductionDays.filter(
            (day) =>
              isPackingProductionDay(day) &&
              day.date < draft.date,
          ),
          subsequentBalanceLots,
        )

    const newestOriginByProduct = new Map<string, string>()
    for (const position of positions) {
      const key = `${position.familyId}|${position.productId}`
      const currentDate = newestOriginByProduct.get(key)
      if (!currentDate || position.originDate > currentDate) {
        newestOriginByProduct.set(key, position.originDate)
      }
    }

    return positions.filter(
      (balance) =>
        balance.pendingKg100 > 0 &&
        newestOriginByProduct.get(`${balance.familyId}|${balance.productId}`) ===
          balance.originDate &&
        !selectedKeys.has(
          `${balance.originDayId}|${balance.productId}`,
        ),
    )
  }, [
    allProductionDays,
    draft.balanceUses,
    draft.date,
    draft.process,
    freezing.freezingAutomaticOriginPositions,
    subsequentBalanceLots,
  ])

  return {
    buildResult,
    hasSufficientData,
    businessSummary,
    reportFamilySubtotals,
    orderedProductIds,
    getCaptureCellProps,
    closureValidation,
    canClose,
    diagnostics,
    balanceShiftDiagnostics,
    freezingBalanceUseSummary,
    dayHasReportData,
    nightHasReportData,
    hasReportData,
    reportsReconciled,
    tunnelMovementRequired,
    pendingClosureReasons,
    reviewReasons,
    footerStatus,
    importedBalanceTotal,
    importedBalanceMatches,
    totalReportedKg100,
    reportCatalogItems,
    availableBalances,
    // Freezing traceability delegation
    freezingOpenOriginPositions: freezing.freezingOpenOriginPositions,
    freezingAutomaticOriginStartDate: freezing.freezingAutomaticOriginStartDate,
    freezingAutomaticOriginPositions: freezing.freezingAutomaticOriginPositions,
    freezingAvailabilityByProduct: freezing.freezingAvailabilityByProduct,
    getFreezingPotentialAvailabilityKg100:
      freezing.getFreezingPotentialAvailabilityKg100,
    freezingPreviousOriginsAvailableKg100:
      freezing.freezingPreviousOriginsAvailableKg100,
    freezingCurrentOriginAvailableKg100:
      freezing.freezingCurrentOriginAvailableKg100,
    freezingTotalAvailableKg100: freezing.freezingTotalAvailableKg100,
    freezingLinkedThisDayKg100: freezing.freezingLinkedThisDayKg100,
    freezingPendingAfterKg100: freezing.freezingPendingAfterKg100,
    freezingBalanceExplanation: freezing.freezingBalanceExplanation,
    freezingPendingLinkCount: freezing.freezingPendingLinkCount,
    freezingTraceabilitySummary: freezing.freezingTraceabilitySummary,
    freezingOriginLedger: freezing.freezingOriginLedger,
  }
}
