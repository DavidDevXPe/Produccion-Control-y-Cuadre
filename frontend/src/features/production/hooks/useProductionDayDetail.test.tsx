import { renderHook } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProductionDataProvider } from '../state/ProductionDataContext'
import { useProductionDayDetail } from './useProductionDayDetail'

function renderDetailHook(route: string) {
  return renderHook(() => useProductionDayDetail(), {
    wrapper: ({ children }) => (
      <ProductionDataProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/jornadas/:date" element={<>{children}</>} />
            <Route path="/jornadas" element={<>{children}</>} />
          </Routes>
        </MemoryRouter>
      </ProductionDataProvider>
    ),
  })
}

describe('useProductionDayDetail', () => {
  it('returns undefined productionDay when date is not found', () => {
    const { result } = renderDetailHook('/jornadas/9999-99-99')
    expect(result.current.productionDay).toBeUndefined()
  })

  it('loads Wednesday production day and computes balanced status and calculation', () => {
    const { result } = renderDetailHook('/jornadas/2026-09-02')
    expect(result.current.productionDay).toBeDefined()
    expect(result.current.productionDay?.date).toBe('2026-09-02')
    expect(result.current.isBalanced).toBe(true)
    expect(result.current.isClosed).toBe(true)
    expect(result.current.canExport).toBe(true)
    expect(result.current.calculation).toBeDefined()
    expect(result.current.statusBadge.tone).toBe('warning')
    expect(result.current.statusBadge.label).toBe('CERRADA · CON OBSERVACIONES')
  })

  it('loads Saturday and provides packingCloseSummary and balancePositions', () => {
    const { result } = renderDetailHook('/jornadas/2026-09-05')
    expect(result.current.productionDay).toBeDefined()
    expect(result.current.packingCloseSummary.length).toBeGreaterThan(0)
    expect(result.current.balancePositions.length).toBeGreaterThan(0)
  })
})
