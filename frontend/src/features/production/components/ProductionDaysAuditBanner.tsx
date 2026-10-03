import { FileSpreadsheet, ShieldCheck } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'

export interface ProductionDaysAuditBannerProps {
  isWeekFullySquared: boolean
  balancedCount: number
  registeredDaysCount: number
}

export function ProductionDaysAuditBanner({
  isWeekFullySquared,
  balancedCount,
  registeredDaysCount,
}: ProductionDaysAuditBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4.5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-900">
                Balance y Auditoría de Semana
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-bold ${
                  isWeekFullySquared
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : balancedCount > 0
                      ? 'border-sky-200 bg-sky-50 text-sky-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {isWeekFullySquared
                  ? '100% Cuadrado'
                  : `${balancedCount} de ${registeredDaysCount} Cuadradas`}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500 max-w-2xl">
              {isWeekFullySquared
                ? 'Todas las jornadas cerradas coinciden con el pesaje de báscula de muelle y reporte de supervisores de turno.'
                : 'Conciliación operativa en tiempo real de turnos, pesajes de balanza y verificación de cierres de lote.'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center sm:self-center">
          <ActionLink to="/resumen" variant="secondary" size="sm">
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Descargar informe de cuadre
          </ActionLink>
        </div>
      </div>
    </div>
  )
}
