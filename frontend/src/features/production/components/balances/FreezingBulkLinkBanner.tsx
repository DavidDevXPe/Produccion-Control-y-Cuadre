export interface FreezingBulkLinkBannerProps {
  freezingPendingLinkCount: number
  onOpenBulkFreezingLink: () => void
  prevProcessName?: string
}

export function FreezingBulkLinkBanner({
  freezingPendingLinkCount,
  onOpenBulkFreezingLink,
  prevProcessName = 'Envasado',
}: FreezingBulkLinkBannerProps) {
  if (freezingPendingLinkCount <= 0) return null

  return (
    <div className="border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-ui-line-dark-grid">
      <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-ui-amber-border-dark-soft dark:bg-ui-amber-surface-dark-deep">
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-amber-900 dark:text-ui-amber-text-dark">
            Vinculación FIFO disponible
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-ui-amber-text-dark-pale">
            {freezingPendingLinkCount}{' '}
            {freezingPendingLinkCount === 1
              ? 'producto tiene'
              : 'productos tienen'}{' '}
            kilos pendientes de vincular. El sistema consumirá primero las
            jornadas de {prevProcessName} abiertas más antiguas para cada producto.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenBulkFreezingLink}
          className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-amber-400 bg-white px-3 text-xs font-extrabold text-amber-900 shadow-sm transition-all hover:border-amber-500 hover:bg-amber-100 hover:shadow-md active:scale-[0.98] dark:border-ui-amber-border-dark dark:bg-ui-surface-dark dark:text-ui-amber-text-dark-bright dark:hover:border-ui-amber-text-dark dark:hover:bg-ui-amber-surface-dark dark:hover:text-ui-amber-text-dark-pale"
        >
          Vincular todos FIFO
        </button>
      </div>
    </div>
  )
}
