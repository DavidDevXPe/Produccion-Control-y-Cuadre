import { Search } from 'lucide-react'

export interface ProductionBreakdownToolbarProps {
  readonly query: string
  readonly onQueryChange: (query: string) => void
  readonly onExpandAll: () => void
  readonly onCollapseAll: () => void
}

export function ProductionBreakdownToolbar({
  query,
  onQueryChange,
  onExpandAll,
  onCollapseAll,
}: ProductionBreakdownToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="min-h-8 rounded-lg px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-900"
          onClick={onExpandAll}
        >
          Expandir todo
        </button>
        <button
          type="button"
          className="min-h-8 rounded-lg px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-900"
          onClick={onCollapseAll}
        >
          Contraer todo
        </button>
      </div>
      <label className="relative block w-full sm:w-64">
        <span className="sr-only">Buscar familia o producto</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar producto..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-500 focus:border-brand-400 focus:bg-white"
        />
      </label>
    </div>
  )
}
