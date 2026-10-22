import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileUp,
  Package,
} from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { SectionCard } from '../../../components/ui/SectionCard'

export interface DashboardQuickActionsCardProps {
  canCreateJourney: boolean
  weekDistinctProductCount: number
  weeklyYieldPercent: number | null
}

export function DashboardQuickActionsCard({
  canCreateJourney,
  weekDistinctProductCount,
  weeklyYieldPercent,
}: DashboardQuickActionsCardProps) {
  return (
    <SectionCard
      title="Acciones rápidas de planta"
      description="Accesos directos de captura, catálogo y respaldo."
      className="flex flex-col xl:grow xl:shrink-0"
      contentClassName="flex flex-1 flex-col justify-between"
    >
      <div className="p-4 pb-3">
        <div className="flex flex-col gap-3 rounded-lg border border-sky-300 bg-sky-50 p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-sky-500/50 dark:bg-sky-500/10">
          <div className="flex items-start gap-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-600 text-white"
              aria-hidden="true"
            >
              <FileUp className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.04em] text-slate-900">
                Carga rápida de reporte
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">
                Importa el archivo Excel del turno o registra una jornada manual.
              </p>
            </div>
          </div>

          <ActionLink
            to={
              canCreateJourney
                ? '/jornadas/nueva?process=PACKING'
                : '/jornadas?process=PACKING'
            }
            variant="secondary"
            size="sm"
            className="shrink-0 self-start sm:self-center"
          >
            {canCreateJourney ? 'Cargar reporte' : 'Ver jornadas'}
            <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </div>
      </div>

      <ul className="divide-y divide-slate-100 border-t border-slate-100">
        <li className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700"
              aria-hidden="true"
            >
              <Package className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">
                Catálogo de productos
              </p>
              <p className="text-[0.6875rem] text-slate-500">
                Lotes verificados en la semana activa
              </p>
            </div>
          </div>
          <ActionLink to="/catalogos" variant="ghost" size="sm">
            {`${weekDistinctProductCount} productos`}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </ActionLink>
        </li>

        <li className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              aria-hidden="true"
            >
              <CheckCircle2 className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">
                Rendimiento promedio
              </p>
              <p className="text-[0.6875rem] text-slate-500">
                Umbral base de referencia: 80,00%
              </p>
            </div>
          </div>
          <span className="number-tabular shrink-0 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
            {weeklyYieldPercent !== null
              ? `${weeklyYieldPercent.toFixed(2)}%`
              : 'Sin datos'}
          </span>
        </li>

        <li className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Database className="size-3.5 text-slate-500" aria-hidden="true" />
            Almacenamiento local persistido
          </span>
          <ActionLink to="/datos" variant="ghost" size="sm">
            Respaldo y datos
            <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </li>
      </ul>
    </SectionCard>
  )
}
