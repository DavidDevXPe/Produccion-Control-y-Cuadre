import { CheckCircle, Edit2, Tag, XCircle } from 'lucide-react'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import type { ProductionCatalogItem } from '../../production/capture/productionCatalog'

interface CatalogProductTableProps {
  products: readonly ProductionCatalogItem[]
  onEditProduct: (product: ProductionCatalogItem) => void
  onToggleStatus: (productId: string) => void
}

export function CatalogProductTable({
  products,
  onEditProduct,
  onToggleStatus,
}: CatalogProductTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-200 dark:bg-slate-50/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-200 dark:bg-slate-50 dark:text-slate-600">
            <tr>
              <th className="px-4 py-3">Producto / Nombre Canónico</th>
              <th className="px-4 py-3">Familia</th>
              <th className="px-4 py-3">Clasificación</th>
              <th className="px-4 py-3">Sinónimos / Aliases Excel</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No se encontraron productos con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isActive = p.active ?? true
                return (
                  <tr key={p.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-100/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {p.productName}
                      </p>
                      <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{p.productId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-200 dark:bg-slate-100 dark:text-white">
                        {p.familyName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-500">
                      {p.technicalClassification ?? 'GENERAL'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {p.aliases && p.aliases.length > 0 ? (
                          p.aliases.map((alias) => (
                            <span
                              key={alias}
                              className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-[0.6875rem] font-medium text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                            >
                              <Tag className="size-3" />
                              {alias}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">Sin alias mapeados</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge tone={isActive ? 'success' : 'neutral'}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEditProduct(p)}
                          title="Editar producto"
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-100"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(p.productId)}
                          title={isActive ? 'Desactivar producto' : 'Activar producto'}
                          className={`rounded p-1.5 transition-colors ${
                            isActive
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-100'
                          }`}
                        >
                          {isActive ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

