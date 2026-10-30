import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
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

  it('removes treatment-only rows instead of recovering them after deletion', () => {
    const treatmentProduct = catalogItems.find((product) =>
      product.productName.includes('EN TRATAMIENTO'),
    )
    expect(treatmentProduct).toBeDefined()

    const treatmentDraft: ProductionCaptureDraft = {
      ...initialDraft,
      rows: [
        {
          key: 'treatment-only-row',
          product: treatmentProduct!,
          dayReportedKg: '0',
          dayPreviousBalanceKg: '0',
          nightReportedKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '4178',
          closingBalanceKg: '0',
          finishedKg: '4178',
          captureSections: ['TREATMENT'],
        },
      ],
    }

    const { result } = renderHook(() => {
      const [draft, setDraft] = useState(treatmentDraft)
      const sectionProducts = useProductionSectionProducts({
        draft,
        setDraft,
        catalogItems,
        setSaveError: vi.fn(),
        updateDraft: vi.fn(),
      })

      return { draft, sectionProducts }
    })

    expect(result.current.sectionProducts.treatmentRows).toHaveLength(1)

    act(() => {
      result.current.sectionProducts.removeTreatmentProduct('treatment-only-row')
    })

    expect(result.current.sectionProducts.treatmentRows).toHaveLength(0)
    expect(result.current.draft.rows).toHaveLength(0)
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

  it('removes a closing-only row, including a zero-value BAA 1-2 row', () => {
    const balanceProduct = catalogItems.find(
      (product) => product.productId === 'rejo-baa-1-2',
    )
    expect(balanceProduct).toBeDefined()

    const draftWithClosingRow: ProductionCaptureDraft = {
      ...initialDraft,
      rows: [
        {
          key: 'closing-baa-1-2',
          product: balanceProduct!,
          dayReportedKg: '0',
          dayPreviousBalanceKg: '0',
          nightReportedKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '0',
          captureSections: ['BALANCE'],
        },
      ],
    }

    const { result } = renderHook(() => {
      const [draft, setDraft] = useState(draftWithClosingRow)
      const sectionProducts = useProductionSectionProducts({
        draft,
        setDraft,
        catalogItems,
        setSaveError: vi.fn(),
        updateDraft: vi.fn(),
      })

      return { draft, sectionProducts }
    })

    expect(result.current.sectionProducts.closingRows).toHaveLength(1)

    act(() => {
      result.current.sectionProducts.removeClosingProduct('closing-baa-1-2')
    })

    expect(result.current.sectionProducts.closingRows).toHaveLength(0)
    expect(result.current.draft.rows).toHaveLength(0)
  })

  it('removes only the saldo membership when the product is also in the report', () => {
    const balanceProduct = catalogItems.find(
      (product) => product.productId === 'rejo-baa-1-2',
    )
    expect(balanceProduct).toBeDefined()

    const draftWithSharedRow: ProductionCaptureDraft = {
      ...initialDraft,
      rows: [
        {
          key: 'shared-baa-1-2',
          product: balanceProduct!,
          dayReportedKg: '125',
          dayPreviousBalanceKg: '0',
          nightReportedKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '40',
          finishedKg: '0',
          captureSections: ['BALANCE'],
        },
      ],
    }

    const { result } = renderHook(() => {
      const [draft, setDraft] = useState(draftWithSharedRow)
      const sectionProducts = useProductionSectionProducts({
        draft,
        setDraft,
        catalogItems,
        setSaveError: vi.fn(),
        updateDraft: vi.fn(),
      })

      return { draft, sectionProducts }
    })

    act(() => {
      result.current.sectionProducts.removeClosingProduct('shared-baa-1-2')
    })

    expect(result.current.sectionProducts.closingRows).toHaveLength(0)
    expect(result.current.draft.rows).toHaveLength(1)
    expect(result.current.draft.rows[0]).toMatchObject({
      dayReportedKg: '125',
      closingBalanceKg: '0',
    })
    expect(result.current.draft.rows[0]?.captureSections).toBeUndefined()
  })

  it('keeps each section independent when the same product has different quantities', () => {
    const sharedProduct = catalogItems.find(
      (product) => product.productId === 'rejo-baa-1-2',
    )
    expect(sharedProduct).toBeDefined()

    const sharedDraft: ProductionCaptureDraft = {
      ...initialDraft,
      rows: [
        {
          key: 'shared-sections-baa-1-2',
          product: sharedProduct!,
          dayReportedKg: '125',
          dayPreviousBalanceKg: '0',
          nightReportedKg: '75',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '40',
          tunnelNightKg: '15',
          treatmentKg: '12',
          closingBalanceKg: '30',
          finishedKg: '0',
          captureSections: ['TUNNEL', 'TREATMENT', 'BALANCE'],
        },
      ],
    }

    const { result } = renderHook(() => {
      const [draft, setDraft] = useState(sharedDraft)
      const sectionProducts = useProductionSectionProducts({
        draft,
        setDraft,
        catalogItems,
        setSaveError: vi.fn(),
        updateDraft: vi.fn(),
      })

      return { draft, sectionProducts }
    })

    act(() => {
      result.current.sectionProducts.removeTunnelProduct('shared-sections-baa-1-2')
    })

    expect(result.current.draft.rows[0]).toMatchObject({
      dayReportedKg: '125',
      nightReportedKg: '75',
      tunnelDayKg: '0',
      tunnelNightKg: '0',
      treatmentKg: '12',
      closingBalanceKg: '30',
    })
    expect(result.current.sectionProducts.tunnelRows).toHaveLength(0)
    expect(result.current.sectionProducts.treatmentRows).toHaveLength(1)
    expect(result.current.sectionProducts.closingRows).toHaveLength(1)

    act(() => {
      result.current.sectionProducts.removeTreatmentProduct('shared-sections-baa-1-2')
    })

    expect(result.current.draft.rows[0]).toMatchObject({
      dayReportedKg: '125',
      nightReportedKg: '75',
      treatmentKg: '0',
      closingBalanceKg: '30',
    })
    expect(result.current.sectionProducts.treatmentRows).toHaveLength(0)
    expect(result.current.sectionProducts.closingRows).toHaveLength(1)

    act(() => {
      result.current.sectionProducts.removeClosingProduct('shared-sections-baa-1-2')
    })

    expect(result.current.draft.rows).toHaveLength(1)
    expect(result.current.draft.rows[0]).toMatchObject({
      dayReportedKg: '125',
      nightReportedKg: '75',
      closingBalanceKg: '0',
    })
    expect(result.current.sectionProducts.closingRows).toHaveLength(0)
  })

  it('does not remove report traceability backed by a previous balance when tunnel is deleted', () => {
    const sharedProduct = catalogItems.find(
      (product) => product.productId === 'rejo-baa-1-2',
    )
    expect(sharedProduct).toBeDefined()

    const draftWithPreviousBalance: ProductionCaptureDraft = {
      ...initialDraft,
      rows: [
        {
          key: 'tunnel-with-previous-balance',
          product: sharedProduct!,
          dayReportedKg: '0',
          dayPreviousBalanceKg: '8',
          nightReportedKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '4',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '0',
          captureSections: ['TUNNEL'],
        },
      ],
    }

    const { result } = renderHook(() => {
      const [draft, setDraft] = useState(draftWithPreviousBalance)
      const sectionProducts = useProductionSectionProducts({
        draft,
        setDraft,
        catalogItems,
        setSaveError: vi.fn(),
        updateDraft: vi.fn(),
      })

      return { draft, sectionProducts }
    })

    act(() => {
      result.current.sectionProducts.removeTunnelProduct(
        'tunnel-with-previous-balance',
      )
    })

    expect(result.current.draft.rows).toHaveLength(1)
    expect(result.current.draft.rows[0]).toMatchObject({
      dayPreviousBalanceKg: '8',
      tunnelDayKg: '0',
    })
    expect(result.current.sectionProducts.tunnelRows).toHaveLength(0)
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
