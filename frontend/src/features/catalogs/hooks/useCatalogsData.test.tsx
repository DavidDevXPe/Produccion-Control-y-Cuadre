import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetActiveProductCatalogForTests } from '../../production/capture/productCatalogRepository'
import { TRABUNDA_STORAGE_KEYS } from '../../../storage/trabundaStorage'
import { useCatalogsData } from './useCatalogsData'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
  resetActiveProductCatalogForTests()
})

describe('useCatalogsData', () => {
  it('loads products initially and allows filtering by search term', () => {
    const { result } = renderHook(() => useCatalogsData())

    expect(result.current.products.length).toBeGreaterThan(0)
    expect(result.current.filteredProducts.length).toBe(result.current.products.length)

    act(() => {
      result.current.setSearchTerm('aleta')
    })

    expect(result.current.filteredProducts.length).toBeGreaterThan(0)
    expect(
      result.current.filteredProducts.every(
        (p) =>
          p.productName.toLowerCase().includes('aleta') ||
          p.familyName.toLowerCase().includes('aleta') ||
          p.aliases?.some((a) => a.toLowerCase().includes('aleta')),
      ),
    ).toBe(true)
  })

  it('filters by status and family', () => {
    const { result } = renderHook(() => useCatalogsData())

    act(() => {
      result.current.setSelectedFamily('aleta-cruda')
    })

    expect(
      result.current.filteredProducts.every((p) => p.familyId === 'aleta-cruda'),
    ).toBe(true)

    act(() => {
      result.current.setSelectedStatus('ACTIVE')
    })

    expect(
      result.current.filteredProducts.every((p) => (p.active ?? true) === true),
    ).toBe(true)
  })

  it('manages modal open and close states', () => {
    const { result } = renderHook(() => useCatalogsData())

    expect(result.current.isModalOpen).toBe(false)

    act(() => {
      result.current.handleOpenAddModal()
    })

    expect(result.current.isModalOpen).toBe(true)
    expect(result.current.editingProduct).toBeNull()

    act(() => {
      result.current.handleCloseModal()
    })

    expect(result.current.isModalOpen).toBe(false)
  })

  it('refreshes the catalog after a storage change from another tab', () => {
    const { result } = renderHook(() => useCatalogsData())
    const product = {
      productId: 'catalog-cross-tab',
      productName: 'CATALOG CROSS TAB',
      familyId: 'manto-crudo',
      familyName: 'MANTO CRUDO',
      summaryGroupId: 'MANTO',
    }
    const storedProducts = JSON.stringify([product])

    localStorage.setItem(TRABUNDA_STORAGE_KEYS.productCatalog, storedProducts)
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: TRABUNDA_STORAGE_KEYS.productCatalog,
          newValue: storedProducts,
        }),
      )
    })

    expect(result.current.products.some((item) => item.productId === product.productId)).toBe(true)
  })
})

