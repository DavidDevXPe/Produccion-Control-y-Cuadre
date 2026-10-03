export interface BalancePanelToolbarProps {
  readonly groupsCount: number
  readonly onExpandAll: () => void
  readonly onCollapseAll: () => void
}

export function BalancePanelToolbar({
  groupsCount,
  onExpandAll,
  onCollapseAll,
}: BalancePanelToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-5">
      <p className="text-xs font-medium text-slate-500">
        {groupsCount} familias con producto pendiente
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="min-h-8 rounded-lg px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-900"
          onClick={onExpandAll}
        >
          Expandir todo
        </button>
        <span className="text-slate-300" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          className="min-h-8 rounded-lg px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-900"
          onClick={onCollapseAll}
        >
          Contraer todo
        </button>
      </div>
    </div>
  )
}

