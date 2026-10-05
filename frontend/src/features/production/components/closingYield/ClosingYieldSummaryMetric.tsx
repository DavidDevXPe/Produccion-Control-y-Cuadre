import { AlertTriangle } from 'lucide-react'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../../utils/formatters'
import type { FamilyYieldProjection } from '../../model/businessRules'
import { formatPercent, statusMeta } from './closingYieldTypes'

export interface ClosingYieldSummaryMetricProps {
  readonly metric: FamilyYieldProjection
}

export function ClosingYieldSummaryMetric({
  metric,
}: ClosingYieldSummaryMetricProps) {
  const status = statusMeta(metric.status)

  return (
    <div className="border-b border-slate-200 py-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-slate-800">
          {metric.label}
        </p>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>
      <p className="number-tabular mt-1 text-lg font-extrabold text-slate-950">
        {formatPercent(metric.projectedYieldPercent)}
      </p>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.6875rem] leading-5 text-slate-500">
        <span>
          Objetivo{' '}
          <strong className="text-slate-700">
            {metric.targetPercent === null
              ? 'No aplica'
              : `≥ ${metric.targetPercent.toFixed(0)}%`}
          </strong>
        </span>
        {metric.status === 'BELOW_TARGET' ? (
          <span>
            Faltan{' '}
            <strong className="number-tabular text-amber-700">
              {formatCentiKg(metric.missingToTargetKg100)}
            </strong>
          </span>
        ) : null}
      </div>
      {metric.status === 'INTEGRITY_ERROR' ? (
        <p className="mt-2 flex items-start gap-1.5 text-[0.6875rem] leading-4 text-rose-700">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Con este saldo el resultado alcanzaría{' '}
          {formatPercent(metric.projectedYieldPercent)}. Exceso:{' '}
          {formatCentiKg(metric.excessKg100)}.
        </p>
      ) : null}
      {metric.key === 'NUCA' ? (
        <p className="mt-1 text-[0.625rem] leading-4 text-slate-500">
          Nuca Bikini 7%: referencia informativa; no bloquea el cierre.
        </p>
      ) : null}
    </div>
  )
}

