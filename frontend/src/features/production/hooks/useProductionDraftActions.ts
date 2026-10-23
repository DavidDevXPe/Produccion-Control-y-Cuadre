import { useRef, useState } from 'react'
import { createUnconfirmedCatalogItem } from '../capture/productionCatalog'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type {
  ProductionCaptureDraft,
  ProductionCaptureBalanceUse,
  ProductionCaptureRow,
} from '../capture/productionCapture'
import {
  captureQuantityKg100,
  createRow,
} from '../capture/productionEntryHelpers'
import { normalizeCaptureBalanceUses } from '../capture/balanceUseNormalization'
import { normalizeProductName } from '../capture/productNormalizer'
import { addActiveProduct, getActiveProducts } from '../capture/productCatalogRepository'
import { buildFreezingFifoAllocation } from '../capture/freezingFifo'
import { isSundayIsoDate } from '../model/productionDayMode'
import { kg100, sumKg100 } from '../model/calculations'
import type { FreezingAvailabilityPosition } from '../model/freezing'
import type { Kg100 } from '../model/types'

export interface SelectedBalancePosition {
  originDayId: string
  originDate: string
  familyId: string
  familyName: string
  productId: string
  productName: string
  pendingKg100: Kg100
}

interface UseProductionDraftActionsParams {
  draft: ProductionCaptureDraft
  setDraft: React.Dispatch<React.SetStateAction<ProductionCaptureDraft>>
  catalogItems: ProductionCatalogItem[]
  isFreezing?: boolean
  isBalanceOnly: boolean
  isEditingAllowed: boolean
  freezingAutomaticOriginPositions: FreezingAvailabilityPosition[]
  clearSectionProduct: (productId: string) => void
  manualProductSearchInputRef?: React.RefObject<HTMLInputElement | null> | undefined
  setSaveError: (error: string) => void
  setCatalogItems?: React.Dispatch<React.SetStateAction<ProductionCatalogItem[]>>
  updateDraft: <Key extends keyof ProductionCaptureDraft>(
    key: Key,
    value: ProductionCaptureDraft[Key],
  ) => void
}

export function useProductionDraftActions({
  draft,
  setDraft,
  catalogItems,
  isBalanceOnly,
  isEditingAllowed,
  freezingAutomaticOriginPositions,
  clearSectionProduct,
  manualProductSearchInputRef,
  setSaveError,
  setCatalogItems,
  updateDraft,
}: UseProductionDraftActionsParams) {
  const [removedRowState, setRemovedRowState] = useState<{
    row: ProductionCaptureDraft['rows'][number]
    index: number
  } | null>(null)
  const undoTimeoutRef = useRef<number | null>(null)

  const updateDate = (date: string) => {
    const sunday = isSundayIsoDate(date)
    setDraft((current) => ({
      ...current,
      date,
      operationMode: sunday ? 'BALANCE_ONLY' : 'NORMAL',
      rawMaterialKg:
        sunday || current.process !== 'PACKING' ? '0' : current.rawMaterialKg,
      balanceUses: current.process !== 'PACKING' ? [] : current.balanceUses,
    }))
    setSaveError('')
  }

  const updateRow = (
    key: string,
    field: keyof Omit<ProductionCaptureRow, 'key' | 'product'>,
    value: string,
  ) => {
    setDraft((current) => {
      const nextRows = current.rows.map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      )
      return {
        ...current,
        rows: nextRows,
        ...(current.process !== 'PACKING'
          ? {
              balanceUses: normalizeCaptureBalanceUses(
                nextRows.reduce<ProductionCaptureBalanceUse[]>((uses, row) => {
                  const movement = captureQuantityKg100(row.dayReportedKg) > 0 || captureQuantityKg100(row.nightReportedKg) > 0
                  if (!movement) return uses
                  return [...buildFreezingFifoAllocation({
                    targetProduct: row.product,
                    targetDate: current.date,
                    reportedDayKg100: captureQuantityKg100(row.dayReportedKg),
                    reportedNightKg100: captureQuantityKg100(row.nightReportedKg),
                    positions: freezingAutomaticOriginPositions,
                    existingUses: uses.filter((use) => use.productId !== row.product.productId),
                  }).balanceUses]
                }, []),
              ),
            }
          : {}),
      }
    })
  }

  const addReportProduct = (productId: string) => {
    if (!productId) return
    if (draft.rows.some((row) => row.product.productId === productId)) {
      setSaveError('Ese producto ya está agregado a la jornada.')
      return
    }
    const row = createRow(productId, draft.rows.length) ?? (() => {
      const product = catalogItems.find((item) => item.productId === productId)
      if (!product) return null
      return {
        key: `manual-${product.productId}-${Date.now()}-${draft.rows.length}`,
        product,
        dayReportedKg: '', dayPreviousBalanceKg: '0', nightReportedKg: '', nightPreviousBalanceKg: '0',
        tunnelDayKg: '0', tunnelNightKg: '0', treatmentKg: '0', closingBalanceKg: '0', finishedKg: '',
      }
    })()
    if (!row) return
    updateDraft('rows', [...draft.rows, row])
    setSaveError('')
    manualProductSearchInputRef?.current?.focus()
  }

  const createReportProduct = (name: string) => {
    const normalized = normalizeProductName(name)
    const existing = catalogItems.find((product) => normalizeProductName(product.productName) === normalized)
    const product = existing ?? addActiveProduct(createUnconfirmedCatalogItem(name))
    setCatalogItems?.(getActiveProducts())
    addReportProduct(product.productId)
  }

  const addSelectedBalance = (position: SelectedBalancePosition) => {
    if (!position) return

    const normalizedBalanceName = normalizeProductName(position.productName)

    const reportProduct = draft.rows.find(
      (row) =>
        row.product.familyId === position.familyId &&
        normalizeProductName(row.product.productName) === normalizedBalanceName,
    )?.product

    const catalogProduct =
      reportProduct ??
      catalogItems.find(
        (product) => product.productId === position.productId,
      ) ??
      catalogItems.find(
        (product) =>
          product.familyId === position.familyId &&
          (normalizeProductName(product.productName) ===
            normalizedBalanceName ||
            normalizeProductName(product.canonicalName ?? '') ===
              normalizedBalanceName ||
            (product.aliases ?? []).some(
              (alias) => normalizeProductName(alias) === normalizedBalanceName,
            )),
      )

    const requiresProductDistribution = !catalogProduct

    const resolvedProductId = catalogProduct?.productId ?? position.productId

    const balanceUse: ProductionCaptureBalanceUse = {
      key: `balance-${position.originDayId}-${position.productId}`,
      originDayId: position.originDayId,
      originDate: position.originDate,

      familyId: catalogProduct?.familyId ?? position.familyId,
      familyName: catalogProduct?.familyName ?? position.familyName,

      productId: resolvedProductId,
      productName:
        catalogProduct?.productName ?? 'Producto exacto no identificado',

      availableKg100: position.pendingKg100,

      dayKg: '0',
      nightKg: '0',

      sourceProductId: position.productId,

      requiresProductDistribution,
    }

    setDraft((current) => {
      const alreadyExists = current.balanceUses.some(
        (balance) =>
          balance.originDayId === balanceUse.originDayId &&
          balance.productId === balanceUse.productId &&
          (balance.sourceProductId ?? balance.productId) ===
            (balanceUse.sourceProductId ?? balanceUse.productId),
      )

      const hasProductRow = current.rows.some(
        (row) => row.product.productId === balanceUse.productId,
      )
      const shouldAddRow =
        isBalanceOnly &&
        current.process === 'PACKING' &&
        !requiresProductDistribution &&
        !hasProductRow
      const row = shouldAddRow
        ? createRow(balanceUse.productId, current.rows.length)
        : null

      return {
        ...current,
        rows:
          row === null
            ? current.rows
            : [
                ...current.rows,
                { ...row, dayReportedKg: '0', nightReportedKg: '0' },
              ],
        balanceUses: normalizeCaptureBalanceUses(
          alreadyExists
            ? current.balanceUses
            : [...current.balanceUses, balanceUse],
        ),
      }
    })

    setSaveError('')
  }

  const autoLinkFreezingProduct = (productId: string) => {
    if (draft.process === 'PACKING') return
    setDraft((current) => {
      const row = current.rows.find(
        (candidate) => candidate.product.productId === productId,
      )
      if (!row) {
        return current
      }
      const otherUses = current.balanceUses.filter(
        (use) => use.productId !== productId,
      )
      const allocation = buildFreezingFifoAllocation({
        targetProduct: row.product,
        targetDate: current.date,
        reportedDayKg100: captureQuantityKg100(row.dayReportedKg),
        reportedNightKg100: captureQuantityKg100(row.nightReportedKg),
        positions: freezingAutomaticOriginPositions,
        existingUses: otherUses,
      })
      return {
        ...current,
        balanceUses: normalizeCaptureBalanceUses(allocation.balanceUses),
      }
    })
    setSaveError('')
  }

  const autoLinkAllFreezingProducts = () => {
    if (draft.process === 'PACKING') return

    setDraft((current) => {
      const rowsWithMovement = current.rows.filter(
        (row) =>
          captureQuantityKg100(row.dayReportedKg) > 0 ||
          captureQuantityKg100(row.nightReportedKg) > 0,
      )

      const movementProductIds = new Set(
        rowsWithMovement.map((r) => r.product.productId),
      )
      let nextBalanceUses = current.balanceUses.filter(
        (use) => !movementProductIds.has(use.productId),
      )

      for (const row of rowsWithMovement) {
        const allocation = buildFreezingFifoAllocation({
          targetProduct: row.product,
          targetDate: current.date,
          reportedDayKg100: captureQuantityKg100(row.dayReportedKg),
          reportedNightKg100: captureQuantityKg100(row.nightReportedKg),
          positions: freezingAutomaticOriginPositions,
          existingUses: nextBalanceUses,
        })

        nextBalanceUses = [...allocation.balanceUses]
      }

      return {
        ...current,
        balanceUses: normalizeCaptureBalanceUses(nextBalanceUses),
      }
    })

    setSaveError('')
  }

  const updateBalanceUse = (
    key: string,
    field: 'dayKg' | 'nightKg',
    value: string,
  ) => {
    setDraft((current) => {
      const nextBalanceUses = current.balanceUses.map((balance) =>
        balance.key === key ? { ...balance, [field]: value } : balance,
      )

      if (!isBalanceOnly || current.process !== 'PACKING') {
        return {
          ...current,
          balanceUses: normalizeCaptureBalanceUses(nextBalanceUses),
        }
      }

      const nextRows = current.rows.map((row) => {
        const productBalanceUses = nextBalanceUses.filter(
          (balance) =>
            balance.productId === row.product.productId &&
            balance.requiresProductDistribution !== true,
        )

        if (productBalanceUses.length === 0) {
          return row
        }

        const dayBalanceKg100 = sumKg100(
          productBalanceUses.map((balance) =>
            captureQuantityKg100(balance.dayKg),
          ),
        )

        const nightBalanceKg100 = sumKg100(
          productBalanceUses.map((balance) =>
            captureQuantityKg100(balance.nightKg),
          ),
        )

        return {
          ...row,
          dayReportedKg: String(dayBalanceKg100 / 100),
          nightReportedKg: String(nightBalanceKg100 / 100),
        }
      })

      const nextTotalDayKg100 = sumKg100(
        nextRows.map((r) => captureQuantityKg100(r.dayReportedKg)),
      )
      const nextTotalNightKg100 = sumKg100(
        nextRows.map((r) => captureQuantityKg100(r.nightReportedKg)),
      )

      return {
        ...current,
        balanceUses: normalizeCaptureBalanceUses(nextBalanceUses),
        rows: nextRows,
        declaredDayTotalKg:
          nextTotalDayKg100 > 0 ? String(nextTotalDayKg100 / 100) : current.declaredDayTotalKg,
        declaredNightTotalKg:
          nextTotalNightKg100 > 0 ? String(nextTotalNightKg100 / 100) : current.declaredNightTotalKg,
      }
    })
  }

  const distributeLegacyBalance = (key: string, productId: string) => {
    const product = catalogItems.find(
      (candidate) => candidate.productId === productId,
    )
    if (!product) return

    setDraft((current) => {
      const hasProductRow = current.rows.some(
        (row) => row.product.productId === product.productId,
      )
      const shouldAddRow =
        isBalanceOnly && current.process === 'PACKING' && !hasProductRow
      const row = shouldAddRow
        ? createRow(product.productId, current.rows.length)
        : null

      return {
        ...current,
        rows:
          row === null
            ? current.rows
            : [
                ...current.rows,
                { ...row, dayReportedKg: '0', nightReportedKg: '0' },
              ],
        balanceUses: normalizeCaptureBalanceUses(
          current.balanceUses.map((balance) =>
            balance.key === key
              ? {
                  ...balance,
                  familyId: product.familyId,
                  familyName: product.familyName,
                  productId: product.productId,
                  productName: product.productName,
                  sourceProductId:
                    balance.sourceProductId ?? balance.productId,
                  requiresProductDistribution: false,
                }
              : balance,
          ),
        ),
      }
    })
    setSaveError('')
  }

  const removeBalanceUse = (key: string) => {
    setDraft((current) => {
      const nextBalanceUses = current.balanceUses.filter(
        (balance) => balance.key !== key,
      )

      if (!isBalanceOnly || current.process !== 'PACKING') {
        return {
          ...current,
          balanceUses: normalizeCaptureBalanceUses(nextBalanceUses),
        }
      }

      const removedUse = current.balanceUses.find((b) => b.key === key)
      if (!removedUse) {
        return {
          ...current,
          balanceUses: normalizeCaptureBalanceUses(nextBalanceUses),
        }
      }

      const nextRows = current.rows.map((row) => {
        if (row.product.productId !== removedUse.productId) return row

        const currentDayKg100 = captureQuantityKg100(row.dayReportedKg)
        const currentNightKg100 = captureQuantityKg100(row.nightReportedKg)

        const removedDayKg100 = captureQuantityKg100(removedUse.dayKg)
        const removedNightKg100 = captureQuantityKg100(removedUse.nightKg)

        const newDayKg100 = kg100(Math.max(0, currentDayKg100 - removedDayKg100))
        const newNightKg100 = kg100(Math.max(0, currentNightKg100 - removedNightKg100))

        return {
          ...row,
          dayReportedKg: String(newDayKg100 / 100),
          nightReportedKg: String(newNightKg100 / 100),
        }
      })

      const prevTotalDayKg100 = sumKg100(
        current.rows.map((r) => captureQuantityKg100(r.dayReportedKg)),
      )
      const nextTotalDayKg100 = sumKg100(
        nextRows.map((r) => captureQuantityKg100(r.dayReportedKg)),
      )
      const prevTotalNightKg100 = sumKg100(
        current.rows.map((r) => captureQuantityKg100(r.nightReportedKg)),
      )
      const nextTotalNightKg100 = sumKg100(
        nextRows.map((r) => captureQuantityKg100(r.nightReportedKg)),
      )

      let nextDeclaredDay = current.declaredDayTotalKg
      if (captureQuantityKg100(current.declaredDayTotalKg) === prevTotalDayKg100) {
        nextDeclaredDay = String(nextTotalDayKg100 / 100)
      }

      let nextDeclaredNight = current.declaredNightTotalKg
      if (captureQuantityKg100(current.declaredNightTotalKg) === prevTotalNightKg100) {
        nextDeclaredNight = String(nextTotalNightKg100 / 100)
      }

      return {
        ...current,
        balanceUses: normalizeCaptureBalanceUses(nextBalanceUses),
        rows: nextRows,
        declaredDayTotalKg: nextDeclaredDay,
        declaredNightTotalKg: nextDeclaredNight,
      }
    })
  }

  const removeRow = (key: string) => {
    if (!isEditingAllowed) return

    const rowToRemove = draft.rows.find((row) => row.key === key)
    if (!rowToRemove) return

    const productId = rowToRemove.product.productId
    const rowIndex = draft.rows.findIndex((row) => row.key === key)
    const dayKg = Number(rowToRemove.dayReportedKg.replace(',', '.')) || 0
    const nightKg = Number(rowToRemove.nightReportedKg.replace(',', '.')) || 0
    const hasValues = dayKg > 0 || nightKg > 0

    // A shared row can also belong to Túnel, Tratamiento or Saldos. Removing it
    // from the normal report must only clear the normal-flow quantities; deleting
    // the row itself would silently delete the movement from the other section.
    const hasOtherSectionMovement =
      captureQuantityKg100(rowToRemove.tunnelDayKg) > 0 ||
      captureQuantityKg100(rowToRemove.tunnelNightKg) > 0 ||
      captureQuantityKg100(rowToRemove.treatmentKg) > 0 ||
      captureQuantityKg100(rowToRemove.closingBalanceKg) > 0 ||
      captureQuantityKg100(rowToRemove.finishedKg) > 0 ||
      draft.balanceUses.some((balance) => balance.productId === productId)

    if (productId && !hasOtherSectionMovement) {
      clearSectionProduct(productId)
    }

    setDraft((current) => {
      if (hasOtherSectionMovement) {
        return {
          ...current,
          rows: current.rows.map((row) =>
            row.key === key
              ? {
                  ...row,
                  dayReportedKg: '0',
                  nightReportedKg: '0',
                  dayPreviousBalanceKg: '0',
                  nightPreviousBalanceKg: '0',
                }
              : row,
          ),
        }
      }

      return {
        ...current,
        rows: current.rows.filter((row) => row.key !== key),
        balanceUses: normalizeCaptureBalanceUses(
          current.balanceUses.filter((balance) => balance.productId !== productId),
        ),
      }
    })

    if (hasValues && !hasOtherSectionMovement) {
      setRemovedRowState({
        row: rowToRemove,
        index: rowIndex,
      })
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current)
      }
      undoTimeoutRef.current = window.setTimeout(() => {
        setRemovedRowState(null)
      }, 8000)
    }
  }

  const undoRemoveRow = () => {
    if (!removedRowState || !isEditingAllowed) return
    const { row: restoredRow, index } = removedRowState

    setDraft((current) => {
      if (
        current.rows.some(
          (r) => r.product.productId === restoredRow.product.productId,
        )
      ) {
        return current
      }
      const newRows = [...current.rows]
      if (index >= 0 && index <= newRows.length) {
        newRows.splice(index, 0, restoredRow)
      } else {
        newRows.push(restoredRow)
      }
      return {
        ...current,
        rows: newRows,
      }
    })

    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = null
    }
    setRemovedRowState(null)
  }

  const dismissUndoToast = () => {
    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = null
    }
    setRemovedRowState(null)
  }

  return {
    updateDate,
    updateRow,
    addReportProduct,
    createReportProduct,
    addSelectedBalance,
    autoLinkFreezingProduct,
    autoLinkAllFreezingProducts,
    updateBalanceUse,
    distributeLegacyBalance,
    removeBalanceUse,
    removeRow,
    undoRemoveRow,
    dismissUndoToast,
    removedRowState,
  }
}
