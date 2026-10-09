import { AlertTriangle } from 'lucide-react'
import { formatIsoDate, formatIsoWeekday } from '../../../utils/formatters'

export interface ProductionDayDeleteDialogProps {
  isOpen: boolean
  date: string
  processLabel: string
  onClose: () => void
  onConfirm: () => void
}

export function ProductionDayDeleteDialog({
  isOpen,
  date,
  processLabel,
  onClose,
  onConfirm,
}: ProductionDayDeleteDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-day-title"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6 dark:border-ui-line-dark dark:bg-ui-surface-dark"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="delete-day-title"
              className="text-base font-bold text-slate-950 dark:text-ui-text-dark-strong"
            >
              ¿Eliminar jornada de {processLabel}?
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-ui-text-dark-soft">
              Se eliminará permanentemente el registro borrador del{' '}
              <strong>{formatIsoWeekday(date)} {formatIsoDate(date)}</strong>. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-ui-line-dark dark:text-ui-text-dark-pale dark:hover:bg-ui-surface-dark-compact"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700"
          >
            Eliminar jornada
          </button>
        </div>
      </section>
    </div>
  )
}
