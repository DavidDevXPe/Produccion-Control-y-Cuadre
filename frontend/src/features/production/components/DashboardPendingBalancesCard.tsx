import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { SectionCard } from '../../../components/ui/SectionCard'
import { formatCentiKg } from '../../../utils/formatters'
import type { kg100 } from '../model/calculations'
import type { PendingFamilyBalance } from '../hooks/useDashboardData'

export interface DashboardPendingBalancesCardProps {
  pendingBalancesByFamily: PendingFamilyBalance[]
  hiddenPendingFamilyCount: number
  pendingTraceableKg100: ReturnType<typeof kg100>
  packingWeekNumber: number
}

export function DashboardPendingBalancesCard({
  pendingBalancesByFamily,
  hiddenPendingFamilyCount,
  pendingTraceableKg100,
  packingWeekNumber,
}: DashboardPendingBalancesCardProps) {
  return (
    <SectionCard
      title="Saldos pendientes por familia"
      description={`Envasado de la semana ${packingWeekNumber} que todavía puede pasar a Congelamiento.`}
      action={
        <ActionLink to="/saldos?process=FREEZING" variant="ghost" size="sm">
          Ver saldos
          <ArrowRight className="size-4" aria-hidden="true" />
        </ActionLink>
      }
      className="shrink-0"
    >
      {pendingBalancesByFamily.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {pendingBalancesByFamily.map((family, index) => (
            <li
              key={family.familyName}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-600 text-xs font-bold text-white"
                aria-hidden="true"
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-xs font-bold uppercase text-slate-900">
                    {family.familyName}
                  </p>
                  <span className="number-tabular shrink-0 text-xs font-bold text-slate-900">
                    {formatCentiKg(family.pendingKg100)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{
                        width: `${
                          pendingBalancesByFamily[0]?.pendingKg100
                            ? Math.max(
                                4,
                                (family.pendingKg100 /
                                  pendingBalancesByFamily[0]
                                    .pendingKg100) *
                                  100,
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-[0.625rem] text-slate-500">
                    {family.productIds.size}{' '}
                    {family.productIds.size === 1
                      ? 'producto pendiente'
                      : 'productos pendientes'}
                  </span>
                </div>
              </div>
            </li>
          ))}

          <li className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2">
            <span className="text-xs font-bold text-slate-700">
              {hiddenPendingFamilyCount > 0
                ? `${hiddenPendingFamilyCount} familias adicionales`
                : 'Pendiente trazable total'}
            </span>
            {hiddenPendingFamilyCount > 0 ? (
              <ActionLink to="/saldos?process=FREEZING" variant="ghost" size="sm">
                Ver todos los saldos
                <ArrowRight className="size-4" aria-hidden="true" />
              </ActionLink>
            ) : (
              <span className="number-tabular text-xs font-bold text-slate-900">
                {formatCentiKg(pendingTraceableKg100)}
              </span>
            )}
          </li>
        </ul>
      ) : (
        <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-500">
          <CheckCircle2
            className="size-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          No existe saldo trazable pendiente de congelar.
        </div>
      )}
    </SectionCard>
  )
}

