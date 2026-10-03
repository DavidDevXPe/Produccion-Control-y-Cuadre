import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ProductionDataProvider } from '../../features/production/state/ProductionDataContext'
import { useAdminShell } from './useAdminShell'

describe('useAdminShell', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('initializes default shell state and formatters', () => {
    const { result } = renderHook(() => useAdminShell(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    expect(result.current.isDashboard).toBe(true)
    expect(result.current.sectionLabel).toBe('Dashboard')
    expect(result.current.isMenuOpen).toBe(false)
    expect(result.current.operationalDate).toBeDefined()
    expect(result.current.operationalWeekday).toBeDefined()
    expect(result.current.operationalShift).toMatch(/Turno (Día|Noche)/)
    expect(result.current.weekSelectorOptions.length).toBeGreaterThan(0)
  })

  it('toggles color theme between light and dark', () => {
    const { result } = renderHook(() => useAdminShell(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    const initialTheme = result.current.colorTheme

    act(() => {
      result.current.toggleColorTheme()
    })

    expect(result.current.colorTheme).toBe(initialTheme === 'dark' ? 'light' : 'dark')
  })

  it('updates menu open state', () => {
    const { result } = renderHook(() => useAdminShell(), {
      wrapper: ({ children }) => (
        <ProductionDataProvider>
          <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
        </ProductionDataProvider>
      ),
    })

    expect(result.current.isMenuOpen).toBe(false)

    act(() => {
      result.current.setIsMenuOpen(true)
    })

    expect(result.current.isMenuOpen).toBe(true)

    act(() => {
      result.current.setIsMenuOpen(false)
    })

    expect(result.current.isMenuOpen).toBe(false)
  })
})
