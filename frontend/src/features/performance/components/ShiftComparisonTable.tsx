import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import { productionProcessLabels } from '../../production/model/productionProcess'
import type { ProductionProcess } from '../../production/model/types'
import { getBestPerformanceShift } from '../model/performanceCalculations'
import type { PerformanceRecord } from '../model/types'
import {
  aggregatePerformanceFor,
  formatPerformanceMetric,
  formatProductivityGap,
} from '../model/performancePresentation'

export interface ShiftComparisonTableProps {
  process: ProductionProcess
  records: readonly PerformanceRecord[]
}

export function ShiftComparisonTable({
  process,
  records,
}: ShiftComparisonTableProps) {
  const day = aggregatePerformanceFor(records, process, 'DAY')
  const night = aggregatePerformanceFor(records, process, 'NIGHT')
  const bestShift = getBestPerformanceShift(
    records.filter((record) => record.process === process),
  )
  const hasDay = day.completeRecordCount > 0
  const hasNight = night.completeRecordCount > 0
  const rows = [
    ['Kg procesados', hasDay ? formatCentiKg(day.processedKg100) : '—', hasNight ? formatCentiKg(night.processedKg100) : '—'],
    ['Horas efectivas', hasDay ? formatPerformanceMetric(day.effectiveHours, ' h') : '—', hasNight ? formatPerformanceMetric(night.effectiveHours, ' h') : '—'],
    ['Persona-h', hasDay ? formatPerformanceMetric(day.personHours) : '—', hasNight ? formatPerformanceMetric(night.personHours) : '—'],
    ['Kg/h', hasDay ? formatPerformanceMetric(day.kgPerHour) : '—', hasNight ? formatPerformanceMetric(night.kgPerHour) : '—'],
    ['Kg/persona-h', hasDay ? formatPerformanceMetric(day.kgPerWorkerHour) : '—', hasNight ? formatPerformanceMetric(night.kgPerWorkerHour) : '—'],
    ['Benchmark (mejor Kg/persona-h del turno)', hasDay ? formatPerformanceMetric(day.benchmark) : '—', hasNight ? formatPerformanceMetric(night.benchmark) : '—'],
    ['Cumplimiento', hasDay ? formatPerformanceMetric(day.benchmarkCompliance, '%') : '—', hasNight ? formatPerformanceMetric(night.benchmarkCompliance, '%') : '—'],
    ['Producción potencial', hasDay && day.potentialKg100 !== null ? formatCentiKg(day.potentialKg100) : '—', hasNight && night.potentialKg100 !== null ? formatCentiKg(night.potentialKg100) : '—'],
    ['Brecha de productividad', hasDay ? formatProductivityGap(day) : '—', hasNight ? formatProductivityGap(night) : '—'],
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
