import { Plus } from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { CatalogBenchmarksSection } from '../components/CatalogBenchmarksSection'
import { CatalogProductFilters } from '../components/CatalogProductFilters'
import { CatalogProductModal } from '../components/CatalogProductModal'
import { CatalogProductTable } from '../components/CatalogProductTable'
import { CatalogTabs } from '../components/CatalogTabs'
import {
  CATALOG_FAMILIES,
  useCatalogsData,
} from '../hooks/useCatalogsData'

export function CatalogsPage() {
  const {
    products,
    filteredProducts,
    searchTerm,
    setSearchTerm,
    selectedFamily,
    setSelectedFamily,
    selectedStatus,
    setSelectedStatus,
    activeTab,
    setActiveTab,
    isModalOpen,
    editingProduct,
    formName,
    setFormName,
    formFamilyId,
    setFormFamilyId,
    formTechnicalClass,
    setFormTechnicalClass,
    newAlias,
    setNewAlias,
    handleOpenAddModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSaveProduct,
    handleToggleStatus,
    handleAddAlias,
    handleRemoveAlias,
  } = useCatalogsData()

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

      <CatalogTabs
        activeTab={activeTab}
        productsCount={products.length}
        onSelectTab={setActiveTab}
      />

      {activeTab === 'PRODUCTS' ? (
        <div className="space-y-4">
          <CatalogProductFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedFamily={selectedFamily}
            onFamilyChange={setSelectedFamily}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            families={CATALOG_FAMILIES}
          />

          <CatalogProductTable
            products={filteredProducts}
            onEditProduct={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      ) : (
        <CatalogBenchmarksSection />
      )}

      <CatalogProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingProduct={editingProduct}
        formName={formName}
        onFormNameChange={setFormName}
        formFamilyId={formFamilyId}
        onFormFamilyIdChange={setFormFamilyId}
        formTechnicalClass={formTechnicalClass}
        onFormTechnicalClassChange={setFormTechnicalClass}
        newAlias={newAlias}
        onNewAliasChange={setNewAlias}
        onAddAlias={handleAddAlias}
        onRemoveAlias={handleRemoveAlias}
        onSave={handleSaveProduct}
        families={CATALOG_FAMILIES}
      />
    </div>
  )
}

export default CatalogsPage

