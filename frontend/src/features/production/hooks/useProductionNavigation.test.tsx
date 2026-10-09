import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { useProductionNavigation } from './useProductionNavigation'

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/jornadas/nueva?process=PACKING']}>
      <ProductionDataProvider>
        <Routes>
          <Route path="/jornadas/nueva" element={<>{children}</>} />
          <Route path="/jornadas/:date" element={<>{children}</>} />
        </Routes>
      </ProductionDataProvider>
    </MemoryRouter>
  )
}

describe('useProductionNavigation', () => {
  it('initializes draft, process, mode and permissions correctly for a new entry', () => {
    const { result } = renderHook(() => useProductionNavigation(), { wrapper })

    expect(result.current.selectedProcess).toBe('PACKING')
    expect(result.current.mode).toBe('MANUAL')
    expect(result.current.isFreezing).toBe(false)
    expect(result.current.isEditingAllowed).toBe(true)
    expect(result.current.draft).toBeDefined()
    expect(result.current.draft.process).toBe('PACKING')
  })

  it('switches process and triggers reset callbacks when draft is empty', () => {
    const onProcessChangeReset = vi.fn()
    const setSaveError = vi.fn()

    const { result } = renderHook(
      () => useProductionNavigation({ onProcessChangeReset, setSaveError }),
      { wrapper },
    )

    act(() => {
      result.current.changeProcess('FREEZING')
    })

    expect(result.current.selectedProcess).toBe('FREEZING')
    expect(result.current.isFreezing).toBe(true)
    expect(onProcessChangeReset).toHaveBeenCalled()
    expect(setSaveError).toHaveBeenCalledWith('')
  })

  it('preserves current draft date when switching process within the active week', () => {
    const { result } = renderHook(() => useProductionNavigation(), { wrapper })

    const initialDate = result.current.draft.date
    expect(initialDate).toBeTruthy()

    act(() => {
      result.current.applyProcessChange('FREEZING')
    })

    expect(result.current.selectedProcess).toBe('FREEZING')
    expect(result.current.draft.date).toBe(initialDate)
  })
})

