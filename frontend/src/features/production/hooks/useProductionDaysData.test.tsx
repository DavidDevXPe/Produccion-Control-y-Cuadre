import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { useProductionDaysData } from './useProductionDaysData'

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
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
})
