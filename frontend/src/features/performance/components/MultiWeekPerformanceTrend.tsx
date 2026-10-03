import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { formatCentiKg } from '../../../utils/formatters'
import { aggregatePerformanceRecords } from '../model/performanceCalculations'
import type { PerformanceRecord } from '../model/types'
import { formatPerformanceMetric } from '../model/performancePresentation'

export interface MultiWeekPerformanceTrendProps {
  records: readonly PerformanceRecord[]
}

export function MultiWeekPerformanceTrend({
  records,
}: MultiWeekPerformanceTrendProps) {
  const weekNumbers = [...new Set(records.map((r) => r.weekNumber))].sort(
    (a, b) => a - b,
  )

  if (weekNumbers.length <= 1) return null

  return (
    <SectionCard
      title="Tendencia multi-semanal de rendimiento"
      description="Evolución del producto procesado y eficiencia por semana registrada."
    >
      <DataTableScroll label="Tendencia multi-semanal de rendimiento">
        <table className="erp-table w-full min-w-[36rem] table-fixed border-collapse text-center">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
              <th scope="col" className="w-[20%] px-3 py-2.5 text-left">Semana</th>
              <th scope="col" className="px-3 py-2.5">Turnos con datos</th>
              <th scope="col" className="px-3 py-2.5">Producto procesado</th>
              <th scope="col" className="px-3 py-2.5">Kg/h</th>
              <th scope="col" className="px-3 py-2.5">Kg/persona-h</th>
              <th scope="col" className="px-3 py-2.5">Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {weekNumbers.map((wn) => {
              const weekRecs = records.filter((r) => r.weekNumber === wn)
              const agg = aggregatePerformanceRecords(weekRecs)
              const hasData = agg.completeRecordCount > 0

              return (
                <tr key={wn} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="px-3 py-2.5 text-left text-xs font-bold text-slate-900">
                    Semana {wn}
                  </th>
                  <td className="number-tabular px-3 py-2.5 text-xs text-slate-700">
                    {agg.completeRecordCount} / {agg.recordCount}
                  </td>
                  <td className="number-tabular px-3 py-2.5 text-xs font-bold text-slate-900">
                    {hasData ? formatCentiKg(agg.processedKg100) : '—'}
                  </td>
                  <td className="number-tabular px-3 py-2.5 text-xs font-semibold text-slate-800">
                    {hasData ? formatPerformanceMetric(agg.kgPerHour) : '—'}
                  </td>
                  <td className="number-tabular px-3 py-2.5 text-xs font-bold text-sky-700 dark:text-sky-400">
                    {hasData ? formatPerformanceMetric(agg.kgPerWorkerHour) : '—'}
                  </td>
                  <td className="number-tabular px-3 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {hasData && agg.benchmarkCompliance !== null
                      ? formatPerformanceMetric(agg.benchmarkCompliance, '%')
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </DataTableScroll>
    </SectionCard>
  )
}
