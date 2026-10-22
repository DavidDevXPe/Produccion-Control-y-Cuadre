import { ArrowRight } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import {
  formatCentiKg,
  formatIsoDateCompact,
  formatIsoWeekday,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import { sumKg100 } from '../model/calculations'
import { isBalanceOnlyProductionDay } from '../model/productionDayMode'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'
import type { DashboardJourneyRow } from '../hooks/useDashboardData'

function processLabel(process: 'PACKING' | 'FREEZING' | null) {
  if (process === null) return 'Envasado → Congelamiento'
  return process === 'FREEZING' ? 'Congelamiento' : 'Envasado'
}

export interface DashboardRecentJourneysTableProps {
  journeyRows: DashboardJourneyRow[]
  packingWeekNumber: number
}

export function DashboardRecentJourneysTable({
  journeyRows,
  packingWeekNumber,
}: DashboardRecentJourneysTableProps) {
  const packingRows = journeyRows.filter((row) => row.process === 'PACKING')
  const totalRawMaterialKg100 = sumKg100(
    packingRows.map((row) => row.day.declaredRawMaterialKg100),
  )
  const totalRegisteredKg100 = sumKg100(
    journeyRows.map((row) => row.registeredKg100),
  )
  const allReconciled =
    journeyRows.length > 0 &&
    journeyRows.every(
      (row) =>
        row.journey.status === 'BALANCED' ||
        row.journey.status === 'BALANCED_OBSERVED',
    )

  return (
    <SectionCard
      title="Últimas jornadas"
      description="Jornadas de la semana, primero las más recientes. Revisa las observadas o pendientes de cuadrar."
      action={
        <ActionLink to="/jornadas" variant="ghost" size="sm">
          Ver todas
          <ArrowRight className="size-4" aria-hidden="true" />
        </ActionLink>
      }
      className="shrink-0"
    >
      <DataTableScroll
        label={`Jornadas registradas en la semana ${packingWeekNumber}`}
      >
        <table className="erp-table w-full min-w-[44rem] table-fixed border-collapse text-center">
          <caption className="sr-only">Últimas jornadas de la semana</caption>

          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[14%]" />
            <col className="w-[17%]" />
            <col className="w-[15%]" />
            <col className="w-[28%]" />
            <col className="w-[11%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-600">
              <th scope="col" className="px-3 py-2.5">Fecha</th>
              <th scope="col" className="px-3 py-2.5">Proceso</th>
              <th scope="col" className="px-3 py-2.5">Kg registrados</th>
              <th scope="col" className="px-3 py-2.5">Aprovechamiento</th>
              <th scope="col" className="px-3 py-2.5">Estado</th>
              <th scope="col" className="px-3 py-2.5">Detalle</th>
            </tr>
          </thead>

          <tbody>
            {journeyRows.map(
              ({ day, calculation, journey, process, registeredKg100 }) => {
                const isPacking = process === 'PACKING'
                const dayYieldStatus = getYieldStatus(
                  calculation.performance.percent,
                )
                const dayYieldStyles =
                  yieldVisualStyles[dayYieldStatus.colorVariant]
                const yieldNotApplicable =
                  !isPacking || isBalanceOnlyProductionDay(day)

                return (
                  <tr
                    key={`${process}-${day.id}`}
                    className="border-b border-slate-100 bg-white last:border-0 hover:bg-brand-50/35"
                  >
                    <th
                      scope="row"
                      className="px-3 py-3 text-center text-xs font-bold text-slate-900"
                    >
                      <span className="block">{formatIsoWeekday(day.date)}</span>
                      <span className="number-tabular block text-[0.6875rem] font-medium text-slate-500">
                        {formatIsoDateCompact(day.date)}
                      </span>
                    </th>

                    <td className="px-3 py-3 text-center text-xs font-semibold text-slate-700">
                      {processLabel(process)}
                    </td>

                    <td className="number-tabular px-3 py-3 text-center text-xs font-bold text-slate-900">
                      {formatCentiKg(registeredKg100)}
                    </td>

                    <td
                      className="px-3 py-3 text-center"
                      title={
                        yieldNotApplicable
                          ? isPacking
                            ? 'Jornada de saldos sin nueva materia prima.'
                            : 'Congelamiento no aplica la referencia de aprovechamiento.'
                          : `${formatRatioAsPercent(
                              calculation.performance.ratio,
                            )} · ${dayYieldStatus.label}: ${
                              dayYieldStatus.interpretation
                            }`
                      }
                    >
                      {yieldNotApplicable ? (
                        <span className="text-xs font-bold text-slate-500">
                          NO APLICA
                        </span>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <span
                            className={`number-tabular text-xs font-bold ${dayYieldStyles.textClass}`}
                          >
                            {formatRatioAsPercent(
                              calculation.performance.ratio,
                            )}
                          </span>
                          <span
                            className={`mt-0.5 text-[0.625rem] font-bold ${dayYieldStyles.textClass}`}
                          >
                            {dayYieldStatus.label}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <StatusBadge tone={journey.tone} truncateText={false}>
                        {journey.label}
                      </StatusBadge>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <ActionLink
                        to={`/jornadas/${day.date}?process=${process}`}
                        variant="ghost"
                        size="sm"
                        aria-label={`Ver jornada de ${formatIsoWeekday(day.date)} ${formatIsoDateCompact(day.date)} · ${processLabel(process)}`}
                      >
                        Ver
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </ActionLink>
                    </td>
                  </tr>
                )
              },
            )}
          </tbody>
        </table>
      </DataTableScroll>

      {journeyRows.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs">
          <span className="font-bold text-slate-700">
            Total semana {packingWeekNumber} (acumulado)
          </span>

          <div className="flex flex-wrap items-center gap-4">
            {totalRawMaterialKg100 > 0 ? (
              <span className="number-tabular font-semibold text-slate-600">
                {`Materia prima: ${formatCentiKg(totalRawMaterialKg100)}`}
              </span>
            ) : null}

            <span className="number-tabular font-bold text-slate-900">
              {`Total registrado: ${formatCentiKg(totalRegisteredKg100)}`}
            </span>

            <StatusBadge
              tone={allReconciled ? 'success' : 'warning'}
              truncateText={false}
            >
              {allReconciled ? 'CONCILIADO' : 'EN REVISIÓN'}
            </StatusBadge>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

