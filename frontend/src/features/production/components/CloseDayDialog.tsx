import { AlertTriangle } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import type { ClosureMessage } from '../model/businessRules'

interface CloseDayDialogProps {
  titleId: string
  title: string
  description: string
  /** Figures shown before confirming, so the user closes knowing what is closed. */
  summary: readonly { label: string; value: string }[]
  /** Observations that will stay with the journey once it is closed. */
  warnings: readonly ClosureMessage[]
  /** Optional heading for each warning (for example by rule code). */
  warningTitle?: (warning: ClosureMessage) => string | null
  error: string
  onCancel: () => void
  onConfirm: () => void
}

const cleanConfirmClasses =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-700 bg-emerald-700 px-5 text-sm font-extrabold text-white shadow-sm transition-colors hover:border-emerald-800 hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:border-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500'

/**
 * Confirmation to close a journey. Closing with observations is a legitimate,
 * documented outcome, so it is presented in amber and never as an error.
 */
export function CloseDayDialog({
  titleId,
  title,
  description,
  summary,
  warnings,
  warningTitle,
  error,
  onCancel,
  onConfirm,
}: CloseDayDialogProps) {
  const hasWarnings = warnings.length > 0

  return (
    <Modal titleId={titleId} onClose={onCancel}>
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700"
            aria-hidden="true"
          >
            <AlertTriangle className="size-4" />
          </span>

          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold text-slate-950">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          {summary.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                {label}
              </dt>
              <dd className="number-tabular mt-1 text-sm font-bold text-slate-950">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {hasWarnings ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-600">
                Advertencias antes del cierre
              </p>
              <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[0.625rem] font-extrabold text-amber-800">
                {warnings.length}{' '}
                {warnings.length === 1 ? 'advertencia' : 'advertencias'}
              </span>
            </div>

            <ul className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50">
              {warnings.map((warning, index) => {
                const heading = warningTitle?.(warning) ?? null

                return (
                  <li
                    key={`${warning.code}-${
                      warning.familyKey ?? warning.productId ?? 'GENERAL'
                    }`}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      index > 0 ? 'border-t border-amber-200' : ''
                    }`}
                  >
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-amber-600"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      {heading ? (
                        <p className="text-xs font-extrabold text-amber-900">
                          {heading}
                        </p>
                      ) : null}
                      <p
                        className={`text-xs leading-5 text-slate-700 ${
                          heading ? 'mt-1' : ''
                        }`}
                      >
                        {warning.message}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800"
          >
            {error}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          onClick={onCancel}
          className={buttonStyles('secondary')}
        >
          Volver a revisar
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className={
            hasWarnings
              ? `${buttonStyles('warning')} px-5 font-extrabold`
              : cleanConfirmClasses
          }
        >
          {hasWarnings ? 'Cerrar con observación' : 'Cerrar jornada'}
        </button>
      </div>
    </Modal>
  )
}
