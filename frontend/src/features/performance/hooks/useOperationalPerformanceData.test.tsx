import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProductionDataProvider } from '../../production/state/ProductionDataContext'
import { useOperationalPerformanceData } from './useOperationalPerformanceData'

describe('useOperationalPerformanceData', () => {
  it('defaults to SUMMARY view and provides active week data', () => {
    const { result } = renderHook(() => useOperationalPerformanceData(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/rendimiento']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    expect(result.current.view).toBe('SUMMARY')
    expect(result.current.selectedProcess).toBeNull()
    expect(result.current.activeWeekNumber).toBeGreaterThan(0)
    expect(result.current.weekRecords).toBeDefined()
    expect(result.current.weekAggregate).toBeDefined()
  })

  it('handles switching view to PACKING and FREEZING', () => {
    const { result } = renderHook(() => useOperationalPerformanceData(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/rendimiento']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    expect(result.current.view).toBe('SUMMARY')

    act(() => {
      result.current.handleViewChange('PACKING')
    })

    expect(result.current.view).toBe('PACKING')
    expect(result.current.selectedProcess).toBe('PACKING')
  })
})
