import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useProductionDraftActions } from '../hooks/useProductionDraftActions'
import { createEmptyCaptureDraft, type ProductionCaptureDraft } from '../capture/productionCapture'
import { kg100 } from './calculations'
import { useFreezingTraceability } from '../hooks/useFreezingTraceability'
import { buildProductionDayFromCapture } from '../capture/productionCapture'
import { getActiveProducts } from '../capture/productCatalogRepository'
import type { FreezingAvailabilityPosition } from './freezing'

describe('User Scenarios for 08/10 and 09/10 Freezing & Envasado separation', () => {
  const catalog = getActiveProducts()
  const sampleProductA = catalog[0]!
  const sampleProductB = catalog[1]!

  it('Scenario 1: On 08/10/2026, editing freezing rows does not auto-populate balanceUses, and same-day Envasado is used directly', () => {
    // Setup a 08/10/2026 FREEZING draft
    let draft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-10-08', 'FREEZING'),
      rows: [
        {
          key: 'row-1',
          product: sampleProductA,
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
    const updateDraft = vi.fn()
    const clearSectionProduct = vi.fn()
    const setSaveError = vi.fn()

    // Mock positions including a past date (05/10) and today (08/10)
    const mockPositions: FreezingAvailabilityPosition[] = [
      {
        originDayId: 'day-packing-2026-10-05',
        originDate: '2026-10-05',
        familyId: sampleProductA.familyId,
        familyName: sampleProductA.familyName,
        productId: sampleProductA.productId,
        productName: sampleProductA.productName,
        summaryGroupId: sampleProductA.summaryGroupId,
        physicalDayKg100: kg100(57000),
        physicalNightKg100: kg100(0),
        receivedBalanceDayKg100: kg100(0),
        receivedBalanceNightKg100: kg100(0),
        ownDayKg100: kg100(57000),
        ownNightKg100: kg100(0),
        closingBalanceKg100: kg100(0),
        generatedKg100: kg100(57000), // 570 kg from 05/10
        processedDayKg100: kg100(0),
        processedNightKg100: kg100(0),
        processedTotalKg100: kg100(0),
        pendingKg100: kg100(57000),
        excessKg100: kg100(0),
      },
      {
        originDayId: 'day-packing-2026-10-08',
        originDate: '2026-10-08',
        familyId: sampleProductA.familyId,
        familyName: sampleProductA.familyName,
        productId: sampleProductA.productId,
        productName: sampleProductA.productName,
        summaryGroupId: sampleProductA.summaryGroupId,
        physicalDayKg100: kg100(56000),
        physicalNightKg100: kg100(0),
        receivedBalanceDayKg100: kg100(0),
        receivedBalanceNightKg100: kg100(0),
        ownDayKg100: kg100(56000),
        ownNightKg100: kg100(0),
        closingBalanceKg100: kg100(0),
        generatedKg100: kg100(56000), // 560 kg from 08/10
        processedDayKg100: kg100(0),
        processedNightKg100: kg100(0),
        processedTotalKg100: kg100(0),
        pendingKg100: kg100(56000),
        excessKg100: kg100(0),
      },
    ]

    const { result: actionsResult } = renderHook(() =>
      useProductionDraftActions({
        draft,
        setDraft,
        catalogItems: catalog,
        isFreezing: true,
        isBalanceOnly: false,
        isEditingAllowed: true,
        freezingAutomaticOriginPositions: mockPositions,
        clearSectionProduct,
        setSaveError,
        updateDraft,
      }),
    )

    // User types 280 kg in Day and 280 kg in Night
    act(() => {
      actionsResult.current.updateRow('row-1', 'dayReportedKg', '280')
    })
    act(() => {
      actionsResult.current.updateRow('row-1', 'nightReportedKg', '280')
    })

    // CRITICAL: No balance uses are auto-generated!
    expect(draft.balanceUses).toHaveLength(0)
    expect(draft.rows[0]?.dayReportedKg).toBe('280')
    expect(draft.rows[0]?.nightReportedKg).toBe('280')
  })

  it('Scenario 2: Traceability strictly isolates same-day Envasado and requires explicit registration for prior balances', () => {
    // Packing day on 05/10 with 570 kg
    const packing05 = buildProductionDayFromCapture(
      {
        ...createEmptyCaptureDraft('2026-10-05', 'PACKING'),
        declaredDayTotalKg: '570',
        rows: [
          {
            key: 'row-05',
            product: sampleProductA,
            dayReportedKg: '570',
            nightReportedKg: '0',
            dayPreviousBalanceKg: '0',
            nightPreviousBalanceKg: '0',
            tunnelDayKg: '0',
            tunnelNightKg: '0',
            treatmentKg: '0',
            closingBalanceKg: '0',
            finishedKg: '570',
          },
        ],
      },
      [],
      [],
      'CLOSED',
    ).productionDay

    // Packing day on 08/10 with 560 kg
    const packing08 = buildProductionDayFromCapture(
      {
        ...createEmptyCaptureDraft('2026-10-08', 'PACKING'),
        declaredDayTotalKg: '560',
        rows: [
          {
            key: 'row-08',
            product: sampleProductA,
            dayReportedKg: '560',
            nightReportedKg: '0',
            dayPreviousBalanceKg: '0',
            nightPreviousBalanceKg: '0',
            tunnelDayKg: '0',
            tunnelNightKg: '0',
            treatmentKg: '0',
            closingBalanceKg: '0',
            finishedKg: '560',
          },
        ],
      },
      [packing05],
      [],
      'CLOSED',
    ).productionDay

    const draft08: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-10-08', 'FREEZING'),
      rows: [
        {
          key: 'row-freezing-08',
          product: sampleProductA,
          dayReportedKg: '560',
          nightReportedKg: '0',
          dayPreviousBalanceKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '560',
        },
        {
          key: 'row-freezing-08-b',
          product: sampleProductB, // Product B had NO production on 08/10
          dayReportedKg: '0',
          nightReportedKg: '0',
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

    const { result: traceResult } = renderHook(() =>
      useFreezingTraceability({
        isFreezing: true,
        allProductionDays: [packing05, packing08],
        draft: draft08,
        catalogItems: catalog,
        totalReportedKg100: kg100(56000),
      }),
    )

    // Product A: Has 560 kg on 08/10, so Envasado shows exactly 560 kg (56000 kg100), NOT 570 kg!
    const availA = traceResult.current.getFreezingPotentialAvailabilityKg100(
      sampleProductA.productId,
    )
    expect(availA).toBe(kg100(56000))

    // Product B: Had NO production on 08/10 and no registered balance -> MUST BE 0 kg!
    const availB = traceResult.current.getFreezingPotentialAvailabilityKg100(
      sampleProductB.productId,
    )
    expect(availB).toBe(0)
  })

  it('Scenario 3: Adding and deleting a balance card permanently reflects in draft.balanceUses without re-registering', () => {
    let draft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-10-09', 'FREEZING'),
      rows: [
        {
          key: 'row-1',
          product: sampleProductA,
          dayReportedKg: '100',
          nightReportedKg: '0',
          dayPreviousBalanceKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '100',
        },
      ],
      balanceUses: [],
    }

    const setDraft = vi.fn((updater) => {
      if (typeof updater === 'function') {
        draft = updater(draft)
      }
    })
    const updateDraft = vi.fn()
    const clearSectionProduct = vi.fn()
    const setSaveError = vi.fn()

    const { result } = renderHook(() =>
      useProductionDraftActions({
        draft,
        setDraft,
        catalogItems: catalog,
        isFreezing: true,
        isBalanceOnly: false,
        isEditingAllowed: true,
        freezingAutomaticOriginPositions: [],
        clearSectionProduct,
        setSaveError,
        updateDraft,
      }),
    )

    // User adds a pending balance from 08/10
    act(() => {
      result.current.addSelectedBalance({
        originDayId: 'day-packing-2026-10-08',
        originDate: '2026-10-08',
        familyId: sampleProductA.familyId,
        familyName: sampleProductA.familyName,
        productId: sampleProductA.productId,
        productName: sampleProductA.productName,
        pendingKg100: kg100(10000),
      })
    })

    expect(draft.balanceUses).toHaveLength(1)
    const cardKey = draft.balanceUses[0]!.key

    // User deletes the card with the trash icon
    act(() => {
      result.current.removeBalanceUse(cardKey)
    })

    // The card is removed and STAYS removed (no auto-re-register)
    expect(draft.balanceUses).toHaveLength(0)

    // Updating a row does not bring it back
    act(() => {
      result.current.updateRow('row-1', 'dayReportedKg', '120')
    })
    expect(draft.balanceUses).toHaveLength(0)
  })
})
