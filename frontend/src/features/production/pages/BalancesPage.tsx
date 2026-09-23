import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Layers3,
  Snowflake,
} from 'lucide-react'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { ProcessSelector } from '../components/ProcessSelector'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg } from '../../../utils/formatters'
import { BalancePanel } from '../components/BalancePanel'
import { FreezingAvailabilityExplanation } from '../components/FreezingAvailabilityExplanation'
import { FreezingBalancesPanel } from '../components/FreezingBalancesPanel'
import {
  calculateOutstandingBalances,
  calculateProductionDay,
  sumKg100,
} from '../model/calculations'
import { calculateFreezingAvailability } from '../model/freezing'
import { isPackingProductionDay, isProductionProcess } from '../model/productionProcess'
import { explainFreezingAvailabilityByOrigin } from '../presentation/freezingAvailabilityExplanation'
import { useProductionData } from '../state/ProductionDataContext'

export function BalancesPage() {
  usePageTitle('Saldos de producción')
  const {
    activeWeekNumber,
    activeProcess,
    allProductionDays,
    getWeekView,
    setActiveProcess,
    subsequentBalanceLots,
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
  const isFreezing = selectedProcess === 'FREEZING'
  const productionDays = allProductionDays.filter(
    (day) =>
      isPackingProductionDay(day) &&
      day.date <= activeWeek.period.endDate,
  )
  const outstandingPositions = calculateOutstandingBalances(
    productionDays,
    subsequentBalanceLots,
  ).filter((position) => position.pendingKg100 > 0 || position.excessKg100 > 0)
  // Positions consumed above what their origin generated stay visible: an
  // excess is an inconsistency to investigate, not "no pending balance".
  const freezingAvailability = calculateFreezingAvailability(
    allProductionDays,
    activeWeek.period.endDate,
  )
  const freezingPositions = [...freezingAvailability]
    .filter((position) => position.pendingKg100 > 0 || position.excessKg100 > 0)
    .sort(
      (first, second) =>
        // Inconsistencies first, then FIFO: oldest origin first.
        Number(second.excessKg100 > 0) - Number(first.excessKg100 > 0) ||
        first.originDate.localeCompare(second.originDate) ||
        first.familyName.localeCompare(second.familyName, 'es-PE') ||
        first.productName.localeCompare(second.productName, 'es-PE'),
    )
  // Each open origin is explained with all of its products, not only the
  // pending ones, so "available" is the complete amount of that journey.
  const openFreezingOriginIds = new Set(
    freezingPositions.map((position) => position.originDayId),
  )
  const freezingOrigins = explainFreezingAvailabilityByOrigin(
    freezingAvailability.filter((position) =>
      openFreezingOriginIds.has(position.originDayId),
    ),
    allProductionDays,
  )
  const outstandingByOrigin = productionDays.flatMap((day) => {
    const positions = outstandingPositions.filter(
      (position) => position.originDayId === day.id,
    )

    return positions.length > 0
      ? [{ day, calculation: calculateProductionDay(day), positions }]
      : []
  })
  const visiblePositions = isFreezing ? freezingPositions : outstandingPositions
  const totalPendingKg100 = sumKg100(
    visiblePositions.map((position) => position.pendingKg100),
  )
  const totalExcessKg100 = sumKg100(
    visiblePositions.map((position) => position.excessKg100),
  )
  const pendingProductCount = new Set(
    visiblePositions
      .filter((position) => position.pendingKg100 > 0)
      .map((position) => position.productId),
  ).size
  const freezingWeek = getWeekView(activeWeekNumber, 'FREEZING')
  const originCount = new Set(
    visiblePositions.map((position) => position.originDayId),
  ).size

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Producción"
        title="Saldos"
        description={
          isFreezing
            ? `Producto envasado pendiente de congelar al cierre de la semana ${activeWeek.number}.`
            : `Posición acumulada al cierre de la semana ${activeWeek.number}, identificada por producto y jornada de origen.`
        }
        actions={
          freezingWeek.canCreate && totalPendingKg100 > 0 ? (
            <ActionLink
              to="/jornadas/nueva?process=FREEZING"
              variant="secondary"
              size="sm"
            >
              <Snowflake className="size-4" aria-hidden="true" />
              Registrar Congelamiento
            </ActionLink>
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
        className={`grid gap-3 ${
          totalExcessKg100 > 0 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'
        }`}
        aria-label="Resumen de saldos"
      >
        <MetricCard
          label={isFreezing ? 'Pendiente de congelar' : 'Saldo total pendiente'}
          value={formatCentiKg(totalPendingKg100)}
          icon={<Boxes className="size-5" />}
          tone="brand"
        />
        <MetricCard label="Productos pendientes" value={pendingProductCount} icon={<Layers3 className="size-5" />} />
        <MetricCard label="Jornadas de origen" value={originCount} icon={<CalendarClock className="size-5" />} />
        {totalExcessKg100 > 0 ? (
          <MetricCard
            label="Consumido en exceso"
            value={formatCentiKg(totalExcessKg100)}
            description="Por encima de lo que generó su origen"
            icon={<AlertTriangle className="size-5" />}
            tone="danger"
          />
        ) : null}
      </section>

      {!isFreezing ? outstandingByOrigin.map(({ day, calculation, positions }) => (
        <BalancePanel
          key={day.id}
          products={calculation.products}
          originDate={day.date}
          positions={positions}
          view="outstanding"
        />
      )) : freezingPositions.length > 0 ? (
        <>
          <FreezingAvailabilityExplanation origins={freezingOrigins} />
          <FreezingBalancesPanel positions={freezingPositions} />
        </>
      ) : null}

      {(isFreezing ? freezingPositions.length : outstandingByOrigin.length) === 0 ? (
        <SectionCard contentClassName="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-bold text-slate-950">
              {isFreezing ? 'Sin producto pendiente de congelar' : 'Sin saldos pendientes'}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
              {isFreezing
                ? 'No existe producto envasado pendiente hasta la fecha consultada.'
                : activeWeek.isClosed
                ? 'El saldo del sábado fue envasado completamente el domingo y los demás saldos cuentan con un consumo posterior registrado.'
                : 'No existen posiciones abiertas hasta la fecha consultada. Los saldos permanecen vinculados a su jornada de origen hasta que registres su procesamiento real.'}
            </p>
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}

export default BalancesPage
