import { useMemo } from 'react'
import {
  calculateWeeklySummary,
  kg100,
  sumKg100,
} from '../model/calculations'
import {
  calculateFreezingAvailability,
  calculateFreezingComparison,
} from '../model/freezing'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import {
  buildDashboardAttentionItems,
  summarizeDashboardAttention,
  type DashboardAttentionItem,
  type DashboardAttentionSummary,
} from '../presentation/dashboardAttention'
import { getJourneyStatus } from '../presentation/journeyStatus'
import { useProductionData } from '../state/ProductionDataContext'
import type { ProductionDay } from '../model/types'
import { formatIsoDateCompact, formatIsoWeekday } from '../../../utils/formatters'
import type { StatusBadgeTone } from '../../../components/ui/StatusBadge'

export interface DashboardCalculatedDay {
  day: ProductionDay
  operationalState: ReturnType<typeof getProductionDayOperationalState>
  calculation: ReturnType<typeof getProductionDayOperationalState>['calculation']
  journey: ReturnType<typeof getJourneyStatus>
}

export interface DashboardJourneyRow extends DashboardCalculatedDay {
  process: 'PACKING' | 'FREEZING'
  registeredKg100: ReturnType<typeof sumKg100>
}

export interface PendingFamilyBalance {
  familyName: string
  pendingKg100: ReturnType<typeof kg100>
  productIds: Set<string>
}

export interface WeeklyProductionDataPoint {
  id: string
  label: string
  dateLabel: string
  dayKg100: ReturnType<typeof kg100>
  nightKg100: ReturnType<typeof kg100>
  treatmentKg100: ReturnType<typeof kg100>
  balanceKg100: ReturnType<typeof kg100>
}

export function useDashboardData() {
  const { activeWeekNumber, allProductionDays, getWeekView } =
    useProductionData()

  return useMemo(() => {
    const packingWeek = getWeekView(activeWeekNumber, 'PACKING')
    const freezingWeek = getWeekView(activeWeekNumber, 'FREEZING')
    const activeWeekState = packingWeek

    const packingDays = packingWeek.productionDays
    const freezingDays = freezingWeek.productionDays
    const registeredJourneyCount = packingDays.length + freezingDays.length
    const hasWeekData = registeredJourneyCount > 0

    const packingCalculatedDays: DashboardCalculatedDay[] = packingDays.map((day) => {
      const operationalState = getProductionDayOperationalState(day)
      return {
        day,
        operationalState,
        calculation: operationalState.calculation,
        journey: getJourneyStatus(day, operationalState),
      }
    })

    const freezingCalculatedDays: DashboardCalculatedDay[] = freezingDays.map((day) => {
      const operationalState = getProductionDayOperationalState(day)
      return {
        day,
        operationalState,
        calculation: operationalState.calculation,
        journey: getJourneyStatus(day, operationalState),
      }
    })

    const processComparison = calculateFreezingComparison(
      allProductionDays,
      packingWeek.period,
    )

    const hasFreezingData =
      processComparison.frozenKg100 > 0 ||
      processComparison.physicalReportedKg100 > 0 ||
      processComparison.status === 'REVIEW'

    const packedWeekKg100 = sumKg100(
      packingCalculatedDays.map(
        ({ calculation }) => calculation.declaredFinishedKg100,
      ),
    )

    const frozenWeekKg100 = sumKg100(
      freezingDays.flatMap((day) => [
        day.declaredShiftTotalsKg100.DAY,
        day.declaredShiftTotalsKg100.NIGHT,
      ]),
    )

    const freezingAvailability = calculateFreezingAvailability(
      allProductionDays,
      packingWeek.period.endDate,
    )

    const weekFreezingPositions = freezingAvailability.filter(
      (position) =>
        position.originDate >= packingWeek.period.startDate &&
        position.originDate <= packingWeek.period.endDate,
    )

    const pendingTraceableKg100 = sumKg100(
      weekFreezingPositions.map((position) => position.pendingKg100),
    )

    const totalAvailableKg100 = sumKg100(
      weekFreezingPositions.map((position) => position.generatedKg100),
    )

    const journeyStatusCounts = [
      ...packingCalculatedDays,
      ...freezingCalculatedDays,
    ].reduce(
      (counts, { journey }) => ({
        ...counts,
        [journey.status]: counts[journey.status] + 1,
      }),
      {
        BALANCED: 0,
        BALANCED_OBSERVED: 0,
        PENDING_REVIEW: 0,
        NOT_BALANCED: 0,
      },
    )

    const balancedJourneyCount = journeyStatusCounts.BALANCED
    const observedJourneyCount = journeyStatusCounts.BALANCED_OBSERVED
    const notBalancedJourneyCount = journeyStatusCounts.NOT_BALANCED
    const reviewJourneyCount =
      journeyStatusCounts.PENDING_REVIEW + notBalancedJourneyCount

    const weekSummary =
      packingDays.length > 0
        ? calculateWeeklySummary(packingDays, packingWeek.period)
        : null

    const isWeekValid =
      Boolean(weekSummary) &&
      weekSummary?.status === 'VALID' &&
      packingDays.every((day) => day.status === 'CLOSED')

    const weeklyProductionData: WeeklyProductionDataPoint[] = packingCalculatedDays.map(
      ({ day, calculation }) => ({
        id: day.id,
        label: day.displayName.split(' ')[0] ?? formatIsoWeekday(day.date),
        dateLabel: formatIsoDateCompact(day.date),
        dayKg100: calculation.productiveDayKg100,
        nightKg100: calculation.productiveNightKg100,
        treatmentKg100: calculation.treatmentKg100,
        balanceKg100: calculation.newClosingBalanceKg100,
      }),
    )

    const pendingBalancesByFamilyAll = (() => {
      const families = new Map<string, PendingFamilyBalance>()

      for (const position of weekFreezingPositions) {
        if (position.pendingKg100 <= 0) continue

        const current = families.get(position.familyId)

        if (current) {
          current.pendingKg100 = kg100(
            current.pendingKg100 + position.pendingKg100,
          )
          current.productIds.add(position.productId)
          continue
        }

        families.set(position.familyId, {
          familyName: position.familyName,
          pendingKg100: position.pendingKg100,
          productIds: new Set([position.productId]),
        })
      }

      return [...families.values()].sort(
        (first, second) => second.pendingKg100 - first.pendingKg100,
      )
    })()

    const pendingBalancesByFamily = pendingBalancesByFamilyAll.slice(0, 5)
    const hiddenPendingFamilyCount = Math.max(
      pendingBalancesByFamilyAll.length - pendingBalancesByFamily.length,
      0,
    )

    const attentionItems: readonly DashboardAttentionItem[] = buildDashboardAttentionItems({
      packingDays: packingCalculatedDays,
      freezingDays: freezingCalculatedDays,
      comparison: processComparison,
      freezingPositions: freezingAvailability,
      weekEndDate: packingWeek.period.endDate,
    })
    const attention: DashboardAttentionSummary = summarizeDashboardAttention(attentionItems)

    const operationStatus: { tone: StatusBadgeTone; label: string } =
      attention.criticalCount > 0 || notBalancedJourneyCount > 0
        ? { tone: 'danger', label: 'OPERACIÓN · CON INCIDENCIAS' }
        : attention.observationCount > 0 || reviewJourneyCount > 0
          ? { tone: 'warning', label: 'OPERACIÓN · CON OBSERVACIONES' }
          : { tone: 'success', label: 'OPERACIÓN · ESTABLE' }

    const weekBadge: { tone: StatusBadgeTone; label: string } = !weekSummary
      ? { tone: 'neutral', label: 'SIN ENVASADO' }
      : isWeekValid
        ? { tone: 'success', label: 'SEMANA CONSISTENTE' }
        : weekSummary.status === 'VALID'
          ? { tone: 'info', label: 'SEMANA EN SEGUIMIENTO' }
          : { tone: 'warning', label: 'SEMANA POR REVISAR' }

    const weeklyYieldPercent = weekSummary?.performance.percent ?? null
    const previousWeek =
      activeWeekNumber > 1 ? getWeekView(activeWeekNumber - 1, 'PACKING') : null
    const previousWeeklyYieldPercent =
      previousWeek && previousWeek.productionDays.length > 0
        ? calculateWeeklySummary(previousWeek.productionDays, previousWeek.period)
            .performance.percent
        : null
    const weeklyYieldDelta =
      weeklyYieldPercent !== null && previousWeeklyYieldPercent !== null
        ? weeklyYieldPercent - previousWeeklyYieldPercent
        : null

    const journeyRows: DashboardJourneyRow[] = [
      ...packingCalculatedDays.map((entry) => ({
        ...entry,
        process: 'PACKING' as const,
        registeredKg100: entry.calculation.declaredFinishedKg100,
      })),
      ...freezingCalculatedDays.map((entry) => ({
        ...entry,
        process: 'FREEZING' as const,
        registeredKg100: sumKg100([
          entry.day.declaredShiftTotalsKg100.DAY,
          entry.day.declaredShiftTotalsKg100.NIGHT,
        ]),
      })),
    ].sort(
      (first, second) =>
        second.day.date.localeCompare(first.day.date) ||
        (first.process === 'PACKING' ? -1 : 1),
    )

    const registeredOperationalDayCount = new Set(
      [...packingDays, ...freezingDays].map((day) => day.date),
    ).size

    const weekDescription = activeWeekState.isClosed
      ? `Semana ${packingWeek.number} · Cerrada · Solo lectura`
      : activeWeekState.isPast
        ? `Semana ${packingWeek.number} · Abierta · Seguimiento operativo`
        : `Semana ${packingWeek.number} · Estado general de Envasado y Congelamiento`

    return {
      packingWeek,
      freezingWeek,
      activeWeekState,
      packingDays,
      freezingDays,
      registeredJourneyCount,
      hasWeekData,
      packingCalculatedDays,
      freezingCalculatedDays,
      processComparison,
      hasFreezingData,
      packedWeekKg100,
      frozenWeekKg100,
      pendingTraceableKg100,
      totalAvailableKg100,
      journeyStatusCounts,
      balancedJourneyCount,
      observedJourneyCount,
      notBalancedJourneyCount,
      reviewJourneyCount,
      weekSummary,
      isWeekValid,
      weeklyProductionData,
      pendingBalancesByFamilyAll,
      pendingBalancesByFamily,
      hiddenPendingFamilyCount,
      attentionItems,
      attention,
      operationStatus,
      weekBadge,
      weeklyYieldPercent,
      weeklyYieldDelta,
      journeyRows,
      registeredOperationalDayCount,
      weekDescription,
    }
  }, [activeWeekNumber, allProductionDays, getWeekView])
}
