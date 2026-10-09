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
}

export function useProductionCalculations({
  draft,
  allProductionDays,
  subsequentBalanceLots,
  catalogItems,
  isFreezing,
  usesExternalAvailability,
}: UseProductionCalculationsParams) {
  const buildResult = useMemo(
    () =>
      buildProductionDayFromCapture(
        draft,
        allProductionDays.filter(
          (day) =>
            productionDayKey(day.date, getProductionProcess(day)) !==
            productionDayKey(draft.date, draft.process),
        ),
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
    () => reportFamilySubtotals.flatMap((s) => s.productIds),
    [reportFamilySubtotals],
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

  const freezingBalanceUseSummary = useMemo(() => {
    if (!hasPreviousProcess(draft.process)) return null

    const diagnosticProductIds = new Set(
      balanceShiftDiagnostics.map((diagnostic) => diagnostic.productId),
    )

    return draft.balanceUses.reduce(
      (summary, balance) => {
        const position = captureBalancePosition(balance)
        const requiresReview =
          balance.requiresProductDistribution === true ||
          position.overusedKg100 > 0 ||
          diagnosticProductIds.has(balance.productId)

        return {
          originCount: summary.originCount + 1,
          availableKg100: kg100(
            summary.availableKg100 + balance.availableKg100,
          ),
          usedKg100: kg100(
            summary.usedKg100 + position.processedKg100,
          ),
          remainingKg100: kg100(
            summary.remainingKg100 + position.pendingKg100,
          ),
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
  }, [balanceShiftDiagnostics, draft.balanceUses, draft.process])

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

  const pendingClosureReasons = useMemo(() => {
    if (canClose) return []
    const items: string[] = []
    if (dayHasReportData && buildResult.calculation.day.detailDifferenceKg100 !== 0) {
      const diff = buildResult.calculation.day.detailDifferenceKg100
      if (diff > 0) {
        items.push(`Turno Día: faltan ${formatCentiKg(diff)}`)
      } else {
        items.push(`Turno Día: excede ${formatCentiKg(kg100(-diff))}`)
      }
    }
    if (nightHasReportData && buildResult.calculation.night.detailDifferenceKg100 !== 0) {
      const diff = buildResult.calculation.night.detailDifferenceKg100
      if (diff > 0) {
        items.push(`Turno Noche: faltan ${formatCentiKg(diff)}`)
      } else {
        items.push(`Turno Noche: excede ${formatCentiKg(kg100(-diff))}`)
      }
    }

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
      if (lower.includes('turno día') && items.some((it) => it.toLowerCase().includes('turno día'))) {
        continue
      }
      if (lower.includes('turno noche') && items.some((it) => it.toLowerCase().includes('turno noche'))) {
        continue
      }
      if (!items.some((it) => it.toLowerCase().includes(lower) || lower.includes(it.toLowerCase()))) {
        items.push(blocker)
      }
    }
    return items
  }, [
    canClose,
    dayHasReportData,
    nightHasReportData,
    buildResult.calculation.day.detailDifferenceKg100,
    buildResult.calculation.night.detailDifferenceKg100,
    closureValidation.blockers,
    diagnostics,
  ])

  const footerStatus = canClose
    ? closureValidation.warnings.length > 0
      ? {
          title: 'La jornada puede cerrarse con observaciones.',
          description:
            'El cuadre principal es válido, pero existen advertencias que quedarán sujetas a revisión.',
        }
      : {
          title: 'La jornada está lista para cerrar.',
          description: usesExternalAvailability
            ? isFreezing
              ? 'Los reportes coinciden y todo el producto congelado tiene origen trazable en Envasado.'
              : 'Los reportes y consumos de saldo están conciliados sin producción propia.'
            : 'El cuadre es correcto y no existen diferencias pendientes.',
        }
    : hasSufficientData
      ? {
          title: 'La jornada todavía requiere revisión.',
          description:
            'Revisa el cuadre y las validaciones pendientes antes de cerrar.',
        }
      : {
          title: 'Completa los datos requeridos para validar la jornada.',
          description:
            'Puedes guardar un borrador válido y continuar después.',
        }

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
      ? freezing.freezingOpenOriginPositions.filter(
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

    return positions.filter(
      (balance) =>
        balance.pendingKg100 > 0 &&
        !selectedKeys.has(
          `${balance.originDayId}|${balance.productId}`,
        ),
    )
  }, [
    allProductionDays,
    draft.balanceUses,
    draft.date,
    draft.process,
    freezing.freezingOpenOriginPositions,
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
