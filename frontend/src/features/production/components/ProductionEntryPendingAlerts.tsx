import type { ClosureMessage, ProductionClosureValidation } from '../model/businessRules'
import {
  buildClosureReviewItems,
  type ClosureReviewItem,
} from '../model/closureReview'

export interface ProductionEntryPendingAlertsProps {
  canClose: boolean
  closureValidation: ProductionClosureValidation
  diagnostics: readonly ClosureMessage[]
  pendingClosureReasons: readonly string[]
  reviewItems?: readonly ClosureReviewItem[]
  saveError: string
}

export function ProductionEntryPendingAlerts({
  canClose,
  closureValidation,
  diagnostics,
  pendingClosureReasons,
  reviewItems: providedReviewItems,
  saveError,
}: ProductionEntryPendingAlertsProps) {
  const reviewItems =
    providedReviewItems ??
    buildClosureReviewItems({
      pendingClosureReasons,
      closureValidation,
      diagnostics,
    })
  const reviewMessages = reviewItems.map((item) => item.message)
  const showReview = reviewMessages.length > 0
  const warningsOnly = canClose && closureValidation.warnings.length > 0

  return (
    <>
      {showReview ? (
        <div
          id="pendientes-para-cerrar"
          tabIndex={-1}
          className="scroll-mt-28 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 outline-none dark:border-amber-500/30 dark:bg-amber-500/10"
        >
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-amber-900 dark:text-amber-300">
            {warningsOnly ? 'Observaciones para revisar' : 'Pendientes para cerrar'}
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900 dark:text-amber-200">
            {reviewMessages.map((message) => (
              <li key={message}>• {message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {saveError ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          {saveError}
        </div>
      ) : null}
    </>
  )
}
