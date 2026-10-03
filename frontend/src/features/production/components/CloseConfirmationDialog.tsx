import { AlertTriangle } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { ClosureMessage } from '../model/businessRules'

export interface CloseConfirmationDialogProps {
  readonly isOpen: boolean
  readonly summaryItems: readonly [string, string][]
  readonly warnings: readonly ClosureMessage[]
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

export function CloseConfirmationDialog({
  isOpen,
  summaryItems,
  warnings,
  onCancel,
  onConfirm,
}: CloseConfirmationDialogProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-[#020914]/90 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="yield-warning-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-ui-line-dark-grid dark:bg-ui-surface-dark"
      >
        {/* Encabezado */}
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-ui-line-dark-grid">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-ui-amber-text-dark">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h2
                id="yield-warning-title"
                className="text-base font-bold text-slate-950 dark:text-ui-text-dark-strong"
              >
                Cerrar jornada
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-ui-text-dark-soft">
                Después del cierre, esta jornada quedará en solo lectura.
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-5 py-4 sm:px-6">
          <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed/70">
            {summaryItems.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
                  {label}
                </dt>

                <dd className="number-tabular mt-1 text-sm font-bold text-slate-950 dark:text-ui-text-dark-strong">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {warnings.length > 0 ? (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-600 dark:text-ui-text-dark-soft">
                  Advertencias antes del cierre
                </p>

                <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[0.625rem] font-extrabold text-amber-800 dark:border-ui-amber-border-dark-soft dark:bg-ui-amber-surface-dark dark:text-ui-amber-text-dark">
                  {warnings.length}{' '}
                  {warnings.length === 1 ? 'advertencia' : 'advertencias'}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50 dark:border-ui-amber-border-dark-deep dark:bg-ui-amber-surface-dark-deep">
                {warnings.map((warning, index) => (
                  <div
                    key={`${warning.code}-${warning.familyKey ?? warning.productId ?? 'GENERAL'}`}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      index > 0
                        ? 'border-t border-amber-200 dark:border-amber-500/10'
                        : ''
                    }`}
                  >
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-ui-amber-text-dark"
                      aria-hidden="true"
                    />

                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-amber-900 dark:text-ui-amber-text-dark">
                        {warning.code === 'FREEZING_TRACEABILITY_DIFFERENCE'
                          ? 'Diferencia de trazabilidad'
                          : warning.code ===
                              'FREEZING_PRODUCT_TRACEABILITY_DIFFERENCE'
                            ? 'Producto con origen insuficiente'
                            : warning.code === 'ANILLAS_MP_EXCEEDS_AVAILABLE'
                              ? 'Variación técnica de MP · Anillas'
                              : warning.familyKey
                                ? 'Rendimiento de familia'
                                : 'Advertencia operativa'}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-700 dark:text-ui-text-dark-subtle">
                        {warning.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Botones */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-deep">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:border-ui-line-dark dark:bg-transparent dark:text-ui-text-dark-pale dark:hover:bg-ui-surface-dark-hover-strong dark:hover:text-white"
          >
            Volver a revisar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-700 bg-emerald-700 px-5 text-sm font-extrabold text-white shadow-sm transition hover:border-emerald-800 hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {warnings.length > 0 ? 'Cerrar con observación' : 'Cerrar jornada'}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}

