import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, FilePlus2, Gauge, LockKeyhole, Scale, Snowflake } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { ProcessSelector } from '../components/ProcessSelector'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatOperationalPeriod } from '../../../utils/operationalContext'
import {
  formatCentiKgValue,
  formatIsoDateCompact,
  formatIsoWeekday,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import { kg100, sumKg100 } from '../model/calculations'
import { calculateFreezingAvailability } from '../model/freezing'
import { isBalanceOnlyProductionDay } from '../model/productionDayMode'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import { isProductionProcess, productionProcessLabels } from '../model/productionProcess'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'
import { useProductionData } from '../state/ProductionDataContext'

function QuantityValue({ value }: { value: number }) {
  return (
    <span className="inline-flex w-full items-baseline justify-center whitespace-nowrap text-center">
      <span>{formatCentiKgValue(value)}</span>
      <span className="ml-1 text-[0.6875rem] font-medium opacity-70">kg</span>
    </span>
  )
}

export function ProductionDaysPage() {
  usePageTitle('Jornadas de producción')
  const {
    activeWeekNumber,
    activeProcess,
    allProductionDays,
    closeWeekManually,
    getWeekView,
    setActiveProcess,
  } = useProductionData()
  const [searchParams, setSearchParams] = useSearchParams()
  const processParam = searchParams.get('process')
  const selectedProcess = isProductionProcess(processParam)
    ? processParam
    : activeProcess
  const activeWeek = getWeekView(activeWeekNumber, selectedProcess)
  useEffect(() => {
    if (selectedProcess !== activeProcess) setActiveProcess(selectedProcess)
  }, [activeProcess, selectedProcess, setActiveProcess])
  const activeWeekState = activeWeek
  const [isWeekCloseOpen, setIsWeekCloseOpen] = useState(false)
  const [weekCloseError, setWeekCloseError] = useState('')
  const registeredDays = activeWeek.productionDays.map((day) => {
    const operationalState = getProductionDayOperationalState(day)
    return {
      day,
      calculation: operationalState.calculation,
      operationalState,
    }
  })
  const balancedCount = registeredDays.filter(
    ({ operationalState }) => operationalState.isBalanced,
  ).length
  const closedCount = registeredDays.filter(
    ({ operationalState }) => operationalState.lifecycle === 'CLOSED',
  ).length
  const readyToCloseCount = registeredDays.filter(
    ({ operationalState }) => operationalState.state === 'READY_TO_CLOSE',
  ).length
  const belowReferenceCount = registeredDays.filter(
    ({ day, calculation }) => {
      if (isBalanceOnlyProductionDay(day)) return false
      const status = getYieldStatus(calculation.performance.percent).status
      return status === 'critical' || status === 'low' || status === 'acceptable'
    },
  ).length
  const latestDay = activeWeek.productionDays.at(-1)
  const isFreezing = selectedProcess === 'FREEZING'
  const freezingPendingKg100 = sumKg100(
    calculateFreezingAvailability(
      allProductionDays,
      activeWeek.period.endDate,
    ).map((position) => position.pendingKg100),
  )
  const frozenPhysicalKg100 = sumKg100(
    registeredDays.flatMap(({ day }) => [
      day.declaredShiftTotalsKg100.DAY,
      day.declaredShiftTotalsKg100.NIGHT,
    ]),
  )
  const freezingDifferenceKg100 = kg100(
    frozenPhysicalKg100 -
      sumKg100(
        registeredDays.map(
          ({ calculation }) => calculation.processedPreviousBalanceKg100,
        ),
      ),
  )
  const missingCalendarDays = activeWeek.calendarDays.filter(
    (calendarDay) =>
      !activeWeek.productionDays.some(
        (productionDay) => productionDay.date === calendarDay.isoDate,
      ),
  )

  const confirmWeekClosure = () => {
    setWeekCloseError('')
    try {
      closeWeekManually(activeWeek.number, selectedProcess)
      setIsWeekCloseOpen(false)
    } catch (error) {
      setWeekCloseError(
        error instanceof Error ? error.message : 'No se pudo cerrar la semana.',
      )
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Producción"
        title="Jornadas de producción"
        description={
          isFreezing
            ? 'Controla lo congelado por turno contra la disponibilidad trazable de Envasado.'
            : 'Consulta el cuadre diario sin mezclarlo con el aprovechamiento operativo.'
        }
        actions={
          activeWeekState.canCloseManually ? (
            <>
            <ActionLink to={`/jornadas/nueva?process=${selectedProcess}`} size="sm">
              <FilePlus2 className="size-4" aria-hidden="true" />
              Nueva jornada
            </ActionLink>
            <button
              type="button"
              onClick={() => setIsWeekCloseOpen(true)}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <LockKeyhole className="size-4" aria-hidden="true" />
              Cerrar semana
            </button>
            </>
          ) : null
        }
      />

      <ProcessSelector
        value={selectedProcess}
        onChange={(process) => {
          if (process !== 'COMPARISON') {
            setActiveProcess(process)
            setSearchParams({ process }, { replace: true })
          }
        }}
      />

      <section
        className={`grid auto-rows-fr gap-3 sm:grid-cols-2 ${isFreezing ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}
        aria-label="Resumen de jornadas"
      >
        {isFreezing ? (
          <>
            <MetricCard
              label="Producto congelado"
              value={formatCentiKgValue(frozenPhysicalKg100)}
              unit="kg"
              icon={<Snowflake className="size-5" />}
              tone="brand"
              description={`${registeredDays.length} ${registeredDays.length === 1 ? 'jornada' : 'jornadas'} registradas`}
            />
            <MetricCard
              label="Pendiente de congelar"
              value={formatCentiKgValue(freezingPendingKg100)}
              unit="kg"
              icon={<Snowflake className="size-5" />}
              tone="warning"
              description="Disponibilidad trazable aún abierta"
            />
            <MetricCard
              label="Diferencia"
              value={formatCentiKgValue(freezingDifferenceKg100)}
              unit="kg"
              icon={<Scale className="size-5" />}
              tone={freezingDifferenceKg100 === 0 ? 'success' : 'danger'}
              description="Físico menos producto vinculado"
            />
            <MetricCard
              label="Estado"
              value={
                registeredDays.length > 0 && balancedCount === registeredDays.length
                  ? 'CUADRADO'
                  : 'REVISAR'
              }
              icon={<CheckCircle2 className="size-5" />}
              tone={
                registeredDays.length > 0 && balancedCount === registeredDays.length
                  ? 'success'
                  : 'warning'
              }
              description={`${balancedCount} de ${registeredDays.length} jornadas conciliadas`}
            />
          </>
        ) : (
          <>
            <MetricCard
              label="Jornadas registradas"
              value={registeredDays.length}
              icon={<CalendarDays className="size-5" />}
              description={`${registeredDays.length} de 7 días de la semana`}
            />
            <MetricCard
              label="Cuadradas"
              value={balancedCount}
              icon={<CheckCircle2 className="size-5" />}
              tone={
                registeredDays.length > 0 && balancedCount === registeredDays.length
                  ? 'success'
                  : 'warning'
              }
              description={
                balancedCount > 0
                  ? `${closedCount} cerrada${closedCount === 1 ? '' : 's'} · ${readyToCloseCount} lista${readyToCloseCount === 1 ? '' : 's'} para cerrar`
                  : 'Requiere revisión'
              }
            />
            <MetricCard
              label="Bajo referencia (<80%)"
              value={belowReferenceCount}
              icon={<Gauge className="size-5" />}
              tone={belowReferenceCount === 0 ? 'success' : 'warning'}
              description="Referencia operativa: 80%"
            />
          </>
        )}
      </section>

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
          <div className="flex flex-col items-start gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Aún no hay jornadas registradas</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {activeWeekState.canCreate
                  ? 'Empieza con ingreso manual o importa una hoja del Excel para revisarla.'
                  : 'Esta semana cerrada permanece disponible únicamente para consulta.'}
              </p>
            </div>
            {activeWeekState.canCreate ? (
            <ActionLink to={`/jornadas/nueva?process=${selectedProcess}`}>
                <FilePlus2 className="size-4" aria-hidden="true" />
                Nueva jornada
              </ActionLink>
            ) : null}
          </div>
        ) : (
        <DataTableScroll label={`Jornadas de producción registradas en la semana ${activeWeek.number}`}>
          <table className="erp-table w-full min-w-[64rem] table-fixed border-collapse text-left">
            <caption className="sr-only">Jornadas de producción registradas</caption>
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[18%]" />
              <col className="w-[11%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Jornada</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">{isFreezing ? 'Reporte Día' : 'Materia prima'}</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">{isFreezing ? 'Reporte Noche' : 'Producto terminado'}</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">{isFreezing ? 'Congelado' : 'Saldo final'}</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Diferencia</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Cuadre</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">{isFreezing ? 'Disponibilidad utilizada' : 'Aprovechamiento'}</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Acción</th>
              </tr>
            </thead>
            <tbody>
              {registeredDays.map(({ day, calculation, operationalState }) => {
                const isBalanced = operationalState.isBalanced
                const isClosed = operationalState.lifecycle === 'CLOSED'
                const isReadyToClose =
                  operationalState.state === 'READY_TO_CLOSE'
                const isBalanceOnly = isBalanceOnlyProductionDay(day)
                const yieldStatus = getYieldStatus(calculation.performance.percent)
                const performancePercent = calculation.performance.percent
                const hasObservedYield =
                  !isFreezing &&
                  !isBalanceOnly &&
                  performancePercent !== null &&
                  performancePercent < 80

                const hasInvalidYield =
                  !isFreezing &&
                  !isBalanceOnly &&
                  performancePercent !== null &&
                  performancePercent > 100

                const squareStatus = !isBalanced
                  ? {
                      tone: 'danger' as const,
                      label: 'POR CUADRAR',
                    }
                  : hasInvalidYield
                    ? {
                        tone: 'danger' as const,
                        label: 'REVISAR INTEGRIDAD',
                      }
                    : hasObservedYield
                      ? {
                          tone: 'warning' as const,
                          label: 'CUADRADO · OBSERVADO',
                        }
                      : {
                          tone: 'success' as const,
                          label: 'CUADRADO',
                        }
                const yieldStyles = yieldVisualStyles[yieldStatus.colorVariant]
                const rowAccentClass =
                  !isBalanced || hasInvalidYield
                    ? 'before:bg-rose-500'
                    : hasObservedYield
                      ? 'before:bg-amber-500'
                      : 'before:bg-emerald-500'

                return (
                  <tr
                    key={day.id}
                    className="bg-white hover:bg-brand-50/35"
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
                        {day.date === latestDay?.date ? (
                          <span className="mt-0.5 block text-[0.625rem] font-medium text-slate-400">
                            Último registro disponible
                          </span>
                        ) : null}
                      </span>
                    </th>
                    <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-700">
                      <QuantityValue value={isFreezing ? day.declaredShiftTotalsKg100.DAY : day.declaredRawMaterialKg100} />
                    </td>
                    <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-950">
                      <QuantityValue value={isFreezing ? day.declaredShiftTotalsKg100.NIGHT : calculation.declaredFinishedKg100} />
                    </td>
                    <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-700">
                      <QuantityValue value={isFreezing ? day.declaredShiftTotalsKg100.DAY + day.declaredShiftTotalsKg100.NIGHT : calculation.newClosingBalanceKg100} />
                    </td>
                    <td
                      className={`number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold ${
                        isBalanced ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      <QuantityValue value={isFreezing ? calculation.ownTurnProductionKg100 : calculation.differenceKg100} />
                    </td>
                    <td className="px-3 py-3 text-center align-middle">
                      <div className="flex w-full items-center justify-center">
                        <StatusBadge tone={squareStatus.tone}>
                          {squareStatus.label}
                        </StatusBadge>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle">
                      {isFreezing ? (
                        <div className="flex w-full flex-col items-center justify-center gap-1 text-center">
                          <span className="number-tabular text-xs font-bold text-slate-700">
                            {formatCentiKgValue(calculation.processedPreviousBalanceKg100)} kg
                          </span>
                          <StatusBadge tone={calculation.ownTurnProductionKg100 === 0 ? 'success' : 'danger'}>
                            {calculation.ownTurnProductionKg100 === 0 ? 'TRAZABLE' : 'REVISAR'}
                          </StatusBadge>
                        </div>
                      ) : isBalanceOnly ? (
                        <div
                          className="flex w-full flex-col items-center justify-center gap-1 text-center"
                          aria-label="Aprovechamiento no aplicable. Jornada de saldos."
                        >
                          <span className="text-xs font-bold text-slate-600">NO APLICA</span>
                          <StatusBadge tone="neutral">JORNADA DE SALDOS</StatusBadge>
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
                          {formatRatioAsPercent(calculation.performance.ratio)}
                        </span>
                        <StatusBadge
                          tone={yieldStyles.badgeTone}
                        >
                          {yieldStatus.label}
                        </StatusBadge>
                      </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center align-middle">
                      <div className="flex w-full items-center justify-center">
                        <ActionLink
                          to={`${
                            isClosed || activeWeekState.isReadOnly || isReadyToClose
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
                        
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </ActionLink>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </DataTableScroll>
        )}
      </SectionCard>

      {isWeekCloseOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="week-close-title"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="week-close-title" className="text-base font-bold text-slate-950">
              Cerrar semana {activeWeek.number} · {productionProcessLabels[selectedProcess]}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Jornadas registradas: {registeredDays.length} de 7. Después del cierre, la semana quedará disponible únicamente para consulta.
                </p>
              </div>
            </div>

            {missingCalendarDays.length > 0 ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-700">
                  Días sin registro
                </p>
                <ul className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                  {missingCalendarDays.map((day) => (
                    <li key={day.isoDate}>{day.label} {day.date} · SIN REGISTRO</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  Los días sin operación permanecerán como SIN REGISTRO; no se crearán jornadas de 0 kg.
                </p>
              </div>
            ) : null}

            {activeWeek.closureBlockers.length > 0 ? (
              <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs font-bold text-rose-900">Jornadas que requieren revisión:</p>
                <ul className="mt-2 space-y-1 text-xs leading-5 text-rose-800">
                  {activeWeek.closureBlockers.map((blocker) => (
                    <li key={blocker.dayId}>• {blocker.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {weekCloseError ? (
              <p role="alert" className="mt-4 text-xs font-semibold text-rose-700">
                {weekCloseError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsWeekCloseOpen(false)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={activeWeek.closureBlockers.length > 0}
                onClick={confirmWeekClosure}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                Cerrar semana
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default ProductionDaysPage
