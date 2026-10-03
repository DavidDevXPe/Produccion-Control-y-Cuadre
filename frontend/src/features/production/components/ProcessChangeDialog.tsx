import { AlertTriangle } from 'lucide-react'
import type { ProductionProcess } from '../model/types'

export interface ProcessChangeDialogProps {
  readonly pendingProcess: ProductionProcess | null
  readonly currentProcess: ProductionProcess
  readonly onCancel: () => void
  readonly onConfirm: (process: ProductionProcess) => void
}

export function ProcessChangeDialog({
  pendingProcess,
  currentProcess,
  onCancel,
  onConfirm,
}: ProcessChangeDialogProps) {
  if (!pendingProcess) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="process-change-title"
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="process-change-title"
              className="text-base font-bold text-slate-950"
            >
              Cambiar a {pendingProcess === 'FREEZING' ? 'Congelamiento' : 'Envasado'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Existen datos sin guardar en la jornada de{' '}
              {currentProcess === 'FREEZING' ? 'Congelamiento' : 'Envasado'}. Se
              conservarán separados mientras cambias de proceso.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(pendingProcess)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800"
          >
            Cambiar proceso
          </button>
        </div>
      </section>
    </div>
  )
}

