import type { ReactNode } from 'react'
import {
  CalendarDays,
  FilePlus2,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import type { OperationalWeekView } from '../state/ProductionDataContext'

export interface DashboardEmptyStateProps {
  packingWeekNumber: number
  activeWeekState: OperationalWeekView
  newJourneyAction?: ReactNode
}

export function DashboardEmptyState({
  packingWeekNumber,
  activeWeekState,
  newJourneyAction,
}: DashboardEmptyStateProps) {
  return (
    <div className="space-y-4">
      <div className="dashboard-eyebrow pl-4">
        <PageHeader
          eyebrow="Dashboard operativo"
          title="En resumen"
          description={
            activeWeekState.isClosed
              ? `Semana ${packingWeekNumber} · Cerrada · Solo lectura`
              : activeWeekState.isCurrent
                ? `Semana ${packingWeekNumber} · Actual · Sin jornadas registradas`
                : `Semana ${packingWeekNumber} · Abierta · Reportes pendientes`
          }
          actions={newJourneyAction}
        />
      </div>

      <SectionCard contentClassName="p-0">
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
                Semana {packingWeekNumber}
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                Sin actividad registrada
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
                {activeWeekState.canCreate
                  ? 'Esta semana está lista para recibir jornadas de Envasado y Congelamiento. Registra la primera para activar el seguimiento operativo.'
                  : 'Esta semana permanece disponible como histórico de solo lectura. Puedes consultar otras semanas desde el menú.'}
              </p>
            </div>
          </div>

          {activeWeekState.canCreate ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 dark:bg-slate-50/5">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-md bg-sky-600 text-[0.6875rem] font-bold text-white">
                    1
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    Registro manual
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-slate-600">
                  Captura la jornada de Envasado o Congelamiento desde el formulario.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 dark:bg-slate-50/5">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-md bg-slate-600 text-[0.6875rem] font-bold text-white">
                    2
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    Importar Excel
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-slate-600">
                  En la captura de Envasado puedes cargar el reporte estructurado y revisarlo antes de guardar.
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              {activeWeekState.canCreate
                ? 'Al registrar la primera jornada se habilitan indicadores, saldos y comparativos de la semana.'
                : 'Usa el selector de semana del encabezado para cambiar de periodo.'}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {activeWeekState.canCreate ? (
                <>
                  <ActionLink
                    to="/jornadas/nueva?process=PACKING"
                    variant="primary"
                  >
                    <FilePlus2 className="size-4" aria-hidden="true" />
                    Registrar primera jornada
                  </ActionLink>
                  <ActionLink to="/jornadas" variant="ghost" size="sm">
                    <FileSpreadsheet className="size-4" aria-hidden="true" />
                    Ir a Jornadas
                  </ActionLink>
                </>
              ) : (
                <ActionLink to="/jornadas" variant="ghost" size="sm">
                  Ver jornadas
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ActionLink>
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

