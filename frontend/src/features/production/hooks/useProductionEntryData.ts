import { useEffect, useRef, useState } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import { getActiveProducts } from '../capture/productCatalogRepository'
import { useProductionCalculations } from './useProductionCalculations'
import { useProductionDraftActions } from './useProductionDraftActions'
import { useProductionExcelImport } from './useProductionExcelImport'
import { useProductionNavigation } from './useProductionNavigation'
import { useProductionPersistence } from './useProductionPersistence'
import { useProductionSectionProducts } from './useProductionSectionProducts'
import { useProductionData } from '../state/ProductionDataContext'
import type { ProductionProcess } from '../model/types'

export function useProductionEntryData() {
  const [saveError, setSaveError] = useState('')
  const [isBulkFreezingLinkConfirmationOpen, setIsBulkFreezingLinkConfirmationOpen] = useState(false)
  const [catalogItems, setCatalogItems] = useState<ProductionCatalogItem[]>(() => getActiveProducts())
  const manualProductSearchInputRef = useRef<HTMLInputElement>(null)
  const onProcessChangeResetRef = useRef<(() => void) | undefined>(undefined)

  const { deleteProductionDay, findProductionDay } = useProductionData()

  const navigation = useProductionNavigation({
    onProcessChangeReset: () => onProcessChangeResetRef.current?.(),
    setSaveError: (err) => setSaveError(err),
  })

  const {
    editingDate,
    navigate,
    selectedProcess,
    activeWeek,
    existingDay,
    isEditingAllowed,
    mode,
    setMode,
    draft,
    setDraft,
    updateDraft,
    isSunday,
    isFreezing,
    isBalanceOnly,
    usesExternalAvailability,
    pendingProcessChange,
    setPendingProcessChange,
    changeProcess,
    applyProcessChange,
    effectiveProductionDays,
    subsequentBalanceLots,
    upsertProductionDay,
  } = navigation

  const sectionProducts = useProductionSectionProducts({
    draft,
    setDraft,
    catalogItems,
    existingDay,
    setSaveError,
    updateDraft,
  })

  const excelImport = useProductionExcelImport({
    draft,
    setDraft,
    isFreezing,
    catalogItems,
    setCatalogItems,
    setSaveError,
  })

  useEffect(() => {
    onProcessChangeResetRef.current = () => {
      excelImport.resetExcelImport()
      sectionProducts.resetSectionProducts()
    }
  })

  usePageTitle(existingDay ? 'Editar jornada' : 'Nueva jornada')

  const calculations = useProductionCalculations({
    draft,
    allProductionDays: effectiveProductionDays,
    subsequentBalanceLots,
    catalogItems,
    isFreezing,
    usesExternalAvailability,
  })

  const draftActions = useProductionDraftActions({
    draft,
    setDraft,
    catalogItems,
    isFreezing,
    isBalanceOnly,
    isEditingAllowed,
    freezingAutomaticOriginPositions: calculations.freezingAutomaticOriginPositions,
    clearSectionProduct: sectionProducts.clearSectionProduct,
    manualProductSearchInputRef,
    setSaveError,
    updateDraft,
  })
  const persistence = useProductionPersistence({
    draft,
    editingDate,
    activeWeek,
    allProductionDays: effectiveProductionDays,
    subsequentBalanceLots,
    upsertProductionDay,
    navigate,
    setSaveError,
  })

  const handleChangeProcess = (process: ProductionProcess) => {
    changeProcess(process)
  }

  const handleConfirmProcessChange = (process: ProductionProcess) => {
    setPendingProcessChange(null)
    applyProcessChange(process)
  }

  const handleCancelProcessChange = () => {
    setPendingProcessChange(null)
  }

  const handleConfirmBulkFreezingLink = () => {
    draftActions.autoLinkAllFreezingProducts()
    setIsBulkFreezingLinkConfirmationOpen(false)
  }

  const handleDeleteDay = () => {
    if (!editingDate) return
    deleteProductionDay(editingDate, selectedProcess)
    navigation.navigate(`/jornadas?process=${selectedProcess}`)
  }

  return {
    saveError,
    setSaveError,
    isBulkFreezingLinkConfirmationOpen,
    setIsBulkFreezingLinkConfirmationOpen,
    catalogItems,
    manualProductSearchInputRef,
    editingDate,
    selectedProcess,
    activeWeek,
    existingDay,
    isEditingAllowed,
    mode,
    setMode,
    draft,
    updateDraft,
    isSunday,
    isFreezing,
    isBalanceOnly,
    usesExternalAvailability,
    pendingProcessChange,
    handleChangeProcess,
    handleConfirmProcessChange,
    handleCancelProcessChange,
    handleConfirmBulkFreezingLink,
    handleDeleteDay,
    findProductionDay,
    sectionProducts,
    excelImport,
    calculations,
    draftActions,
    persistence,
  }
}
