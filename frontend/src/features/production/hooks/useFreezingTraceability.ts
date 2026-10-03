import { useCallback, useMemo } from 'react'
import { calculateFreezingAvailability } from '../model/freezing'
import {
  getProductionProcess,
  productionDayKey,
} from '../model/productionProcess'
import { getOperationalWeekContextForIsoDate } from '../../../utils/operationalContext'
import {
  addDaysToIsoDate,
  captureProductAvailability,
  captureQuantityKg100,
} from '../capture/productionEntryHelpers'
import { normalizeProductName } from '../capture/productNormalizer'
import { kg100, sumKg100 } from '../model/calculations'
import { freezingTraceabilityStatus } from '../pages/captureProductStatus'
import { buildFreezingOriginLedger } from '../capture/freezingOriginLedger'
import type { ProductionCaptureDraft } from '../capture/productionCapture'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type { ProductionDay } from '../model/types'

export interface UseFreezingTraceabilityOptions {
  readonly isFreezing: boolean
  readonly allProductionDays: readonly ProductionDay[]
  readonly draft: ProductionCaptureDraft
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly totalReportedKg100: number
}

export function useFreezingTraceability({
  isFreezing,
  allProductionDays,
  draft,
  catalogItems,
  totalReportedKg100,
}: UseFreezingTraceabilityOptions) {
  const freezingAvailabilityPositions = useMemo(
    () =>
      isFreezing
        ? calculateFreezingAvailability(
            allProductionDays.filter(
              (day) =>
                productionDayKey(day.date, getProductionProcess(day)) !==
                productionDayKey(draft.date, draft.process),
            ),
            draft.date,
          )
        : [],
    [allProductionDays, draft.date, draft.process, isFreezing],
  )

  const freezingOpenOriginPositions = useMemo(
    () =>
      freezingAvailabilityPositions
        .filter((position) => position.pendingKg100 > 0)
        .sort((first, second) => {
          const dateComparison = first.originDate.localeCompare(
            second.originDate,
          )

          if (dateComparison !== 0) {
            return dateComparison
          }

          const dayComparison = first.originDayId.localeCompare(
            second.originDayId,
          )

          if (dayComparison !== 0) {
            return dayComparison
          }

          return first.productId.localeCompare(second.productId)
        }),
    [freezingAvailabilityPositions],
  )

  const freezingAutomaticOriginStartDate = useMemo(() => {
    const week = getOperationalWeekContextForIsoDate(draft.date)

    /*
     * Congelamiento trabaja automáticamente
     * con la semana operativa actual y permite
     * el arrastre inmediato del fin de semana.
     *
     * Si la semana empieza lunes 14/09:
     *
     * inicio automático = sábado 12/09.
     *
     * Así:
     * - sábado 12 puede arrastrarse,
     * - domingo 13 puede arrastrarse,
     * - lunes 14 entra normalmente,
     * - históricos como 02/09 o 07/09 no
     *   son consumidos automáticamente.
     */
    return addDaysToIsoDate(week.period.startDate, -2)
  }, [draft.date])

  const freezingAutomaticOriginPositions = useMemo(
    () =>
      freezingOpenOriginPositions.filter(
        (position) =>
          position.originDate >= freezingAutomaticOriginStartDate &&
          position.originDate <= draft.date,
      ),
    [
      draft.date,
      freezingAutomaticOriginStartDate,
      freezingOpenOriginPositions,
    ],
  )

  const freezingPreviousOriginPositions = useMemo(
    () =>
      freezingAutomaticOriginPositions.filter(
        (position) => position.originDate < draft.date,
      ),
    [draft.date, freezingAutomaticOriginPositions],
  )

  const freezingCurrentOriginPositions = useMemo(
    () =>
      freezingAutomaticOriginPositions.filter(
        (position) => position.originDate === draft.date,
      ),
    [draft.date, freezingAutomaticOriginPositions],
  )

  const freezingAvailabilityByProduct = useMemo(() => {
    if (!isFreezing) return new Map<string, ReturnType<typeof kg100>>()
    const totals = new Map<string, ReturnType<typeof kg100>>()
    for (const position of freezingAutomaticOriginPositions) {
      totals.set(
        position.productId,
        kg100((totals.get(position.productId) ?? 0) + position.pendingKg100),
      )
    }
    return totals
  }, [freezingAutomaticOriginPositions, isFreezing])

  const getFreezingPotentialAvailabilityKg100 = useCallback(
    (productId: string) => {
      const linkedAvailability = captureProductAvailability(
        draft,
        productId,
      )

      const product =
        draft.rows.find((row) => row.product.productId === productId)?.product ??
        catalogItems.find((candidate) => candidate.productId === productId)

      if (!product) {
        return linkedAvailability.availableKg100
      }

      const normalizedProductName = normalizeProductName(product.productName)

      const sourceAvailableKg100 = sumKg100(
        freezingAutomaticOriginPositions
          .filter((position) => {
            if (position.pendingKg100 <= 0) {
              return false
            }

            if (position.productId === product.productId) {
              return true
            }

            return (
              position.familyId === product.familyId &&
              normalizeProductName(position.productName) ===
                normalizedProductName
            )
          })
          .map((position) => position.pendingKg100),
      )

      return kg100(
        Math.max(sourceAvailableKg100, linkedAvailability.availableKg100),
      )
    },
    [catalogItems, draft, freezingAutomaticOriginPositions],
  )

  const freezingPreviousOriginsAvailableKg100 = sumKg100(
    freezingPreviousOriginPositions.map((position) => position.pendingKg100),
  )

  const freezingCurrentOriginAvailableKg100 = sumKg100(
    freezingCurrentOriginPositions.map((position) => position.pendingKg100),
  )

  const freezingTotalAvailableKg100 = sumKg100([
    freezingPreviousOriginsAvailableKg100,
    freezingCurrentOriginAvailableKg100,
  ])

  const freezingLinkedThisDayKg100 = sumKg100(
    draft.balanceUses.flatMap((balance) => [
      captureQuantityKg100(balance.dayKg),
      captureQuantityKg100(balance.nightKg),
    ]),
  )

  const freezingPendingAfterKg100 = kg100(
    Math.max(freezingTotalAvailableKg100 - freezingLinkedThisDayKg100, 0),
  )

  const freezingBalanceExplanation = useMemo(() => {
    if (!isFreezing) {
      return {
        selectedAvailableKg100: kg100(0),
        pendingInSelectedKg100: kg100(0),
        untouchedKg100: kg100(0),
        untracedFrozenKg100: kg100(0),
        physicalDifferenceKg100: kg100(0),
        untouchedPositions: [],
      }
    }

    const automaticKeys = new Set(
      freezingAutomaticOriginPositions.map(
        (position) => `${position.originDayId}|${position.productId}`,
      ),
    )

    const selectedAutomaticUses = draft.balanceUses.filter((balance) =>
      automaticKeys.has(
        `${balance.originDayId}|${
          balance.sourceProductId ?? balance.productId
        }`,
      ),
    )

    const selectedKeys = new Set(
      selectedAutomaticUses.map(
        (balance) =>
          `${balance.originDayId}|${
            balance.sourceProductId ?? balance.productId
          }`,
      ),
    )

    const selectedAvailableKg100 = sumKg100(
      selectedAutomaticUses.map((balance) => balance.availableKg100),
    )

    const selectedLinkedKg100 = sumKg100(
      selectedAutomaticUses.flatMap((balance) => [
        captureQuantityKg100(balance.dayKg),
        captureQuantityKg100(balance.nightKg),
      ]),
    )

    const pendingInSelectedKg100 = kg100(
      Math.max(selectedAvailableKg100 - selectedLinkedKg100, 0),
    )

    const untouchedPositions = freezingAutomaticOriginPositions.filter(
      (position) =>
        !selectedKeys.has(`${position.originDayId}|${position.productId}`),
    )

    const untouchedKg100 = sumKg100(
      untouchedPositions.map((position) => position.pendingKg100),
    )

    const untracedFrozenKg100 = kg100(
      Math.max(totalReportedKg100 - freezingLinkedThisDayKg100, 0),
    )

    const physicalDifferenceKg100 = kg100(
      freezingTotalAvailableKg100 - totalReportedKg100,
    )

    return {
      selectedAvailableKg100,
      pendingInSelectedKg100,
      untouchedKg100,
      untracedFrozenKg100,
      physicalDifferenceKg100,
      untouchedPositions,
    }
  }, [
    draft.balanceUses,
    freezingAutomaticOriginPositions,
    freezingLinkedThisDayKg100,
    freezingTotalAvailableKg100,
    isFreezing,
    totalReportedKg100,
  ])

  const freezingProductsPendingLink = useMemo(
    () =>
      isFreezing
        ? draft.rows.filter((row) => {
            const reportedKg100 = sumKg100([
              captureQuantityKg100(row.dayReportedKg),
              captureQuantityKg100(row.nightReportedKg),
            ])

            if (reportedKg100 === 0) {
              return false
            }

            const linked = captureProductAvailability(
              draft,
              row.product.productId,
            )

            return linked.frozenKg100 < reportedKg100
          })
        : [],
    [draft, isFreezing],
  )

  const freezingPendingLinkCount = freezingProductsPendingLink.length

  const freezingTraceabilitySummary = useMemo(() => {
    if (!isFreezing) {
      return {
        totalProducts: 0,
        traceableProducts: 0,
        pendingProducts: 0,
        problemProducts: 0,
        reportedKg100: kg100(0),
        tracedKg100: kg100(0),
        pendingKg100: kg100(0),
        excessLinkedKg100: kg100(0),
      }
    }

    return draft.rows.reduce(
      (summary, row) => {
        const reportedKg100 = sumKg100([
          captureQuantityKg100(row.dayReportedKg),
          captureQuantityKg100(row.nightReportedKg),
        ])

        if (reportedKg100 === 0) {
          return summary
        }

        const linkedAvailability = captureProductAvailability(
          draft,
          row.product.productId,
        )

        const linkedKg100 = linkedAvailability.frozenKg100

        const availableKg100 = getFreezingPotentialAvailabilityKg100(
          row.product.productId,
        )

        const status = freezingTraceabilityStatus(
          reportedKg100,
          availableKg100,
          linkedKg100,
        )

        const tracedKg100 = kg100(Math.min(linkedKg100, reportedKg100))

        const excessLinkedKg100 = kg100(
          Math.max(linkedKg100 - reportedKg100, 0),
        )

        return {
          totalProducts: summary.totalProducts + 1,
          traceableProducts:
            summary.traceableProducts + (status.label === 'TRAZABLE' ? 1 : 0),
          pendingProducts:
            summary.pendingProducts + (status.tone === 'warning' ? 1 : 0),
          problemProducts:
            summary.problemProducts + (status.tone === 'danger' ? 1 : 0),
          reportedKg100: kg100(summary.reportedKg100 + reportedKg100),
          tracedKg100: kg100(summary.tracedKg100 + tracedKg100),
          pendingKg100: kg100(summary.pendingKg100 + status.pendingToLinkKg100),
          excessLinkedKg100: kg100(summary.excessLinkedKg100 + excessLinkedKg100),
        }
      },
      {
        totalProducts: 0,
        traceableProducts: 0,
        pendingProducts: 0,
        problemProducts: 0,
        reportedKg100: kg100(0),
        tracedKg100: kg100(0),
        pendingKg100: kg100(0),
        excessLinkedKg100: kg100(0),
      },
    )
  }, [
    draft,
    getFreezingPotentialAvailabilityKg100,
    isFreezing,
  ])

  const freezingOriginLedger = useMemo(
    () =>
      isFreezing
        ? buildFreezingOriginLedger({
            positions: freezingAvailabilityPositions,
            currentUses: draft.balanceUses,
          })
        : [],
    [draft.balanceUses, freezingAvailabilityPositions, isFreezing],
  )

  return {
    freezingAvailabilityPositions,
    freezingOpenOriginPositions,
    freezingAutomaticOriginStartDate,
    freezingAutomaticOriginPositions,
    freezingPreviousOriginPositions,
    freezingCurrentOriginPositions,
    freezingAvailabilityByProduct,
    getFreezingPotentialAvailabilityKg100,
    freezingPreviousOriginsAvailableKg100,
    freezingCurrentOriginAvailableKg100,
    freezingTotalAvailableKg100,
    freezingLinkedThisDayKg100,
    freezingPendingAfterKg100,
    freezingBalanceExplanation,
    freezingProductsPendingLink,
    freezingPendingLinkCount,
    freezingTraceabilitySummary,
    freezingOriginLedger,
  }
}
