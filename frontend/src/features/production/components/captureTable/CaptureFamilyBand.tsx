export interface CaptureFamilyBandProps {
  readonly label: string
  readonly count: number
}

export function CaptureFamilyBand({ label, count }: CaptureFamilyBandProps) {
  return (
    <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-canvas/90">
      <th
        colSpan={9}
        className="sticky left-0 z-10 border-l-4 border-l-brand-600 bg-slate-100/70 px-4 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-800 dark:border-l-brand-500 dark:bg-ui-surface-dark-canvas/90 dark:text-white"
      >
        <div className="flex items-center gap-2">
          <span>{label}</span>
          <span className="inline-flex items-center rounded-full border border-brand-200/80 bg-brand-50/70 px-2 py-0.5 text-[0.625rem] font-semibold text-brand-700 dark:border-ui-line-navy dark:bg-ui-surface-dark-compact dark:text-ui-text-dark-subtle">
            {count} {count === 1 ? 'producto' : 'productos'}
          </span>
        </div>
      </th>
    </tr>
  )
}
