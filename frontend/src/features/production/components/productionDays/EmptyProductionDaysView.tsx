import { CalendarDays, FilePlus2, FileSpreadsheet } from 'lucide-react'
import { ActionLink } from '../../../../components/ui/ActionLink'
import { productionProcessLabels } from '../../model/productionProcess'
import type { ProductionProcess } from '../../model/types'

export interface EmptyProductionDaysViewProps {
  readonly activeWeekNumber: number
  readonly selectedProcess: ProductionProcess
  readonly activeWeekCanCreate: boolean
  readonly isFreezing: boolean
}

export function EmptyProductionDaysView({
  activeWeekNumber,
  selectedProcess,
  activeWeekCanCreate,
  isFreezing,
}: EmptyProductionDaysViewProps) {
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky-600 text-white shadow-sm"
          aria-hidden="true"
        >
          <CalendarDays className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-brand-700">
            Semana {activeWeekNumber}
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
            Sin jornadas de {productionProcessLabels[selectedProcess]}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
            {activeWeekCanCreate
              ? isFreezing
                ? 'Registra la primera jornada de Congelamiento o revisa la disponibilidad de Envasado en Saldos.'
                : 'Registra la primera jornada manualmente o importa un Excel estructurado para comenzar el cuadre.'
              : 'Esta semana cerrada permanece disponible únicamente para consulta.'}
          </p>
        </div>
      </div>

      {activeWeekCanCreate ? (
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            {isFreezing
              ? 'Congelamiento consume disponibilidad generada por Envasado.'
              : 'También puedes importar el reporte Excel desde la captura de Envasado.'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <ActionLink to={`/jornadas/nueva?process=${selectedProcess}`}>
              <FilePlus2 className="size-4" aria-hidden="true" />
              Registrar jornada
            </ActionLink>
            {!isFreezing ? (
              <ActionLink
                to={`/jornadas/nueva?process=${selectedProcess}`}
                variant="ghost"
                size="sm"
              >
                <FileSpreadsheet className="size-4" aria-hidden="true" />
                Importar Excel
              </ActionLink>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
