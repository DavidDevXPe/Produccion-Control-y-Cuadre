import { Gauge, Info } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatRatioAsPercent } from '../../../utils/formatters'
import type { NucaWashAuthorization, ProductionDayCalculation } from '../model/types'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'

interface PerformancePanelProps {
  calculation: ProductionDayCalculation
  washAuthorization?: NucaWashAuthorization | null
}

type NucasPerformance = ProductionDayCalculation['nucas']

function NucaReferenceMetrics({
  referenceLabel,
  performance,
}: {
  readonly referenceLabel: string
  readonly performance: NucasPerformance
}) {
  return (
    <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
      <div>
        <dt className="text-slate-600 dark:text-ui-text-dark-soft">
          {referenceLabel}
        </dt>
        <dd className="number-tabular mt-1 font-bold text-slate-900 dark:text-ui-text-dark-strong">
          {formatCentiKg(performance.referenceKg100)}
        </dd>
      </div>
      <div>
        <dt className="text-slate-600 dark:text-ui-text-dark-soft">
          Producción física
        </dt>
        <dd className="number-tabular mt-1 font-bold text-slate-900 dark:text-ui-text-dark-strong">
          {formatCentiKg(performance.actualKg100)}
        </dd>
      </div>
      <div>
        <dt className="text-slate-600 dark:text-ui-text-dark-soft">
          Producción equivalente
        </dt>
        <dd className="number-tabular mt-1 font-bold text-slate-900 dark:text-ui-text-dark-strong">
          {formatCentiKg(performance.equivalentKg100)}
        </dd>
      </div>
    </dl>
  )
}

function NucasCombinedCard({
  performance,
}: {
  readonly performance: NucasPerformance
}) {
  const referenceCompliance = performance.referenceCompliancePercent
  const cappedReferenceCompliance =
    referenceCompliance === null ? null : Math.min(referenceCompliance, 100)
  const exceedsReference =
    referenceCompliance !== null && referenceCompliance > 100
  const excessReferenceKg100 = exceedsReference
    ? Math.max(performance.equivalentKg100 - performance.referenceKg100, 0)
    : 0
  const badgeTone = !performance.applicable
    ? 'neutral'
    : performance.status === 'AT_OR_ABOVE_REFERENCE'
      ? 'success'
      : 'warning'
  const badgeLabel = !performance.applicable
    ? 'NO APLICA'
    : performance.status === 'AT_OR_ABOVE_REFERENCE'
      ? 'CUMPLE'
      : 'BAJO REFERENCIA'

  return (
    <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-3.5 dark:border-brand-500/30 dark:bg-brand-500/10">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-brand-950 dark:text-brand-100">
          Rendimiento de Nucas
        </h3>
        <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
      </div>
      {performance.applicable ? (
        <>
          <NucaReferenceMetrics
            referenceLabel={`MP de referencia (${performance.referencePercent.toFixed(2)}%)`}
            performance={performance}
          />
          <dl className="mt-3 grid grid-cols-1 gap-3 border-t border-brand-100 pt-3 text-xs dark:border-brand-500/20 sm:grid-cols-3">
            <div>
              <dt className="text-brand-800 dark:text-brand-200">
                Rendimiento obtenido:
              </dt>
              <dd className="number-tabular mt-1 font-bold text-brand-950 dark:text-brand-100">
                {cappedReferenceCompliance === null
                  ? '—'
                  : `${cappedReferenceCompliance.toFixed(2)}%`}
              </dd>
              {exceedsReference ? (
                <p className="mt-1 text-[0.6875rem] font-semibold text-emerald-700 dark:text-emerald-300">
                  Supera referencia · +{formatCentiKg(excessReferenceKg100)}
                </p>
              ) : null}
            </div>
            <div>
              <dt className="text-brand-800 dark:text-brand-200">
                Distribución teórica:
              </dt>
              <dd className="number-tabular mt-1 font-bold text-brand-950 dark:text-brand-100">
                {performance.referencePercent.toFixed(2)}%
              </dd>
            </div>
            <div>
              <dt className="text-brand-800 dark:text-brand-200">
                Factor experimental:
              </dt>
              <dd className="number-tabular mt-1 font-bold text-brand-950 dark:text-brand-100">
                {(performance.conversionFactor * 100).toFixed(2)}%
              </dd>
            </div>
          </dl>
          <dl className="mt-3 grid grid-cols-1 gap-3 border-t border-brand-100 pt-3 text-xs dark:border-brand-500/20 sm:grid-cols-2">
            <div>
              <dt className="text-brand-800 dark:text-brand-200">Nuca Bikini</dt>
              <dd className="number-tabular mt-1 font-bold text-brand-950 dark:text-brand-100">
                {formatCentiKg(performance.bikiniKg100)} ·{' '}
                {performance.bikiniWeightPercent?.toFixed(2)}%
              </dd>
            </div>
            <div>
              <dt className="text-brand-800 dark:text-brand-200">
                Nuca semi-limpia
              </dt>
              <dd className="number-tabular mt-1 font-bold text-brand-950 dark:text-brand-100">
                {formatCentiKg(performance.semilimpiaKg100)} ·{' '}
                {performance.semilimpiaWeightPercent?.toFixed(2)}%
              </dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-brand-100 pt-3 text-xs leading-5 text-brand-900 dark:border-brand-500/20 dark:text-brand-100">
            La referencia mínima es {performance.minimumCompliancePercent.toFixed(0)}%.
            La diferencia teórica no genera saldo físico ni bloquea el cuadre.
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs leading-5 text-brand-900 dark:text-brand-100">
          No hay producción positiva de Bikini ni Nuca semilimpia.
        </p>
      )}
    </div>
  )
}

export function PerformancePanel({
  calculation,
}: PerformancePanelProps) {
  const performance = calculation.performance
  const isPerformanceApplicable = performance.status !== 'NOT_APPLICABLE'
  const percentage = performance.ratio === null ? 0 : performance.ratio * 100
  const clampedPercentage = Math.max(0, Math.min(percentage, 100))
  const yieldStatus = getYieldStatus(performance.percent)
  const yieldStyles = yieldVisualStyles[yieldStatus.colorVariant]
  const nucas = calculation.nucas

  return (
    <SectionCard
      title="Aprovechamiento general"
      description="Producto terminado total ÷ materia prima total; no determina el estado del cuadre."
      action={
        <StatusBadge tone={yieldStyles.badgeTone}>
          {yieldStatus.label}
        </StatusBadge>
      }
      className="h-full"
      contentClassName="p-4 sm:p-5"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-ui-text-dark-pale">
            Resultado de la jornada
          </p>
          <p
            className={`number-tabular mt-1 text-3xl font-bold tracking-tight ${yieldStyles.textClass}`}
          >
            {formatRatioAsPercent(performance.ratio)}
          </p>
        </div>
        <span
          className={`grid size-10 place-items-center rounded-xl border ${yieldStyles.panelClass}`}
        >
          <Gauge className="size-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-5">
        <div className="relative h-2.5 overflow-visible rounded-full bg-slate-100 dark:bg-slate-50">
          <div
            className={`h-full rounded-full ${yieldStyles.barClass}`}
            style={{ width: `${clampedPercentage}%` }}
          />
          <span
            className="absolute -top-1 h-4.5 w-0.5 bg-slate-700 dark:bg-white"
            style={{ left: `${performance.referencePercent}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-semibold text-slate-600 dark:text-ui-text-dark-soft">
          <span>0%</span>
          <span>Referencia {performance.referencePercent.toFixed(0)}%</span>
          <span>100%</span>
        </div>
      </div>

      {isPerformanceApplicable ? (
        <div
          className={`mt-4 flex gap-3 rounded-xl border p-3.5 text-sm leading-5 ${yieldStyles.panelClass}`}
        >
          <Info className="mt-0.5 size-4 shrink-0 opacity-90" aria-hidden="true" />
          <p className={`font-semibold ${yieldStyles.textClass}`}>
            {yieldStatus.interpretation}
          </p>
        </div>
      ) : null}

      <NucasCombinedCard performance={nucas} />

      <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-ui-text-dark-soft">
        Las referencias de Nuca son informativas y no intervienen en el cuadre
        matemático.
      </p>
    </SectionCard>
  )
}
