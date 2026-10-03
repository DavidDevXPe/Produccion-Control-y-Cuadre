import {
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { FamilyYieldPanel } from '../components/FamilyYieldPanel'
import { ProductionBalancesSection } from '../components/ProductionBalancesSection'
import { ProductionClosingSection } from '../components/ProductionClosingSection'
import { ProductionExcelImportSection } from '../components/ProductionExcelImportSection'
import { ProductionFinishedProductSection } from '../components/ProductionFinishedProductSection'
import { TubeMpBalancePanel } from '../components/TubeMpBalancePanel'
import { BulkFreezingLinkDialog } from '../components/BulkFreezingLinkDialog'
import { CloseConfirmationDialog } from '../components/CloseConfirmationDialog'
import { ProcessChangeDialog } from '../components/ProcessChangeDialog'
import { ProcessSelector } from '../components/ProcessSelector'
import { ProductPicker } from '../components/ProductPicker'
import { ProductionCaptureTable } from '../components/ProductionCaptureTable'
import { ProductionEntryActionBar } from '../components/ProductionEntryActionBar'
import { ProductionShiftCards } from '../components/ProductionShiftCards'
import { ProductionTreatmentSection } from '../components/ProductionTreatmentSection'
import { ProductionTunnelSection } from '../components/ProductionTunnelSection'
import { ProductionGeneralDataSection } from '../components/ProductionGeneralDataSection'
import { useProductionExcelImport } from '../hooks/useProductionExcelImport'
import { useProductionSectionProducts } from '../hooks/useProductionSectionProducts'
import { useProductionDraftActions } from '../hooks/useProductionDraftActions'
import { useProductionPersistence } from '../hooks/useProductionPersistence'
import { useProductionCalculations } from '../hooks/useProductionCalculations'
import { useProductionNavigation } from '../hooks/useProductionNavigation'
import { usePageTitle } from '../../../hooks/usePageTitle'
import {
  formatCentiKg,
  formatIsoDate,
} from '../../../utils/formatters'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import { getActiveProducts } from '../capture/productCatalogRepository'
import { kg100 } from '../model/calculations'

export function ProductionEntryPage() {
  const [saveError, setSaveError] = useState('')
  const [isBulkFreezingLinkConfirmationOpen, setIsBulkFreezingLinkConfirmationOpen] = useState(false)
  const [catalogItems, setCatalogItems] = useState<ProductionCatalogItem[]>(() => getActiveProducts())
  const manualProductSearchInputRef = useRef<HTMLInputElement>(null)
  const onProcessChangeResetRef = useRef<(() => void) | undefined>(undefined)

  const {
    editingDate,
    navigate,
    selectedProcess,
    activeWeek,
    existingDay,
    isEditingAllowed,
    mode,
    setMode,
    draft,
    setDraft,
    updateDraft,
    isSunday,
    isFreezing,
    isBalanceOnly,
    usesExternalAvailability,
    pendingProcessChange,
    setPendingProcessChange,
    changeProcess,
    applyProcessChange,
    allProductionDays,
    subsequentBalanceLots,
    upsertProductionDay,
  } = useProductionNavigation({
    onProcessChangeReset: () => onProcessChangeResetRef.current?.(),
    setSaveError: (err) => setSaveError(err),
  })

  const sectionProducts = useProductionSectionProducts({
    draft,
    setDraft,
    catalogItems,
    existingDay,
    setSaveError,
    updateDraft,
  })

  const excelImport = useProductionExcelImport({
    draft,
    setDraft,
    isFreezing,
    catalogItems,
    setCatalogItems,
    setSaveError,
  })

  useEffect(() => {
    onProcessChangeResetRef.current = () => {
      excelImport.resetExcelImport()
      sectionProducts.resetSectionProducts()
    }
  })

  usePageTitle(existingDay ? 'Editar jornada' : 'Nueva jornada')

  const {
    buildResult,
    businessSummary,
    reportFamilySubtotals,
    orderedProductIds,
    getCaptureCellProps,
    closureValidation,
    canClose,
    diagnostics,
    balanceShiftDiagnostics,
    freezingBalanceUseSummary,
    dayHasReportData,
    nightHasReportData,
    reportsReconciled,
    tunnelMovementRequired,
    pendingClosureReasons,
    footerStatus,
    importedBalanceTotal,
    importedBalanceMatches,
    totalReportedKg100,
    reportCatalogItems,
    availableBalances,
    freezingAutomaticOriginPositions,
    freezingAutomaticOriginStartDate,
    freezingAvailabilityByProduct,
    getFreezingPotentialAvailabilityKg100,
    freezingPreviousOriginsAvailableKg100,
    freezingCurrentOriginAvailableKg100,
    freezingTotalAvailableKg100,
    freezingLinkedThisDayKg100,
    freezingPendingAfterKg100,
    freezingBalanceExplanation,
    freezingPendingLinkCount,
    freezingTraceabilitySummary,
    freezingOriginLedger,
  } = useProductionCalculations({
    draft,
    allProductionDays,
    subsequentBalanceLots,
    catalogItems,
    isFreezing,
    usesExternalAvailability,
  })

  const draftActions = useProductionDraftActions({
    draft,
    setDraft,
    catalogItems,
    isFreezing,
    isBalanceOnly,
    isEditingAllowed,
    freezingAutomaticOriginPositions,
    clearSectionProduct: sectionProducts.clearSectionProduct,
    manualProductSearchInputRef,
    setSaveError,
    updateDraft,
  })

  const persistence = useProductionPersistence({
    draft,
    editingDate,
    activeWeek,
    allProductionDays,
    subsequentBalanceLots,
    upsertProductionDay,
    navigate,
    setSaveError,
  })

  if (!isEditingAllowed || (editingDate && !existingDay)) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto size-10 text-amber-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          {editingDate
            ? 'Esta jornada no se puede editar'
            : 'Esta semana es de solo lectura'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Las semanas abiertas permiten captura; las semanas cerradas y futuras son de solo lectura.
        </p>
        <Link
          to="/jornadas"
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-bold text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a jornadas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-[calc(var(--entry-action-bar-height)+1rem)] [--entry-action-bar-height:8.75rem] sm:[--entry-action-bar-height:4.25rem] xl:[--entry-action-bar-height:var(--sidebar-footer-height)]">
      <Link
        to="/jornadas"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a jornadas
      </Link>

      <PageHeader
        eyebrow="Captura operativa"
        title={existingDay ? `Editar ${formatIsoDate(existingDay.date)}` : 'Nueva jornada'}
        description={
          isFreezing
            ? 'Registra lo congelado por turno y vincula cada kilo con el producto disponible desde Envasado.'
            : 'Registra los reportes de producción y concilia cada turno hasta obtener un cuadre exacto.'
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone="info">
              {isFreezing ? 'CONGELAMIENTO' : 'ENVASADO'}
            </StatusBadge>
            <StatusBadge
  tone={
    !canClose
      ? 'warning'
      : closureValidation.warnings.length > 0
        ? 'warning'
        : 'success'
  }
>
  {!canClose
    ? 'EN CAPTURA'
    : closureValidation.warnings.length > 0
      ? 'LISTA · CON OBSERVACIONES'
      : 'LISTA PARA CERRAR'}
</StatusBadge>
            {isBalanceOnly ? (
              <StatusBadge tone="neutral">JORNADA DE SALDOS</StatusBadge>
            ) : null}
          </div>
        }
      />

      <ProcessSelector
        value={draft.process}
        disabled={Boolean(existingDay)}
        onChange={(process) => {
          if (process !== 'COMPARISON') changeProcess(process)
        }}
      />

      <div>
        <p className="mb-1.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-slate-500">
          Modo de registro
        </p>
        <div
          className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
          role="tablist"
          aria-label="Forma de ingreso"
        >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'MANUAL'}
          className={`min-h-9 rounded-lg px-4 text-xs font-bold transition ${
            mode === 'MANUAL'
              ? 'bg-brand-700 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setMode('MANUAL')}
        >
          Ingreso manual
        </button>
        <button
  type="button"
  role="tab"
  aria-selected={mode === 'EXCEL'}
  className={`min-h-9 rounded-lg px-4 text-xs font-bold transition ${
    mode === 'EXCEL'
      ? 'bg-brand-700 text-white'
      : 'text-slate-600 hover:bg-slate-50'
  }`}
  onClick={() => setMode('EXCEL')}
>
  Importar Excel
</button>
        </div>
      </div>

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
        totalReportedKg100={totalReportedKg100}
        tunnelToggleError={sectionProducts.tunnelToggleError}
        importedBalanceMatches={importedBalanceMatches}
        importedBalanceTotal={importedBalanceTotal}
        newClosingBalanceKg100={buildResult.calculation.newClosingBalanceKg100}
        onUpdateDraft={updateDraft}
        onUpdateDate={draftActions.updateDate}
        onUpdateTunnelCondition={sectionProducts.updateTunnelCondition}
      />

      <SectionCard
        allowStickyContent
        title="Reportes Día / Noche"
        description={
          draft.shiftAllocationMode === 'EXPLICIT'
            ? 'Registra los productos informados por los supervisores y concilia cada turno.'
            : 'Día y Noche se distribuyen desde los totales del Excel y conservan su trazabilidad.'
        }
        action={
          <StatusBadge tone={draft.shiftAllocationMode === 'EXPLICIT' ? 'info' : 'warning'}>
            {draft.shiftAllocationMode === 'EXPLICIT' ? 'TURNOS EXPLÍCITOS' : 'REPARTO CONCILIADO'}
          </StatusBadge>
        }
      >
        <ProductionShiftCards
          dayShift={buildResult.calculation.day}
          nightShift={buildResult.calculation.night}
          dayHasReportData={dayHasReportData}
          nightHasReportData={nightHasReportData}
        />

        {mode === 'MANUAL' ? (
          <ProductPicker
            items={reportCatalogItems}
            getItemId={(product) => product.productId}
            getItemLabel={(product) => `${product.familyName} · ${product.productName}`}
            getItemMeta={(product) => ({
              group: product.familyName,
              secondaryText: isFreezing
                ? `Disponible: ${formatCentiKg(
                    freezingAvailabilityByProduct.get(product.productId) ??
                      kg100(0),
                  )}`
                : undefined,
            })}
            onAdd={(product) => draftActions.addReportProduct(product.productId)}
            label="Buscar producto"
            placeholder="Buscar producto o seleccionar del catálogo (ej.: aleta, manto o nuca)..."
            buttonLabel="Agregar producto"
            buttonClassName={buttonStyles('primary')}
            scopeKey={`${selectedProcess}:REPORTS`}
            searchInputRef={manualProductSearchInputRef}
          />
        ) : null}

        {draft.rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Carga una captura de producción para construir la lista de productos de esta jornada.
          </div>
        ) : (
          <ProductionCaptureTable
            draft={draft}
            calculation={buildResult.calculation}
            reportFamilySubtotals={reportFamilySubtotals}
            orderedProductIds={orderedProductIds}
            isFreezing={isFreezing}
            isBalanceOnly={isBalanceOnly}
            isEditingAllowed={isEditingAllowed}
            getFreezingPotentialAvailabilityKg100={getFreezingPotentialAvailabilityKg100}
            autoLinkFreezingProduct={draftActions.autoLinkFreezingProduct}
            updateRow={draftActions.updateRow}
            removeRow={draftActions.removeRow}
            getCaptureCellProps={getCaptureCellProps}
          />
        )}
      </SectionCard>

      <ProductionTunnelSection
        enabled={!usesExternalAvailability && draft.hasTunnelProduction}
        reportsReconciled={reportsReconciled}
        tunnelMovementRequired={tunnelMovementRequired}
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
        reportsReconciled={reportsReconciled}
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
        reportsReconciled={reportsReconciled}
        totalReportedKg100={totalReportedKg100}
        draft={draft}
        availableBalances={availableBalances}
        freezingPreviousOriginsAvailableKg100={freezingPreviousOriginsAvailableKg100}
        freezingCurrentOriginAvailableKg100={freezingCurrentOriginAvailableKg100}
        freezingTotalAvailableKg100={freezingTotalAvailableKg100}
        freezingLinkedThisDayKg100={freezingLinkedThisDayKg100}
        freezingPendingAfterKg100={freezingPendingAfterKg100}
        freezingBalanceExplanation={freezingBalanceExplanation}
        freezingPendingLinkCount={freezingPendingLinkCount}
        freezingTraceabilitySummary={freezingTraceabilitySummary}
        freezingOriginLedger={freezingOriginLedger}
        freezingAutomaticOriginStartDate={freezingAutomaticOriginStartDate}
        selectedProcess={selectedProcess}
        freezingBalanceUseSummary={freezingBalanceUseSummary}
        balanceShiftDiagnostics={balanceShiftDiagnostics}
        catalogItems={catalogItems}
        onOpenBulkFreezingLink={() => setIsBulkFreezingLinkConfirmationOpen(true)}
        onAddBalance={draftActions.addSelectedBalance}
        onRemoveBalanceUse={draftActions.removeBalanceUse}
        onDistributeLegacyBalance={draftActions.distributeLegacyBalance}
        onUpdateBalanceUse={draftActions.updateBalanceUse}
      />

      <ProductionClosingSection
        enabled={!usesExternalAvailability}
        reportsReconciled={reportsReconciled}
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
        totalReportedKg100={totalReportedKg100}
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

      {!canClose && (closureValidation.blockers.length > 0 || diagnostics.length > 0 || pendingClosureReasons.length > 0) ? (
        <div
          id="pendientes-para-cerrar"
          tabIndex={-1}
          className="scroll-mt-28 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 outline-none dark:border-amber-500/30 dark:bg-amber-500/10"
        >
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-amber-900 dark:text-amber-300">Pendientes para cerrar</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900 dark:text-amber-200">
            {(pendingClosureReasons.length > 0
              ? pendingClosureReasons
              : [
                  ...closureValidation.blockers
                    .filter((blocker) => blocker.code !== 'TUNNEL_MOVEMENTS_REQUIRED')
                    .map((blocker) => blocker.message),
                  ...diagnostics
                    .filter((diagnostic) => diagnostic.code !== 'SHIFT_BALANCED')
                    .map((diagnostic) => diagnostic.message),
                ]
                  .filter((message, index, messages) => messages.indexOf(message) === index)
                  .slice(0, 12)
            ).map((message) => <li key={message}>• {message}</li>)}
          </ul>
        </div>
      ) : null}

      {saveError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {saveError}
        </div>
      ) : null}

      <ProcessChangeDialog
        pendingProcess={pendingProcessChange}
        currentProcess={draft.process}
        onCancel={() => setPendingProcessChange(null)}
        onConfirm={(process) => {
          setPendingProcessChange(null)
          applyProcessChange(process)
        }}
      />

      <BulkFreezingLinkDialog
        isOpen={isBulkFreezingLinkConfirmationOpen}
        pendingLinkCount={freezingPendingLinkCount}
        onCancel={() => setIsBulkFreezingLinkConfirmationOpen(false)}
        onConfirm={() => {
          draftActions.autoLinkAllFreezingProducts()
          setIsBulkFreezingLinkConfirmationOpen(false)
        }}
      />

      <CloseConfirmationDialog
        isOpen={persistence.isCloseConfirmationOpen}
        summaryItems={
          isFreezing
            ? [
                ['Fecha', formatIsoDate(draft.date)],
                ['Congelado Día', formatCentiKg(buildResult.calculation.day.declaredReportedKg100)],
                ['Congelado Noche', formatCentiKg(buildResult.calculation.night.declaredReportedKg100)],
                ['Total congelado', formatCentiKg(totalReportedKg100)],
                ['Con origen identificado', formatCentiKg(freezingLinkedThisDayKg100)],
                ['Sin origen suficiente', formatCentiKg(freezingBalanceExplanation.untracedFrozenKg100)],
              ]
            : [
                ['Fecha', formatIsoDate(draft.date)],
                ['Materia prima', formatCentiKg(buildResult.productionDay.declaredRawMaterialKg100)],
                ['Producto terminado', formatCentiKg(buildResult.calculation.declaredFinishedKg100)],
                ['Saldo final', formatCentiKg(buildResult.calculation.newClosingBalanceKg100)],
                ['Diferencia', formatCentiKg(buildResult.calculation.differenceKg100)],
                ['Aprovechamiento', `${businessSummary.generalYieldPercent?.toFixed(2) ?? '—'}%`],
              ]
        }
        warnings={closureValidation.warnings}
        onCancel={() => persistence.setIsCloseConfirmationOpen(false)}
        onConfirm={() => persistence.persist(true, true)}
      />

      {draftActions.removedRowState ? (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(var(--entry-action-bar-height)+1.25rem)] right-4 z-40 flex max-w-md items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-xs text-white shadow-xl backdrop-blur-sm dark:border-ui-line-dark dark:bg-ui-surface-dark-deep/95 dark:text-ui-text-dark"
        >
          <span className="truncate">
            Se quitó <strong className="font-bold text-white dark:text-ui-text-dark-strong">{draftActions.removedRowState.row.product.productName}</strong>
          </span>
          <button
            type="button"
            onClick={draftActions.undoRemoveRow}
            className="ml-auto shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 font-bold text-white transition hover:bg-brand-500 active:scale-95 dark:bg-sky-600 dark:text-white dark:hover:bg-sky-500"
          >
            Deshacer
          </button>
          <button
            type="button"
            onClick={draftActions.dismissUndoToast}
            className="grid size-6 place-items-center rounded text-slate-400 hover:text-white dark:hover:text-ui-text-dark-strong"
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </aside>
      ) : null}

      <ProductionEntryActionBar
        canClose={canClose}
        footerStatus={footerStatus}
        pendingClosureReasons={pendingClosureReasons}
        dayShift={buildResult.calculation.day}
        nightShift={buildResult.calculation.night}
        dayHasReportData={dayHasReportData}
        nightHasReportData={nightHasReportData}
        onSaveDraft={() => persistence.persist(false)}
        onCloseDay={() => persistence.persist(true)}
      />
    </div>
  )
}

export default ProductionEntryPage
