import { Activity, Clock3, FileSpreadsheet, Gauge, PackageCheck, Printer, UsersRound } from 'lucide-react'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import {
  SegmentedTabs,
  type SegmentedTabOption,
} from '../../../components/ui/SegmentedTabs'
import { lazy, Suspense } from 'react'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'

const PerformanceCharts = lazy(() =>
  import('../components/PerformanceCharts').then((module) => ({
    default: module.PerformanceCharts,
  })),
)
import { PerformanceShiftCard } from '../components/PerformanceShiftCard'
import { ProcessPerformanceSummaryCard } from '../components/ProcessPerformanceSummaryCard'
import { ShiftComparisonTable } from '../components/ShiftComparisonTable'
import { MultiWeekPerformanceTrend } from '../components/MultiWeekPerformanceTrend'
import {
  useOperationalPerformanceData,
  type PerformanceView,
} from '../hooks/useOperationalPerformanceData'
import { formatPerformanceMetric } from '../model/performancePresentation'
import { productionProcessLabels } from '../../production/model/productionProcess'
import type { ProductionDay } from '../../production/model/types'

const viewOptions: readonly SegmentedTabOption<PerformanceView>[] = [
  { value: 'SUMMARY', label: 'Resumen' },
  { value: 'PACKING', label: 'Envasado' },
  { value: 'FREEZING', label: 'Congelamiento' },
]

export function OperationalPerformancePage() {
  const {
    view,
    activeWeekNumber,
    storedRecords,
    saveRecord,
    calculatedRecords,
    weekRecords,
    weekAggregate,
    selectedDays,
    handleViewChange,
    handleExportExcel,
    handleExportPdf,
  } = useOperationalPerformanceData()

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operación"
        title="Rendimiento operativo"
        description={`Semana ${activeWeekNumber} · eficiencia física separada del cuadre productivo.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className={`no-print ${buttonStyles('secondary', 'sm')}`}
            >
              <FileSpreadsheet className="size-4" aria-hidden="true" />
              Exportar Excel
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className={`no-print ${buttonStyles('secondary', 'sm')}`}
            >
              <Printer className="size-4" aria-hidden="true" />
              Exportar PDF
            </button>
            <StatusBadge tone="info">KG DESDE REPORTES</StatusBadge>
          </div>
        }
      />

      <SegmentedTabs
        id="performance-view"
        caption="Vista"
        label="Vista de rendimiento"
        options={viewOptions}
        value={view}
        onChange={handleViewChange}
      />

      <div
        role="tabpanel"
        id="performance-view-panel"
        aria-labelledby={`performance-view-${view}`}
        className="space-y-5"
      >
        {view === 'SUMMARY' ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de rendimiento">
              <MetricCard label="Turnos con información" value={weekRecords.filter((record) => record.isComplete).length} icon={<Activity className="size-5" />} tone="brand" />
              <MetricCard label="Producto procesado" value={weekAggregate.completeRecordCount > 0 ? formatCentiKg(weekAggregate.processedKg100) : '—'} icon={<PackageCheck className="size-5" />} />
              <MetricCard label="Horas efectivas" value={weekAggregate.completeRecordCount > 0 ? formatPerformanceMetric(weekAggregate.effectiveHours, ' h') : '—'} icon={<Clock3 className="size-5" />} />
              <MetricCard label="Persona-h" value={weekAggregate.completeRecordCount > 0 ? formatPerformanceMetric(weekAggregate.personHours) : '—'} icon={<UsersRound className="size-5" />} />
            </section>
            {weekRecords.length === 0 ? (
              <SectionCard contentClassName="p-6 text-center">
                <Gauge className="mx-auto size-8 text-brand-700" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-bold text-slate-950">SIN INFORMACIÓN DE RENDIMIENTO</h2>
                <p className="mt-1 text-xs text-slate-600">Las jornadas productivas se conservan; completa supervisor, personal y horarios para calcular eficiencia.</p>
              </SectionCard>
            ) : null}
            <ProcessPerformanceSummaryCard process="PACKING" records={weekRecords} />
            <ProcessPerformanceSummaryCard process="FREEZING" records={weekRecords} />
            <section className="grid gap-5 xl:grid-cols-2">
              <ShiftComparisonTable process="PACKING" records={weekRecords} />
              <ShiftComparisonTable process="FREEZING" records={weekRecords} />
            </section>
            <MultiWeekPerformanceTrend records={calculatedRecords} />
          </>
        ) : (
          <>
            {selectedDays.length === 0 ? (
              <SectionCard contentClassName="p-8 text-center">
                <Gauge className="mx-auto size-8 text-slate-400" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-bold text-slate-950">Sin jornadas de {productionProcessLabels[view]}</h2>
                <p className="mt-1 text-xs text-slate-500">No se inventan kilos ni registros de rendimiento para esta semana.</p>
              </SectionCard>
            ) : selectedDays.map((day: ProductionDay) => (
              <SectionCard
                key={day.id}
                title={formatIsoDate(day.date)}
                description={`${productionProcessLabels[view]} · los kg se actualizan automáticamente si cambia el reporte productivo.`}
                contentClassName="grid gap-5 p-4 xl:grid-cols-2 sm:p-5"
              >
                {(['DAY', 'NIGHT'] as const).map((shift) => (
                  <PerformanceShiftCard
                    key={`${day.id}-${shift}`}
                    productionDay={day}
                    shift={shift}
                    weekNumber={activeWeekNumber}
                    storedRecord={storedRecords.find(
                      (record) =>
                        record.productionDayId === day.id && record.shift === shift,
                    )}
                    weekRecords={weekRecords}
                    readOnly={false}
                    onSave={saveRecord}
                  />
                ))}
              </SectionCard>
            ))}
            <ShiftComparisonTable process={view} records={weekRecords} />
            <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-ui-surface-dark-soft" />}>
              <PerformanceCharts records={weekRecords.filter((record) => record.process === view)} />
            </Suspense>
          </>
        )}
      </div>
    </div>
  )
}

export default OperationalPerformancePage

