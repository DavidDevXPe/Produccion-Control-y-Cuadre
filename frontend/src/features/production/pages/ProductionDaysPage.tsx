import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, FilePlus2, Gauge, LockKeyhole } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { Modal } from '../../../components/ui/Modal'
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
import { getJourneyStatus } from '../presentation/journeyStatus'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'
import { useProductionData } from '../state/ProductionDataContext'

function QuantityValue({ value }: { value: number }) {
  return (
    <span className="inline-flex w-full items-baseline justify-center whitespace-nowrap text-center">
      <span>{formatCentiKgValue(value)}</span>
      <span className="ml-1 text-[0.6875rem] font-medium">kg</span>
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
      journey: getJourneyStatus(day, operationalState),
    }
  })
  // Same criterion as the Dashboard: "Cuadradas" are closed, balanced and
  // without observations. Observed journeys are counted on their own.
  const balancedCount = registeredDays.filter(
    ({ journey }) => journey.status === 'BALANCED',
  ).length
  const closedCount = registeredDays.filter(
    ({ operationalState }) => operationalState.lifecycle === 'CLOSED',
  ).length
  // Closed and balanced with observations, whether they were saved at closing
  // or only exist as validation warnings of a historical journey.
  const observedClosedCount = registeredDays.filter(
    ({ journey }) => journey.status === 'BALANCED_OBSERVED',
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

const frozenPhysicalKg100 = sumKg100(
  registeredDays.flatMap(({ day }) => [
    day.declaredShiftTotalsKg100.DAY,
    day.declaredShiftTotalsKg100.NIGHT,
  ]),
)

const freezingLinkedKg100 = sumKg100(
  registeredDays.map(
    ({ calculation }) => calculation.processedPreviousBalanceKg100,
  ),
)

const freezingDifferenceKg100 = kg100(
  frozenPhysicalKg100 - freezingLinkedKg100,
)

const freezingPendingKg100 = sumKg100(
  calculateFreezingAvailability(
    allProductionDays,
    activeWeek.period.endDate,
  ).map((position) => position.pendingKg100),
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
              className={buttonStyles('secondary', 'sm')}
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
  className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3"
  aria-label="Resumen de jornadas"
>
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
      registeredDays.length > 0 &&
      balancedCount === registeredDays.length
        ? 'success'
        : 'warning'
    }
    description={
      closedCount > 0 || readyToCloseCount > 0
        ? `${closedCount} cerrada${closedCount === 1 ? '' : 's'} · ${
            readyToCloseCount
          } lista${readyToCloseCount === 1 ? '' : 's'} para cerrar${
            observedClosedCount > 0
              ? ` · ${observedClosedCount} con observación`
              : ''
          }`
        : 'Requiere revisión'
    }
  />

  {isFreezing ? (
    <MetricCard
      label="Con observación"
      value={observedClosedCount}
      icon={<AlertTriangle className="size-5" />}
      tone={observedClosedCount > 0 ? 'warning' : 'success'}
      description={
        observedClosedCount > 0
          ? `${observedClosedCount} ${
              observedClosedCount === 1 ? 'jornada requiere' : 'jornadas requieren'
            } revisión`
          : 'Sin observaciones de cierre'
      }
    />
  ) : (
    <MetricCard
      label="Bajo referencia (<80%)"
      value={belowReferenceCount}
      icon={<Gauge className="size-5" />}
      tone={belowReferenceCount === 0 ? 'success' : 'warning'}
      description="Referencia operativa: 80%"
    />
  )}
</section>

{isFreezing ? (
        <section
          aria-labelledby="freezing-summary-title"
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel"
        >
          <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-3.5">
            <h2
              id="freezing-summary-title"
              className="text-sm font-bold text-slate-950"
            >
              Resumen de congelamiento
            </h2>
            <p className="text-xs leading-5 text-slate-500">
              Estado físico y trazable de lo congelado en la semana seleccionada.
            </p>
          </div>

          <dl className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            <div className="px-5 py-3.5 text-center">
              <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                Congelado esta semana
              </dt>
              <dd className="number-tabular mt-1.5 text-xl font-extrabold text-slate-950">
                {formatCentiKgValue(frozenPhysicalKg100)}
                <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
              </dd>
            </div>

            <div className="px-5 py-3.5 text-center">
              <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                Vinculado
              </dt>
              <dd className="number-tabular mt-1.5 text-xl font-extrabold text-slate-950">
                {formatCentiKgValue(freezingLinkedKg100)}
                <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
              </dd>
            </div>

            <div className="px-5 py-3.5 text-center">
              <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                Dif. trazabilidad
              </dt>
              {/* Physical above linked: observation (amber). Linked above
                  physical: inconsistency (red). Never netted or hidden. */}
              <dd
                className={`number-tabular mt-1.5 text-xl font-extrabold ${
                  freezingDifferenceKg100 === 0
                    ? 'text-emerald-700'
                    : freezingDifferenceKg100 > 0
                      ? 'text-amber-700'
                      : 'text-rose-700'
                }`}
              >
                {formatCentiKgValue(freezingDifferenceKg100)}
                <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
              </dd>
              {freezingDifferenceKg100 < 0 ? (
                <p className="mt-1 text-[0.625rem] font-semibold text-rose-700">
                  Vinculado por encima de lo reportado
                </p>
              ) : null}
            </div>

            <div className="px-5 py-3.5 text-center">
              <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                Pendiente trazable acumulado
              </dt>
              <dd className="number-tabular mt-1.5 text-xl font-extrabold text-brand-800">
                {formatCentiKgValue(freezingPendingKg100)}
                <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
              </dd>
              <p className="mt-1 text-[0.625rem] text-slate-500">
                Disponible pendiente al cierre del período
              </p>
            </div>
          </dl>
        </section>
      ) : null}

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
              <tr className="border-b border-slate-200 bg-slate-50/90 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Jornada</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">{isFreezing ? 'Día' : 'Materia prima'}</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">{isFreezing ? 'Noche' : 'Producto terminado'}</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">{isFreezing ? 'Total congelado' : 'Saldo final'}</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">{isFreezing ? 'Dif. trazabilidad' : 'Diferencia'}</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">{isFreezing ? 'Estado' : 'Cuadre'}</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">{isFreezing ? 'Vinculado' : 'Aprovechamiento'}</th>
                <th scope="col" className="px-3 py-2.5 text-center align-middle">Acción</th>
              </tr>
            </thead>
            <tbody>
              {registeredDays.map(({ day, calculation, operationalState, journey }) => {
                const isClosed = operationalState.lifecycle === 'CLOSED'
                const isReadyToClose =
                  operationalState.state === 'READY_TO_CLOSE'
                const isBalanceOnly = isBalanceOnlyProductionDay(day)
                const yieldStatus = getYieldStatus(calculation.performance.percent)
                const performancePercent = calculation.performance.percent
                // A yield above 100% is impossible: it is an integrity problem
                // even before the journey is closed.
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
                // A difference is red only when the journey really is not
                // balanced; on an open journey it is follow-up work.
                const differenceClass =
                  calculation.differenceKg100 === 0
                    ? 'text-emerald-700'
                    : journey.status === 'NOT_BALANCED'
                      ? 'text-rose-700'
                      : 'text-amber-700'

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
                          <span className="mt-0.5 block text-[0.625rem] font-medium text-slate-500">
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
  <div className="number-tabular flex w-full items-center justify-center whitespace-nowrap text-center text-xs font-semibold text-slate-700 ">
    <QuantityValue
      value={calculation.processedPreviousBalanceKg100}
    />
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
        <Modal
          titleId="week-close-title"
          size="md"
          onClose={() => setIsWeekCloseOpen(false)}
        >
          <div className="p-5 sm:p-6">
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
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default ProductionDaysPage
