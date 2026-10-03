import { Search } from 'lucide-react'
import type { CatalogFamily } from '../hooks/useCatalogsData'

interface CatalogProductFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedFamily: string
  onFamilyChange: (value: string) => void
  selectedStatus: 'ALL' | 'ACTIVE' | 'INACTIVE'
  onStatusChange: (status: 'ALL' | 'ACTIVE' | 'INACTIVE') => void
  families: readonly CatalogFamily[]
}

export function CatalogProductFilters({
  searchTerm,
  onSearchChange,
  selectedFamily,
  onFamilyChange,
  selectedStatus,
  onStatusChange,
  families,
}: CatalogProductFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por producto, familia o alias..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-200 dark:bg-slate-50 dark:text-white dark:placeholder-slate-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedFamily}
          onChange={(e) => onFamilyChange(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-200 dark:bg-slate-50 dark:text-white"
        >
          <option value="ALL">Todas las familias</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-200 dark:bg-slate-50 dark:text-white"
        >
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">Solo Activos</option>
          <option value="INACTIVE">Solo Inactivos</option>
        </select>
      </div>
    </div>
  )
}

