import { ArrowRight, PackageOpen } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { PackedFamilySummary } from '../hooks/useDashboardData'

export interface DashboardPackingFamilyCardProps {
  packedFamilies: readonly PackedFamilySummary[]
  totalFamiliesCount: number
  packingWeekNumber: number
  weeklyYieldPercent: number | null
}

export function DashboardPackingFamilyCard({
  packedFamilies,
  totalFamiliesCount,
  packingWeekNumber,
  weeklyYieldPercent,
}: DashboardPackingFamilyCardProps) {
  const meetsYieldStandard =
    weeklyYieldPercent !== null && weeklyYieldPercent >= 80

  return (
    <SectionCard
      title="Distribución por familia (Envasado)"
      description={`${totalFamiliesCount} ${
        totalFamiliesCount === 1
          ? 'familia confirmada'
          : 'familias confirmadas'
      } en reportes de la semana ${packingWeekNumber}.`}
      action={
        <ActionLink to="/resumen" variant="ghost" size="sm">
          Ver resumen
          <ArrowRight className="size-4" aria-hidden="true" />
        </ActionLink>
      }
      className="flex flex-col xl:grow xl:shrink-0"
      contentClassName="flex flex-1 flex-col justify-between"
    >
      {packedFamilies.length > 0 ? (
        <ul className="divide-y divide-slate-100 flex-1">
          {packedFamilies.map((family, index) => (
            <li
              key={family.familyId}
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
                    {formatCentiKg(family.packedKg100)}{' '}
                    <span className="text-[0.6875rem] font-semibold text-slate-500">
                      ({family.sharePercent.toFixed(1)}%)
                    </span>
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
                        width: `${Math.min(
                          100,
                          Math.max(4, family.sharePercent),
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-[0.625rem] text-slate-500">
                    {family.productIds.size}{' '}
                    {family.productIds.size === 1 ? 'producto' : 'productos'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 items-center gap-3 px-5 py-6 text-sm text-slate-500">
          <PackageOpen
            className="size-5 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          No hay volumen de Envasado registrado en esta semana.
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-2">
        <span className="text-xs font-bold text-slate-700">
          Límite mínimo de aprovechamiento: 80%
        </span>
        {weeklyYieldPercent !== null ? (
          <StatusBadge
            tone={meetsYieldStandard ? 'success' : 'warning'}
            truncateText={false}
          >
            {meetsYieldStandard ? 'CUMPLE ESTÁNDAR' : 'BAJO REFERENCIA'}
          </StatusBadge>
        ) : (
          <StatusBadge tone="neutral" truncateText={false}>
            SIN REFERENCIA
          </StatusBadge>
        )}
      </div>
    </SectionCard>
  )
}
