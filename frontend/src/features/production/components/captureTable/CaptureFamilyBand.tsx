export interface CaptureFamilyBandProps {
  readonly label: string
  readonly count: number
}

export function CaptureFamilyBand({ label, count }: CaptureFamilyBandProps) {
  return (
    <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-200 dark:bg-slate-100/40">
      <th
        colSpan={9}
        className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50/80 px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-900 dark:border-r-slate-200 dark:bg-slate-50 dark:text-white sm:px-5"
      >
        <div className="flex items-center gap-2">
          <span>{label}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[0.625rem] font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-100 dark:text-slate-300 dark:ring-slate-200">
            {count} {count === 1 ? 'producto' : 'productos'}
          </span>
        </div>
      </th>
    </tr>
  )
}
