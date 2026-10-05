import { formatCentiKg } from '../../../../utils/formatters'
import { kg100 } from '../../../production/model/calculations'
import type { PerformanceRecord } from '../../model/types'
import { benchmarkStatusLabels, formatMetric } from './shiftCardTypes'

export interface PerformanceShiftMetricsDlProps {
  readonly performance: PerformanceRecord
}

export function PerformanceShiftMetricsDl({
  performance,
}: PerformanceShiftMetricsDlProps) {
  const metrics: readonly [string, string][] = [
    ['Producto procesado', formatCentiKg(performance.processedKg100)],
    ['Horas programadas', formatMetric(performance.scheduledHours, ' h')],
    ['Horas efectivas', formatMetric(performance.effectiveHours, ' h')],
    ['Persona-h', formatMetric(performance.personHours)],
    ['Kg/h', formatMetric(performance.kgPerHour)],
    ['Kg/persona-h', formatMetric(performance.kgPerWorkerHour)],
    [
      'Benchmark (mejor del turno)',
      performance.benchmark === null ? 'SIN DATOS' : formatMetric(performance.benchmark),
    ],
    ['Estado benchmark', benchmarkStatusLabels[performance.benchmarkStatus]],
    ['Cumplimiento', formatMetric(performance.benchmarkCompliance, '%')],
    [
      'Potencial',
      performance.potentialKg100 === null ? '—' : formatCentiKg(performance.potentialKg100),
    ],
    [
      'Brecha',
      performance.productivityGapKg100 === null
        ? '—'
        : performance.productivityGapKg100 < 0
          ? `+${formatCentiKg(kg100(-performance.productivityGapKg100))} sobre benchmark`
          : formatCentiKg(performance.productivityGapKg100),
    ],
  ]

  return (
    <dl className="grid gap-px border-y border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([label, value]) => (
        <div key={label} className="bg-white px-3 py-3 text-center">
          <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            {label}
          </dt>
          <dd className="number-tabular mt-1 text-xs font-bold text-slate-950">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

