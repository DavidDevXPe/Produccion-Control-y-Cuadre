import { ChangeEvent, DragEvent, useState } from 'react'
import { AlertTriangle, Database, Download, RotateCcw, ShieldCheck, Upload } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import {
  readStorageQuarantine,
  STORAGE_QUARANTINE_REASON_LABELS,
} from '../../../storage/storageQuarantine'
import {
  createTrabundaBackup,
  downloadJsonFile,
  parseTrabundaBackup,
  restoreTrabundaBackup,
  type TrabundaBackupPreview,
} from '../backup/backupService'

function backupFilename(prefix = 'trabunda-backup') {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.json`
}

function quarantinedItemCount(payload: unknown): number {
  return Array.isArray(payload) ? payload.length : 1
}

export function DataBackupsPage() {
  const [quarantine] = useState(() => readStorageQuarantine())
  const [preview, setPreview] = useState<TrabundaBackupPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  const usedBytes = Object.keys(localStorage).reduce((acc, key) => {
    return acc + (localStorage.getItem(key)?.length || 0) * 2
  }, 0)
  const maxEstimatedBytes = 5 * 1024 * 1024 // 5 MB
  const usagePercentage = Math.min(100, Math.round((usedBytes / maxEstimatedBytes) * 100))
  const usedKb = (usedBytes / 1024).toFixed(1)

  const exportBackup = () => {
    downloadJsonFile(backupFilename(), createTrabundaBackup())
  }

  const exportQuarantine = () => {
    downloadJsonFile(backupFilename('trabunda-datos-apartados'), quarantine)
  }

  const processBackupFile = async (file: File) => {
    setPreview(null)
    setError(null)
    try {
      setPreview(parseTrabundaBackup(await file.text()))
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No se pudo leer el respaldo seleccionado.',
      )
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processBackupFile(file)
      event.target.value = ''
    }
  }

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      await processBackupFile(file)
    }
  }

  const confirmResetData = () => {
    downloadJsonFile(backupFilename('trabunda-respaldo-autoguardado'), createTrabundaBackup())
    localStorage.clear()
    window.location.reload()
  }

  const confirmRestore = () => {
    if (!preview) return
    downloadJsonFile(backupFilename('trabunda-preimportacion'), createTrabundaBackup())
    restoreTrabundaBackup(preview)
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-[88rem] space-y-6">
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
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Restablecer datos
          </button>
          <button
            type="button"
            onClick={exportBackup}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            <Download className="size-4" aria-hidden="true" />
            Exportar respaldo
          </button>
        </div>
      </div>

      <section className="theme-surface overflow-hidden rounded-xl border border-slate-200 p-5 dark:border-ui-line-dark-soft">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="size-5 text-brand-600 dark:text-ui-text-dark-brand" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">Almacenamiento Local del Navegador</h2>
              <p className="text-xs text-slate-600 dark:text-ui-text-dark-info">
                Espacio utilizado: {usedKb} KB de ~5 MB estimados ({usagePercentage}%)
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-ui-surface-dark-soft">
          <div
            className={`h-full transition-all duration-300 ${
              usagePercentage > 85 ? 'bg-rose-500' : usagePercentage > 60 ? 'bg-amber-500' : 'bg-brand-600'
            }`}
            style={{ width: `${Math.max(2, usagePercentage)}%` }}
          />
        </div>
      </section>

      {quarantine.length > 0 ? (
        <section
          aria-labelledby="quarantine-title"
          className="theme-surface overflow-hidden rounded-xl border border-amber-300 dark:border-amber-500/40"
        >
          <div className="flex flex-col gap-3 border-b border-amber-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between dark:border-amber-500/30">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <h2 id="quarantine-title" className="font-bold text-slate-950 dark:text-white">
                  Datos apartados por seguridad
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-ui-text-dark-info">
                  Al abrir la aplicación se encontraron datos guardados que no se pudieron
                  cargar. Se conservó una copia intacta para que no se pierdan cuando se
                  guarde una jornada nueva. No se borran automáticamente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={exportQuarantine}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download className="size-4" aria-hidden="true" />
              Exportar datos apartados
            </button>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-ui-line-dark-soft">
            {quarantine.map((entry, index) => (
              <li
                key={`${entry.sourceKey}-${entry.reason}-${entry.quarantinedAt}-${index}`}
                className="px-5 py-3 text-sm"
              >
                <p className="font-bold text-slate-900 dark:text-white">
                  {STORAGE_QUARANTINE_REASON_LABELS[entry.reason]}
                </p>
                <p className="mt-0.5 text-slate-600 dark:text-ui-text-faint">
                  {quarantinedItemCount(entry.payload)}{' '}
                  {quarantinedItemCount(entry.payload) === 1 ? 'elemento' : 'elementos'} ·
                  origen {entry.sourceKey} · apartado el{' '}
                  {new Date(entry.quarantinedAt).toLocaleString('es-PE')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
              onChange={handleFileChange}
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
                    onClick={confirmRestore}
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

      {showResetModal ? (
        <Modal
          titleId="reset-modal-title"
          onClose={() => setShowResetModal(false)}
        >
          <div className="space-y-4 p-6 text-sm text-slate-700 dark:text-slate-200">
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
                onClick={() => setShowResetModal(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmResetData}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
              >
                Respaldar y restablecer
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
