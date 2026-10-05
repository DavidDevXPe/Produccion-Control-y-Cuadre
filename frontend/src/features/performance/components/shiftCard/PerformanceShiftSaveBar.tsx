import { Save } from 'lucide-react'
import { buttonStyles } from '../../../../components/ui/buttonStyles'
import type { PerformanceRecord } from '../../model/types'

export interface PerformanceShiftSaveBarProps {
  readonly saveState: 'IDLE' | 'SAVED' | 'ERROR'
  readonly performance: PerformanceRecord
  readonly readOnly: boolean
  readonly onSave: () => void
}

export function PerformanceShiftSaveBar({
  saveState,
  performance,
  readOnly,
  onSave,
}: PerformanceShiftSaveBarProps) {
  return (
    <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p
        className={`text-xs font-semibold ${saveState === 'ERROR' ? 'text-rose-700' : 'text-slate-500'}`}
        role={saveState === 'ERROR' ? 'alert' : 'status'}
      >
        {saveState === 'SAVED'
          ? 'Información de rendimiento guardada.'
          : saveState === 'ERROR'
            ? performance.validationMessage
            : performance.isComplete
              ? 'Indicadores recalculados con el reporte físico vigente.'
              : performance.validationMessage ?? 'Completa los datos operativos del turno.'}
      </p>
      {!readOnly ? (
        <button
          type="button"
          onClick={onSave}
          className={`${buttonStyles('primary', 'sm')} shrink-0`}
        >
          <Save className="size-4" aria-hidden="true" />
          Guardar rendimiento
        </button>
      ) : null}
    </div>
  )
}

