import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useProductionDraftActions } from './useProductionDraftActions'
import { createEmptyCaptureDraft, type ProductionCaptureDraft } from '../capture/productionCapture'
import { getActiveProducts } from '../capture/productCatalogRepository'

describe('useProductionDraftActions', () => {
  const catalogItems = getActiveProducts()
  const initialDraft: ProductionCaptureDraft = createEmptyCaptureDraft('2026-09-15', 'PACKING')

  it('updates draft date and switches Sunday to BALANCE_ONLY', () => {
    let draft = { ...initialDraft }
    const setDraft = vi.fn((updater) => {
      if (typeof updater === 'function') {
        draft = updater(draft)
      }
    })
    const setSaveError = vi.fn()
    const updateDraft = vi.fn()
    const clearSectionProduct = vi.fn()

    const { result } = renderHook(() =>
      useProductionDraftActions({
        draft,
        setDraft,
        catalogItems,
        isFreezing: false,
        isBalanceOnly: false,
        isEditingAllowed: true,
        freezingAutomaticOriginPositions: [],
        clearSectionProduct,
        setSaveError,
        updateDraft,
      }),
    )

    act(() => {
      result.current.updateDate('2026-09-20') // Sunday
    })

    expect(draft.date).toBe('2026-09-20')
    expect(draft.operationMode).toBe('BALANCE_ONLY')
    expect(draft.rawMaterialKg).toBe('0')
  })

  it('adds a report product to draft rows when not already present', () => {
    let draft = { ...initialDraft }
    const setDraft = vi.fn()
    const setSaveError = vi.fn()
    const updateDraft = vi.fn((key, value) => {
      draft = { ...draft, [key]: value }
    })
    const clearSectionProduct = vi.fn()

    const { result } = renderHook(() =>
      useProductionDraftActions({
        draft,
        setDraft,
        catalogItems,
        isFreezing: false,
        isBalanceOnly: false,
        isEditingAllowed: true,
        freezingAutomaticOriginPositions: [],
        clearSectionProduct,
        setSaveError,
        updateDraft,
      }),
    )

    act(() => {
      result.current.addReportProduct(catalogItems[0]!.productId)
    })

    expect(updateDraft).toHaveBeenCalledWith('rows', expect.any(Array))
  })

  it('removes row and allows undoing removal', () => {
    let draft: ProductionCaptureDraft = {
      ...initialDraft,
      rows: [
        {
          key: 'row-1',
          product: catalogItems[0]!,
          dayReportedKg: '100',
          nightReportedKg: '50',
          dayPreviousBalanceKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '0',
        },
      ],
    }
    const setDraft = vi.fn((updater) => {
      if (typeof updater === 'function') {
        draft = updater(draft)
      }
    })
    const setSaveError = vi.fn()
    const updateDraft = vi.fn()
    const clearSectionProduct = vi.fn()

    const { result } = renderHook(() =>
      useProductionDraftActions({
        draft,
        setDraft,
        catalogItems,
        isFreezing: false,
        isBalanceOnly: false,
        isEditingAllowed: true,
        freezingAutomaticOriginPositions: [],
        clearSectionProduct,
        setSaveError,
        updateDraft,
      }),
    )

    act(() => {
      result.current.removeRow('row-1')
    })

    expect(draft.rows).toHaveLength(0)
    expect(result.current.removedRowState).not.toBeNull()

    act(() => {
      result.current.undoRemoveRow()
    })

    expect(draft.rows).toHaveLength(1)
    expect(draft.rows[0]?.product.productId).toBe(catalogItems[0]!.productId)
  })
})
