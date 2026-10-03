import { Database } from 'lucide-react'

export interface BackupStorageCardProps {
  usedKb: string
  usagePercentage: number
}

export function BackupStorageCard({ usedKb, usagePercentage }: BackupStorageCardProps) {
  return (
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
  )
}
