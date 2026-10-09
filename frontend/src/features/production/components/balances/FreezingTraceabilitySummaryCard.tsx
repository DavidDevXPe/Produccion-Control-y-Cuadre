import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../../utils/formatters'
import type { FreezingTraceabilitySummary } from './balanceTypes'

export interface FreezingTraceabilitySummaryCardProps {
  readonly summary: FreezingTraceabilitySummary
  readonly prevProcessName?: string
  readonly currentProcessName?: string
}

export function FreezingTraceabilitySummaryCard({
  summary,
  prevProcessName = 'Envasado',
  currentProcessName = 'Congelamiento',
}: FreezingTraceabilitySummaryCardProps) {
  if (summary.totalProducts <= 0) {
    return null
  }

  const coveragePercent =
    summary.reportedKg100 > 0
      ? Math.min(100, (summary.tracedKg100 / summary.reportedKg100) * 100)
      : null

  const overview =
    summary.totalProducts === 0
      ? {
          tone: 'neutral' as const,
          label: 'SIN MOVIMIENTOS',
        }
      : summary.problemProducts > 0 || summary.excessLinkedKg100 > 0
        ? {
            tone: 'danger' as const,
            label: 'REVISAR TRAZABILIDAD',
          }
        : summary.pendingProducts > 0
          ? {
              tone: 'warning' as const,
              label: 'VINCULACIÓN PENDIENTE',
            }
          : {
              tone: 'success' as const,
              label: 'TRAZABILIDAD COMPLETA',
            }

  const progressClass =
    overview.tone === 'danger'
      ? 'bg-rose-500'
      : overview.tone === 'warning'
        ? 'bg-amber-500'
        : overview.tone === 'success'
          ? 'bg-emerald-500'
          : 'bg-slate-400'

  return (
    <div
      role="region"
      aria-label={`Resumen de trazabilidad de ${currentProcessName}`}
      className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-ui-line-dark-grid"
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-700 dark:text-ui-text-dark-soft">
              Resumen de trazabilidad
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ui-text-soft">
              Estado de los productos reportados en {currentProcessName} frente a su origen trazable de {prevProcessName}.
            </p>
          </div>
          <StatusBadge tone={overview.tone}>{overview.label}</StatusBadge>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark">
            <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
              Productos reportados
            </dt>
            <dd className="mt-1 text-lg font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
              {summary.totalProducts}
            </dd>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/[0.05]">
            <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-300">
              Trazables
            </dt>
            <dd className="mt-1 text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
              {summary.traceableProducts}
            </dd>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-3 dark:border-amber-500/20 dark:bg-amber-500/[0.05]">
            <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-amber-700 dark:text-amber-300">
              Pendientes
            </dt>
            <dd className="mt-1 text-lg font-extrabold text-amber-700 dark:text-amber-300">
              {summary.pendingProducts}
            </dd>
          </div>

          <div className="rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-3 dark:border-rose-500/20 dark:bg-rose-500/[0.05]">
            <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-rose-700 dark:text-rose-300">
              Con problema
            </dt>
            <dd className="mt-1 text-lg font-extrabold text-rose-700 dark:text-rose-300">
              {summary.problemProducts}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-ui-text-dark-pale">
                Cobertura vinculada
              </p>
              <p className="mt-0.5 text-[0.6875rem] text-slate-500 dark:text-ui-text-soft">
                Kg reportados que ya cuentan con origen de {prevProcessName} identificado.
              </p>
            </div>
            <span className="number-tabular shrink-0 text-lg font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
              {coveragePercent === null ? '—' : `${coveragePercent.toFixed(2)}%`}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-ui-line-dark-grid">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${progressClass}`}
              style={{
                width: `${coveragePercent ?? 0}%`,
              }}
            />
          </div>

          <div className="mt-3 flex flex-col gap-1 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-ui-text-dark-soft">
            <p>
              <strong className="number-tabular text-slate-900 dark:text-ui-text-dark-strong">
                {formatCentiKg(summary.tracedKg100)}
              </strong>{' '}
              de{' '}
              <strong className="number-tabular text-slate-900 dark:text-ui-text-dark-strong">
                {formatCentiKg(summary.reportedKg100)}
              </strong>{' '}
              con origen vinculado.
            </p>
            {summary.pendingKg100 > 0 ? (
              <p className="number-tabular font-bold text-amber-700 dark:text-amber-300">
                Faltan {formatCentiKg(summary.pendingKg100)}
              </p>
            ) : (
              <p className="font-bold text-emerald-700 dark:text-emerald-300">
                Sin kilos pendientes.
              </p>
            )}
          </div>

          {summary.excessLinkedKg100 > 0 ? (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
              Existen {formatCentiKg(summary.excessLinkedKg100)} vinculados por encima de los kilos reportados. Revisa la distribución Día/Noche.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
