import type { HTMLAttributes, ReactNode } from 'react'

export type MetricCardTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'orange'
  | 'yellow'
  | 'violet'

export interface MetricCardProgress {
  /** 0–100. Values outside the range are clamped for the bar only. */
  readonly percent: number
  /** Accessible name of the progress bar. */
  readonly label: string
  /** Visible value next to the bar; defaults to the rounded percent. */
  readonly valueText?: string
}

export interface MetricCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  label: string
  value: ReactNode
  unit?: string
  description?: ReactNode
  icon?: ReactNode
  tone?: MetricCardTone
  valueClassName?: string
  /**
   * `default` keeps the compact card used across the app. `kpi` is the
   * dashboard card: solid icon tile, tinted border and optional progress.
   */
  variant?: 'default' | 'kpi'
  progress?: MetricCardProgress
}

const cardToneClasses: Record<MetricCardTone, string> = {
  neutral: 'border-l-slate-300',
  brand: 'border-l-brand-500',
  success: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  danger: 'border-l-rose-500',
  orange: 'border-l-orange-500',
  yellow: 'border-l-yellow-500',
  violet: 'border-l-violet-500',
}

const iconToneClasses: Record<MetricCardTone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-rose-50 text-rose-700',
  orange: 'bg-orange-50 text-orange-700',
  yellow: 'bg-yellow-50 text-yellow-800',
  violet: 'bg-violet-50 text-violet-700',
}

/** KPI variant: tinted frame, solid icon tile and bar color per tone. */
const kpiToneClasses: Record<
  MetricCardTone,
  { card: string; icon: string; bar: string; value: string }
> = {
  neutral: {
    card: 'kpi-card--neutral',
    icon: 'bg-slate-500 text-white',
    bar: 'bg-slate-400',
    value: 'text-slate-700',
  },
  brand: {
    card: 'kpi-card--brand',
    icon: 'bg-sky-600 text-white',
    bar: 'bg-sky-500',
    value: 'text-sky-700 dark:text-sky-300',
  },
  success: {
    card: 'kpi-card--success',
    icon: 'bg-emerald-600 text-white',
    bar: 'bg-emerald-500',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    card: 'kpi-card--warning',
    icon: 'bg-amber-500 text-slate-950',
    bar: 'bg-amber-500',
    value: 'text-amber-800 dark:text-amber-300',
  },
  danger: {
    card: 'kpi-card--danger',
    icon: 'bg-rose-600 text-white',
    bar: 'bg-rose-500',
    value: 'text-rose-700 dark:text-rose-300',
  },
  orange: {
    card: 'kpi-card--warning',
    icon: 'bg-orange-500 text-white',
    bar: 'bg-orange-500',
    value: 'text-orange-800 dark:text-orange-300',
  },
  yellow: {
    card: 'kpi-card--warning',
    icon: 'bg-yellow-500 text-slate-950',
    bar: 'bg-yellow-500',
    value: 'text-yellow-800 dark:text-yellow-300',
  },
  violet: {
    card: 'kpi-card--violet',
    icon: 'bg-violet-600 text-white',
    bar: 'bg-violet-500',
    value: 'text-violet-700 dark:text-violet-300',
  },
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function MetricCard({
  label,
  value,
  unit,
  description,
  icon,
  tone = 'neutral',
  valueClassName = '',
  variant = 'default',
  progress,
  className = '',
  ...props
}: MetricCardProps) {
  const isKpi = variant === 'kpi'
  const kpiTone = kpiToneClasses[tone]

  return (
    <article
      {...props}
      className={[
        'metric-card flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-[1.125rem] shadow-panel',
        isKpi ? `kpi-card ${kpiTone.card}` : `border-l-[3px] ${cardToneClasses[tone]}`,
        icon ? 'metric-card--with-icon' : '',
        isKpi ? 'metric-card--kpi' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="metric-card__layout">
        <div className="metric-card__content flex min-w-0 flex-1 flex-col">
          <h2 className="metric-card__label text-xs font-semibold leading-5 text-slate-600">
            {label}
          </h2>
          <p className={`metric-card__value mt-1.5 flex min-w-0 flex-nowrap items-baseline gap-x-1.5 whitespace-nowrap font-bold leading-none tracking-tight ${valueClassName || 'text-slate-950'}`}>
            <span className="number-tabular whitespace-nowrap">{value}</span>
            {unit ? (
              <span className="whitespace-nowrap text-sm font-bold tracking-normal text-slate-500">
                {unit}
              </span>
            ) : null}
          </p>

          {description ? (
            <div className="mt-auto pt-2 text-xs leading-5 text-slate-500">
              {description}
            </div>
          ) : null}
        </div>

        {icon ? (
          <span
            className={`metric-card__icon grid size-9 shrink-0 place-items-center rounded-lg ${
              isKpi ? kpiTone.icon : iconToneClasses[tone]
            }`}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>

      {progress ? (
        <div className="mt-3 flex items-center gap-3">
          <div
            role="progressbar"
            aria-label={progress.label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(clampPercent(progress.percent) * 10) / 10}
            aria-valuetext={progress.valueText ?? `${progress.percent.toFixed(1)}%`}
            className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className={`h-full rounded-full ${kpiTone.bar}`}
              style={{ width: `${clampPercent(progress.percent)}%` }}
            />
          </div>
          <span className={`number-tabular shrink-0 text-xs font-bold ${kpiTone.value}`}>
            {progress.valueText ?? `${progress.percent.toFixed(1)}%`}
          </span>
        </div>
      ) : null}
    </article>
  )
}

export default MetricCard
