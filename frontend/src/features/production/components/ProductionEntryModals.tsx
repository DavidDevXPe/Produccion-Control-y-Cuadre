import { BulkFreezingLinkDialog } from './BulkFreezingLinkDialog'
import { CloseConfirmationDialog } from './CloseConfirmationDialog'
import { ProcessChangeDialog } from './ProcessChangeDialog'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import type { Kg100, ProductionProcess } from '../model/types'
import type { CaptureBuildResult, ProductionCaptureDraft } from '../capture/productionCapture'
import type { ProductionBusinessSummary, ProductionClosureValidation } from '../model/businessRules'

export interface ProductionEntryModalsProps {
  pendingProcessChange: ProductionProcess | null
  draft: ProductionCaptureDraft
  onCancelProcessChange: () => void
  onConfirmProcessChange: (process: ProductionProcess) => void
  isBulkFreezingLinkConfirmationOpen: boolean
  freezingPendingLinkCount: number
  onCancelBulkFreezingLink: () => void
  onConfirmBulkFreezingLink: () => void
  isCloseConfirmationOpen: boolean
  isFreezing: boolean
  buildResult: CaptureBuildResult
  totalReportedKg100: Kg100
  freezingLinkedThisDayKg100: Kg100
  freezingBalanceExplanation: { untracedFrozenKg100: Kg100 }
  businessSummary: ProductionBusinessSummary
  closureValidation: ProductionClosureValidation
  onCancelCloseConfirmation: () => void
  onConfirmClose: () => void
  removedRowState: { row: ProductionCaptureDraft['rows'][number]; index: number } | null
  onUndoRemoveRow: () => void
  onDismissUndoToast: () => void
}

export function ProductionEntryModals({
  pendingProcessChange,
  draft,
  onCancelProcessChange,
  onConfirmProcessChange,
  isBulkFreezingLinkConfirmationOpen,
  freezingPendingLinkCount,
  onCancelBulkFreezingLink,
  onConfirmBulkFreezingLink,
  isCloseConfirmationOpen,
  isFreezing,
  buildResult,
  totalReportedKg100,
  freezingLinkedThisDayKg100,
  freezingBalanceExplanation,
  businessSummary,
  closureValidation,
  onCancelCloseConfirmation,
  onConfirmClose,
  removedRowState,
  onUndoRemoveRow,
  onDismissUndoToast,
}: ProductionEntryModalsProps) {
  return (
    <>
      <ProcessChangeDialog
        pendingProcess={pendingProcessChange}
        currentProcess={draft.process}
        onCancel={onCancelProcessChange}
        onConfirm={onConfirmProcessChange}
      />

      <BulkFreezingLinkDialog
        isOpen={isBulkFreezingLinkConfirmationOpen}
        pendingLinkCount={freezingPendingLinkCount}
        onCancel={onCancelBulkFreezingLink}
        onConfirm={onConfirmBulkFreezingLink}
      />

      <CloseConfirmationDialog
        isOpen={isCloseConfirmationOpen}
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
        onCancel={onCancelCloseConfirmation}
        onConfirm={onConfirmClose}
      />

      {removedRowState ? (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(var(--entry-action-bar-height)+1.25rem)] right-4 z-40 flex max-w-md items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-xs text-white shadow-xl backdrop-blur-sm dark:border-ui-line-dark dark:bg-ui-surface-dark-deep/95 dark:text-ui-text-dark"
        >
          <span className="truncate">
            Se quitó <strong className="font-bold text-white dark:text-ui-text-dark-strong">{removedRowState.row.product.productName}</strong>
          </span>
          <button
            type="button"
            onClick={onUndoRemoveRow}
            className="ml-auto shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 font-bold text-white transition hover:bg-brand-500 active:scale-95 dark:bg-sky-600 dark:text-white dark:hover:bg-sky-500"
          >
            Deshacer
          </button>
          <button
            type="button"
            onClick={onDismissUndoToast}
            className="grid size-6 place-items-center rounded text-slate-400 hover:text-white dark:hover:text-ui-text-dark-strong"
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </aside>
      ) : null}
    </>
  )
}
