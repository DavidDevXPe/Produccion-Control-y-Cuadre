import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useProductionCalculations } from './useProductionCalculations'
import { createEmptyCaptureDraft } from '../capture/productionCapture'
import { getActiveProducts } from '../capture/productCatalogRepository'

describe('useProductionCalculations', () => {
  const catalogItems = getActiveProducts()

  it('computes basic buildResult, summary, and reconciliation for an initial draft', () => {
    const draft = createEmptyCaptureDraft('2026-09-15', 'PACKING')

    const { result } = renderHook(() =>
      useProductionCalculations({
        draft,
        allProductionDays: [],
        subsequentBalanceLots: [],
        catalogItems,
        isFreezing: false,
        usesExternalAvailability: false,
      }),
    )

    expect(result.current.buildResult).toBeDefined()
    expect(result.current.businessSummary).toBeDefined()
    expect(result.current.totalReportedKg100).toBe(0)
    expect(result.current.hasReportData).toBe(false)
    expect(result.current.canClose).toBe(false)
    expect(result.current.footerStatus).toBeDefined()
    expect(result.current.reportCatalogItems.length).toBeGreaterThan(0)
  })

  it('filters available balances when external availability is active', () => {
    const draft = createEmptyCaptureDraft('2026-09-15', 'FREEZING')

    const { result } = renderHook(() =>
      useProductionCalculations({
        draft,
        allProductionDays: [],
        subsequentBalanceLots: [],
        catalogItems,
        isFreezing: true,
        usesExternalAvailability: true,
      }),
    )

    expect(result.current.availableBalances).toBeDefined()
    expect(result.current.freezingBalanceUseSummary).toBeDefined()
    expect(result.current.freezingPendingLinkCount).toBe(0)
  })
})
