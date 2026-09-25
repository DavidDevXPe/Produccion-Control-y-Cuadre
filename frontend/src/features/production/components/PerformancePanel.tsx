import { Droplets, Gauge, Info } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatRatioAsPercent } from '../../../utils/formatters'
import type {
  NucaWashAuthorization,
  ProductionDayCalculation,
} from '../model/types'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'

interface PerformancePanelProps {
  calculation: ProductionDayCalculation
  washAuthorization?: NucaWashAuthorization | null
}

export function PerformancePanel({
  calculation,
  washAuthorization,
}: PerformancePanelProps) {
  const performance = calculation.performance
  const isPerformanceApplicable = performance.status !== 'NOT_APPLICABLE'
  const percentage = performance.ratio === null ? 0 : performance.ratio * 100
  const clampedPercentage = Math.max(0, Math.min(percentage, 100))
  const yieldStatus = getYieldStatus(performance.percent)
  const yieldStyles = yieldVisualStyles[yieldStatus.colorVariant]
  const nucaSemilimpia = calculation.nucaSemilimpia
  const nucaBikini = calculation.nucaBikini

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
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
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
        <div className="relative h-2.5 overflow-visible rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full ${yieldStyles.barClass}`}
            style={{ width: `${clampedPercentage}%` }}
          />
          <span
            className="absolute -top-1 h-4.5 w-0.5 bg-slate-700 dark:bg-slate-200"
            style={{ left: `${performance.referencePercent}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
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

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-600 dark:bg-slate-800/40">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Nuca semilimpia
          </h3>
          <StatusBadge
            tone={
              !nucaSemilimpia.applicable
                ? 'neutral'
                : nucaSemilimpia.status === 'AT_OR_ABOVE_REFERENCE'
                  ? 'success'
                  : 'warning'
            }
          >
            {!nucaSemilimpia.applicable
              ? 'NO APLICA'
              : nucaSemilimpia.status === 'AT_OR_ABOVE_REFERENCE'
                ? 'EN REFERENCIA'
                : 'BAJO REFERENCIA'}
          </StatusBadge>
        </div>
        {nucaSemilimpia.applicable ? (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-600 dark:text-slate-300">
                Referencia 15%
              </dt>
              <dd className="number-tabular mt-1 font-bold text-slate-900 dark:text-slate-100">
                {formatCentiKg(nucaSemilimpia.referenceKg100)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-300">
                Producción real
              </dt>
              <dd className="number-tabular mt-1 font-bold text-slate-900 dark:text-slate-100">
                {formatCentiKg(nucaSemilimpia.actualKg100)}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3.5 dark:border-brand-500/30 dark:bg-brand-500/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Droplets
              className="size-4 text-brand-700 dark:text-brand-300"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-brand-950 dark:text-brand-100">
              Nuca Bikini
            </h3>
          </div>
          <StatusBadge tone={nucaBikini.applicable ? 'info' : 'neutral'}>
            {nucaBikini.applicable ? 'LAVADO ACTIVO' : 'NO APLICA'}
          </StatusBadge>
        </div>
        {nucaBikini.applicable ? (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-600 dark:text-slate-300">
                  Referencia 7%
                </dt>
                <dd className="number-tabular mt-1 font-bold text-slate-900 dark:text-slate-100">
                  {formatCentiKg(nucaBikini.referenceKg100)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-600 dark:text-slate-300">
                  Producción real
                </dt>
                <dd className="number-tabular mt-1 font-bold text-slate-900 dark:text-slate-100">
                  {formatCentiKg(nucaBikini.actualKg100)}
                </dd>
              </div>
            </dl>
            {washAuthorization ? (
              <p className="mt-3 border-t border-brand-100 pt-3 text-xs leading-5 font-medium text-brand-900 dark:border-brand-500/20 dark:text-brand-100">
                {washAuthorization.kind === 'CUSTOMER_ORDER'
                  ? `Pedido: ${washAuthorization.reference}`
                  : 'Pedido confirmado; número no consignado en el Excel.'}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
        Las referencias de Nuca son informativas y no intervienen en el cuadre
        matemático.
      </p>
    </SectionCard>
  )
}