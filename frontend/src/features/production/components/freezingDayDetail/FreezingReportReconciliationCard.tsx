import { SectionCard } from '../../../../components/ui/SectionCard'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../../utils/formatters'
import type { Kg100 } from '../../model/types'

export interface FreezingReportReconciliationCardProps {
  readonly isBalanced: boolean
  readonly reconciliationObserved: boolean
  readonly dayReportedKg100: Kg100
  readonly nightReportedKg100: Kg100
  readonly linkedKg100: Kg100
  readonly pendingPreviousBalanceKg100: Kg100
}

export function FreezingReportReconciliationCard({
  isBalanced,
  reconciliationObserved,
  dayReportedKg100,
  nightReportedKg100,
  linkedKg100,
  pendingPreviousBalanceKg100,
}: FreezingReportReconciliationCardProps) {
  return (
    <SectionCard
      title="Cuadre de reportes"
      description="Cada turno debe coincidir con su detalle y todo producto congelado debe tener disponibilidad trazable."
      action={
        <StatusBadge
          tone={
            isBalanced
              ? 'success'
              : reconciliationObserved
                ? 'warning'
                : 'danger'
          }
          truncateText={false}
        >
          {isBalanced
            ? 'CUADRADO'
            : reconciliationObserved
              ? 'CUADRADO · OBSERVADO'
              : 'REVISAR'}
        </StatusBadge>
      }
      contentClassName="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4"
    >
      {(
        [
          ['Detalle Día', dayReportedKg100],
          ['Detalle Noche', nightReportedKg100],
          ['Congelado atribuible', linkedKg100],
          ['Pendiente en orígenes vinculados', pendingPreviousBalanceKg100],
        ] as const
      ).map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:bg-slate-50/5"
        >
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            {label}
          </p>
          <p className="number-tabular mt-1 whitespace-nowrap text-base font-extrabold text-slate-950">
            {formatCentiKg(value)}
          </p>
        </div>
      ))}
    </SectionCard>
  )
}
