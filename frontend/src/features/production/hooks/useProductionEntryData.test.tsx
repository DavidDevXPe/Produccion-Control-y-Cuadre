import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { useProductionEntryData } from './useProductionEntryData'

describe('useProductionEntryData', () => {
  it('initializes default state for new entry capture', () => {
    const { result } = renderHook(() => useProductionEntryData(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/jornadas/nueva']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    expect(result.current.mode).toBe('MANUAL')
    expect(result.current.draft).toBeDefined()
    expect(result.current.isFreezing).toBe(false)
    expect(result.current.saveError).toBe('')
    expect(result.current.isBulkFreezingLinkConfirmationOpen).toBe(false)
  })

  it('allows toggling between MANUAL and EXCEL modes', () => {
    const { result } = renderHook(() => useProductionEntryData(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/jornadas/nueva']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    expect(result.current.mode).toBe('MANUAL')

    act(() => {
      result.current.setMode('EXCEL')
    })

    expect(result.current.mode).toBe('EXCEL')

    act(() => {
      result.current.setMode('MANUAL')
    })

    expect(result.current.mode).toBe('MANUAL')
  })

  it('handles bulk freezing link dialog open/close state', () => {
    const { result } = renderHook(() => useProductionEntryData(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/jornadas/nueva']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    expect(result.current.isBulkFreezingLinkConfirmationOpen).toBe(false)

    act(() => {
      result.current.setIsBulkFreezingLinkConfirmationOpen(true)
    })

    expect(result.current.isBulkFreezingLinkConfirmationOpen).toBe(true)

    act(() => {
      result.current.setIsBulkFreezingLinkConfirmationOpen(false)
    })

    expect(result.current.isBulkFreezingLinkConfirmationOpen).toBe(false)
  })
})
