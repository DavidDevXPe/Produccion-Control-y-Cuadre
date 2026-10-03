import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { useProductionDaysData } from './useProductionDaysData'

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

