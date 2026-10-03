import { AlertTriangle } from 'lucide-react'
import { SectionCard } from '../../../../components/ui/SectionCard'
import { StatusBadge } from '../../../../components/ui/StatusBadge'

export interface FreezingClosureWarningsCardProps {
  readonly isClosed: boolean
  readonly warnings: readonly {
    readonly code: string
    readonly message: string
    readonly familyKey?: string
    readonly productId?: string
  }[]
}

export function FreezingClosureWarningsCard({
  isClosed,
  warnings,
}: FreezingClosureWarningsCardProps) {
  if (warnings.length === 0) return null

  return (
    <SectionCard
      title={
        isClosed ? 'Observaciones de cierre' : 'Observaciones detectadas'
      }
      description="No modifican el reporte físico; quedan para revisión y auditoría."
      className="border-amber-300/80 ring-1 ring-amber-200/50 dark:border-amber-500/40 dark:ring-amber-500/15"
      action={
        <StatusBadge tone="warning" truncateText={false}>
          {warnings.length}{' '}
          {warnings.length === 1 ? 'OBSERVACIÓN' : 'OBSERVACIONES'}
        </StatusBadge>
      }
    >
      <ul className="divide-y divide-amber-100 dark:divide-amber-500/10">
        {warnings.map((warning) => (
          <li
            key={`${warning.code}-${
              warning.familyKey ?? warning.productId ?? 'GENERAL'
            }`}
            className="flex items-start gap-3 bg-amber-50/50 px-4 py-3 dark:bg-amber-500/5 sm:px-5"
          >
            <span
              className="grid size-7 shrink-0 place-items-center rounded-md bg-amber-500 text-slate-950"
              aria-hidden="true"
            >
              <AlertTriangle className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-amber-800 dark:text-amber-300">
                {warning.code === 'FREEZING_TRACEABILITY_DIFFERENCE'
                  ? 'Diferencia de trazabilidad'
                  : warning.code === 'FREEZING_PRODUCT_TRACEABILITY_DIFFERENCE'
                    ? 'Producto con origen insuficiente'
                    : 'Observación'}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-700 dark:text-ui-text-dark-pale">
                {warning.message}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
