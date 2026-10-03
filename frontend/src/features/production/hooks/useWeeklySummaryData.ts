import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { exportPageToPdf } from '../../../utils/pdfExport'
import { formatCentiKg } from '../../../utils/formatters'
import type { ProductionView } from '../components/ProcessSelector'
import type { WeeklyProductGroupRow } from '../components/WeeklyProductSummary'
import { exportWeeklySummaryWorkbook } from '../export/weeklySummaryWorkbook'
import { calculateWeeklySummary, kg100, sumKg100 } from '../model/calculations'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import { isProductionProcess } from '../model/productionProcess'
import { getTubeMpBalance } from '../model/tubeMpBalance'
import type {
  Kg100,
  ProductionDay,
  SummaryGroupId,
  WeeklyProductTotal,
  WeeklySummary,
} from '../model/types'
import { getJourneyStatus } from '../presentation/journeyStatus'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'
import { useProductionData } from '../state/ProductionDataContext'

export const SUMMARY_GROUP_ORDER: readonly SummaryGroupId[] = [
  'ALETA',
  'MANTO',
  'ANILLAS',
  'BOTON',
  'RECORTE_CRUDO',
  'RECORTE_COCIDO',
  'REJOS_SPECIAL',
  'REJOS',
  'REPRODUCTOR',
  'PICO',
  'NUCA_SEMILIMPIA',
  'NUCA_BIKINI',
]

export const SUMMARY_GROUP_LABELS: Record<SummaryGroupId, string> = {
  ALETA: 'Aleta cruda',
  MANTO: 'Manto crudo',
  ANILLAS: 'Anillas',
  BOTON: 'Botón / tratamiento',
  RECORTE_CRUDO: 'Recorte crudo',
  RECORTE_COCIDO: 'Recorte cocido y membrana',
  REJOS_SPECIAL: 'Rejos bailarín semilimpio',
  REJOS: 'Rejos crudo',
  REPRODUCTOR: 'Reproductor crudo',
  PICO: 'Pico',
  NUCA_SEMILIMPIA: 'Nuca semilimpia',
  NUCA_BIKINI: 'Nuca Bikini',
}

export function getGroupTotal(summary: WeeklySummary, groupId: SummaryGroupId): Kg100 {
  return (
    summary.groupTotals.find((group) => group.summaryGroupId === groupId)
      ?.totalKg100 ?? kg100(0)
  )
}

export function getWeeklyReproductorAllocation(days: readonly ProductionDay[]): Kg100 {
  return sumKg100(
    days.map(
      (day) => day.rawMaterialAllocationOverridesKg100.REPRODUCTOR ?? kg100(0),
    ),
  )
}

export function getGroupAllocation(
  summary: WeeklySummary,
  reproductor: Kg100,
  tubeAllocation: Readonly<{
    mantoKg100: Kg100
    anillasKg100: Kg100
  }>,
  groupId: SummaryGroupId,
): Kg100 | null {
  const allocations: Partial<Record<SummaryGroupId, Kg100 | null>> = {
    ALETA: summary.distribution.aletaKg100,
    MANTO: tubeAllocation.mantoKg100,
    ANILLAS: tubeAllocation.anillasKg100,
    BOTON: null,
    RECORTE_CRUDO: null,
    RECORTE_COCIDO: null,
    REJOS_SPECIAL: null,
    REJOS: kg100(summary.distribution.rejosKg100 - reproductor),
    REPRODUCTOR: reproductor,
    PICO: kg100(0),
    NUCA_SEMILIMPIA: summary.distribution.nucasKg100,
    NUCA_BIKINI: summary.nucaBikini.applicable
      ? summary.nucaBikini.referenceKg100
      : null,
  }

  return allocations[groupId] ?? null
}

export function percentage(numerator: Kg100, denominator: Kg100 | null): string {
  if (denominator === null || denominator === 0) return '—'
  return `${((numerator / denominator) * 100).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

export function productsForGroup(
  summary: WeeklySummary,
  groupId: SummaryGroupId,
): readonly WeeklyProductTotal[] {
  return summary.productTotals.filter(
    (product) => product.summaryGroupId === groupId,
  )
}

export function useWeeklySummaryData() {
  usePageTitle('Resumen semanal')

  const {
    activeProcess,
    activeWeekNumber,
    allProductionDays,
    getWeekView,
    setActiveProcess,
  } = useProductionData()

  const [searchParams, setSearchParams] = useSearchParams()
  const viewParam = searchParams.get('view')

  // The URL is the source of truth, so links, back/forward and reloads agree.
  const view: ProductionView =
    viewParam === 'COMPARISON' || isProductionProcess(viewParam)
      ? viewParam
      : activeProcess

  const activeWeek = useMemo(() => {
    return getWeekView(
      activeWeekNumber,
      view === 'COMPARISON' ? 'PACKING' : view,
    )
  }, [getWeekView, activeWeekNumber, view])

  const productionDays = activeWeek.productionDays

  const handleViewChange = (nextView: ProductionView) => {
    setSearchParams({ view: nextView }, { replace: true })
    if (nextView !== 'COMPARISON') setActiveProcess(nextView)
  }

  // Calculations for PACKING view when days exist
  const summary = useMemo(() => {
    if (productionDays.length === 0) return undefined
    return calculateWeeklySummary(productionDays, activeWeek.period)
  }, [productionDays, activeWeek.period])

  const operationalStatesByDate = useMemo(() => {
    return new Map(
      productionDays.map(
        (day) => [day.date, getProductionDayOperationalState(day)] as const,
      ),
    )
  }, [productionDays])

  const calculationsByDate = useMemo(() => {
    return new Map(
      [...operationalStatesByDate].map(
        ([date, state]) => [date, state.calculation] as const,
      ),
    )
  }, [operationalStatesByDate])

  const weekDays = useMemo(() => {
    return activeWeek.calendarDays.map((day) => {
      const productionDay = productionDays.find(
        (candidate) => candidate.date === day.isoDate,
      )
      const operationalState = operationalStatesByDate.get(day.isoDate)
      return {
        ...day,
        calculation: calculationsByDate.get(day.isoDate) ?? null,
        ...(productionDay ? { status: productionDay.status } : {}),
        ...(productionDay && operationalState
          ? { journey: getJourneyStatus(productionDay, operationalState) }
          : {}),
      }
    })
  }, [activeWeek.calendarDays, productionDays, operationalStatesByDate, calculationsByDate])

  const reproductorAllocation = useMemo(() => {
    return getWeeklyReproductorAllocation(productionDays)
  }, [productionDays])

  const weeklyTubeAllocation = useMemo(() => {
    return productionDays.reduce(
      (totals, day) => {
        const calculation = calculationsByDate.get(day.date)!
        const balance = getTubeMpBalance(day, calculation)
        return {
          mantoKg100: kg100(
            totals.mantoKg100 + balance.mpMantoEstimatedKg100,
          ),
          anillasKg100: kg100(
            totals.anillasKg100 + balance.mpAnillaProcessKg100,
          ),
        }
      },
      { mantoKg100: kg100(0), anillasKg100: kg100(0) },
    )
  }, [productionDays, calculationsByDate])

  const weeklyProductGroups: readonly WeeklyProductGroupRow[] = useMemo(() => {
    if (!summary) return []
    return SUMMARY_GROUP_ORDER.map((groupId) => {
      const totalKg100 = getGroupTotal(summary, groupId)
      const allocationKg100 = getGroupAllocation(
        summary,
        reproductorAllocation,
        weeklyTubeAllocation,
        groupId,
      )

      return {
        id: groupId,
        label: SUMMARY_GROUP_LABELS[groupId],
        totalKg100,
        allocationLabel:
          allocationKg100 === null ? '—' : formatCentiKg(allocationKg100),
        performanceLabel: percentage(totalKg100, allocationKg100),
        rawMaterialShareLabel: percentage(
          totalKg100,
          summary.rawMaterialKg100,
        ),
        products: productsForGroup(summary, groupId),
      }
    })
  }, [summary, reproductorAllocation, weeklyTubeAllocation])

  const isValid = useMemo(() => {
    if (!summary) return false
    return (
      summary.status === 'VALID' &&
      productionDays.every((day) => day.status === 'CLOSED')
    )
  }, [summary, productionDays])

  const weeklyYieldStatus = useMemo(() => {
    if (!summary) return undefined
    return getYieldStatus(summary.performance.percent)
  }, [summary])

  const weeklyYieldStyles = useMemo(() => {
    if (!weeklyYieldStatus) return undefined
    return yieldVisualStyles[weeklyYieldStatus.colorVariant]
  }, [weeklyYieldStatus])

  const isNucaSemilimpiaReferenceApplicable = summary?.nucaSemilimpia.applicable ?? false
  const isNucaBikiniReferenceApplicable = summary?.nucaBikini.applicable ?? false

  const handleExportExcel = () => {
    if (!summary) return
    exportWeeklySummaryWorkbook({
      weekNumber: activeWeek.number,
      period: activeWeek.period,
      summary,
      productionDays,
    })
  }

  const handleExportPdf = () => {
    exportPageToPdf(`Resumen Semanal ${activeWeek.number}`)
  }

  const packingWeek = useMemo(() => {
    return getWeekView(activeWeek.number, 'PACKING')
  }, [getWeekView, activeWeek.number])

  const freezingWeek = useMemo(() => {
    return getWeekView(activeWeek.number, 'FREEZING')
  }, [getWeekView, activeWeek.number])

  return {
    view,
    activeWeek,
    productionDays,
    allProductionDays,
    handleViewChange,
    summary,
    weekDays,
    weeklyProductGroups,
    isValid,
    weeklyYieldStatus,
    weeklyYieldStyles,
    isNucaSemilimpiaReferenceApplicable,
    isNucaBikiniReferenceApplicable,
    handleExportExcel,
    handleExportPdf,
    packingWeek,
    freezingWeek,
  }
}
