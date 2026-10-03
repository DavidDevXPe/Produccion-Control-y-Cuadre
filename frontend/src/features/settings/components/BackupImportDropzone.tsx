import { ChangeEvent, DragEvent } from 'react'
import { AlertTriangle, Upload } from 'lucide-react'
import type { TrabundaBackupPreview } from '../backup/backupService'

export interface BackupImportDropzoneProps {
  isDragging: boolean
  error: string | null
  preview: TrabundaBackupPreview | null
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void
  onDragLeave: (event: DragEvent<HTMLLabelElement>) => void
  onDrop: (event: DragEvent<HTMLLabelElement>) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onConfirmRestore: () => void
}

export function BackupImportDropzone({
  isDragging,
  error,
  preview,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onConfirmRestore,
}: BackupImportDropzoneProps) {
  return (
    <section className="theme-surface overflow-hidden rounded-xl border border-slate-200 dark:border-ui-line-dark-soft">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-ui-line-dark-soft">
        <h2 className="font-bold text-slate-950 dark:text-white">
          Importar respaldo JSON
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-ui-text-dark-info">
          Compatible con el formato nuevo TRABUNDA_BACKUP y con respaldos
          antiguos exportados directamente desde localStorage.
        </p>
      </div>

      <div className="space-y-5 p-5">
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-5 py-8 text-center transition ${
            isDragging
              ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-500/20'
              : 'border-slate-300 hover:border-brand-400 hover:bg-brand-50 dark:border-ui-line-dark dark:hover:bg-ui-surface-dark-hover-soft'
          }`}
        >
          <Upload className="size-7 text-brand-600 dark:text-ui-text-dark-brand" aria-hidden="true" />
          <span className="font-bold text-slate-900 dark:text-white">
            Arrastra aquí tu archivo de respaldo o haz clic para seleccionar
          </span>
          <span className="text-sm text-slate-600 dark:text-ui-text-faint">
            El archivo no se sube a ningún servidor; se valida localmente en este navegador.
          </span>
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={onFileChange}
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {preview ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-amber-950 dark:text-amber-100">
                  Resumen antes de importar
                </h3>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-amber-800/80 dark:text-amber-200/80">Formato</dt>
                    <dd className="font-bold text-amber-950 dark:text-white">{preview.sourceFormat}</dd>
                  </div>
                  <div>
                    <dt className="text-amber-800/80 dark:text-amber-200/80">Jornadas</dt>
                    <dd className="font-bold text-amber-950 dark:text-white">{preview.productionDays}</dd>
                  </div>
                  <div>
                    <dt className="text-amber-800/80 dark:text-amber-200/80">Rango</dt>
                    <dd className="font-bold text-amber-950 dark:text-white">{preview.dateRange ?? 'Sin fechas'}</dd>
                  </div>
                  <div>
                    <dt className="text-amber-800/80 dark:text-amber-200/80">Rendimiento</dt>
                    <dd className="font-bold text-amber-950 dark:text-white">{preview.performanceRecords} registros</dd>
                  </div>
                </dl>
                {preview.warnings.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900 dark:text-amber-100">
                    {preview.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  onClick={onConfirmRestore}
                  className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-amber-950 transition hover:bg-amber-400"
                >
                  Confirmar importación y reemplazar datos locales
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
