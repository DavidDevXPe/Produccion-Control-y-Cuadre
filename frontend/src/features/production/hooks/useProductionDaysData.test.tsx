import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { closedFreezingDay, closedPackingDay } from '../../../test/productionFixtures'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import {
  ACTIVE_WEEK_STORAGE_KEY,
  DAYS_STORAGE_KEY,
} from '../state/productionDataConstants'
import { useProductionDaysData } from './useProductionDaysData'

function createWrapper(initialEntries: string[] = ['/']) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <ProductionDataProvider>{children}</ProductionDataProvider>
      </MemoryRouter>
    )
  }
}

describe('useProductionDaysData', () => {
  it('initializes with default process and calculations', () => {
    const { result } = renderHook(() => useProductionDaysData(), {
      wrapper: createWrapper(),
    })
    expect(result.current.selectedProcess).toBeDefined()
    expect(typeof result.current.isFreezing).toBe('boolean')
    expect(Array.isArray(result.current.registeredDays)).toBe(true)
    expect(typeof result.current.balancedCount).toBe('number')
    expect(typeof result.current.belowReferenceCount).toBe('number')
    expect(result.current.weeklySummary).toBeDefined()
  })
})

describe('production day filters', () => {
  it('totals only the visible journeys and resets the totals when no rows match', () => {
    const { result } = renderHook(() => useProductionDaysData(), { wrapper: MemoryRouter })
    const day = result.current.allRegisteredDays[0]!.day
    expect(result.current.allRegisteredDays.length).toBeGreaterThan(1)
    act(() => result.current.setSelectedDate(day.date))
    expect(result.current.registeredDays).toHaveLength(1)
    expect(result.current.weeklySummary.rawMaterialKg100).toBe(day.declaredRawMaterialKg100)
    expect(result.current.weeklySummary.declaredFinishedKg100).toBe(day.declaredFinishedTotalKg100)
    act(() => result.current.setSearchQuery('no-matching-journey'))
    expect(result.current.registeredDays).toHaveLength(0)
    expect(result.current.weeklySummary.rawMaterialKg100).toBe(0)
    expect(result.current.weeklySummary.declaredFinishedKg100).toBe(0)
  })

  it('keeps weekly freezing indicators separate from the global pending ledger', () => {
    window.localStorage.clear()
    window.localStorage.setItem(ACTIVE_WEEK_STORAGE_KEY, '48')

    const origin = closedPackingDay('2026-10-20', 100_000)
    const freezing = closedFreezingDay({
      date: '2026-10-21',
      reportedKg: 80_000,
      linkedKg: 80_000,
      origin,
    })
    window.localStorage.setItem(
      DAYS_STORAGE_KEY,
      JSON.stringify([origin, freezing]),
    )

    const { result } = renderHook(() => useProductionDaysData(), {
      wrapper: createWrapper(['/jornadas?process=FREEZING']),
    })

    expect(result.current.freezingWeeklyAvailableKg100).toBe(2_000_000)
    expect(result.current.freezingWeeklyPhysicalKg100).toBe(8_000_000)
    expect(result.current.freezingWeeklyLinkedKg100).toBe(8_000_000)
    expect(result.current.freezingWeeklyDifferenceKg100).toBe(0)
    expect(result.current.freezingHasRecords).toBe(true)
    // The global figure is independent from the selected-week cards and is
    // the remaining ledger after the 80,000 kg FIFO consumption.
    expect(result.current.freezingPendingKg100).toBeGreaterThanOrEqual(2_000_000)
  })

  it('shows Envasado availability when the selected week has no Freezing record', () => {
    window.localStorage.clear()
    window.localStorage.setItem(ACTIVE_WEEK_STORAGE_KEY, '48')

    const origin = closedPackingDay('2026-10-20', 100_000)
    window.localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify([origin]))

    const { result } = renderHook(() => useProductionDaysData(), {
      wrapper: createWrapper(['/jornadas?process=FREEZING']),
    })

    expect(result.current.freezingWeeklyAvailableKg100).toBe(10_000_000)
    expect(result.current.freezingWeeklyPhysicalKg100).toBe(0)
    expect(result.current.freezingWeeklyLinkedKg100).toBe(0)
    expect(result.current.freezingHasRecords).toBe(false)
    expect(result.current.freezingPendingKg100).toBeGreaterThanOrEqual(10_000_000)
  })

  it('subtracts a later FIFO consumption from the selected week availability', () => {
    window.localStorage.clear()
    window.localStorage.setItem(ACTIVE_WEEK_STORAGE_KEY, '48')

    const origin = closedPackingDay('2026-10-20', 100_000)
    const laterFreezing = closedFreezingDay({
      date: '2026-10-27',
      reportedKg: 100_000,
      linkedKg: 100_000,
      origin,
    })
    window.localStorage.setItem(
      DAYS_STORAGE_KEY,
      JSON.stringify([origin, laterFreezing]),
    )

    const { result } = renderHook(() => useProductionDaysData(), {
      wrapper: createWrapper(['/jornadas?process=FREEZING']),
    })

    expect(result.current.freezingHasRecords).toBe(false)
    expect(result.current.freezingWeeklyAvailableKg100).toBe(0)
    expect(result.current.freezingWeeklyPhysicalKg100).toBe(0)
    expect(result.current.freezingWeeklyLinkedKg100).toBe(0)
  })
})
