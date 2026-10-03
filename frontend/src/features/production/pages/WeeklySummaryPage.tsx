import { ClipboardCheck } from 'lucide-react'
import { FreezingSummaryView } from '../components/FreezingSummaryView'
import { ProcessSelector } from '../components/ProcessSelector'
import { ProductionComparisonView } from '../components/ProductionComparisonView'
import { WeeklyConsistencyPanel } from '../components/WeeklyConsistencyPanel'
import { WeeklyDaysTable } from '../components/WeeklyDaysTable'
import { WeeklyProductSummary } from '../components/WeeklyProductSummary'
import { WeeklySummaryDistributionSection } from '../components/WeeklySummaryDistributionSection'
import { WeeklySummaryEmptyState } from '../components/WeeklySummaryEmptyState'
import { WeeklySummaryHeader } from '../components/WeeklySummaryHeader'
import { WeeklySummaryMetricsGrid } from '../components/WeeklySummaryMetricsGrid'
import { useWeeklySummaryData } from '../hooks/useWeeklySummaryData'

export function WeeklySummaryPage() {
  const {
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
  } = useWeeklySummaryData()

  const selector = (
    <div className="no-print">
      <ProcessSelector
        value={view}
        includeComparison
        onChange={handleViewChange}
      />
    </div>
  )

  if (view === 'FREEZING') {
    return (
      <FreezingSummaryView
        week={activeWeek}
        allProductionDays={allProductionDays}
        selector={selector}
      />
    )
  }

  if (view === 'COMPARISON') {
    return (
      <ProductionComparisonView
        weekNumber={activeWeek.number}
        period={activeWeek.period}
        productionDays={allProductionDays}
        packingClosed={packingWeek.isClosed}
        freezingClosed={freezingWeek.isClosed}
        selector={selector}
      />
    )
  }

  if (productionDays.length === 0 || !summary) {
    return (
      <WeeklySummaryEmptyState
        activeWeek={activeWeek}
        selector={selector}
      />
    )
  }

  return (
    <div className="space-y-5">
      <WeeklySummaryHeader
        weekNumber={activeWeek.number}
        productionDaysCount={productionDays.length}
        isClosed={activeWeek.isClosed}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
      />

      {selector}

      <WeeklySummaryMetricsGrid
        summary={summary}
        isValid={isValid}
        weeklyYieldStatus={weeklyYieldStatus}
        weeklyYieldStyles={weeklyYieldStyles}
      />

      <WeeklyConsistencyPanel summary={summary} />

      <WeeklyDaysTable
        days={weekDays}
        totalKg100={summary.declaredFinishedKg100}
        weekNumber={activeWeek.number}
        isWeekClosed={activeWeek.isClosed}
      />

      <WeeklySummaryDistributionSection
        summary={summary}
        isNucaSemilimpiaReferenceApplicable={isNucaSemilimpiaReferenceApplicable}
        isNucaBikiniReferenceApplicable={isNucaBikiniReferenceApplicable}
      />

      <WeeklyProductSummary
        groups={weeklyProductGroups}
        totalFinishedKg100={summary.detailFinishedKg100}
        performanceRatio={summary.performance.ratio}
      />

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600 shadow-panel">
        <ClipboardCheck
          className="mt-0.5 size-5 shrink-0 text-brand-700"
          aria-hidden="true"
        />
        <p>
          La semana puede validar en cero y permanecer bajo la referencia del 80%.
          El aprovechamiento acumulado se calcula con los totales de MP y producto, no
          promediando porcentajes diarios.
        </p>
      </div>
    </div>
  )
}

export default WeeklySummaryPage

