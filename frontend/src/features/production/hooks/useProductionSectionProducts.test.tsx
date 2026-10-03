import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useProductionSectionProducts } from './useProductionSectionProducts'
import { createEmptyCaptureDraft, type ProductionCaptureDraft } from '../capture/productionCapture'
import { getActiveProducts } from '../capture/productCatalogRepository'

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
  })
})
