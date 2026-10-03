import { exportPageToPdf } from '../../../utils/pdfExport'
import { formatIsoDate } from '../../../utils/formatters'
import { BalancePanel } from '../components/BalancePanel'
import { CloseDayDialog } from '../components/CloseDayDialog'
import { FreezingDayDetail } from '../components/FreezingDayDetail'
import { ProductionBreakdown } from '../components/ProductionBreakdown'
import { ProductionDayClosureObservations } from '../components/ProductionDayClosureObservations'
import { ProductionDayCuadreSection } from '../components/ProductionDayCuadreSection'
import { ProductionDayHeader } from '../components/ProductionDayHeader'
import { ProductionDayMetricsGrid } from '../components/ProductionDayMetricsGrid'
import { ProductionDayNotFound } from '../components/ProductionDayNotFound'
import { ProductionDayShiftGrid } from '../components/ProductionDayShiftGrid'
import { ReceivedBalancePanel } from '../components/ReceivedBalancePanel'
import { useProductionDayDetail } from '../hooks/useProductionDayDetail'

export function ProductionDayPage() {
  const {
    productionDay,
    allProductionDays,
    operationalState,
    calculation,
    process,
    isFreezing,
    isBalanceOnly,
    balancePositions,
    isBalanced,
    isClosed,
    isReadyToClose,
    visibleClosureObservations,
    canExport,
    sourceSheet,
    statusBadge,
    canEdit,
    exportState,
    isCloseConfirmationOpen,
    closeError,
    handleCloseDay,
    cancelClose,
    confirmCloseDay,
    handleExport,
    freezingCloseSummary,
    packingCloseSummary,
  } = useProductionDayDetail()

  if (!productionDay || !operationalState || !calculation) {
    return <ProductionDayNotFound />
  }

  if (isFreezing) {
    return (
      <>
        <FreezingDayDetail
          productionDay={productionDay}
          allProductionDays={allProductionDays}
          canEdit={canEdit}
          canClose={isReadyToClose && !isClosed}
          canExport={canExport}
          exportState={exportState}
          onClose={handleCloseDay}
          onExportPdf={() =>
            exportPageToPdf(
              `Reporte Jornada Congelamiento ${formatIsoDate(productionDay.date)}`,
            )
          }
          onExportExcel={handleExport}
        />

        {isCloseConfirmationOpen ? (
          <CloseDayDialog
            titleId="freezing-close-title"
            title="Cerrar jornada de Congelamiento"
            description="Después del cierre, esta jornada quedará en solo lectura."
            summary={freezingCloseSummary}
            warnings={operationalState.validation.warnings}
            warningTitle={(warning) =>
              warning.code === 'FREEZING_TRACEABILITY_DIFFERENCE'
                ? 'Diferencia de trazabilidad'
                : warning.code === 'FREEZING_PRODUCT_TRACEABILITY_DIFFERENCE'
                  ? 'Producto con origen insuficiente'
                  : 'Advertencia'
            }
            error={closeError}
            onCancel={cancelClose}
            onConfirm={confirmCloseDay}
          />
        ) : null}
      </>
    )
  }

  return (
    <div className="space-y-5">
      <ProductionDayHeader
        productionDay={productionDay}
        process={process}
        isBalanceOnly={isBalanceOnly}
        sourceSheet={sourceSheet}
        statusBadge={statusBadge}
        canEdit={canEdit}
        isReadyToClose={isReadyToClose}
        canExport={canExport}
        exportState={exportState}
        onCloseDay={handleCloseDay}
        onExportPdf={() =>
          exportPageToPdf(
            `Reporte Jornada ${formatIsoDate(productionDay.date)}`,
          )
        }
        onExportExcel={handleExport}
      />

      <ProductionDayClosureObservations
        isClosed={isClosed}
        observations={visibleClosureObservations}
      />

      <ProductionDayMetricsGrid
        declaredRawMaterialKg100={productionDay.declaredRawMaterialKg100}
        calculation={calculation}
        isBalanceOnly={isBalanceOnly}
        isBalanced={isBalanced}
      />

      <ProductionDayCuadreSection
        calculation={calculation}
        isBalanceOnly={isBalanceOnly}
        washAuthorization={productionDay.nucaWashAuthorization}
      />

      <ProductionDayShiftGrid calculation={calculation} />

      <div id="produccion" className="scroll-mt-28">
        <ProductionBreakdown products={calculation.products} />
      </div>

      <div id="saldos" className="scroll-mt-28 space-y-5">
        <ReceivedBalancePanel
          productionDay={productionDay}
          calculation={calculation}
        />
        {!isBalanceOnly ? (
          <BalancePanel
            products={calculation.products}
            originDate={productionDay.date}
            positions={balancePositions}
          />
        ) : null}
      </div>

      {isCloseConfirmationOpen ? (
        <CloseDayDialog
          titleId="day-close-title"
          title="Cerrar jornada"
          description="Después del cierre, esta jornada quedará en solo lectura."
          summary={packingCloseSummary}
          warnings={operationalState.validation.warnings}
          error={closeError}
          onCancel={cancelClose}
          onConfirm={confirmCloseDay}
        />
      ) : null}
    </div>
  )
}

export default ProductionDayPage

