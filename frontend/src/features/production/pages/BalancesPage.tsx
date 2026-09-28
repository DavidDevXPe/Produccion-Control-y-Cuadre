import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Layers3,
  Printer,
  Search,
  Snowflake,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { ProcessSelector } from '../components/ProcessSelector'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { exportPageToPdf } from '../../../utils/pdfExport'
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

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  useEffect(() => {
    if (selectedProcess !== activeProcess) setActiveProcess(selectedProcess)
  }, [activeProcess, selectedProcess, setActiveProcess])
  const isFreezing = selectedProcess === 'FREEZING'
  const weekStart = activeWeek.period.startDate
  const weekEnd = activeWeek.period.endDate

  const productionDays = allProductionDays.filter(
    (day) =>
      isPackingProductionDay(day) &&
      day.date <= weekEnd,
  )
  const outstandingPositions = calculateOutstandingBalances(
    productionDays,
    subsequentBalanceLots,
  ).filter((position) => position.pendingKg100 > 0 || position.excessKg100 > 0)

  // Full ledger up to week end (needed for correct excess/pending math).
  const freezingAvailability = calculateFreezingAvailability(
    allProductionDays,
    weekEnd,
  )

  // UI scope: only positions whose Packing origin belongs to the active week.
  const freezingPositions = [...freezingAvailability]
    .filter(
      (position) =>
        (position.pendingKg100 > 0 || position.excessKg100 > 0) &&
        position.originDate >= weekStart &&
        position.originDate <= weekEnd,
    )
    .sort(
      (first, second) =>
        Number(second.excessKg100 > 0) - Number(first.excessKg100 > 0) ||
        first.originDate.localeCompare(second.originDate) ||
        first.familyName.localeCompare(second.familyName, 'es-PE') ||
        first.productName.localeCompare(second.productName, 'es-PE'),
    )

  const openFreezingOriginIds = new Set(
    freezingPositions.map((position) => position.originDayId),
  )
  const freezingOrigins = explainFreezingAvailabilityByOrigin(
    freezingAvailability.filter((position) =>
      openFreezingOriginIds.has(position.originDayId),
    ),
    allProductionDays,
  )

  const filteredFreezingPositions = freezingPositions.filter((position) => {
    const matchesSearch =
      !searchQuery.trim() ||
      position.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.familyName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDate = !selectedDate || position.originDate === selectedDate
    return matchesSearch && matchesDate
  })

  const outstandingByOrigin = productionDays.flatMap((day) => {
    if (day.date < weekStart || day.date > weekEnd) return []
    if (selectedDate && day.date !== selectedDate) return []

    const positions = outstandingPositions.filter((position) => {
      if (position.originDayId !== day.id) return false
      if (!searchQuery.trim()) return true
      return (
        position.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        position.familyName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })

    return positions.length > 0
      ? [{ day, calculation: calculateProductionDay(day), positions }]
      : []
  })

  const visiblePositions = isFreezing
    ? filteredFreezingPositions
    : outstandingPositions.filter((position) => {
        const inWeek =
          position.originDate >= weekStart && position.originDate <= weekEnd
        if (!inWeek) return false
        const matchesSearch =
          !searchQuery.trim() ||
          position.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          position.familyName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesDate = !selectedDate || position.originDate === selectedDate
        return matchesSearch && matchesDate
      })
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
            ? `Producto envasado pendiente de congelar · solo orígenes de la semana ${activeWeek.number}.`
            : `Posición acumulada de la semana ${activeWeek.number}, identificada por producto y jornada de origen.`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportPageToPdf(`Saldos de Produccion Semana ${activeWeek.number}`)}
              className={`no-print ${buttonStyles('secondary', 'sm')}`}
            >
              <Printer className="size-4" aria-hidden="true" />
              Exportar PDF
            </button>
            {freezingWeek.canCreate && totalPendingKg100 > 0 ? (
              <ActionLink
                to="/jornadas/nueva?process=FREEZING"
                variant="secondary"
                size="sm"
              >
                <Snowflake className="size-4" aria-hidden="true" />
                Registrar Congelamiento
              </ActionLink>
            ) : null}
          </div>
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

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por producto o familia..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-8 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="origin-date-filter" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Fecha de origen:
          </label>
          <input
            id="origin-date-filter"
            type="date"
            value={selectedDate}
            min={weekStart}
            max={weekEnd}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {selectedDate ? (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Limpiar fecha
            </button>
          ) : null}
        </div>
      </div>

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
        <MetricCard
          label="Productos pendientes"
          value={pendingProductCount}
          icon={<Layers3 className="size-5" />}
        />
        <MetricCard
          label="Jornadas de origen"
          value={originCount}
          icon={<CalendarClock className="size-5" />}
        />
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

      {!isFreezing ? (
        outstandingByOrigin.map(({ day, calculation, positions }) => (
          <BalancePanel
            key={day.id}
            products={calculation.products}
            originDate={day.date}
            positions={positions}
            view="outstanding"
          />
        ))
      ) : filteredFreezingPositions.length > 0 ? (
        <>
          <FreezingAvailabilityExplanation origins={freezingOrigins} />
          <FreezingBalancesPanel positions={filteredFreezingPositions} />
        </>
      ) : null}

      {(isFreezing ? freezingPositions.length : outstandingByOrigin.length) ===
      0 ? (
        <SectionCard contentClassName="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-bold text-slate-950">
              {isFreezing
                ? 'Sin producto pendiente de congelar en esta semana'
                : 'Sin saldos pendientes en esta semana'}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
              {isFreezing
                ? 'No hay posiciones abiertas con origen en la semana seleccionada. Cambia de semana o revisa jornadas de Envasado anteriores si buscas saldo histórico.'
                : activeWeek.isClosed
                  ? 'El saldo del sábado fue envasado completamente el domingo y los demás saldos cuentan con un consumo posterior registrado.'
                  : 'No existen posiciones abiertas con origen en esta semana.'}
            </p>
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}

export default BalancesPage