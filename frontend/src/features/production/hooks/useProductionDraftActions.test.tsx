import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useProductionDraftActions } from './useProductionDraftActions'
import { createEmptyCaptureDraft, type ProductionCaptureDraft } from '../capture/productionCapture'
import { kg100 } from '../model/calculations'
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

  it('keeps balanceUses separate when updating rows and allows manual FIFO linking when requested', () => {
    const product = catalogItems[0]!
    let draft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-10-06', 'FREEZING'),
      rows: [
        {
          key: 'row-freezing-1',
          product,
          dayReportedKg: '',
          nightReportedKg: '',
          dayPreviousBalanceKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '0',
        },
      ],
      balanceUses: [],
    }

    const setDraft = vi.fn((updater) => {
      if (typeof updater === 'function') {
        draft = updater(draft)
      }
    })
    const setSaveError = vi.fn()
    const updateDraft = vi.fn()
    const clearSectionProduct = vi.fn()

    const mockPositions = [
      {
        originDayId: 'day-packing-2026-10-05',
        originDate: '2026-10-05',
        familyId: product.familyId,
        familyName: product.familyName,
        productId: product.productId,
        productName: product.productName,
        summaryGroupId: 'ALETA' as const,
        physicalDayKg100: kg100(28000),
        physicalNightKg100: kg100(28000),
        receivedBalanceDayKg100: kg100(0),
        receivedBalanceNightKg100: kg100(0),
        ownDayKg100: kg100(28000),
        ownNightKg100: kg100(28000),
        closingBalanceKg100: kg100(0),
        generatedKg100: kg100(56000),
        processedDayKg100: kg100(0),
        processedNightKg100: kg100(0),
        processedTotalKg100: kg100(0),
        pendingKg100: kg100(56000),
        excessKg100: kg100(0),
      },
    ]

    const { result } = renderHook(() =>
      useProductionDraftActions({
        draft,
        setDraft,
        catalogItems,
        isFreezing: true,
        isBalanceOnly: false,
        isEditingAllowed: true,
        freezingAutomaticOriginPositions: mockPositions,
        clearSectionProduct,
        setSaveError,
        updateDraft,
      }),
    )

    // 1. Updating row does NOT create balance uses automatically
    act(() => {
      result.current.updateRow('row-freezing-1', 'dayReportedKg', '280')
    })

    expect(draft.rows[0]?.dayReportedKg).toBe('280')
    expect(draft.balanceUses).toHaveLength(0)

    act(() => {
      result.current.updateRow('row-freezing-1', 'nightReportedKg', '280')
    })

    expect(draft.rows[0]?.nightReportedKg).toBe('280')
    expect(draft.balanceUses).toHaveLength(0)

    // 2. Manual FIFO link consumes prior origin
    act(() => {
      result.current.autoLinkFreezingProduct(product.productId)
    })

    expect(draft.balanceUses).toHaveLength(1)
    expect(draft.balanceUses[0]?.originDate).toBe('2026-10-05')
    expect(draft.balanceUses[0]?.dayKg).toBe('280')
    expect(draft.balanceUses[0]?.nightKg).toBe('280')
  })

  it('keeps physical shift report rows completely separated from balance uses in FREEZING (Problem A)', () => {
    const product = catalogItems[0]!
    let draft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-10-09', 'FREEZING'),
      declaredDayTotalKg: '150',
      declaredNightTotalKg: '50',
      rows: [
        {
          key: 'row-freezing-1',
          product,
          dayReportedKg: '150',
          nightReportedKg: '50',
          dayPreviousBalanceKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '200',
        },
      ],
      balanceUses: [],
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
        isFreezing: true,
        isBalanceOnly: false,
        isEditingAllowed: true,
        freezingAutomaticOriginPositions: [],
        clearSectionProduct,
        setSaveError,
        updateDraft,
      }),
    )

    // 1. Adding a balance must only affect balanceUses, NOT draft.rows or declared totals
    act(() => {
      result.current.addSelectedBalance({
        originDayId: 'day-packing-2026-10-08',
        originDate: '2026-10-08',
        familyId: product.familyId,
        familyName: product.familyName,
        productId: product.productId,
        productName: product.productName,
        pendingKg100: kg100(10000),
      })
    })

    expect(draft.balanceUses).toHaveLength(1)
    expect(draft.balanceUses[0]?.originDate).toBe('2026-10-08')
    expect(draft.rows).toHaveLength(1) // Rows not increased!
    expect(draft.rows[0]?.dayReportedKg).toBe('150')
    expect(draft.rows[0]?.nightReportedKg).toBe('50')
    expect(draft.declaredDayTotalKg).toBe('150')
    expect(draft.declaredNightTotalKg).toBe('50')

    // 2. Updating a balance must only affect balanceUses, NOT draft.rows or declared totals
    const balanceKey = draft.balanceUses[0]!.key
    act(() => {
      result.current.updateBalanceUse(balanceKey, 'dayKg', '100')
    })

    expect(draft.balanceUses[0]?.dayKg).toBe('100')
    expect(draft.rows).toHaveLength(1)
    expect(draft.rows[0]?.dayReportedKg).toBe('150') // Still 150!
    expect(draft.declaredDayTotalKg).toBe('150') // Still 150!

    // 3. Removing a balance must only affect balanceUses, NOT draft.rows or declared totals
    act(() => {
      result.current.removeBalanceUse(balanceKey)
    })

    expect(draft.balanceUses).toHaveLength(0)
    expect(draft.rows).toHaveLength(1)
    expect(draft.rows[0]?.dayReportedKg).toBe('150')
    expect(draft.rows[0]?.nightReportedKg).toBe('50')
    expect(draft.declaredDayTotalKg).toBe('150')
    expect(draft.declaredNightTotalKg).toBe('50')
  })
})
