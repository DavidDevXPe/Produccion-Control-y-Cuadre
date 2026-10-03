import { AlertTriangle } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import type { ClosureMessage } from '../model/businessRules'
import type { ClosureObservationRecord } from '../model/types'

interface ProductionDayClosureObservationsProps {
  isClosed: boolean
  observations: readonly (ClosureObservationRecord | ClosureMessage)[]
}

export function ProductionDayClosureObservations({
  isClosed,
  observations,
}: ProductionDayClosureObservationsProps) {
  if (observations.length === 0) return null

  return (
    <SectionCard
      title={
        isClosed ? 'Observaciones de cierre' : 'Observaciones detectadas'
      }
      description="Quedan asociadas a la jornada para revisión y auditoría."
      className="border-amber-300/80 ring-1 ring-amber-200/50 dark:border-amber-500/40 dark:ring-amber-500/15"
      action={
        <StatusBadge tone="warning" truncateText={false}>
          {observations.length}{' '}
          {observations.length === 1
            ? 'OBSERVACIÓN'
            : 'OBSERVACIONES'}
        </StatusBadge>
      }
    >
      <ul className="divide-y divide-amber-100 dark:divide-amber-500/10">
        {observations.map((observation) => (
          <li
            key={`${observation.code}-${
              observation.familyKey ?? observation.productId ?? 'GENERAL'
            }`}
            className="flex items-start gap-3 bg-amber-50/50 px-4 py-3 dark:bg-amber-500/5 sm:px-5"
          >
            <span
              className="grid size-7 shrink-0 place-items-center rounded-md bg-amber-500 text-slate-950"
              aria-hidden="true"
            >
              <AlertTriangle className="size-3.5" />
            </span>
            <p className="text-xs leading-5 text-slate-700 dark:text-ui-text-dark-pale">
              {observation.message}
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

