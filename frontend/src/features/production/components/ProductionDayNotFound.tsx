import { ArrowLeft, CalendarDays } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { SectionCard } from '../../../components/ui/SectionCard'

export function ProductionDayNotFound() {
  return (
    <div className="mx-auto max-w-lg">
      <SectionCard contentClassName="p-0">
        <div className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:px-8">
          <span
            className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-500"
            aria-hidden="true"
          >
            <CalendarDays className="size-6" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-950">
              Jornada no encontrada
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              No hay información registrada para la fecha solicitada. Vuelve al
              listado o crea una jornada nueva.
            </p>
          </div>
          <ActionLink to="/jornadas">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a jornadas
          </ActionLink>
        </div>
      </SectionCard>
    </div>
  )
}

