import type { HTMLAttributes, ReactNode } from 'react'

export type MetricCardTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'orange'
  | 'yellow'

export interface MetricCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  label: string
  value: ReactNode
  unit?: string
  description?: ReactNode
  icon?: ReactNode
  tone?: MetricCardTone
  valueClassName?: string
}

const cardToneClasses: Record<MetricCardTone, string> = {
  neutral: 'border-l-slate-300',
  brand: 'border-l-brand-500',
  success: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  danger: 'border-l-rose-500',
  orange: 'border-l-orange-500',
  yellow: 'border-l-yellow-500',
}

const iconToneClasses: Record<MetricCardTone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-rose-50 text-rose-700',
  orange: 'bg-orange-50 text-orange-700',
  yellow: 'bg-yellow-50 text-yellow-800',
}

export function MetricCard({
  label,
  value,
  unit,
  description,
  icon,
  tone = 'neutral',
  valueClassName = '',
  className = '',
  ...props
}: MetricCardProps) {
  return (
    <article
      {...props}
      className={[
        'metric-card min-h-[7.125rem] min-w-0 rounded-xl border border-l-[3px] border-slate-200 bg-white p-[1.125rem] shadow-panel',
        cardToneClasses[tone],
        icon ? 'metric-card--with-icon' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="metric-card__layout">
        <div className="metric-card__content min-w-0">
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
            <div className="mt-2 text-xs leading-5 text-slate-500">
              {description}
            </div>
          ) : null}
        </div>

        {icon ? (
          <span
            className={`metric-card__icon grid size-9 shrink-0 place-items-center rounded-lg ${iconToneClasses[tone]}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
    </article>
  )
}

export default MetricCard
