import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../../utils/formatters'
import type { ProductionBusinessSummary } from '../../model/businessRules'
import { formatPercent, statusMeta } from './closingYieldTypes'

export interface ClosingYieldOverallMetricProps {
  readonly summary: ProductionBusinessSummary
}

export function ClosingYieldOverallMetric({
  summary,
}: ClosingYieldOverallMetricProps) {
  const overallStatus = statusMeta(summary.overallControl.status)

  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-slate-800">
          Aprovechamiento general
        </p>
        <StatusBadge tone={overallStatus.tone}>{overallStatus.label}</StatusBadge>
      </div>
      <p className="number-tabular mt-1 text-lg font-extrabold text-slate-950">
        {formatPercent(summary.overallUtilization.percent)}
      </p>
      <dl className="mt-1 grid gap-0.5 text-[0.6875rem] leading-5 text-slate-500">
        <div className="flex justify-between gap-3">
          <dt>Objetivo</dt>
          <dd className="number-tabular font-bold text-slate-700">
            ≥ {summary.overallControl.targetPercent.toFixed(0)}%
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>PT mínimo</dt>
          <dd className="number-tabular font-bold text-slate-700">
            {formatCentiKg(summary.overallControl.minimumFinishedKg100)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Faltan</dt>
          <dd className="number-tabular font-bold text-slate-700">
            {formatCentiKg(summary.overallControl.missingToTargetKg100)}
          </dd>
        </div>
      </dl>
      {summary.overallControl.status === 'INTEGRITY_ERROR' ? (
        <p className="mt-2 flex items-start gap-1.5 text-[0.6875rem] leading-4 text-rose-700">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Con este saldo el resultado alcanzaría{' '}
          {formatPercent(summary.overallUtilization.percent)}. Exceso:{' '}
          {formatCentiKg(summary.overallControl.excessKg100)}.
        </p>
      ) : summary.overallControl.status === 'COMPLIES' ? (
        <p className="mt-2 flex items-center gap-1.5 text-[0.6875rem] font-bold text-emerald-700">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          Referencia general alcanzada
        </p>
      ) : null}
    </div>
  )
}

