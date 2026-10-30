import { AlertTriangle } from 'lucide-react'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../../utils/formatters'
import {
  NUCA_BIKINI_TO_EQUIVALENT_FACTOR,
} from '../../model/businessConfig'
import type { FamilyYieldProjection } from '../../model/businessRules'
import { formatPercent, statusMeta } from './closingYieldTypes'

export interface ClosingYieldSummaryMetricProps {
  readonly metric: FamilyYieldProjection
}

export function ClosingYieldSummaryMetric({
  metric,
}: ClosingYieldSummaryMetricProps) {
  const status = statusMeta(metric.status)
  const isNuca = metric.key === 'NUCA'
  const referenceCompliance = metric.projectedYieldPercent
  const cappedReferenceCompliance =
    referenceCompliance === null ? null : Math.min(referenceCompliance, 100)
  const exceedsReference =
    isNuca && referenceCompliance !== null && referenceCompliance > 100
  const excessReferenceKg100 = exceedsReference
    ? Math.max(metric.projectedProductionKg100 - metric.rawMaterialKg100, 0)
    : 0

  return (
    <div className="border-b border-slate-200 py-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-slate-800">
          {metric.label}
        </p>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.04em] text-slate-500">
        {isNuca ? 'Rendimiento obtenido' : 'Rendimiento proyectado'}
      </p>
      <p className="number-tabular mt-0.5 text-lg font-extrabold text-slate-950">
        {isNuca
          ? metric.referencePercent === null || metric.projectedYieldPercent === null
            ? 'Sin producción'
            : formatPercent(cappedReferenceCompliance)
          : formatPercent(metric.projectedYieldPercent)}
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
        {metric.status === 'BELOW_TARGET' && !isNuca ? (
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
      {isNuca ? (
        metric.referencePercent === null || metric.referencePercent === undefined ? (
          <p className="mt-1 text-[0.625rem] leading-4 text-slate-500">
            Sin producción registrada.
          </p>
        ) : (
          <dl className="mt-2 grid gap-0.5 text-[0.625rem] leading-4 text-slate-500">
            <div className="flex justify-between gap-3">
              <dt>Cumplimiento de referencia</dt>
              <dd className="number-tabular font-bold text-slate-700">
                {cappedReferenceCompliance === null
                  ? 'No disponible'
                  : `${cappedReferenceCompliance.toFixed(2)}%`}
              </dd>
            </div>
            {exceedsReference ? (
              <div className="flex justify-between gap-3 text-emerald-700">
                <dt>Referencia superada</dt>
                <dd className="number-tabular font-bold">
                  +{formatCentiKg(excessReferenceKg100)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt>Distribución teórica de MP</dt>
              <dd className="number-tabular font-bold text-slate-700">
                {metric.referencePercent.toFixed(2)}%
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>MP de referencia</dt>
              <dd className="number-tabular font-bold text-slate-700">
                {formatCentiKg(metric.rawMaterialKg100)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Producción equivalente</dt>
              <dd className="number-tabular font-bold text-slate-700">
                {formatCentiKg(metric.projectedProductionKg100)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Factor experimental</dt>
              <dd className="number-tabular font-bold text-slate-700">
                {(NUCA_BIKINI_TO_EQUIVALENT_FACTOR * 100).toFixed(2)}%
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Referencia mínima</dt>
              <dd className="number-tabular font-bold text-slate-700">
                ≥ {(metric.targetPercent ?? 0).toFixed(0)}%
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>PT físico registrado</dt>
              <dd className="number-tabular font-bold text-slate-700">
                {formatCentiKg(metric.productionBeforeClosingKg100)}
              </dd>
            </div>
          </dl>
        )
      ) : null}
    </div>
  )
}

