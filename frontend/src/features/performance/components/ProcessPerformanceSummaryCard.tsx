import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import { productionProcessLabels } from '../../production/model/productionProcess'
import type { ProductionProcess } from '../../production/model/types'
import type { PerformanceRecord } from '../model/types'
import {
  aggregatePerformanceFor,
  formatPerformanceMetric,
  formatProductivityGap,
} from '../model/performancePresentation'

export interface ProcessPerformanceSummaryCardProps {
  process: ProductionProcess
  records: readonly PerformanceRecord[]
}

export function ProcessPerformanceSummaryCard({
  process,
  records,
}: ProcessPerformanceSummaryCardProps) {
  const aggregate = aggregatePerformanceFor(records, process)
  const hasInformation = aggregate.completeRecordCount > 0
  const benchmarkConfigured = aggregate.potentialKg100 !== null

  return (
    <SectionCard
      title={productionProcessLabels[process]}
      description={`${aggregate.completeRecordCount} de ${aggregate.recordCount} turnos con información completa.`}
      action={
        <StatusBadge tone={benchmarkConfigured ? 'info' : 'neutral'}>
          {benchmarkConfigured ? 'BENCHMARK: MEJOR TURNO DE LA SEMANA' : 'SIN BENCHMARK'}
        </StatusBadge>
      }
      contentClassName="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4"
    >
      {[
        ['Producto procesado semanal', hasInformation ? formatCentiKg(aggregate.processedKg100) : '—'],
        ['Kg/h semanal', hasInformation ? formatPerformanceMetric(aggregate.kgPerHour) : '—'],
        ['Kg/persona-h semanal', hasInformation ? formatPerformanceMetric(aggregate.kgPerWorkerHour) : '—'],
        [
          'Cumplimiento / brecha',
          benchmarkConfigured
            ? `${formatPerformanceMetric(aggregate.benchmarkCompliance, '%')} · ${formatProductivityGap(aggregate)}`
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
