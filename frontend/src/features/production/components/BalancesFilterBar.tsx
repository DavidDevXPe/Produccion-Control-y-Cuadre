import { Search, X } from 'lucide-react'

export interface BalancesFilterBarProps {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  selectedDate: string
  onSelectedDateChange: (date: string) => void
  weekStart: string
  weekEnd: string
}

export function BalancesFilterBar({
  searchQuery,
  onSearchQueryChange,
  selectedDate,
  onSelectedDateChange,
  weekStart,
  weekEnd,
}: BalancesFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Buscar por producto o familia..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-8 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchQueryChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="origin-date-filter" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
          Fecha de origen:
        </label>
        <input
          id="origin-date-filter"
          type="date"
          value={selectedDate}
          min={weekStart}
          max={weekEnd}
          onChange={(e) => onSelectedDateChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {selectedDate ? (
          <button
            type="button"
            onClick={() => onSelectedDateChange('')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Limpiar fecha
          </button>
        ) : null}
      </div>
    </div>
  )
}
