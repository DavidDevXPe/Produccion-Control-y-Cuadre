import { AlertTriangle } from 'lucide-react'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../../utils/formatters'
import type { ProductionBusinessSummary } from '../../model/businessRules'
import type { SummaryGroupId } from '../../model/types'
import { FAMILY_FOR_GROUP, formatPercent, statusMeta } from './closingYieldTypes'

export interface ClosingBalanceRowControlProps {
  readonly summary: ProductionBusinessSummary
  readonly summaryGroupId: SummaryGroupId
}

export function ClosingBalanceRowControl({
  summary,
  summaryGroupId,
}: ClosingBalanceRowControlProps) {
  const familyKey = FAMILY_FOR_GROUP[summaryGroupId]
  const family = familyKey
    ? summary.families.find((metric) => metric.key === familyKey)
    : undefined
  const group = summary.groupClosingProjections.find(
    (metric) => metric.groupId === summaryGroupId,
  )
  const yieldBeforePercent = family?.yieldBeforePercent ?? group?.yieldBeforePercent ?? null
  const projectedYieldPercent =
    family?.projectedYieldPercent ?? group?.projectedYieldPercent ?? null
  const capacityToOneHundredKg100 =
    family?.capacityToOneHundredKg100 ??
    group?.capacityToOneHundredKg100 ??
    summary.overallControl.capacityToOneHundredKg100
  const status = family?.status ?? group?.status ?? 'NO_TARGET'
  const meta = statusMeta(status)
  const excessKg100 = family?.excessKg100 ?? group?.excessKg100

  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-[0.6875rem] sm:col-span-2 sm:grid-cols-[repeat(5,minmax(0,1fr))_auto] sm:items-center">
      <div>
        <p className="text-slate-500">Rendimiento antes</p>
        <p className="number-tabular mt-0.5 font-extrabold text-slate-900">
          {formatPercent(yieldBeforePercent)}
        </p>
      </div>
      <div>
        <p className="text-slate-500">Rendimiento proyectado</p>
        <p className="number-tabular mt-0.5 font-extrabold text-slate-900">
          {formatPercent(projectedYieldPercent)}
        </p>
      </div>
      <div>
        <p className="text-slate-500">Objetivo</p>
        <p className="number-tabular mt-0.5 font-extrabold text-slate-900">
          {family?.targetPercent == null
            ? 'No aplica'
            : `≥ ${family.targetPercent.toFixed(0)}%`}
        </p>
      </div>
      <div>
        <p className="text-slate-500">Faltan</p>
        <p className="number-tabular mt-0.5 font-extrabold text-slate-900">
          {family?.targetPercent == null
            ? 'No aplica'
            : formatCentiKg(family.missingToTargetKg100)}
        </p>
      </div>
      <div>
        <p className="text-slate-500">Capacidad hasta 100%</p>
        <p className="number-tabular mt-0.5 font-extrabold text-slate-900">
          {formatCentiKg(capacityToOneHundredKg100)}
        </p>
      </div>
      <div className="sm:justify-self-end">
        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
      </div>
      {status === 'INTEGRITY_ERROR' ? (
        <p className="flex items-start gap-1.5 text-rose-700 sm:col-span-6">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Con este saldo el resultado alcanzaría {formatPercent(projectedYieldPercent)}.
          {excessKg100 !== undefined ? ` Exceso: ${formatCentiKg(excessKg100)}.` : ''}
        </p>
      ) : null}
    </div>
  )
}

