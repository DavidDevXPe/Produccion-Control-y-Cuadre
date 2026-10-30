import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../../utils/formatters'
import {
  NUCA_BIKINI_TO_EQUIVALENT_FACTOR,
} from '../../model/businessConfig'
import type {
  FamilyYieldProjection,
  ProductionBusinessSummary,
} from '../../model/businessRules'
import { formatPercent, yieldStatus } from './familyYieldTypes'

export interface FamilyYieldCardProps {
  readonly metric: FamilyYieldProjection
  readonly summary: ProductionBusinessSummary
  readonly showTunnel?: boolean
}

export function FamilyYieldCard({
  metric,
  summary,
  showTunnel = false,
}: FamilyYieldCardProps) {
  const status = yieldStatus(metric)
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
    <article
      key={metric.key}
      className="rounded-xl border border-slate-200 bg-slate-50/55 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-950">{metric.label}</h3>
          <p className="mt-0.5 text-[0.6875rem] text-slate-500">
            {isNuca ? 'MP de referencia Nucas' : 'MP de referencia'}:{' '}
            {formatCentiKg(metric.rawMaterialKg100)}
            {isNuca && summary.nucas.applicable ? (
              <>
                {' · Distribución teórica '}
                {summary.nucas.referencePercent.toFixed(2)}%
              </>
            ) : null}
          </p>
        </div>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">
            {isNuca ? 'Rendimiento obtenido' : 'Después de Reportes'}
          </dt>
          <dd className="number-tabular mt-0.5 font-bold text-slate-900">
            {isNuca
              ? summary.nucas.applicable
                ? formatPercent(cappedReferenceCompliance)
                : 'Sin producción'
              : formatPercent(metric.reportYieldPercent)}
          </dd>
        </div>
        {showTunnel ? (
          <>
            <div>
              <dt className="text-slate-500">Túnel incorporado</dt>
              <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                {formatCentiKg(metric.tunnelKg100)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Después de Túnel</dt>
              <dd className="number-tabular mt-0.5 font-bold text-slate-900">
                {formatPercent(metric.afterTunnelYieldPercent)}
              </dd>
            </div>
          </>
        ) : null}
        <div>
          <dt className="text-slate-500">
            {isNuca ? 'PT real' : 'Producción antes de saldo'}
          </dt>
          <dd className="number-tabular mt-0.5 font-bold text-slate-900">
            {formatCentiKg(metric.productionBeforeClosingKg100)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Tratamiento incluido</dt>
          <dd className="number-tabular mt-0.5 font-bold text-slate-900">
            {formatCentiKg(metric.treatmentKg100)}
          </dd>
        </div>
        {!isNuca ? (
          <div>
            <dt className="text-slate-500">Rend. técnico antes de saldo</dt>
            <dd className="number-tabular mt-0.5 font-bold text-slate-900">
              {formatPercent(metric.yieldBeforePercent)}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-slate-500">
            {isNuca ? 'Objetivo de cumplimiento' : 'Objetivo técnico'}
          </dt>
          <dd className="number-tabular mt-0.5 font-bold text-slate-900">
            {metric.targetPercent === null
              ? 'Sin objetivo configurado'
              : `≥ ${metric.targetPercent.toFixed(0)}%`}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Saldo ingresado</dt>
          <dd className="number-tabular mt-0.5 font-bold text-slate-900">
            {formatCentiKg(metric.closingBalanceKg100)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">
            {isNuca ? 'Factor experimental' : 'Rendimiento técnico'}
          </dt>
          <dd className="number-tabular mt-0.5 text-base font-extrabold text-slate-950">
            {isNuca
              ? `${(NUCA_BIKINI_TO_EQUIVALENT_FACTOR * 100).toFixed(2)}%`
              : formatPercent(metric.projectedYieldPercent)}
          </dd>
          {exceedsReference ? (
            <dd className="text-[0.625rem] font-semibold text-emerald-700">
              Supera referencia · +{formatCentiKg(excessReferenceKg100)}
            </dd>
          ) : null}
        </div>
        {!isNuca ? (
          <div>
            <dt className="text-slate-500">Aprovechamiento MP</dt>
            <dd className="number-tabular mt-0.5 text-base font-extrabold text-brand-800">
              {formatPercent(metric.utilizationPercent)}
            </dd>
          </div>
        ) : null}
        {metric.targetPercent !== null && !isNuca ? (
          <div>
            <dt className="text-slate-500">Kg faltantes para objetivo</dt>
            <dd className="number-tabular mt-0.5 font-bold text-slate-900">
              {formatCentiKg(metric.missingToTargetKg100)}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-slate-500">
            {isNuca ? 'Saldo físico por referencia' : 'Capacidad hasta 100%'}
          </dt>
          <dd className="number-tabular mt-0.5 font-bold text-slate-900">
            {isNuca ? 'No aplica' : formatCentiKg(metric.capacityToOneHundredKg100)}
          </dd>
        </div>
      </dl>

      {metric.status === 'INTEGRITY_ERROR' ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Con este saldo, {metric.label} alcanzaría{' '}
            {formatPercent(metric.projectedYieldPercent)}. Exceso detectado:{' '}
            {formatCentiKg(metric.excessKg100)}.
          </p>
        </div>
      ) : metric.status === 'COMPLIES' ? (
        <p className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Objetivo alcanzado
        </p>
      ) : null}

      {metric.key === 'REJO_REPRODUCTOR' ? (
        <div className="mt-3 grid gap-1 border-t border-slate-200 pt-3 text-[0.6875rem] leading-5 text-slate-500 sm:grid-cols-2">
          <p>
            Rejo: <strong>{formatPercent(summary.rejoReproductor.sharedYieldPercent)}</strong> ·
            MP {formatCentiKg(summary.rejoReproductor.rejoRawMaterialKg100)}
          </p>
          <p>
            Reproductor: <strong>{formatPercent(summary.rejoReproductor.sharedYieldPercent)}</strong> ·
            MP {formatCentiKg(summary.rejoReproductor.reproductorRawMaterialKg100)}
          </p>
        </div>
      ) : null}
      {metric.key === 'MANTO' ? (
        <div className="mt-3 border-t border-slate-200 pt-3 text-[0.6875rem] leading-5 text-slate-500">
          <p>
            Rendimiento técnico Manto: <strong>80%</strong> · PT Manto:{' '}
            {formatCentiKg(summary.tubeMpBalance.ptMantoKg100)} · MP
            estimada: {formatCentiKg(summary.tubeMpBalance.mpMantoEstimatedKg100)}
          </p>
          {summary.tubeMpBalance.mpMantoExcessKg100 > 0 ? (
            <p className="mt-1 font-bold text-rose-700">
              Error: la MP estimada de Manto excede la MP Tubo en{' '}
              {formatCentiKg(summary.tubeMpBalance.mpMantoExcessKg100)}.
            </p>
          ) : null}
        </div>
      ) : null}
      {metric.key === 'NUCA' && summary.nucas.applicable ? (
        <p className="mt-3 border-t border-slate-200 pt-3 text-[0.6875rem] leading-5 text-slate-500">
          La distribución teórica usa {summary.nucas.referencePercent.toFixed(2)}% de MP y
          el factor experimental {(NUCA_BIKINI_TO_EQUIVALENT_FACTOR * 100).toFixed(2)}%.
          Esta referencia no genera saldo físico.
        </p>
      ) : null}
    </article>
  )
}
