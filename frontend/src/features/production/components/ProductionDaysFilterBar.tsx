import { Download, Search, X } from 'lucide-react'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { ProcessSelector } from './ProcessSelector'
import type { ProductionProcess } from '../model/types'

export interface ProductionDaysFilterBarProps {
  selectedProcess: ProductionProcess
  packingDaysCount?: number
  freezingDaysCount?: number
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  selectedDate: string
  onSelectedDateChange: (date: string) => void
  minDate: string
  maxDate: string
  onSelectProcess: (process: ProductionProcess) => void
  onExportCsv: () => void
  registeredDaysCount: number
}

export function ProductionDaysFilterBar({
  selectedProcess,
  searchQuery,
  onSearchQueryChange,
  selectedDate,
  onSelectedDateChange,
  minDate,
  maxDate,
  onSelectProcess,
  onExportCsv,
  registeredDaysCount,
}: ProductionDaysFilterBarProps) {
  return (
    <div className="space-y-4">
      <ProcessSelector
        value={selectedProcess}
        onChange={onSelectProcess}
      />

      {/* Filter bar exactly matching BalancesPage */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Buscar por lote o supervisor..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-8 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="day-date-filter"
            className="text-xs font-semibold text-slate-600 whitespace-nowrap"
          >
            Fecha:
          </label>
          <input
            id="day-date-filter"
            type="date"
            aria-label="Filtrar por fecha"
            value={selectedDate}
            min={minDate}
            max={maxDate}
            onChange={(e) => onSelectedDateChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {selectedDate ? (
            <button
              type="button"
              onClick={() => onSelectedDateChange('')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Limpiar
            </button>
          ) : null}

          <button
            type="button"
            onClick={onExportCsv}
            disabled={registeredDaysCount === 0}
            className={`no-print ${buttonStyles('secondary', 'sm')}`}
          >
            <Download className="size-3.5" />
            <span>Exportar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
