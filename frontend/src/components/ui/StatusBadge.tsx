import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'

export type StatusBadgeTone =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'orange'
  | 'yellow'

export interface StatusBadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  children: ReactNode
  tone?: StatusBadgeTone
  showIcon?: boolean
  truncateText?: boolean
}

const toneClasses: Record<StatusBadgeTone, string> = {
  success:
    'bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25',
  danger:
    'bg-rose-50 text-rose-800 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/25',
  warning:
    'bg-amber-50 text-amber-900 ring-amber-600/25 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25',
  info: 'bg-brand-50 text-brand-800 ring-brand-600/20 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/25',
  neutral:
    'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/15 dark:text-slate-700 dark:ring-slate-400/25',
  orange:
    'bg-orange-50 text-orange-900 ring-orange-600/25 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/25',
  yellow:
    'bg-yellow-50 text-yellow-900 ring-yellow-600/25 dark:bg-yellow-500/15 dark:text-yellow-700 dark:ring-yellow-400/25',
}

const toneIcons: Record<StatusBadgeTone, LucideIcon> = {
  success: CheckCircle2,
  danger: XCircle,
  warning: AlertTriangle,
  info: Info,
  neutral: Circle,
  orange: AlertTriangle,
  yellow: Info,
}

export function StatusBadge({
  children,
  tone = 'neutral',
  showIcon = true,
  truncateText = true,
  className = '',
  ...props
}: StatusBadgeProps) {
  const Icon = toneIcons[tone]

  return (
    <span
      {...props}
      className={[
        'inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-bold leading-none tracking-[0.025em] ring-1 ring-inset',
        truncateText ? 'max-w-full' : 'max-w-none',
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showIcon ? (
        <Icon
          className="size-3.5 shrink-0"
          aria-hidden="true"
        />
      ) : null}

      <span className={truncateText ? 'truncate' : ''}>{children}</span>
    </span>
  )
}

export default StatusBadge
