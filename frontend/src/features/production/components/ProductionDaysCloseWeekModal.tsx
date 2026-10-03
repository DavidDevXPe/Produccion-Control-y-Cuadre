import { AlertTriangle } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { productionProcessLabels } from '../model/productionProcess'
import type { OperationalCalendarDay, OperationalWeekView } from '../state/ProductionDataContext'
import type { ProductionProcess } from '../model/types'

export interface ProductionDaysCloseWeekModalProps {
  isOpen: boolean
  onClose: () => void
  activeWeek: OperationalWeekView
  selectedProcess: ProductionProcess
  registeredDaysCount: number
  missingCalendarDays: readonly OperationalCalendarDay[]
  weekCloseError: string
  onConfirmWeekClosure: () => void
}

export function ProductionDaysCloseWeekModal({
  isOpen,
  onClose,
  activeWeek,
  selectedProcess,
  registeredDaysCount,
  missingCalendarDays,
  weekCloseError,
  onConfirmWeekClosure,
}: ProductionDaysCloseWeekModalProps) {
  if (!isOpen) return null

  return (
    <Modal
      titleId="week-close-title"
      size="md"
      onClose={onClose}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="week-close-title"
              className="text-base font-bold text-slate-950"
            >
              Cerrar semana {activeWeek.number} ·{' '}
              {productionProcessLabels[selectedProcess]}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Jornadas registradas: {registeredDaysCount} de 7. Después del
              cierre, la semana quedará disponible únicamente para consulta.
            </p>
          </div>
        </div>

        {missingCalendarDays.length > 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-700">
              Días sin registro
            </p>
            <ul className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
              {missingCalendarDays.map((day) => (
                <li key={day.isoDate}>
                  {day.label} {day.date} · SIN REGISTRO
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              Los días sin operación permanecerán como SIN REGISTRO; no se
              crearán jornadas de 0 kg.
            </p>
          </div>
        ) : null}

        {activeWeek.closureBlockers.length > 0 ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3"
          >
            <p className="text-xs font-bold text-rose-900">
              Jornadas que requieren revisión:
            </p>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-rose-800">
              {activeWeek.closureBlockers.map((blocker) => (
                <li key={blocker.dayId}>• {blocker.message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {weekCloseError ? (
          <p role="alert" className="mt-4 text-xs font-semibold text-rose-700">
            {weekCloseError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={activeWeek.closureBlockers.length > 0}
            onClick={onConfirmWeekClosure}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            Cerrar semana
          </button>
        </div>
      </div>
    </Modal>
  )
}

