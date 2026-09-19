import { ChangeEvent, useState } from 'react'
import { AlertTriangle, Download, Upload } from 'lucide-react'
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

export function DataBackupsPage() {
  const [preview, setPreview] = useState<TrabundaBackupPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const exportBackup = () => {
    downloadJsonFile(backupFilename(), createTrabundaBackup())
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setPreview(null)
    setError(null)
    if (!file) return

    try {
      setPreview(parseTrabundaBackup(await file.text()))
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No se pudo leer el respaldo seleccionado.',
      )
    } finally {
      event.target.value = ''
    }
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-[#00b7f1]">
            Administración
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Datos y respaldos
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-[#b7d7ea]">
            Exporta una copia versionada del navegador o restaura un respaldo
            validado. Antes de importar se genera automáticamente una copia de
            seguridad del estado actual.
          </p>
        </div>

        <button
          type="button"
          onClick={exportBackup}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
        >
          <Download className="size-4" aria-hidden="true" />
          Exportar respaldo
        </button>
      </div>

      <section className="theme-surface overflow-hidden rounded-xl border border-slate-200 dark:border-[#244052]">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-[#244052]">
          <h2 className="font-bold text-slate-950 dark:text-white">
            Importar respaldo JSON
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#b7d7ea]">
            Compatible con el formato nuevo TRABUNDA_BACKUP y con respaldos
            antiguos exportados directamente desde localStorage.
          </p>
        </div>

        <div className="space-y-5 p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50 dark:border-[#2b5268] dark:hover:bg-[#0f2230]">
            <Upload className="size-7 text-brand-600 dark:text-[#00b7f1]" aria-hidden="true" />
            <span className="font-bold text-slate-900 dark:text-white">
              Seleccionar archivo de respaldo
            </span>
            <span className="text-sm text-slate-500 dark:text-[#94a9b8]">
              El archivo no se sube a ningún servidor; se valida en este navegador.
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
    </div>
  )
}
