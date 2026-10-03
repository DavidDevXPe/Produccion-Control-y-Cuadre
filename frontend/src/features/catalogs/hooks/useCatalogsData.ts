import { useState, useMemo } from "react";
import {
  getActiveProducts,
  addActiveProduct,
  updateActiveProduct,
  addAliasToActiveProduct,
  removeAliasFromActiveProduct,
  toggleProductActiveStatus,
  createStableProductId,
} from "../../production/capture/productCatalogRepository";
import type { ProductionCatalogItem } from "../../production/capture/productionCatalog";
import type { SummaryGroupId } from "../../production/model/types";
import { usePageTitle } from "../../../hooks/usePageTitle";

export interface CatalogFamily {
  id: string;
  name: string;
  summaryGroupId: SummaryGroupId;
}

export const CATALOG_FAMILIES: readonly CatalogFamily[] = [
  { id: "aleta-cruda", name: "ALETA CRUDA", summaryGroupId: "ALETA" },
  { id: "manto-crudo", name: "MANTO CRUDO", summaryGroupId: "MANTO" },
  { id: "anillas", name: "ANILLAS", summaryGroupId: "ANILLAS" },
  {
    id: "nuca-semilimpia",
    name: "NUCA SEMILIMPIA",
    summaryGroupId: "NUCA_SEMILIMPIA",
  },
  { id: "rejos-crudo", name: "REJOS CRUDO", summaryGroupId: "REJOS" },
  {
    id: "reproductor-crudo",
    name: "REPRODUCTOR CRUDO",
    summaryGroupId: "REPRODUCTOR",
  },
  { id: "pico", name: "PICO", summaryGroupId: "PICO" },
  {
    id: "recorte-crudo",
    name: "RECORTE CRUDO",
    summaryGroupId: "RECORTE_CRUDO",
  },
  {
    id: "recorte-cocido",
    name: "RECORTE COCIDO",
    summaryGroupId: "RECORTE_COCIDO",
  },
  { id: "subproductos", name: "SUBPRODUCTOS", summaryGroupId: "RECORTE_CRUDO" },
];

export const DEFAULT_CATALOG_FAMILY: CatalogFamily = CATALOG_FAMILIES[0]!;

export function useCatalogsData() {
  usePageTitle("Catálogos — TRABUNDA");

  const [products, setProducts] = useState<ProductionCatalogItem[]>(() =>
    getActiveProducts(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "BENCHMARKS">(
    "PRODUCTS",
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductionCatalogItem | null>(null);
  const [newAlias, setNewAlias] = useState("");

  // Form State
  const [formName, setFormName] = useState("");
  const [formFamilyId, setFormFamilyId] = useState(DEFAULT_CATALOG_FAMILY.id);
  const [formTechnicalClass, setFormTechnicalClass] = useState<
    "POLAR" | "USA" | "GENERAL" | "UNCLASSIFIED"
  >("GENERAL");

  const reloadProducts = () => {
    setProducts(getActiveProducts());
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const active = p.active ?? true;
      if (selectedStatus === "ACTIVE" && !active) return false;
      if (selectedStatus === "INACTIVE" && active) return false;

      if (selectedFamily !== "ALL" && p.familyId !== selectedFamily)
        return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = p.productName.toLowerCase().includes(query);
        const matchFamily = p.familyName.toLowerCase().includes(query);
        const matchAlias = p.aliases?.some((a) =>
          a.toLowerCase().includes(query),
        );
        return matchName || matchFamily || matchAlias;
      }

      return true;
    });
  }, [products, searchTerm, selectedFamily, selectedStatus]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormFamilyId(DEFAULT_CATALOG_FAMILY.id);
    setFormTechnicalClass("GENERAL");
    setNewAlias("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: ProductionCatalogItem) => {
    setEditingProduct(product);
    setFormName(product.productName);
    setFormFamilyId(product.familyId);
    setFormTechnicalClass(product.technicalClassification ?? "GENERAL");
    setNewAlias("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const selectedFamilyObj =
      CATALOG_FAMILIES.find((f) => f.id === formFamilyId) ??
      DEFAULT_CATALOG_FAMILY;

    if (editingProduct) {
      updateActiveProduct(editingProduct.productId, {
        productName: formName,
        canonicalName: formName,
        familyId: selectedFamilyObj.id,
        familyName: selectedFamilyObj.name,
        summaryGroupId: selectedFamilyObj.summaryGroupId,
        technicalClassification: formTechnicalClass,
      });
    } else {
      const newId = createStableProductId(formName);
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
        source: "MANUAL",
        createdAt: new Date().toISOString(),
      });
    }

    reloadProducts();
    setIsModalOpen(false);
  };

  const handleToggleStatus = (productId: string) => {
    toggleProductActiveStatus(productId);
    reloadProducts();
  };

  const handleAddAlias = () => {
    if (!editingProduct || !newAlias.trim()) return;
    addAliasToActiveProduct(editingProduct.productId, newAlias.trim());
    setNewAlias("");
    reloadProducts();
    const updated = getActiveProducts().find(
      (p) => p.productId === editingProduct.productId,
    );
    if (updated) setEditingProduct(updated);
  };

  const handleRemoveAlias = (alias: string) => {
    if (!editingProduct) return;
    removeAliasFromActiveProduct(editingProduct.productId, alias);
    reloadProducts();
    const updated = getActiveProducts().find(
      (p) => p.productId === editingProduct.productId,
    );
    if (updated) setEditingProduct(updated);
  };

  return {
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
  };
}
