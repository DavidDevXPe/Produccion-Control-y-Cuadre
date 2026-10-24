import { renderHook, act } from '@testing-library/react'
import type { SetStateAction } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useProductionSectionProducts } from './useProductionSectionProducts'
import { createEmptyCaptureDraft, type ProductionCaptureDraft } from '../capture/productionCapture'
import { getActiveProducts } from '../capture/productCatalogRepository'
import { kg100 } from '../model/calculations'

describe('useProductionSectionProducts', () => {
  const catalogItems = getActiveProducts()
  const initialDraft: ProductionCaptureDraft = createEmptyCaptureDraft('2026-09-15', 'PACKING')

  it('initializes with empty section products and correct catalog items', () => {
    const setDraft = vi.fn()
    const setSaveError = vi.fn()
    const updateDraft = vi.fn()

    const { result } = renderHook(() =>
      useProductionSectionProducts({
        draft: initialDraft,
        setDraft,
        catalogItems,
        setSaveError,
        updateDraft,
      }),
    )

    expect(result.current.treatmentRows).toHaveLength(0)
    expect(result.current.tunnelRows).toHaveLength(0)
    expect(result.current.closingRows).toHaveLength(0)
    expect(result.current.tunnelToggleError).toBe('')
  })

  it('updates tunnel condition correctly and blocks disabling when movements exist', () => {
    const setDraft = vi.fn()
    const setSaveError = vi.fn()
    const updateDraft = vi.fn()

    const draftWithTunnel = {
      ...initialDraft,
      hasTunnelProduction: true,
      rows: [
        {
          key: 'row-1',
          product: catalogItems[0]!,
          dayReportedKg: '0',
          nightReportedKg: '0',
          dayPreviousBalanceKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '100',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '0',
          shiftScheduleNotes: '',
        },
      ],
    }

    const { result } = renderHook(() =>
      useProductionSectionProducts({
        draft: draftWithTunnel,
        setDraft,
        catalogItems,
        setSaveError,
        updateDraft,
      }),
    )

    expect(result.current.tunnelRows).toHaveLength(1)
    expect(result.current.nonReportProductIds).toContain(catalogItems[0]!.productId)

    act(() => {
      result.current.updateTunnelCondition(false)
    })

    expect(result.current.tunnelToggleError).toContain('Existen productos de Túnel registrados')
    expect(updateDraft).not.toHaveBeenCalledWith('hasTunnelProduction', false)

    act(() => {
      result.current.updateTunnelCondition(true)
    })
    expect(updateDraft).toHaveBeenCalledWith('hasTunnelProduction', true)
  })

  it('persists section membership when an existing row is added to Tunnel', () => {
    let draft: ProductionCaptureDraft = {
      ...initialDraft,
      rows: [
        {
          key: 'shared-row',
          product: catalogItems[0]!,
          dayReportedKg: '0',
          dayPreviousBalanceKg: '0',
          nightReportedKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '0',
        },
      ],
    }
    const setDraft = vi.fn((updater: SetStateAction<ProductionCaptureDraft>) => {
      draft = typeof updater === 'function' ? updater(draft) : updater
    })

    const { result } = renderHook(() =>
      useProductionSectionProducts({
        draft,
        setDraft,
        catalogItems,
        setSaveError: vi.fn(),
        updateDraft: vi.fn(),
      }),
    )

    act(() => {
      result.current.addTunnelProduct(catalogItems[0]!.productId)
    })

    expect(draft.rows[0]?.captureSections).toEqual(['TUNNEL'])
  })

  it('adds movement product when adding to closing or treatment', () => {
    let draft = { ...initialDraft }
    const setDraft = vi.fn((updater) => {
      if (typeof updater === 'function') {
        draft = updater(draft)
      }
    })
    const setSaveError = vi.fn()
    const updateDraft = vi.fn((key, value) => {
      draft = { ...draft, [key]: value }
    })

    const { result } = renderHook(() =>
      useProductionSectionProducts({
        draft,
        setDraft,
        catalogItems,
        setSaveError,
        updateDraft,
      }),
    )

    const productToAdd = catalogItems[0]!

    act(() => {
      result.current.addClosingProduct(productToAdd.productId)
    })

    expect(updateDraft).toHaveBeenCalledWith('rows', expect.any(Array))
    expect(result.current.nonReportProductIds).toContain(productToAdd.productId)
  })

  it('recovers historical treatment-only rows without showing them in reports', () => {
    const treatmentProduct = catalogItems.find((product) =>
      product.productName.includes('EN TRATAMIENTO'),
    )
    expect(treatmentProduct).toBeDefined()

    const historicalDraft: ProductionCaptureDraft = {
      ...initialDraft,
      rows: [
        {
          key: 'historical-treatment-row',
          product: treatmentProduct!,
          dayReportedKg: '0',
          nightReportedKg: '0',
          dayPreviousBalanceKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '1300.2',
        },
      ],
    }

    const { result } = renderHook(() =>
      useProductionSectionProducts({
        draft: historicalDraft,
        setDraft: vi.fn(),
        catalogItems,
        setSaveError: vi.fn(),
        updateDraft: vi.fn(),
      }),
    )

    expect(result.current.treatmentRows).toHaveLength(1)
    expect(result.current.nonReportProductIds).toContain(
      treatmentProduct!.productId,
    )
  })

  it('recovers imported closing-balance rows as non-report products', () => {
    const balanceProduct = catalogItems[0]!
    const historicalDraft: ProductionCaptureDraft = {
      ...initialDraft,
      rows: [
        {
          key: 'historical-closing-row',
          product: balanceProduct,
          dayReportedKg: '0',
          dayPreviousBalanceKg: '0',
          nightReportedKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '35',
          finishedKg: '0',
        },
      ],
    }

    const { result } = renderHook(() =>
      useProductionSectionProducts({
        draft: historicalDraft,
        setDraft: vi.fn(),
        catalogItems,
        setSaveError: vi.fn(),
        updateDraft: vi.fn(),
      }),
    )

    expect(result.current.closingRows).toHaveLength(1)
    expect(result.current.nonReportProductIds).toContain(
      balanceProduct.productId,
    )
  })

  it('keeps products linked to previous balances out of the daily report', () => {
    const balanceProduct = catalogItems[0]!
    const historicalDraft: ProductionCaptureDraft = {
      ...initialDraft,
      balanceUses: [
        {
          key: 'balance-origin-product',
          originDayId: 'production-day-2026-09-14',
          originDate: '2026-09-14',
          familyId: balanceProduct.familyId,
          familyName: balanceProduct.familyName,
          productId: balanceProduct.productId,
          productName: balanceProduct.productName,
          availableKg100: kg100(2500),
          dayKg: '25',
          nightKg: '0',
        },
      ],
    }

    const { result } = renderHook(() =>
      useProductionSectionProducts({
        draft: historicalDraft,
        setDraft: vi.fn(),
        catalogItems,
        setSaveError: vi.fn(),
        updateDraft: vi.fn(),
      }),
    )

    expect(result.current.nonReportProductIds).toContain(
      balanceProduct.productId,
    )
  })
})
