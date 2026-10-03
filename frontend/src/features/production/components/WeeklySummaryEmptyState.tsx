import type { ReactNode } from 'react'
import { FilePlus2 } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import type { OperationalWeekView } from '../state/ProductionDataContext'

interface WeeklySummaryEmptyStateProps {
  activeWeek: OperationalWeekView
  selector: ReactNode
}

export function WeeklySummaryEmptyState({
  activeWeek,
  selector,
}: WeeklySummaryEmptyStateProps) {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reportes"
        title="Resumen semanal"
        description={`Semana ${activeWeek.number} · ${
          activeWeek.isClosed
            ? 'Cerrada · Solo lectura'
            : activeWeek.isCurrent
              ? 'Actual · Sin registros'
              : 'Abierta · Sin registros'
        }.`}
        actions={
          activeWeek.canCreate ? (
            <ActionLink to="/jornadas/nueva?process=PACKING" size="sm">
              <FilePlus2 className="size-4" aria-hidden="true" />
              Nueva jornada
            </ActionLink>
          ) : null
        }
      />
      {selector}
      <SectionCard
        title="No hay información para consolidar"
        description="El resumen aparecerá a medida que guardes jornadas de esta semana."
        contentClassName="p-6"
      >
        <p className="text-sm leading-6 text-slate-600">
          {activeWeek.isClosed
            ? 'Esta semana permanece disponible como histórico de solo lectura.'
            : activeWeek.isPast
              ? 'Esta semana pasada continúa abierta para completar reportes pendientes.'
              : 'La semana actual está lista para recibir jornadas.'}
        </p>
      </SectionCard>
    </div>
  )
}

