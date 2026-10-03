import { useMemo, useRef, useState } from 'react'
import type { ProductionDay } from '../model/types'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type { ProductionCaptureDraft } from '../capture/productionCapture'
import {
  captureQuantityKg100,
  createRow,
} from '../capture/productionEntryHelpers'
import { isTreatmentOnlyProduct } from '../capture/freezingExcelPreview'
import { useGridKeyboardNavigation } from './useGridKeyboardNavigation'

interface UseProductionSectionProductsParams {
  draft: ProductionCaptureDraft
  setDraft: React.Dispatch<React.SetStateAction<ProductionCaptureDraft>>
  catalogItems: ProductionCatalogItem[]
  existingDay?: ProductionDay | undefined
  setSaveError: (error: string) => void
  updateDraft: <Key extends keyof ProductionCaptureDraft>(
    key: Key,
    value: ProductionCaptureDraft[Key],
  ) => void
}

export function useProductionSectionProducts({
  draft,
  setDraft,
  catalogItems,
  existingDay,
  setSaveError,
  updateDraft,
}: UseProductionSectionProductsParams) {
  // Treatment section state
  const treatmentSearchInputRef = useRef<HTMLInputElement>(null)
  const [treatmentProductIds, setTreatmentProductIds] = useState<Set<string>>(
    () => new Set(),
  )

  const effectiveTreatmentProductIds = useMemo(() => {
    const ids = new Set(treatmentProductIds)
    for (const row of draft.rows) {
      if (captureQuantityKg100(row.treatmentKg) > 0) {
        ids.add(row.product.productId)
      }
    }
    return ids
  }, [draft.rows, treatmentProductIds])

  const treatmentCatalogItems = useMemo(
    () =>
      catalogItems.filter(
        (product) => !effectiveTreatmentProductIds.has(product.productId),
      ),
    [catalogItems, effectiveTreatmentProductIds],
  )

  const treatmentRows = useMemo(
    () =>
      draft.rows.filter((row) =>
        effectiveTreatmentProductIds.has(row.product.productId),
      ),
    [draft.rows, effectiveTreatmentProductIds],
  )

  const { getGridCellProps: getTreatmentCellProps } = useGridKeyboardNavigation({
    totalRows: treatmentRows.length,
    columns: 1,
    gridId: 'treatment-grid',
  })

  // Tunnel section state
  const tunnelSearchInputRef = useRef<HTMLInputElement>(null)
  const [tunnelProductIds, setTunnelProductIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [tunnelToggleError, setTunnelToggleError] = useState('')

  const effectiveTunnelProductIds = useMemo(() => {
    const ids = new Set(tunnelProductIds)
    for (const row of draft.rows) {
      if (
        captureQuantityKg100(row.tunnelDayKg) > 0 ||
        captureQuantityKg100(row.tunnelNightKg) > 0
      ) {
        ids.add(row.product.productId)
      }
    }
    return ids
  }, [draft.rows, tunnelProductIds])

  const tunnelCatalogItems = useMemo(
    () =>
      catalogItems.filter(
        (product) =>
          !effectiveTunnelProductIds.has(product.productId) &&
          !isTreatmentOnlyProduct(product),
      ),
    [catalogItems, effectiveTunnelProductIds],
  )

  const tunnelRows = useMemo(
    () =>
      draft.rows.filter((row) =>
        effectiveTunnelProductIds.has(row.product.productId),
      ),
    [draft.rows, effectiveTunnelProductIds],
  )

  const { getGridCellProps: getTunnelCellProps } = useGridKeyboardNavigation({
    totalRows: tunnelRows.length,
    columns: 2,
    gridId: 'tunnel-grid',
  })

  // Closing section state
  const closingSearchInputRef = useRef<HTMLInputElement>(null)
  const [closingProductIds, setClosingProductIds] = useState<Set<string>>(
    () =>
      new Set(
        existingDay?.lines
          .filter((line) => line.newClosingBalanceKg100 > 0)
          .map((line) => line.productId) ?? [],
      ),
  )

  const closingCatalogItems = useMemo(
    () =>
      catalogItems.filter(
        (product) => !closingProductIds.has(product.productId),
      ),
    [catalogItems, closingProductIds],
  )

  const closingRows = useMemo(
    () =>
      draft.rows.filter(
        (row) =>
          closingProductIds.has(row.product.productId) ||
          captureQuantityKg100(row.closingBalanceKg) > 0,
      ),
    [closingProductIds, draft.rows],
  )

  // Helpers
  const addMovementProduct = (
    productId: string,
    resetSelection: () => void,
  ) => {
    if (!productId) return
    if (draft.rows.some((row) => row.product.productId === productId)) {
      resetSelection()
      return
    }
    const row = createRow(productId, draft.rows.length)
    if (!row) return
    updateDraft('rows', [
      ...draft.rows,
      { ...row, dayReportedKg: '0', nightReportedKg: '0' },
    ])
    resetSelection()
    setSaveError('')
  }

  const updateTunnelCondition = (enabled: boolean) => {
    const hasTunnelMovements = draft.rows.some(
      (row) =>
        captureQuantityKg100(row.tunnelDayKg) > 0 ||
        captureQuantityKg100(row.tunnelNightKg) > 0,
    )

    if (!enabled && hasTunnelMovements) {
      setTunnelToggleError(
        'Existen productos de Túnel registrados. Elimina estos movimientos antes de desactivar la opción.',
      )
      return
    }

    updateDraft('hasTunnelProduction', enabled)
    setTunnelToggleError('')
  }

  const addTreatmentProduct = (productId: string) => {
    addMovementProduct(productId, () => {
      setTreatmentProductIds((current) => {
        const next = new Set(current)
        next.add(productId)
        return next
      })
      treatmentSearchInputRef.current?.focus()
    })
  }

  const removeTreatmentProduct = (rowKey: string) => {
    const selectedRow = draft.rows.find((candidate) => candidate.key === rowKey)
    if (!selectedRow) return

    const productId = selectedRow.product.productId

    setDraft((current) => {
      const row = current.rows.find((candidate) => candidate.key === rowKey)
      if (!row) return current

      const hasOtherMovement =
        captureQuantityKg100(row.dayReportedKg) > 0 ||
        captureQuantityKg100(row.nightReportedKg) > 0 ||
        captureQuantityKg100(row.dayPreviousBalanceKg) > 0 ||
        captureQuantityKg100(row.nightPreviousBalanceKg) > 0 ||
        captureQuantityKg100(row.tunnelDayKg) > 0 ||
        captureQuantityKg100(row.tunnelNightKg) > 0 ||
        captureQuantityKg100(row.closingBalanceKg) > 0 ||
        captureQuantityKg100(row.finishedKg) > 0 ||
        current.balanceUses.some((balance) => balance.productId === productId)

      return {
        ...current,
        rows: hasOtherMovement
          ? current.rows.map((candidate) =>
              candidate.key === rowKey
                ? {
                    ...candidate,
                    treatmentKg: '0',
                  }
                : candidate,
            )
          : current.rows.filter((candidate) => candidate.key !== rowKey),
      }
    })

    setTreatmentProductIds((current) => {
      const next = new Set(current)
      next.delete(productId)
      return next
    })

    setSaveError('')
  }

  const addTunnelProduct = (productId: string) => {
    addMovementProduct(productId, () => {
      setTunnelProductIds((current) => {
        const next = new Set(current)
        next.add(productId)
        return next
      })
      tunnelSearchInputRef.current?.focus()
    })
  }

  const addClosingProduct = (productId: string) => {
    if (!productId) return
    setClosingProductIds((current) => new Set(current).add(productId))
    addMovementProduct(productId, () => {
      closingSearchInputRef.current?.focus()
    })
  }

  const removeClosingProduct = (rowKey: string) => {
    setDraft((current) => {
      const row = current.rows.find((candidate) => candidate.key === rowKey)
      if (!row) return current

      const productId = row.product.productId

      const hasOtherMovement =
        captureQuantityKg100(row.dayReportedKg) > 0 ||
        captureQuantityKg100(row.nightReportedKg) > 0 ||
        captureQuantityKg100(row.dayPreviousBalanceKg) > 0 ||
        captureQuantityKg100(row.nightPreviousBalanceKg) > 0 ||
        captureQuantityKg100(row.tunnelDayKg) > 0 ||
        captureQuantityKg100(row.tunnelNightKg) > 0 ||
        captureQuantityKg100(row.treatmentKg) > 0 ||
        captureQuantityKg100(row.finishedKg) > 0 ||
        current.balanceUses.some((balance) => balance.productId === productId)

      return {
        ...current,
        rows: hasOtherMovement
          ? current.rows.map((candidate) =>
              candidate.key === rowKey
                ? {
                    ...candidate,
                    closingBalanceKg: '0',
                  }
                : candidate,
            )
          : current.rows.filter((candidate) => candidate.key !== rowKey),
      }
    })

    setClosingProductIds((current) => {
      const next = new Set(current)
      const row = draft.rows.find((candidate) => candidate.key === rowKey)
      if (row) {
        next.delete(row.product.productId)
      }
      return next
    })

    setSaveError('')
  }

  const clearSectionProduct = (productId: string) => {
    setClosingProductIds((current) => {
      const next = new Set(current)
      next.delete(productId)
      return next
    })

    setTreatmentProductIds((current) => {
      const next = new Set(current)
      next.delete(productId)
      return next
    })

    setTunnelProductIds((current) => {
      const next = new Set(current)
      next.delete(productId)
      return next
    })
  }

  const resetSectionProducts = () => {
    setClosingProductIds(new Set())
    setTreatmentProductIds(new Set())
    setTunnelProductIds(new Set())
  }

  return {
    treatmentSearchInputRef,
    treatmentCatalogItems,
    treatmentRows,
    getTreatmentCellProps,
    addTreatmentProduct,
    removeTreatmentProduct,
    tunnelSearchInputRef,
    tunnelCatalogItems,
    tunnelRows,
    tunnelToggleError,
    getTunnelCellProps,
    updateTunnelCondition,
    addTunnelProduct,
    closingSearchInputRef,
    closingCatalogItems,
    closingRows,
    addClosingProduct,
    removeClosingProduct,
    clearSectionProduct,
    resetSectionProducts,
    addMovementProduct,
  }
}
