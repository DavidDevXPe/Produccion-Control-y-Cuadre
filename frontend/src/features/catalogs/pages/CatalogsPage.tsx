import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Layers,
  Settings2,
  Tag,
  Sliders,
} from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import {
  getActiveProducts,
  addActiveProduct,
  updateActiveProduct,
  addAliasToActiveProduct,
  removeAliasFromActiveProduct,
  toggleProductActiveStatus,
  createStableProductId,
} from '../../production/capture/productCatalogRepository'
import type { ProductionCatalogItem } from '../../production/capture/productionCatalog'
import type { SummaryGroupId } from '../../production/model/types'
import { usePageTitle } from '../../../hooks/usePageTitle'

const FAMILIES = [
  { id: 'aleta-cruda', name: 'ALETA CRUDA', summaryGroupId: 'ALETA' as SummaryGroupId },
  { id: 'manto-crudo', name: 'MANTO CRUDO', summaryGroupId: 'MANTO' as SummaryGroupId },
  { id: 'anillas', name: 'ANILLAS', summaryGroupId: 'ANILLAS' as SummaryGroupId },
  { id: 'nuca-semilimpia', name: 'NUCA SEMILIMPIA', summaryGroupId: 'NUCA_SEMILIMPIA' as SummaryGroupId },
  { id: 'rejos-crudo', name: 'REJOS CRUDO', summaryGroupId: 'REJOS' as SummaryGroupId },
  { id: 'reproductor-crudo', name: 'REPRODUCTOR CRUDO', summaryGroupId: 'REPRODUCTOR' as SummaryGroupId },
  { id: 'pico', name: 'PICO', summaryGroupId: 'PICO' as SummaryGroupId },
  { id: 'recorte-crudo', name: 'RECORTE CRUDO', summaryGroupId: 'RECORTE_CRUDO' as SummaryGroupId },
  { id: 'recorte-cocido', name: 'RECORTE COCIDO', summaryGroupId: 'RECORTE_COCIDO' as SummaryGroupId },
  { id: 'subproductos', name: 'SUBPRODUCTOS', summaryGroupId: 'RECORTE_CRUDO' as SummaryGroupId },
]

export function CatalogsPage() {
  usePageTitle('Catálogos — TRABUNDA')

  const [products, setProducts] = useState<ProductionCatalogItem[]>(() => getActiveProducts())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'BENCHMARKS'>('PRODUCTS')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductionCatalogItem | null>(null)
  const [newAlias, setNewAlias] = useState('')

  // Form State
  const defaultFamily = FAMILIES[0] ?? { id: 'aleta-cruda', name: 'ALETA CRUDA', summaryGroupId: 'ALETA' as SummaryGroupId }
  const [formName, setFormName] = useState('')
  const [formFamilyId, setFormFamilyId] = useState(defaultFamily.id)
  const [formTechnicalClass, setFormTechnicalClass] = useState<'POLAR' | 'USA' | 'GENERAL' | 'UNCLASSIFIED'>('GENERAL')

  const reloadProducts = () => {
    setProducts(getActiveProducts())
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const active = p.active ?? true;
      if (selectedStatus === 'ACTIVE' && !active) return false
      if (selectedStatus === 'INACTIVE' && active) return false

      if (selectedFamily !== 'ALL' && p.familyId !== selectedFamily) return false

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchName = p.productName.toLowerCase().includes(query)
        const matchFamily = p.familyName.toLowerCase().includes(query)
        const matchAlias = p.aliases?.some((a) => a.toLowerCase().includes(query))
        return matchName || matchFamily || matchAlias
      }

      return true
    })
  }, [products, searchTerm, selectedFamily, selectedStatus])

  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setFormName('')
    setFormFamilyId(defaultFamily.id)
    setFormTechnicalClass('GENERAL')
    setNewAlias('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (product: ProductionCatalogItem) => {
    setEditingProduct(product)
    setFormName(product.productName)
    setFormFamilyId(product.familyId)
    setFormTechnicalClass(product.technicalClassification ?? 'GENERAL')
    setNewAlias('')
    setIsModalOpen(true)
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    const selectedFamilyObj = FAMILIES.find((f) => f.id === formFamilyId) ?? defaultFamily

    if (editingProduct) {
      updateActiveProduct(editingProduct.productId, {
        productName: formName,
        canonicalName: formName,
        familyId: selectedFamilyObj.id,
        familyName: selectedFamilyObj.name,
        summaryGroupId: selectedFamilyObj.summaryGroupId,
        technicalClassification: formTechnicalClass,
      })
    } else {
      const newId = createStableProductId(formName)
      addActiveProduct({
        productId: newId,
        productName: formName,
        canonicalName: formName,
        familyId: selectedFamilyObj.id,
        familyName: selectedFamilyObj.name,
        summaryGroupId: selectedFamilyObj.summaryGroupId,
        technicalClassification: formTechnicalClass,
        active: true,
        aliases: [],
        source: 'MANUAL',
        createdAt: new Date().toISOString(),
      })
    }

    reloadProducts()
    setIsModalOpen(false)
  }

  const handleToggleStatus = (productId: string) => {
    toggleProductActiveStatus(productId)
    reloadProducts()
  }

  const handleAddAlias = () => {
    if (!editingProduct || !newAlias.trim()) return
    addAliasToActiveProduct(editingProduct.productId, newAlias.trim())
    setNewAlias('')
    reloadProducts()
    // Refresh local editing product
    const updated = getActiveProducts().find((p) => p.productId === editingProduct.productId)
    if (updated) setEditingProduct(updated)
  }

  const handleRemoveAlias = (alias: string) => {
    if (!editingProduct) return
    removeAliasFromActiveProduct(editingProduct.productId, alias)
    reloadProducts()
    const updated = getActiveProducts().find((p) => p.productId === editingProduct.productId)
    if (updated) setEditingProduct(updated)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administración de Catálogos"
        description="Gestión de catálogo de productos, equivalencias de importación Excel y parámetros operativos."
        actions={
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
          >
            <Plus className="size-4" />
            <span>Nuevo Producto</span>
          </button>
        }
      />

      {/* Selector de Pestañas */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('PRODUCTS')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'PRODUCTS'
              ? 'border-brand-700 text-brand-700 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Layers className="size-4" />
          <span>Productos y Equivalencias ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('BENCHMARKS')}
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

      {activeTab === 'PRODUCTS' ? (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por producto, familia o alias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="ALL">Todas las familias</option>
                {FAMILIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Solo Activos</option>
                <option value="INACTIVE">Solo Inactivos</option>
              </select>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Producto / Nombre Canónico</th>
                    <th className="px-4 py-3">Familia</th>
                    <th className="px-4 py-3">Clasificación</th>
                    <th className="px-4 py-3">Sinónimos / Aliases Excel</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        No se encontraron productos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isActive = p.active ?? true
                      return (
                        <tr key={p.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {p.productName}
                            </p>
                            <p className="text-xs font-mono text-slate-400">{p.productId}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {p.familyName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
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
                                <span className="text-xs italic text-slate-400">Sin alias mapeados</span>
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
                                onClick={() => handleOpenEditModal(p)}
                                title="Editar producto"
                                className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(p.productId)}
                                title={isActive ? 'Desactivar producto' : 'Activar producto'}
                                className={`rounded p-1.5 transition-colors ${
                                  isActive
                                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
        </div>
      ) : (
        /* Sección Parámetros Operativos */
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <Settings2 className="size-5 text-brand-600" />
              Metas de Rendimiento por Familia
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Porcentajes esperados de rendimiento teórico sobre materia prima procesada.
            </p>

            <div className="mt-4 space-y-3">
              {[
                { family: 'Aleta Cruda', target: '80.0%' },
                { family: 'Manto Crudo', target: '75.0%' },
                { family: 'Anillas', target: '65.0%' },
                { family: 'Nuca Semilimpia', target: '70.0%' },
                { family: 'Rejos Crudo', target: '85.0%' },
              ].map((item) => (
                <div key={item.family} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.family}</span>
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                    {item.target}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <Sliders className="size-5 text-brand-600" />
              Benchmarks de Eficiencia Operativa
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Productividad objetivo por operario-hora en líneas de procesamiento.
            </p>

            <div className="mt-4 space-y-3">
              {[
                { process: 'Línea Empaque (Directo)', benchmark: '120 Kg / persona-h' },
                { process: 'Línea Congelado (Túneles)', benchmark: '150 Kg / persona-h' },
                { process: 'Especialidades / Corte', benchmark: '85 Kg / persona-h' },
              ].map((item) => (
                <div key={item.process} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.process}</span>
                  <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
                    {item.benchmark}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Producto */}
      {isModalOpen ? (
        <Modal
          titleId="catalog-modal-title"
          onClose={() => setIsModalOpen(false)}
        >
          <div className="p-6">
            <h2 id="catalog-modal-title" className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Nombre del Producto
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej. TALLO CRUDO CONGELADO 1-2 KG"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Familia
              </label>
              <select
                value={formFamilyId}
                onChange={(e) => setFormFamilyId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {FAMILIES.map((f) => (
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
                onChange={(e) => setFormTechnicalClass(e.target.value as 'POLAR' | 'USA' | 'GENERAL' | 'UNCLASSIFIED')}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="GENERAL">General</option>
                <option value="POLAR">POLAR</option>
                <option value="USA">USA</option>
                <option value="UNCLASSIFIED">Sin Clasificar</option>
              </select>
            </div>
          </div>

          {editingProduct ? (
            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
                Sinónimos y Aliases (para coincidencia con planillas Excel)
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  placeholder="Nuevo alias en Excel..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddAlias}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 dark:bg-slate-700"
                >
                  Agregar Alias
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {editingProduct.aliases && editingProduct.aliases.length > 0 ? (
                  editingProduct.aliases.map((alias) => (
                    <span
                      key={alias}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    >
                      {alias}
                      <button
                        type="button"
                        onClick={() => handleRemoveAlias(alias)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Eliminar alias"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No hay sinónimos agregados aún.</p>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
      ) : null}
    </div>
  )
}

export default CatalogsPage
