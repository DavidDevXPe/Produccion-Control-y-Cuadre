import { formatCentiKg } from '../../../../utils/formatters'
import type { ProductionBusinessSummary } from '../../model/businessRules'
import { formatPercent } from './familyYieldTypes'

export interface GroupUtilizationFooterProps {
  readonly summary: ProductionBusinessSummary
}

export function GroupUtilizationFooter({
  summary,
}: GroupUtilizationFooterProps) {
  return (
    <>
      <div className="border-t border-slate-200 bg-slate-50/55 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-950">
              Aprovechamiento MP por grupo
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Producto terminado del grupo ÷ materia prima total.
            </p>
          </div>
          <p className="number-tabular text-sm font-bold text-brand-800">
            General: {formatPercent(summary.overallUtilization.percent)}
          </p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {summary.groupUtilizations.map((group) => (
            <div
              key={group.groupId}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">
                  {group.label}
                </p>
                <p className="number-tabular mt-0.5 text-[0.6875rem] text-slate-500">
                  {formatCentiKg(group.finishedKg100)}
                </p>
              </div>
              <p className="number-tabular whitespace-nowrap text-xs font-extrabold text-brand-800">
                {formatPercent(group.percent)}
              </p>
            </div>
          ))}
        </div>
      </div>
      <p className="border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs leading-5 text-slate-600 sm:px-5">
        Registre únicamente saldo real. Los kg faltantes son una referencia para alcanzar el objetivo.
      </p>
    </>
  )
}
