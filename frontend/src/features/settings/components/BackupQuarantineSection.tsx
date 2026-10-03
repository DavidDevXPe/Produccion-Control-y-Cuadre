import { Download, ShieldCheck } from 'lucide-react'
import {
  STORAGE_QUARANTINE_REASON_LABELS,
  type StorageQuarantineEntry,
} from '../../../storage/storageQuarantine'

function quarantinedItemCount(payload: unknown): number {
  return Array.isArray(payload) ? payload.length : 1
}

export interface BackupQuarantineSectionProps {
  quarantine: readonly StorageQuarantineEntry[]
  onExportQuarantine: () => void
}

export function BackupQuarantineSection({
  quarantine,
  onExportQuarantine,
}: BackupQuarantineSectionProps) {
  if (quarantine.length === 0) return null

  return (
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
          onClick={onExportQuarantine}
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
  )
}
