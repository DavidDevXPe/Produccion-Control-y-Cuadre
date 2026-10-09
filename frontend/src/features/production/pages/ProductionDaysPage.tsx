import {
  FilePlus2,
  FileSpreadsheet,
  LockKeyhole,
} from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { PageHeader } from '../../../components/ui/PageHeader'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { ProductionDaysAuditBanner } from '../components/ProductionDaysAuditBanner'
import { ProductionDaysMetricsGrid } from '../components/ProductionDaysMetricsGrid'
import { ProductionDaysFilterBar } from '../components/ProductionDaysFilterBar'
import { ProductionDaysFreezingSummary } from '../components/ProductionDaysFreezingSummary'
import { ProductionDaysTable } from '../components/ProductionDaysTable'
import { ProductionDaysCloseWeekModal } from '../components/ProductionDaysCloseWeekModal'
import { useProductionDaysData } from '../hooks/useProductionDaysData'

export function ProductionDaysPage() {
  usePageTitle('Jornadas de producción')

  const {
    selectedProcess,
    isFreezing,
    activeWeek,
    activeWeekState,
    packingDaysCount,
    freezingDaysCount,
    weeklySummary,
    registeredDays,
    balancedCount,
    belowReferenceCount,
    latestDay,
    frozenPhysicalKg100,
    freezingLinkedKg100,
    freezingDifferenceKg100,
    freezingPendingKg100,
    missingCalendarDays,
    isWeekFullySquared,
    searchQuery,
    setSearchQuery,
    selectedDate,
    setSelectedDate,
    isWeekCloseOpen,
    setIsWeekCloseOpen,
    weekCloseError,
    confirmWeekClosure,
    handleDeleteDay,
    handleSelectProcess,
    handleExportCsv,
  } = useProductionDaysData()

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {activeWeekState.canCreate ? (
        <>
          <ActionLink
            to={`/jornadas/nueva?process=${selectedProcess}`}
            variant="secondary"
            size="sm"
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Importar Excel
          </ActionLink>
          <ActionLink to={`/jornadas/nueva?process=${selectedProcess}`} size="sm">
            <FilePlus2 className="size-4" aria-hidden="true" />
            Nueva jornada
          </ActionLink>
        </>
      ) : null}
      {activeWeekState.canCloseManually ? (
        <button
          type="button"
          onClick={() => setIsWeekCloseOpen(true)}
          className={buttonStyles('secondary', 'sm')}
        >
          <LockKeyhole className="size-4" aria-hidden="true" />
          Cerrar semana
        </button>
      ) : null}
    </div>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Control Operativo de Planta"
        title="Jornadas de producción"
        description={
          isFreezing
            ? `Semana ${activeWeek.number} · Control de congelado por turno contra la disponibilidad trazable de Envasado.`
            : `Semana ${activeWeek.number} · Registro, balance de materia prima, cuadre exacto de producto terminado y trazabilidad frigorífica.`
        }
        actions={headerActions}
      />

      <ProductionDaysAuditBanner
        isWeekFullySquared={isWeekFullySquared}
        balancedCount={balancedCount}
        registeredDaysCount={registeredDays.length}
      />

      <ProductionDaysMetricsGrid
        isFreezing={isFreezing}
        frozenPhysicalKg100={frozenPhysicalKg100}
        freezingLinkedKg100={freezingLinkedKg100}
        freezingDifferenceKg100={freezingDifferenceKg100}
        freezingPendingKg100={freezingPendingKg100}
        weeklySummary={weeklySummary}
        registeredDaysCount={registeredDays.length}
        belowReferenceCount={belowReferenceCount}
      />

      <ProductionDaysFilterBar
        selectedProcess={selectedProcess}
        packingDaysCount={packingDaysCount}
        freezingDaysCount={freezingDaysCount}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        minDate={activeWeek.period.startDate}
        maxDate={activeWeek.period.endDate}
        onSelectProcess={handleSelectProcess}
        onExportCsv={handleExportCsv}
        registeredDaysCount={registeredDays.length}
      />

      {isFreezing ? (
        <ProductionDaysFreezingSummary
          frozenPhysicalKg100={frozenPhysicalKg100}
          freezingLinkedKg100={freezingLinkedKg100}
          freezingDifferenceKg100={freezingDifferenceKg100}
          freezingPendingKg100={freezingPendingKg100}
        />
      ) : null}

      <ProductionDaysTable
        registeredDays={registeredDays}
        activeWeek={activeWeek}
        activeWeekState={activeWeekState}
        selectedProcess={selectedProcess}
        isFreezing={isFreezing}
        latestDay={latestDay}
        weeklySummary={weeklySummary}
        frozenPhysicalKg100={frozenPhysicalKg100}
        freezingLinkedKg100={freezingLinkedKg100}
        freezingDifferenceKg100={freezingDifferenceKg100}
        balancedCount={balancedCount}
        onDeleteDay={handleDeleteDay}
      />

      <ProductionDaysCloseWeekModal
        isOpen={isWeekCloseOpen}
        onClose={() => setIsWeekCloseOpen(false)}
        activeWeek={activeWeek}
        selectedProcess={selectedProcess}
        registeredDaysCount={registeredDays.length}
        missingCalendarDays={missingCalendarDays}
        weekCloseError={weekCloseError}
        onConfirmWeekClosure={confirmWeekClosure}
      />
    </div>
  )
}
export default ProductionDaysPage