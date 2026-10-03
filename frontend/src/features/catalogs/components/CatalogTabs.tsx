import { Layers, Sliders } from 'lucide-react'

interface CatalogTabsProps {
  activeTab: 'PRODUCTS' | 'BENCHMARKS'
  productsCount: number
  onSelectTab: (tab: 'PRODUCTS' | 'BENCHMARKS') => void
}

export function CatalogTabs({
  activeTab,
  productsCount,
  onSelectTab,
}: CatalogTabsProps) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-200">
      <button
        type="button"
        onClick={() => onSelectTab('PRODUCTS')}
        className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
          activeTab === 'PRODUCTS'
            ? 'border-brand-700 text-brand-700 dark:border-brand-400 dark:text-brand-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
        }`}
      >
        <Layers className="size-4" />
        <span>Productos y Equivalencias ({productsCount})</span>
      </button>
      <button
        type="button"
        onClick={() => onSelectTab('BENCHMARKS')}
        className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
          activeTab === 'BENCHMARKS'
            ? 'border-brand-700 text-brand-700 dark:border-brand-400 dark:text-brand-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
        }`}
      >
        <Sliders className="size-4" />
        <span>Parámetros Operativos</span>
      </button>
    </div>
  )
}

