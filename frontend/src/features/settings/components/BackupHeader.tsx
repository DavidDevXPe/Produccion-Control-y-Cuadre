import { Download, RotateCcw } from 'lucide-react'

export interface BackupHeaderProps {
  onShowResetModal: () => void
  onExportBackup: () => void
}

export function BackupHeader({ onShowResetModal, onExportBackup }: BackupHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-ui-text-dark-brand">
          Administración
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Datos y respaldos
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-ui-text-dark-info">
          Exporta una copia versionada del navegador o restaura un respaldo
          validado. Antes de importar se genera automáticamente una copia de
          seguridad del estado actual.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onShowResetModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Restablecer datos
        </button>
        <button
          type="button"
          onClick={onExportBackup}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
        >
          <Download className="size-4" aria-hidden="true" />
          Exportar respaldo
        </button>
      </div>
    </div>
  )
}
