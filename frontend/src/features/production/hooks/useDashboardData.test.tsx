import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { useDashboardData } from './useDashboardData'

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <ProductionDataProvider>
          {children}
        </ProductionDataProvider>
      </MemoryRouter>
    )
  }
}

describe('useDashboardData', () => {
  it('returns valid values from data context', () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.hasWeekData).toBe('boolean')
    expect(typeof result.current.registeredJourneyCount).toBe('number')
    expect(Array.isArray(result.current.packingDays)).toBe(true)
    expect(Array.isArray(result.current.freezingDays)).toBe(true)
    expect(Array.isArray(result.current.weeklyProductionData)).toBe(true)
    expect(Array.isArray(result.current.journeyRows)).toBe(true)
  })

  it('scopes attention items strictly to the selected week without leaking prior weeks', () => {
    window.localStorage.setItem('trabunda.production.activeWeek.v1', '42')
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    })

    const { startDate, endDate } = result.current.packingWeek.period
    for (const item of result.current.attentionItems) {
      expect(item.date >= startDate && item.date <= endDate).toBe(true)
    }
    expect(
      result.current.attentionItems.some(
        (item) => item.key === 'freezing-excess-over-origin',
      ),
    ).toBe(false)
    window.localStorage.removeItem('trabunda.production.activeWeek.v1')
  })
})

