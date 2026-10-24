import { useMemo, useRef, useState } from 'react'
import type { ProductionCaptureSection, ProductionDay } from '../model/types'
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

type CaptureRow = ProductionCaptureDraft['rows'][number]

function hasCaptureSection(
  row: CaptureRow,
  section: ProductionCaptureSection,
): boolean {
  return row.captureSections?.includes(section) ?? false
}

function withCaptureSection(
  row: CaptureRow,
  section: ProductionCaptureSection,
  enabled: boolean,
): CaptureRow {
  const sections = new Set(row.captureSections ?? [])
  if (enabled) sections.add(section)
  else sections.delete(section)

  return {
    ...row,
    ...(sections.size > 0 ? { captureSections: [...sections] } : {}),
  }
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
      // Older jornadas did not persist the section that originated a row.
      // Treatment-only products are still unambiguous from their catalog
      // identity, so recover that membership when hydrating a historical day.
      if (
        captureQuantityKg100(row.treatmentKg) > 0 ||
        isTreatmentOnlyProduct(row.product) ||
        hasCaptureSection(row, 'TREATMENT')
      ) {
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
        captureQuantityKg100(row.tunnelNightKg) > 0 ||
        hasCaptureSection(row, 'TUNNEL')
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

  const effectiveClosingProductIds = useMemo(() => {
    const ids = new Set(closingProductIds)
    for (const row of draft.rows) {
      if (
        captureQuantityKg100(row.closingBalanceKg) > 0 ||
        hasCaptureSection(row, 'BALANCE')
      ) {
        ids.add(row.product.productId)
      }
    }
    return ids
  }, [closingProductIds, draft.rows])

  const closingCatalogItems = useMemo(
    () =>
      catalogItems.filter(
        (product) => !effectiveClosingProductIds.has(product.productId),
      ),
    [catalogItems, effectiveClosingProductIds],
  )

  const closingRows = useMemo(
    () =>
      draft.rows.filter(
        (row) =>
          effectiveClosingProductIds.has(row.product.productId) ||
          captureQuantityKg100(row.closingBalanceKg) > 0,
      ),
    [draft.rows, effectiveClosingProductIds],
  )

  const balanceProductIds = useMemo(
    () => [...new Set(draft.balanceUses.map((balance) => balance.productId))],
    [draft.balanceUses],
  )

  const nonReportProductIds = useMemo(
    () => [
      ...new Set([
        ...effectiveTreatmentProductIds,
        ...effectiveTunnelProductIds,
        ...effectiveClosingProductIds,
        ...balanceProductIds,
      ]),
    ],
    [
      balanceProductIds,
      effectiveClosingProductIds,
      effectiveTreatmentProductIds,
      effectiveTunnelProductIds,
    ],
  )

  // Helpers
  const addMovementProduct = (
    productId: string,
    resetSelection: () => void,
    section?: ProductionCaptureSection,
  ) => {
    if (!productId) return
    if (draft.rows.some((row) => row.product.productId === productId)) {
      if (section) {
        setDraft((current) => ({
          ...current,
          rows: current.rows.map((row) =>
            row.product.productId === productId
              ? withCaptureSection(row, section, true)
              : row,
          ),
        }))
      }
      resetSelection()
      return
    }
    const row = createRow(productId, draft.rows.length)
    if (!row) return
    updateDraft('rows', [
      ...draft.rows,
      {
        ...row,
        dayReportedKg: '0',
        nightReportedKg: '0',
        ...(section ? { captureSections: [section] } : {}),
      },
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
    if (draft.rows.some((row) => row.product.productId === productId)) {
      setDraft((current) => ({
        ...current,
        rows: current.rows.map((row) =>
          row.product.productId === productId
            ? withCaptureSection(row, 'TREATMENT', true)
            : row,
        ),
      }))
      setTreatmentProductIds((current) => new Set(current).add(productId))
      treatmentSearchInputRef.current?.focus()
      return
    }
    addMovementProduct(productId, () => {
      setTreatmentProductIds((current) => {
        const next = new Set(current)
        next.add(productId)
        return next
      })
      treatmentSearchInputRef.current?.focus()
    }, 'TREATMENT')
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
        current.balanceUses.some((balance) => balance.productId === productId) ||
        hasCaptureSection(row, 'TUNNEL') ||
        hasCaptureSection(row, 'BALANCE')

      return {
        ...current,
        rows: hasOtherMovement
          ? current.rows.map((candidate) =>
              candidate.key === rowKey
                ? withCaptureSection(
                    { ...candidate, treatmentKg: '0' },
                    'TREATMENT',
                    false,
                  )
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
    if (draft.rows.some((row) => row.product.productId === productId)) {
      setDraft((current) => ({
        ...current,
        rows: current.rows.map((row) =>
          row.product.productId === productId
            ? withCaptureSection(row, 'TUNNEL', true)
            : row,
        ),
      }))
      setTunnelProductIds((current) => new Set(current).add(productId))
      tunnelSearchInputRef.current?.focus()
      return
    }
    addMovementProduct(productId, () => {
      setTunnelProductIds((current) => {
        const next = new Set(current)
        next.add(productId)
        return next
      })
      tunnelSearchInputRef.current?.focus()
    }, 'TUNNEL')
  }

  const removeTunnelProduct = (rowKey: string) => {
    const removedProductId = draft.rows.find((row) => row.key === rowKey)?.product.productId
    setDraft((current) => {
      const row = current.rows.find((candidate) => candidate.key === rowKey)
      if (!row) return current
      const hasOtherMovement =
        captureQuantityKg100(row.dayReportedKg) > 0 ||
        captureQuantityKg100(row.nightReportedKg) > 0 ||
        captureQuantityKg100(row.treatmentKg) > 0 ||
        captureQuantityKg100(row.closingBalanceKg) > 0 ||
        captureQuantityKg100(row.finishedKg) > 0 ||
        current.balanceUses.some((balance) => balance.productId === row.product.productId) ||
        hasCaptureSection(row, 'TREATMENT') ||
        hasCaptureSection(row, 'BALANCE')
      return {
        ...current,
        rows: hasOtherMovement
          ? current.rows.map((candidate) =>
              candidate.key === rowKey
                ? withCaptureSection(
                    { ...candidate, tunnelDayKg: '0', tunnelNightKg: '0' },
                    'TUNNEL',
                    false,
                  )
                : candidate,
            )
          : current.rows.filter((candidate) => candidate.key !== rowKey),
      }
    })
    setTunnelProductIds((current) => {
      const next = new Set(current)
      if (removedProductId) next.delete(removedProductId)
      return next
    })
    setSaveError('')
  }

  const addClosingProduct = (productId: string) => {
    if (!productId) return
    if (draft.rows.some((row) => row.product.productId === productId)) {
      setDraft((current) => ({
        ...current,
        rows: current.rows.map((row) =>
          row.product.productId === productId
            ? withCaptureSection(row, 'BALANCE', true)
            : row,
        ),
      }))
      setClosingProductIds((current) => new Set(current).add(productId))
      closingSearchInputRef.current?.focus()
      return
    }
    setClosingProductIds((current) => new Set(current).add(productId))
    addMovementProduct(productId, () => {
      closingSearchInputRef.current?.focus()
    }, 'BALANCE')
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
        current.balanceUses.some((balance) => balance.productId === productId) ||
        hasCaptureSection(row, 'TREATMENT') ||
        hasCaptureSection(row, 'TUNNEL')

      return {
        ...current,
        rows: hasOtherMovement
          ? current.rows.map((candidate) =>
              candidate.key === rowKey
                ? withCaptureSection(
                    { ...candidate, closingBalanceKg: '0' },
                    'BALANCE',
                    false,
                  )
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
    tunnelProductIds: [...effectiveTunnelProductIds],
    tunnelCatalogItems,
    tunnelRows,
    tunnelToggleError,
    getTunnelCellProps,
    updateTunnelCondition,
    addTunnelProduct,
    removeTunnelProduct,
    closingSearchInputRef,
    closingCatalogItems,
    closingRows,
    nonReportProductIds,
    addClosingProduct,
    removeClosingProduct,
    clearSectionProduct,
    resetSectionProducts,
    addMovementProduct,
  }
}
