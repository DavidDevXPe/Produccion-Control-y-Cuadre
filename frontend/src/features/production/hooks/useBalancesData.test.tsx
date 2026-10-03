import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { useBalancesData } from './useBalancesData'

describe('useBalancesData', () => {
  it('provides default balance state and week dates', () => {
    const { result } = renderHook(() => useBalancesData(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/saldos']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    expect(result.current.selectedProcess).toBe('PACKING')
    expect(result.current.isFreezing).toBe(false)
    expect(result.current.weekStart).toBeDefined()
    expect(result.current.weekEnd).toBeDefined()
    expect(result.current.searchQuery).toBe('')
    expect(result.current.selectedDate).toBe('')
  })

  it('updates searchQuery and selectedDate filters', () => {
    const { result } = renderHook(() => useBalancesData(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/saldos']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    act(() => {
      result.current.setSearchQuery('Tubo')
      result.current.setSelectedDate('2026-09-08')
    })

    expect(result.current.searchQuery).toBe('Tubo')
    expect(result.current.selectedDate).toBe('2026-09-08')
  })

  it('handles switching process to FREEZING via search params and callback', () => {
    const { result } = renderHook(() => useBalancesData(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/saldos?process=FREEZING']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    expect(result.current.selectedProcess).toBe('FREEZING')
    expect(result.current.isFreezing).toBe(true)

    act(() => {
      result.current.handleProcessChange('PACKING')
    })

    expect(result.current.selectedProcess).toBe('PACKING')
    expect(result.current.isFreezing).toBe(false)
  })
})
