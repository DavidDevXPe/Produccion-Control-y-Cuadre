import type { ProductionClosureValidation, ClosureMessage } from '../model/businessRules'

export interface ProductionEntryPendingAlertsProps {
  canClose: boolean
  closureValidation: ProductionClosureValidation
  diagnostics: readonly ClosureMessage[]
  pendingClosureReasons: readonly string[]
  saveError: string
}

export function ProductionEntryPendingAlerts({
  canClose,
  closureValidation,
  diagnostics,
  pendingClosureReasons,
  saveError,
}: ProductionEntryPendingAlertsProps) {
  const showBlockers =
    !canClose &&
    (closureValidation.blockers.length > 0 ||
      diagnostics.length > 0 ||
      pendingClosureReasons.length > 0)

  return (
    <>
      {showBlockers ? (
        <div
          id="pendientes-para-cerrar"
          tabIndex={-1}
          className="scroll-mt-28 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 outline-none dark:border-amber-500/30 dark:bg-amber-500/10"
        >
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-amber-900 dark:text-amber-300">
            Pendientes para cerrar
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900 dark:text-amber-200">
            {(pendingClosureReasons.length > 0
              ? pendingClosureReasons
              : [
                  ...closureValidation.blockers
                    .filter((blocker: ClosureMessage) => blocker.code !== 'TUNNEL_MOVEMENTS_REQUIRED')
                    .map((blocker: ClosureMessage) => blocker.message),
                  ...diagnostics
                    .filter((diagnostic: ClosureMessage) => diagnostic.code !== 'SHIFT_BALANCED')
                    .map((diagnostic: ClosureMessage) => diagnostic.message),
                ]
                  .filter((message, index, messages) => messages.indexOf(message) === index)
                  .slice(0, 12)
            ).map((message) => (
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
