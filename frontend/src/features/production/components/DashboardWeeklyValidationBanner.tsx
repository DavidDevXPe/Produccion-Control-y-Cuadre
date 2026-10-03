import { ArrowRight, CalendarDays } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { formatCentiKg } from '../../../utils/formatters'
import type { calculateWeeklySummary } from '../model/calculations'

export interface DashboardWeeklyValidationBannerProps {
  weekSummary: ReturnType<typeof calculateWeeklySummary> | null
  isWeekValid: boolean
}

export function DashboardWeeklyValidationBanner({
  weekSummary,
  isWeekValid,
}: DashboardWeeklyValidationBannerProps) {
  if (!weekSummary) return null

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-panel sm:flex-row sm:items-center sm:justify-between"
      aria-label="Validación semanal"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-lg ${
            isWeekValid
              ? 'bg-emerald-600 text-white'
              : weekSummary.status === 'VALID'
                ? 'bg-sky-600 text-white'
                : 'bg-amber-500 text-slate-950'
          }`}
          aria-hidden="true"
        >
          <CalendarDays className="size-4" />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900">
            Validación semanal de Envasado
          </p>
          <p className="mt-0.5 text-[0.6875rem] text-slate-500">
            Diferencia acumulada:{' '}
            <strong className="number-tabular text-slate-800">
              {formatCentiKg(weekSummary.differenceKg100)}
            </strong>
          </p>
        </div>
      </div>

      <ActionLink to="/resumen" variant="ghost" size="sm">
        Revisar resumen
        <ArrowRight className="size-4" aria-hidden="true" />
      </ActionLink>
    </section>
  )
}

