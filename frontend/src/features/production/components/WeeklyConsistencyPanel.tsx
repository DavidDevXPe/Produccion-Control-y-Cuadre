import { CheckCircle2 } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { WeeklySummary } from '../model/types'

interface WeeklyConsistencyPanelProps {
  summary: WeeklySummary
}

export function WeeklyConsistencyPanel({ summary }: WeeklyConsistencyPanelProps) {
  const isValid = summary.status === 'VALID'

  return (
    <SectionCard
      title="Validación de consistencia"
      description="El total diario y el detalle por producto se calculan de forma independiente."
      action={
        <StatusBadge tone={isValid ? 'success' : 'danger'}>
          {isValid ? 'INFORMACIÓN CONSISTENTE' : 'REVISAR INFORMACIÓN'}
        </StatusBadge>
      }
      contentClassName="p-4 sm:p-5"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        <div className="flex min-h-[4.75rem] flex-col items-center justify-center rounded-lg bg-slate-50 p-3 text-center ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            PT por jornadas
          </p>
          <p className="number-tabular mt-1.5 whitespace-nowrap text-lg font-bold text-slate-950">
            {formatCentiKg(summary.declaredFinishedKg100)}
          </p>
        </div>
        <span className="text-center text-xl font-light text-slate-400" aria-hidden="true">
          =
        </span>
        <div className="flex min-h-[4.75rem] flex-col items-center justify-center rounded-lg bg-slate-50 p-3 text-center ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            PT por productos
          </p>
          <p className="number-tabular mt-1.5 whitespace-nowrap text-lg font-bold text-slate-950">
            {formatCentiKg(summary.detailFinishedKg100)}
          </p>
        </div>
        <span className="text-center text-xl font-light text-slate-400" aria-hidden="true">
          →
        </span>
        <div
          className={`flex min-h-[4.75rem] flex-col items-center justify-center rounded-lg p-3 text-center ring-1 ${
            isValid ? 'bg-emerald-50 ring-emerald-200' : 'bg-rose-50 ring-rose-200'
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wide ${
              isValid ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            Diferencia
          </p>
          <p
            className={`number-tabular mt-1.5 whitespace-nowrap text-lg font-bold ${
              isValid ? 'text-emerald-900' : 'text-rose-900'
            }`}
          >
            {formatCentiKg(summary.differenceKg100)}
          </p>
        </div>
      </div>

      <div
        className={`mt-3 flex items-start gap-2 border-t border-slate-200 pt-3 text-xs leading-5 ${
          isValid ? 'text-slate-500' : 'text-rose-800'
        }`}
      >
        <CheckCircle2
          className={`mt-0.5 size-4 shrink-0 ${
            isValid ? 'text-emerald-700' : 'text-rose-700'
          }`}
          aria-hidden="true"
        />
        <p>
          {isValid
            ? `Se consolidaron ${summary.productTotals.length} líneas de producto en ${summary.days.length} jornadas registradas. La validación no depende de posiciones de fila y conserva el control independiente del detalle.`
            : 'Los dos caminos de validación o la integridad de una jornada requieren revisión.'}
        </p>
      </div>

      {summary.integrityIssues.length > 0 ? (
        <div className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-950 ring-1 ring-rose-200">
          <p className="font-bold">
            Validaciones pendientes ({summary.integrityIssues.length})
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-5">
            {summary.integrityIssues.map((issue) => (
              <li
                key={JSON.stringify([
                  issue.scope,
                  issue.code,
                  issue.dayId ?? null,
                  issue.productId ?? null,
                  issue.balanceLotId ?? null,
                  issue.shift ?? null,
                  issue.message,
                ])}
              >
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </SectionCard>
  )
}
