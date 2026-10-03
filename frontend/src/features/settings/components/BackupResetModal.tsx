import { AlertTriangle } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'

export interface BackupResetModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmReset: () => void
}

export function BackupResetModal({
  isOpen,
  onClose,
  onConfirmReset,
}: BackupResetModalProps) {
  if (!isOpen) return null

  return (
    <Modal
      titleId="reset-modal-title"
      onClose={onClose}
    >
      <div className="space-y-4 p-6 text-sm text-slate-700 dark:text-white">
        <h2 id="reset-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
          Restablecer datos locales
        </h2>
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-600" aria-hidden="true" />
          <p className="text-xs leading-5">
            Esta acción borrará todas las jornadas y configuraciones guardadas en este navegador.
            Se descargará automáticamente un archivo de respaldo antes de limpiar la memoria.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-200 dark:text-slate-300 dark:hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmReset}
            className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
          >
            Respaldar y restablecer
          </button>
        </div>
      </div>
    </Modal>
  )
}
