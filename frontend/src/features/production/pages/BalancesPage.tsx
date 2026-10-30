import {
  Printer,
  Snowflake,
} from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { PageHeader } from '../../../components/ui/PageHeader'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { BalancePanel } from '../components/BalancePanel'
import { BalancesEmptyState } from '../components/BalancesEmptyState'
import { BalancesFilterBar } from '../components/BalancesFilterBar'
import { BalancesMetricsGrid } from '../components/BalancesMetricsGrid'
import { FreezingAvailabilityExplanation } from '../components/FreezingAvailabilityExplanation'
import { FreezingBalancesPanel } from '../components/FreezingBalancesPanel'
import { ProcessSelector } from '../components/ProcessSelector'
import { useBalancesData } from '../hooks/useBalancesData'

export function BalancesPage() {
  const {
    selectedProcess,
    activeWeek,
    isFreezing,
    weekStart,
    weekEnd,
    searchQuery,
    setSearchQuery,
    selectedDate,
    setSelectedDate,
    freezingPositions,
    filteredFreezingPositions,
    previousFreezingPositions,
    filteredPreviousFreezingPositions,
    freezingOrigins,
    outstandingByOrigin,
    totalPendingKg100,
    totalFreezingLedgerPendingKg100,
    totalExcessKg100,
    pendingProductCount,
    originCount,
    freezingWeek,
    handleProcessChange,
    handleExportPdf,
  } = useBalancesData()

  const hasNoPositions =
    (isFreezing
      ? freezingPositions.length + previousFreezingPositions.length
      : outstandingByOrigin.length) === 0

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
              onClick={handleExportPdf}
              className={`no-print ${buttonStyles('secondary', 'sm')}`}
            >
              <Printer className="size-4" aria-hidden="true" />
              Exportar PDF
            </button>
            {freezingWeek.canCreate &&
            (totalPendingKg100 > 0 || totalFreezingLedgerPendingKg100 > 0) ? (
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
        onChange={handleProcessChange}
      />

      <BalancesFilterBar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />

      <BalancesMetricsGrid
        isFreezing={isFreezing}
        totalPendingKg100={totalPendingKg100}
        pendingProductCount={pendingProductCount}
        originCount={originCount}
        totalExcessKg100={totalExcessKg100}
      />

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
          {filteredPreviousFreezingPositions.length > 0 ? (
            <FreezingBalancesPanel
              positions={filteredPreviousFreezingPositions}
              title="Saldos anteriores disponibles"
              description="Orígenes de semanas anteriores que siguen disponibles para consumir mediante FIFO. Se mantienen separados de la producción de la semana seleccionada."
            />
          ) : null}
        </>
      ) : null}

      {isFreezing &&
      filteredFreezingPositions.length === 0 &&
      filteredPreviousFreezingPositions.length > 0 ? (
        <FreezingBalancesPanel
          positions={filteredPreviousFreezingPositions}
          title="Saldos anteriores disponibles"
          description="Orígenes de semanas anteriores que siguen disponibles para consumir mediante FIFO. Se mantienen separados de la producción de la semana seleccionada."
        />
      ) : null}

      {hasNoPositions ? (
        <BalancesEmptyState
          isFreezing={isFreezing}
          isWeekClosed={activeWeek.isClosed}
        />
      ) : null}
    </div>
  )
}

export default BalancesPage
