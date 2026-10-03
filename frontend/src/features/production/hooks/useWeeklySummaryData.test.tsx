import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { useWeeklySummaryData } from './useWeeklySummaryData'

describe('useWeeklySummaryData', () => {
  it('returns empty state summary undefined when no production days exist in provider', () => {
    const { result } = renderHook(() => useWeeklySummaryData(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/resumen']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    expect(result.current.activeWeek).toBeDefined()
    expect(result.current.productionDays).toHaveLength(0)
    expect(result.current.summary).toBeUndefined()
  })

  it('computes summary, weekDays and product groups when fallback/seed days are active', () => {
    const { result } = renderHook(() => useWeeklySummaryData(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/resumen']}>{children}</MemoryRouter>
      ),
    })

    expect(result.current.activeWeek).toBeDefined()
    expect(result.current.productionDays.length).toBeGreaterThan(0)
    expect(result.current.summary).toBeDefined()
    expect(result.current.weekDays.length).toBe(7)
    expect(result.current.weeklyProductGroups.length).toBeGreaterThan(0)
  })

  it('switches views via handleViewChange', () => {
    const { result } = renderHook(() => useWeeklySummaryData(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/resumen']}>{children}</MemoryRouter>
      ),
    })

    expect(result.current.view).toBe('PACKING')

    act(() => {
      result.current.handleViewChange('FREEZING')
    })

    expect(result.current.view).toBe('FREEZING')
  })
})

