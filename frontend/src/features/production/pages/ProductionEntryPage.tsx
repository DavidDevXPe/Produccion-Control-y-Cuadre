import { FamilyYieldPanel } from '../components/FamilyYieldPanel'
import { ProductionBalancesSection } from '../components/ProductionBalancesSection'
import { ProductionClosingSection } from '../components/ProductionClosingSection'
import { ProductionEntryActionBar } from '../components/ProductionEntryActionBar'
import { ProductionEntryHeader } from '../components/ProductionEntryHeader'
import { ProductionEntryModals } from '../components/ProductionEntryModals'
import { ProductionEntryPendingAlerts } from '../components/ProductionEntryPendingAlerts'
import { ProductionEntryReadOnlyWarning } from '../components/ProductionEntryReadOnlyWarning'
import { ProductionExcelImportSection } from '../components/ProductionExcelImportSection'
import { ProductionFinishedProductSection } from '../components/ProductionFinishedProductSection'
import { ProductionGeneralDataSection } from '../components/ProductionGeneralDataSection'
import { ProductionReportsSection } from '../components/ProductionReportsSection'
import { ProductionTreatmentSection } from '../components/ProductionTreatmentSection'
import { ProductionTunnelSection } from '../components/ProductionTunnelSection'
import { TubeMpBalancePanel } from '../components/TubeMpBalancePanel'
import { useProductionEntryData } from '../hooks/useProductionEntryData'

export function ProductionEntryPage() {
  const {
    saveError,
    isBulkFreezingLinkConfirmationOpen,
    setIsBulkFreezingLinkConfirmationOpen,
    catalogItems,
    manualProductSearchInputRef,
    editingDate,
    selectedProcess,
    activeWeek,
    existingDay,
    isEditingAllowed,
    mode,
    setMode,
    draft,
    updateDraft,
    isSunday,
    isFreezing,
    isBalanceOnly,
    usesExternalAvailability,
    pendingProcessChange,
    handleChangeProcess,
    handleConfirmProcessChange,
    handleCancelProcessChange,
    handleConfirmBulkFreezingLink,
    sectionProducts,
    excelImport,
    calculations,
    draftActions,
    persistence,
  } = useProductionEntryData()

  if (!isEditingAllowed || (editingDate && !existingDay)) {
    return <ProductionEntryReadOnlyWarning editingDate={editingDate} />
  }

  const { buildResult, businessSummary, closureValidation } = calculations

  return (
    <div className="space-y-5 pb-[calc(var(--entry-action-bar-height)+1rem)] [--entry-action-bar-height:8.75rem] sm:[--entry-action-bar-height:4.25rem] xl:[--entry-action-bar-height:var(--sidebar-footer-height)]">
      <ProductionEntryHeader
        existingDay={existingDay}
        isFreezing={isFreezing}
        canClose={calculations.canClose}
        closureValidation={closureValidation}
        isBalanceOnly={isBalanceOnly}
        draftProcess={draft.process}
        mode={mode}
        onModeChange={setMode}
        onChangeProcess={handleChangeProcess}
      />

      <ProductionExcelImportSection
        enabled={mode === 'EXCEL'}
        isFreezing={isFreezing}
        excelShift={excelImport.excelShift}
        fileName={excelImport.fileName}
        importState={excelImport.importState}
        excelImportMessage={excelImport.excelImportMessage}
        canConfirmExcelImport={excelImport.canConfirmExcelImport}
        excelPreview={excelImport.excelPreview}
        freezingExcelPreview={excelImport.freezingExcelPreview}
        unresolvedExcelRows={excelImport.unresolvedExcelRows}
        unresolvedFreezingExcelRows={excelImport.unresolvedFreezingExcelRows}
        excelExistingProductByRow={excelImport.excelExistingProductByRow}
        freezingNewProductFamilyByRow={excelImport.freezingNewProductFamilyByRow}
        freezingCatalogFamilyOptions={excelImport.freezingCatalogFamilyOptions}
        catalogItems={catalogItems}
        onChangeExcelShift={excelImport.changeExcelShift}
        onWorkbookFileChange={excelImport.handleWorkbook}
        onApplyExcelPreview={excelImport.applyExcelPreview}
        onSelectExistingProductForRow={(rowNumber, productId) =>
          excelImport.setExcelExistingProductByRow((c) => ({ ...c, [rowNumber]: productId }))
        }
        onSelectFreezingFamilyForRow={(rowNumber, familyId) =>
          excelImport.setFreezingNewProductFamilyByRow((c) => ({ ...c, [rowNumber]: familyId }))
        }
        onAssociateFreezingExcelRowToExisting={excelImport.associateFreezingExcelRowToExisting}
        onAddFreezingExcelRowToCatalog={excelImport.addFreezingExcelRowToCatalog}
        onAddExcelRowToCatalog={excelImport.addExcelRowToCatalog}
        onAssociateExcelRowToExisting={excelImport.associateExcelRowToExisting}
      />

      <ProductionGeneralDataSection
        draft={draft}
        isSunday={isSunday}
        isFreezing={isFreezing}
        isBalanceOnly={isBalanceOnly}
        editingDate={editingDate}
        existingDayDate={existingDay?.date}
        activeWeekStartDate={activeWeek.period.startDate}
        activeWeekEndDate={activeWeek.period.endDate}
        usesExternalAvailability={usesExternalAvailability}
        totalReportedKg100={calculations.totalReportedKg100}
        tunnelToggleError={sectionProducts.tunnelToggleError}
        importedBalanceMatches={calculations.importedBalanceMatches}
        importedBalanceTotal={calculations.importedBalanceTotal}
        newClosingBalanceKg100={buildResult.calculation.newClosingBalanceKg100}
        onUpdateDraft={updateDraft}
        onUpdateDate={draftActions.updateDate}
        onUpdateTunnelCondition={sectionProducts.updateTunnelCondition}
      />

      <ProductionReportsSection
        draft={draft}
        calculation={buildResult.calculation}
        reportCatalogItems={calculations.reportCatalogItems}
        freezingAvailabilityByProduct={calculations.freezingAvailabilityByProduct}
        reportFamilySubtotals={calculations.reportFamilySubtotals}
        orderedProductIds={calculations.orderedProductIds}
        dayHasReportData={calculations.dayHasReportData}
        nightHasReportData={calculations.nightHasReportData}
        isFreezing={isFreezing}
        isBalanceOnly={isBalanceOnly}
        isEditingAllowed={isEditingAllowed}
        mode={mode}
        selectedProcess={selectedProcess}
        searchInputRef={manualProductSearchInputRef}
        getFreezingPotentialAvailabilityKg100={calculations.getFreezingPotentialAvailabilityKg100}
        autoLinkFreezingProduct={draftActions.autoLinkFreezingProduct}
        onAddReportProduct={draftActions.addReportProduct}
        onUpdateRow={draftActions.updateRow}
        onRemoveRow={draftActions.removeRow}
        getCaptureCellProps={calculations.getCaptureCellProps}
      />

      <ProductionTunnelSection
        enabled={!usesExternalAvailability && draft.hasTunnelProduction}
        reportsReconciled={calculations.reportsReconciled}
        tunnelMovementRequired={calculations.tunnelMovementRequired}
        dayKg100={buildResult.calculation.tunnel.dayKg100}
        nightKg100={buildResult.calculation.tunnel.nightKg100}
        totalKg100={buildResult.calculation.tunnel.totalKg100}
        catalogItems={sectionProducts.tunnelCatalogItems}
        rows={sectionProducts.tunnelRows}
        selectedProcess={selectedProcess}
        searchInputRef={sectionProducts.tunnelSearchInputRef}
        onAddProduct={sectionProducts.addTunnelProduct}
        onUpdateRow={(rowKey, field, value) => draftActions.updateRow(rowKey, field, value)}
        getTunnelCellProps={sectionProducts.getTunnelCellProps}
      />

      <ProductionTreatmentSection
        enabled={!usesExternalAvailability}
        reportsReconciled={calculations.reportsReconciled}
        catalogItems={sectionProducts.treatmentCatalogItems}
        rows={sectionProducts.treatmentRows}
        selectedProcess={selectedProcess}
        searchInputRef={sectionProducts.treatmentSearchInputRef}
        onAddProduct={sectionProducts.addTreatmentProduct}
        onUpdateRow={(rowKey, value) =>
          draftActions.updateRow(rowKey, 'treatmentKg', value)
        }
        onRemoveProduct={sectionProducts.removeTreatmentProduct}
        getTreatmentCellProps={sectionProducts.getTreatmentCellProps}
      />

      <ProductionBalancesSection
        isFreezing={isFreezing}
        isBalanceOnly={isBalanceOnly}
        usesExternalAvailability={usesExternalAvailability}
        reportsReconciled={calculations.reportsReconciled}
        totalReportedKg100={calculations.totalReportedKg100}
        draft={draft}
        availableBalances={calculations.availableBalances}
        freezingPreviousOriginsAvailableKg100={calculations.freezingPreviousOriginsAvailableKg100}
        freezingCurrentOriginAvailableKg100={calculations.freezingCurrentOriginAvailableKg100}
        freezingTotalAvailableKg100={calculations.freezingTotalAvailableKg100}
        freezingLinkedThisDayKg100={calculations.freezingLinkedThisDayKg100}
        freezingPendingAfterKg100={calculations.freezingPendingAfterKg100}
        freezingBalanceExplanation={calculations.freezingBalanceExplanation}
        freezingPendingLinkCount={calculations.freezingPendingLinkCount}
        freezingTraceabilitySummary={calculations.freezingTraceabilitySummary}
        freezingOriginLedger={calculations.freezingOriginLedger}
        freezingAutomaticOriginStartDate={calculations.freezingAutomaticOriginStartDate}
        selectedProcess={selectedProcess}
        freezingBalanceUseSummary={calculations.freezingBalanceUseSummary}
        balanceShiftDiagnostics={calculations.balanceShiftDiagnostics}
        catalogItems={catalogItems}
        onOpenBulkFreezingLink={() => setIsBulkFreezingLinkConfirmationOpen(true)}
        onAddBalance={draftActions.addSelectedBalance}
        onRemoveBalanceUse={draftActions.removeBalanceUse}
        onDistributeLegacyBalance={draftActions.distributeLegacyBalance}
        onUpdateBalanceUse={draftActions.updateBalanceUse}
      />

      <ProductionClosingSection
        enabled={!usesExternalAvailability}
        reportsReconciled={calculations.reportsReconciled}
        catalogItems={sectionProducts.closingCatalogItems}
        rows={sectionProducts.closingRows}
        businessSummary={businessSummary}
        selectedProcess={selectedProcess}
        searchInputRef={sectionProducts.closingSearchInputRef}
        onAddProduct={sectionProducts.addClosingProduct}
        onUpdateRow={(rowKey, value) =>
          draftActions.updateRow(rowKey, 'closingBalanceKg', value)
        }
        onRemoveProduct={sectionProducts.removeClosingProduct}
      />

      <ProductionFinishedProductSection
        isFreezing={isFreezing}
        isBalanceOnly={isBalanceOnly}
        usesExternalAvailability={usesExternalAvailability}
        hasTunnelProduction={draft.hasTunnelProduction}
        totalReportedKg100={calculations.totalReportedKg100}
        calculation={buildResult.calculation}
        businessSummary={businessSummary}
      />

      {!usesExternalAvailability ? (
        <TubeMpBalancePanel balance={businessSummary.tubeMpBalance} />
      ) : null}

      {!usesExternalAvailability ? (
        <FamilyYieldPanel
          summary={businessSummary}
          showTunnel={draft.hasTunnelProduction}
        />
      ) : null}

      <ProductionEntryPendingAlerts
        canClose={calculations.canClose}
        closureValidation={closureValidation}
        diagnostics={calculations.diagnostics}
        pendingClosureReasons={calculations.pendingClosureReasons}
        saveError={saveError}
      />

      <ProductionEntryModals
        pendingProcessChange={pendingProcessChange}
        draft={draft}
        onCancelProcessChange={handleCancelProcessChange}
        onConfirmProcessChange={handleConfirmProcessChange}
        isBulkFreezingLinkConfirmationOpen={isBulkFreezingLinkConfirmationOpen}
        freezingPendingLinkCount={calculations.freezingPendingLinkCount}
        onCancelBulkFreezingLink={() => setIsBulkFreezingLinkConfirmationOpen(false)}
        onConfirmBulkFreezingLink={handleConfirmBulkFreezingLink}
        isCloseConfirmationOpen={persistence.isCloseConfirmationOpen}
        isFreezing={isFreezing}
        buildResult={buildResult}
        totalReportedKg100={calculations.totalReportedKg100}
        freezingLinkedThisDayKg100={calculations.freezingLinkedThisDayKg100}
        freezingBalanceExplanation={calculations.freezingBalanceExplanation}
        businessSummary={businessSummary}
        closureValidation={closureValidation}
        onCancelCloseConfirmation={() => persistence.setIsCloseConfirmationOpen(false)}
        onConfirmClose={() => persistence.persist(true, true)}
        removedRowState={draftActions.removedRowState}
        onUndoRemoveRow={draftActions.undoRemoveRow}
        onDismissUndoToast={draftActions.dismissUndoToast}
      />

      <ProductionEntryActionBar
        canClose={calculations.canClose}
        footerStatus={calculations.footerStatus}
        pendingClosureReasons={calculations.pendingClosureReasons}
        dayShift={buildResult.calculation.day}
        nightShift={buildResult.calculation.night}
        dayHasReportData={calculations.dayHasReportData}
        nightHasReportData={calculations.nightHasReportData}
        onSaveDraft={() => persistence.persist(false)}
        onCloseDay={() => persistence.persist(true)}
      />
    </div>
  )
}

export default ProductionEntryPage
