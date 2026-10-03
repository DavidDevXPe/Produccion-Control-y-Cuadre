import { Trash2 } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import type { ProductionCatalogItem } from '../../production/capture/productionCatalog'
import type { CatalogFamily } from '../hooks/useCatalogsData'

interface CatalogProductModalProps {
  isOpen: boolean
  onClose: () => void
  editingProduct: ProductionCatalogItem | null
  formName: string
  onFormNameChange: (value: string) => void
  formFamilyId: string
  onFormFamilyIdChange: (value: string) => void
  formTechnicalClass: 'POLAR' | 'USA' | 'GENERAL' | 'UNCLASSIFIED'
  onFormTechnicalClassChange: (value: 'POLAR' | 'USA' | 'GENERAL' | 'UNCLASSIFIED') => void
  newAlias: string
  onNewAliasChange: (value: string) => void
  onAddAlias: () => void
  onRemoveAlias: (alias: string) => void
  onSave: (e: React.FormEvent) => void
  families: readonly CatalogFamily[]
}

export function CatalogProductModal({
  isOpen,
  onClose,
  editingProduct,
  formName,
  onFormNameChange,
  formFamilyId,
  onFormFamilyIdChange,
  formTechnicalClass,
  onFormTechnicalClassChange,
  newAlias,
  onNewAliasChange,
  onAddAlias,
  onRemoveAlias,
  onSave,
  families,
}: CatalogProductModalProps) {
  if (!isOpen) return null

  return (
    <Modal titleId="catalog-modal-title" onClose={onClose}>
      <div className="p-6">
        <h2
          id="catalog-modal-title"
          className="mb-4 text-lg font-bold text-slate-900 dark:text-white"
        >
          {editingProduct ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
        </h2>
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Nombre del Producto
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => onFormNameChange(e.target.value)}
              placeholder="Ej. TALLO CRUDO CONGELADO 1-2 KG"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-200 dark:bg-slate-50 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Familia
              </label>
              <select
                value={formFamilyId}
                onChange={(e) => onFormFamilyIdChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-200 dark:bg-slate-50 dark:text-white"
              >
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Clasificación Térmica
              </label>
              <select
                value={formTechnicalClass}
                onChange={(e) =>
                  onFormTechnicalClassChange(
                    e.target.value as
                      | 'POLAR'
                      | 'USA'
                      | 'GENERAL'
                      | 'UNCLASSIFIED',
                  )
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-200 dark:bg-slate-50 dark:text-white"
              >
                <option value="GENERAL">General</option>
                <option value="POLAR">POLAR</option>
                <option value="USA">USA</option>
                <option value="UNCLASSIFIED">Sin Clasificar</option>
              </select>
            </div>
          </div>

          {editingProduct ? (
            <div className="border-t border-slate-200 pt-4 dark:border-slate-200">
              <label className="mb-2 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Sinónimos y Aliases (para coincidencia con planillas Excel)
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAlias}
                  onChange={(e) => onNewAliasChange(e.target.value)}
                  placeholder="Nuevo alias en Excel..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-200 dark:bg-slate-50 dark:text-white"
                />
                <button
                  type="button"
                  onClick={onAddAlias}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100"
                >
                  Agregar Alias
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {editingProduct.aliases && editingProduct.aliases.length > 0 ? (
                  editingProduct.aliases.map((alias) => (
                    <span
                      key={alias}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-200 dark:bg-slate-100 dark:text-white"
                    >
                      {alias}
                      <button
                        type="button"
                        onClick={() => onRemoveAlias(alias)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Eliminar alias"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-xs italic text-slate-400">
                    No hay sinónimos agregados aún.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-200 dark:text-slate-300 dark:hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

