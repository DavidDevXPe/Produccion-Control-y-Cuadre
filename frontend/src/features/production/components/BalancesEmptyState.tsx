import { CheckCircle2 } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'

export interface BalancesEmptyStateProps {
  isFreezing: boolean
  isWeekClosed: boolean
}

export function BalancesEmptyState({
  isFreezing,
  isWeekClosed,
}: BalancesEmptyStateProps) {
  return (
    <SectionCard contentClassName="p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-base font-bold text-slate-950">
          {isFreezing
            ? 'Sin producto pendiente de congelar en esta semana'
            : 'Sin saldos pendientes en esta semana'}
        </h2>
        <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
          {isFreezing
            ? 'No hay posiciones abiertas con origen en la semana seleccionada. Cambia de semana o revisa jornadas de Envasado anteriores si buscas saldo histórico.'
            : isWeekClosed
              ? 'El saldo del sábado fue envasado completamente el domingo y los demás saldos cuentan con un consumo posterior registrado.'
              : 'No existen posiciones abiertas con origen en esta semana.'}
        </p>
      </div>
    </SectionCard>
  )
}
