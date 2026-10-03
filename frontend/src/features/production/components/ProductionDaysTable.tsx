import { ArrowRight, CalendarDays, FilePlus2, FileSpreadsheet } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatOperationalPeriod } from '../../../utils/operationalContext'
import {
  formatCentiKgValue,
  formatIsoDateCompact,
  formatIsoWeekday,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import type { calculateWeeklySummary, kg100 } from '../model/calculations'
import { isBalanceOnlyProductionDay } from '../model/productionDayMode'
import { productionProcessLabels } from '../model/productionProcess'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'
import type { OperationalWeekView } from '../state/ProductionDataContext'
import type { RegisteredProductionDayItem } from '../hooks/useProductionDaysData'
import type { ProductionDay, ProductionProcess } from '../model/types'
import { sumKg100 } from '../model/calculations'

function QuantityValue({ value }: { value: number }) {
  return (
    <span className="inline-flex w-full items-baseline justify-center whitespace-nowrap text-center">
      <span>{formatCentiKgValue(value)}</span>
      <span className="ml-1 text-[0.6875rem] font-medium">kg</span>
    </span>
  )
}

export interface ProductionDaysTableProps {
  registeredDays: RegisteredProductionDayItem[]
  activeWeek: OperationalWeekView
  activeWeekState: OperationalWeekView
  selectedProcess: ProductionProcess
  isFreezing: boolean
  latestDay: ProductionDay | undefined
  weeklySummary: ReturnType<typeof calculateWeeklySummary>
  frozenPhysicalKg100: ReturnType<typeof kg100>
  freezingLinkedKg100: ReturnType<typeof kg100>
  freezingDifferenceKg100: ReturnType<typeof kg100>
  balancedCount: number
}

export function ProductionDaysTable({
  registeredDays,
  activeWeek,
  activeWeekState,
  selectedProcess,
  isFreezing,
  latestDay,
  weeklySummary,
  frozenPhysicalKg100,
  freezingLinkedKg100,
  freezingDifferenceKg100,
  balancedCount,
}: ProductionDaysTableProps) {
  return (
    <SectionCard
      title={`Semana ${activeWeek.number}`}
      description={`${formatOperationalPeriod(activeWeek.period)} · ${
        activeWeekState.isClosed
          ? 'Cerrada · Solo lectura'
          : activeWeekState.isCurrent
            ? 'Actual'
            : `Abierta · ${registeredDays.length} de 7`
      }`}
      action={
        <StatusBadge tone="info">
          {registeredDays.length}{' '}
          {registeredDays.length === 1 ? 'REGISTRO' : 'REGISTROS'}
        </StatusBadge>
      }
    >
      {registeredDays.length === 0 ? (
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
                Semana {activeWeek.number}
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Sin jornadas de {productionProcessLabels[selectedProcess]}
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
                {activeWeekState.canCreate
                  ? isFreezing
                    ? 'Registra la primera jornada de Congelamiento o revisa la disponibilidad de Envasado en Saldos.'
                    : 'Registra la primera jornada manualmente o importa un Excel estructurado para comenzar el cuadre.'
                  : 'Esta semana cerrada permanece disponible únicamente para consulta.'}
              </p>
            </div>
          </div>

          {activeWeekState.canCreate ? (
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
      ) : (
        <DataTableScroll
          label={`Jornadas de producción registradas en la semana ${activeWeek.number}`}
          showEdgeIndicators={false}
          className="data-scroll-clean-edge"
        >
          <table className="erp-table w-full min-w-[68rem] table-fixed border-collapse text-left">
            <caption className="sr-only">Jornadas de producción registradas</caption>
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[11%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[17%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
                <th scope="col" className="px-3 py-2.5 text-center align-middle">
                  Jornada
                </th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">
                  {isFreezing ? 'Día' : 'Materia prima'}
                </th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">
                  {isFreezing ? 'Noche' : 'Producto terminado'}
                </th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">
                  {isFreezing ? 'Total congelado' : 'Saldo final'}
                </th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">
                  {isFreezing ? 'Dif. trazabilidad' : 'Diferencia'}
                </th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">
                  {isFreezing ? 'Estado' : 'Cuadre'}
                </th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">
                  {isFreezing ? 'Vinculado' : 'Aprovechamiento'}
                </th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {registeredDays.map(
                ({ day, calculation, operationalState, journey }, idx) => {
                  const isClosed = operationalState.lifecycle === 'CLOSED'
                  const isReadyToClose =
                    operationalState.state === 'READY_TO_CLOSE'
                  const isBalanceOnly = isBalanceOnlyProductionDay(day)
                  const yieldStatus = getYieldStatus(
                    calculation.performance.percent,
                  )
                  const performancePercent = calculation.performance.percent
                  const hasInvalidYield =
                    !isFreezing &&
                    !isBalanceOnly &&
                    performancePercent !== null &&
                    performancePercent > 100

                  const squareStatus = hasInvalidYield
                    ? { tone: 'danger' as const, label: 'REVISAR INTEGRIDAD' }
                    : { tone: journey.tone, label: journey.label }
                  const yieldStyles = yieldVisualStyles[yieldStatus.colorVariant]
                  const rowAccentClass =
                    squareStatus.tone === 'danger'
                      ? 'before:bg-rose-500'
                      : squareStatus.tone === 'warning'
                        ? 'before:bg-amber-500'
                        : 'before:bg-emerald-500'

                  const differenceClass =
                    calculation.differenceKg100 === 0
                      ? 'text-emerald-700'
                      : journey.status === 'NOT_BALANCED'
                        ? 'text-rose-700'
                        : 'text-amber-700'

                  return (
                    <tr
                      key={day.id}
                      className="border-b border-slate-100 hover:bg-slate-50/80 last:border-0"
                    >
                      <th
                        scope="row"
                        className={`relative px-3 py-3 text-center align-middle before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] ${rowAccentClass}`}
                      >
                        <span className="flex w-full flex-col items-center justify-center text-center">
                          <span className="block text-xs font-bold tracking-[0.04em] text-slate-950">
                            {formatIsoWeekday(day.date)}
                          </span>
                          <span className="number-tabular mt-0.5 block text-xs font-semibold text-slate-600">
                            {formatIsoDateCompact(day.date)}
                          </span>
                          <span className="mt-0.5 block text-[0.625rem] font-medium text-sky-700">
                            Lote Z-{activeWeek.number}0{idx + 1}
                          </span>
                          {day.date === latestDay?.date ? (
                            <span className="mt-0.5 block text-[0.625rem] font-medium text-slate-500">
                              Último registro disponible
                            </span>
                          ) : null}
                        </span>
                      </th>
                      <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-700">
                        <QuantityValue
                          value={
                            isFreezing
                              ? day.declaredShiftTotalsKg100.DAY
                              : day.declaredRawMaterialKg100
                          }
                        />
                      </td>
                      <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-950">
                        <QuantityValue
                          value={
                            isFreezing
                              ? day.declaredShiftTotalsKg100.NIGHT
                              : calculation.declaredFinishedKg100
                          }
                        />
                      </td>
                      <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-700">
                        <QuantityValue
                          value={
                            isFreezing
                              ? day.declaredShiftTotalsKg100.DAY +
                                day.declaredShiftTotalsKg100.NIGHT
                              : calculation.newClosingBalanceKg100
                          }
                        />
                      </td>
                      <td
                        className={`number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold ${
                          isFreezing
                            ? calculation.ownTurnProductionKg100 === 0
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                            : differenceClass
                        }`}
                      >
                        <QuantityValue
                          value={
                            isFreezing
                              ? calculation.ownTurnProductionKg100
                              : calculation.differenceKg100
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-center align-middle">
                        <div className="flex w-full items-center justify-center">
                          <StatusBadge
                            tone={squareStatus.tone}
                            truncateText={false}
                          >
                            {squareStatus.label}
                          </StatusBadge>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center align-middle">
                        {isFreezing ? (
                          <div className="number-tabular flex w-full items-center justify-center whitespace-nowrap text-center text-xs font-semibold text-slate-700">
                            <QuantityValue
                              value={calculation.processedPreviousBalanceKg100}
                            />
                          </div>
                        ) : isBalanceOnly ? (
                          <div
                            className="flex w-full flex-col items-center justify-center gap-1 text-center"
                            aria-label="Aprovechamiento no aplicable. Jornada de saldos."
                          >
                            <span className="text-xs font-bold text-slate-600">
                              NO APLICA
                            </span>
                            <StatusBadge tone="neutral">
                              JORNADA DE SALDOS
                            </StatusBadge>
                          </div>
                        ) : (
                          <div
                            className="flex w-full flex-col items-center justify-center gap-1 text-center"
                            title={`${formatRatioAsPercent(calculation.performance.ratio)} · ${yieldStatus.label}: ${yieldStatus.interpretation}`}
                            aria-label={`Aprovechamiento ${formatRatioAsPercent(calculation.performance.ratio)}. Estado ${yieldStatus.label}. ${yieldStatus.interpretation}`}
                          >
                            <span
                              className={`number-tabular whitespace-nowrap text-xs font-bold ${yieldStyles.textClass}`}
                            >
                              {formatRatioAsPercent(
                                calculation.performance.ratio,
                              )}
                            </span>
                            <StatusBadge tone={yieldStyles.badgeTone}>
                              {yieldStatus.label}
                            </StatusBadge>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center align-middle">
                        <div className="flex w-full items-center justify-center">
                          <ActionLink
                            to={`${
                              isClosed ||
                              activeWeekState.isReadOnly ||
                              isReadyToClose
                                ? `/jornadas/${day.date}`
                                : `/jornadas/${day.date}/editar`
                            }?process=${selectedProcess}`}
                            variant="ghost"
                            size="sm"
                          >
                            {isClosed || activeWeekState.isReadOnly
                              ? 'Ver detalle'
                              : isReadyToClose
                                ? 'Revisar y cerrar'
                                : 'Seguir cuadrando'}
                            <ArrowRight
                              className="size-4"
                              aria-hidden="true"
                            />
                          </ActionLink>
                        </div>
                      </td>
                    </tr>
                  )
                },
              )}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold">
              <tr>
                <th
                  scope="row"
                  className="px-3 py-3 text-center align-middle text-[0.6875rem] font-bold uppercase tracking-wider text-slate-800"
                >
                  TOTAL ACUMULADO
                </th>
                <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-extrabold text-slate-900">
                  <span className="number-tabular">
                    {formatCentiKgValue(
                      isFreezing
                        ? frozenPhysicalKg100
                        : weeklySummary.rawMaterialKg100,
                    )}{' '}
                    kg
                  </span>
                </td>
                <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-extrabold text-slate-900">
                  <span className="number-tabular">
                    {formatCentiKgValue(
                      isFreezing
                        ? freezingLinkedKg100
                        : weeklySummary.declaredFinishedKg100,
                    )}{' '}
                    kg
                  </span>
                </td>
                <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-extrabold text-slate-900">
                  <span className="number-tabular">
                    {formatCentiKgValue(
                      isFreezing
                        ? frozenPhysicalKg100
                        : sumKg100(
                            registeredDays.map(
                              ({ calculation }) =>
                                calculation.newClosingBalanceKg100,
                            ),
                          ),
                    )}{' '}
                    kg
                  </span>
                </td>
                <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-extrabold text-emerald-700">
                  <span className="number-tabular">
                    {formatCentiKgValue(
                      isFreezing
                        ? freezingDifferenceKg100
                        : weeklySummary.differenceKg100,
                    )}{' '}
                    kg
                  </span>
                </td>
                <td className="px-3 py-3 text-center align-middle text-xs font-semibold text-slate-600">
                  {balancedCount} de {registeredDays.length} auditadas
                </td>
                <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-extrabold text-brand-800">
                  {!isFreezing && weeklySummary.performance.percent !== null
                    ? formatRatioAsPercent(weeklySummary.performance.ratio)
                    : '—'}
                </td>
                <td className="px-3 py-3 text-center align-middle text-xs font-semibold text-slate-500">
                  {registeredDays.length} {registeredDays.length === 1 ? 'jornada' : 'jornadas'}
                </td>
              </tr>
            </tfoot>
          </table>
        </DataTableScroll>
      )}
    </SectionCard>
  )
}

