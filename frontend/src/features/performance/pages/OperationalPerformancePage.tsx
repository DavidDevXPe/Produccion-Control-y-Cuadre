import { Activity, Clock3, Gauge, PackageCheck, UsersRound } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import {
  SegmentedTabs,
  type SegmentedTabOption,
} from '../../../components/ui/SegmentedTabs'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import { getOperationalWeekContextForIsoDate } from '../../../utils/operationalContext'
import { PerformanceCharts } from '../components/PerformanceCharts'
import { PerformanceShiftCard } from '../components/PerformanceShiftCard'
import { usePerformanceRecords } from '../hooks/usePerformanceRecords'
import {
  aggregatePerformanceRecords,
  calculatePerformanceRecord,
  findPerformanceBenchmark,
  getBestPerformanceShift,
} from '../model/performanceCalculations'
import { PERFORMANCE_BENCHMARKS } from '../model/performanceConfig'
import type { PerformanceAggregate, PerformanceRecord } from '../model/types'
import { getProductionProcess, productionProcessLabels } from '../../production/model/productionProcess'
import type { ProductionDay, ProductionProcess, ShiftCode } from '../../production/model/types'
import { useProductionData } from '../../production/state/ProductionDataContext'

type PerformanceView = 'SUMMARY' | ProductionProcess

const viewOptions: readonly SegmentedTabOption<PerformanceView>[] = [
  { value: 'SUMMARY', label: 'Resumen' },
  { value: 'PACKING', label: 'Envasado' },
  { value: 'FREEZING', label: 'Congelamiento' },
]

function isPerformanceView(value: string | null): value is PerformanceView {
  return value === 'SUMMARY' || value === 'PACKING' || value === 'FREEZING'
}

function formatMetric(value: number | null, suffix = ''): string {
  return value === null || !Number.isFinite(value)
    ? '—'
    : `${value.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}${suffix}`
}

function aggregateFor(
  records: readonly PerformanceRecord[],
  process: ProductionProcess,
  shift?: ShiftCode,
): PerformanceAggregate {
  const benchmark = shift
    ? findPerformanceBenchmark(PERFORMANCE_BENCHMARKS, process, shift)
    : PERFORMANCE_BENCHMARKS.find(
        (config) => config.process === process && config.shift === undefined,
      )?.kgPerWorkerHour ?? null
  return aggregatePerformanceRecords(
    records.filter(
      (record) =>
        record.process === process && (shift === undefined || record.shift === shift),
    ),
    benchmark,
  )
}

function formatGap(aggregate: PerformanceAggregate): string {
  const gap = aggregate.productivityGapKg100
  if (gap === null) return '—'
  return gap < 0
    ? `+${formatCentiKg(-gap)} sobre benchmark`
    : formatCentiKg(gap)
}

function ShiftComparisonTable({
  process,
  records,
}: {
  process: ProductionProcess
  records: readonly PerformanceRecord[]
}) {
  const day = aggregateFor(records, process, 'DAY')
  const night = aggregateFor(records, process, 'NIGHT')
  const bestShift = getBestPerformanceShift(
    records.filter((record) => record.process === process),
  )
  const hasDay = day.completeRecordCount > 0
  const hasNight = night.completeRecordCount > 0
  const rows = [
    ['Kg procesados', hasDay ? formatCentiKg(day.processedKg100) : '—', hasNight ? formatCentiKg(night.processedKg100) : '—'],
    ['Horas efectivas', hasDay ? formatMetric(day.effectiveHours, ' h') : '—', hasNight ? formatMetric(night.effectiveHours, ' h') : '—'],
    ['Persona-h', hasDay ? formatMetric(day.personHours) : '—', hasNight ? formatMetric(night.personHours) : '—'],
    ['Kg/h', hasDay ? formatMetric(day.kgPerHour) : '—', hasNight ? formatMetric(night.kgPerHour) : '—'],
    ['Kg/persona-h', hasDay ? formatMetric(day.kgPerWorkerHour) : '—', hasNight ? formatMetric(night.kgPerWorkerHour) : '—'],
    ['Cumplimiento', hasDay ? formatMetric(day.benchmarkCompliance, '%') : '—', hasNight ? formatMetric(night.benchmarkCompliance, '%') : '—'],
  ]

  return (
    <SectionCard
      title={`${productionProcessLabels[process]} · Día vs Noche`}
      description="Los indicadores semanales se calculan con sumas de kilos, horas efectivas y persona-h."
      action={
        <StatusBadge tone={bestShift ? 'info' : 'neutral'}>
          {bestShift ? `MEJOR TURNO: ${bestShift === 'DAY' ? 'DÍA' : 'NOCHE'}` : 'NO CALCULABLE'}
        </StatusBadge>
      }
    >
      <DataTableScroll label={`Rendimiento Día y Noche de ${productionProcessLabels[process]}`}>
        <table className="erp-table w-full min-w-[34rem] table-fixed border-collapse text-center">
          <caption className="sr-only">
            Indicadores de rendimiento de {productionProcessLabels[process]} por turno
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
              <th scope="col" className="w-[48%] px-4 py-2.5 text-left">Indicador</th>
              <th scope="col" className="px-3 py-2.5">Día</th>
              <th scope="col" className="px-3 py-2.5">Noche</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, dayValue, nightValue]) => (
              <tr key={label} className="border-b border-slate-100 last:border-0">
                <th scope="row" className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700">{label}</th>
                <td className="number-tabular px-3 py-2.5 text-xs font-bold text-slate-950">{dayValue}</td>
                <td className="number-tabular px-3 py-2.5 text-xs font-bold text-slate-950">{nightValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableScroll>
    </SectionCard>
  )
}

function ProcessPerformanceSummary({
  process,
  records,
}: {
  process: ProductionProcess
  records: readonly PerformanceRecord[]
}) {
  const aggregate = aggregateFor(records, process)
  const hasInformation = aggregate.completeRecordCount > 0
  const benchmarkConfigured = aggregate.benchmark !== null
  return (
    <SectionCard
      title={productionProcessLabels[process]}
      description={`${aggregate.completeRecordCount} de ${aggregate.recordCount} turnos con información completa.`}
      action={
        <StatusBadge tone={benchmarkConfigured ? 'info' : 'neutral'}>
          {benchmarkConfigured ? 'BENCHMARK CONFIGURADO' : 'BENCHMARK NO CONFIGURADO'}
        </StatusBadge>
      }
      contentClassName="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4"
    >
      {[
        ['Producto procesado semanal', hasInformation ? formatCentiKg(aggregate.processedKg100) : '—'],
        ['Kg/h semanal', hasInformation ? formatMetric(aggregate.kgPerHour) : '—'],
        ['Kg/persona-h semanal', hasInformation ? formatMetric(aggregate.kgPerWorkerHour) : '—'],
        [
          'Cumplimiento / brecha',
          benchmarkConfigured
            ? `${formatMetric(aggregate.benchmarkCompliance, '%')} · ${formatGap(aggregate)}`
            : '—',
        ],
      ].map(([label, value]) => (
        <div key={label} className="bg-white px-4 py-4 text-center">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">{label}</p>
          <p className="number-tabular mt-1 text-sm font-extrabold text-slate-950">{value}</p>
        </div>
      ))}
    </SectionCard>
  )
}

export function OperationalPerformancePage() {
  usePageTitle('Rendimiento operativo')
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedView = searchParams.get('view')
  const view: PerformanceView = isPerformanceView(requestedView)
    ? requestedView
    : 'SUMMARY'
  const { activeWeekNumber, allProductionDays, getWeekView } = useProductionData()
  const { records: storedRecords, saveRecord } = usePerformanceRecords()
  const period = getOperationalWeekContextForIsoDate(
    getWeekView(activeWeekNumber, 'PACKING').period.startDate,
  ).period
  const productionDays = allProductionDays.filter(
    (day) => day.date >= period.startDate && day.date <= period.endDate,
  )
  const calculatedRecords = useMemo(
    () =>
      storedRecords.flatMap((record) => {
        const productionDay = allProductionDays.find(
          (day) =>
            day.id === record.productionDayId &&
            getProductionProcess(day) === record.process,
        )
        return productionDay
          ? [calculatePerformanceRecord(record, productionDay, PERFORMANCE_BENCHMARKS)]
          : []
      }),
    [allProductionDays, storedRecords],
  )
  const weekRecords = calculatedRecords.filter(
    (record) => record.weekNumber === activeWeekNumber,
  )
  const weekAggregate = aggregatePerformanceRecords(weekRecords)
  const selectedProcess = view === 'SUMMARY' ? null : view
  const selectedDays = selectedProcess
    ? productionDays.filter(
        (day) => getProductionProcess(day) === selectedProcess,
      )
    : []

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operación"
        title="Rendimiento operativo"
        description={`Semana ${activeWeekNumber} · eficiencia física separada del cuadre productivo.`}
        actions={<StatusBadge tone="info">KG DESDE REPORTES</StatusBadge>}
      />

      <SegmentedTabs
        id="performance-view"
        caption="Vista"
        label="Vista de rendimiento"
        options={viewOptions}
        value={view}
        onChange={(value) => setSearchParams({ view: value }, { replace: true })}
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
            <MetricCard label="Horas efectivas" value={weekAggregate.completeRecordCount > 0 ? formatMetric(weekAggregate.effectiveHours, ' h') : '—'} icon={<Clock3 className="size-5" />} />
            <MetricCard label="Persona-h" value={weekAggregate.completeRecordCount > 0 ? formatMetric(weekAggregate.personHours) : '—'} icon={<UsersRound className="size-5" />} />
          </section>
          {weekRecords.length === 0 ? (
            <SectionCard contentClassName="p-6 text-center">
              <Gauge className="mx-auto size-8 text-brand-700" aria-hidden="true" />
              <h2 className="mt-3 text-sm font-bold text-slate-950">SIN INFORMACIÓN DE RENDIMIENTO</h2>
              <p className="mt-1 text-xs text-slate-600">Las jornadas productivas se conservan; completa supervisor, personal y horarios para calcular eficiencia.</p>
            </SectionCard>
          ) : null}
          <ProcessPerformanceSummary process="PACKING" records={weekRecords} />
          <ProcessPerformanceSummary process="FREEZING" records={weekRecords} />
          <section className="grid gap-5 xl:grid-cols-2">
            <ShiftComparisonTable process="PACKING" records={weekRecords} />
            <ShiftComparisonTable process="FREEZING" records={weekRecords} />
          </section>
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
                  readOnly={false}
                  onSave={saveRecord}
                />
              ))}
            </SectionCard>
          ))}
          <ShiftComparisonTable process={view} records={weekRecords} />
          <PerformanceCharts records={weekRecords.filter((record) => record.process === view)} />
        </>
      )}
      </div>
    </div>
  )
}

export default OperationalPerformancePage
