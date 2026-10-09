import { ClipboardCheck } from 'lucide-react'
import { FreezingSummaryView } from '../components/FreezingSummaryView'
import { ProcessSelector } from '../components/ProcessSelector'
import { PalletizingReconciliationView } from '../components/palletizing/PalletizingReconciliationView'
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
    aggregatedPalletizingRows,
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

  if (view === 'VIDEOJET') {
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
        <PalletizingReconciliationView
          initialRows={aggregatedPalletizingRows}
          title="Trazabilidad y Rotulado Videojet QR"
          subtitle={`Control de rotulado, sacos QR e identificación de blocks sin QR · Semana ${activeWeek.number}`}
        />
      </div>
    )
  }

  if (view === 'PALLETIZING') {
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
        <PalletizingReconciliationView
          initialRows={aggregatedPalletizingRows}
          title="Conciliación de Paletizado y Saldos de Cámara"
          subtitle={`Etapa final de despacho y arrastre de saldos físicos · Semana ${activeWeek.number}`}
        />
      </div>
    )
  }

  if (view === 'COMPARISON') {
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
        <PalletizingReconciliationView
          initialRows={aggregatedPalletizingRows}
          title="Flujo de Cuadre Integral entre Procesos (Semanal)"
          subtitle={`Consolidado de Envasado, Congelamiento, Videojet y Paletizado · Semana ${activeWeek.number}`}
        />
      </div>
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

