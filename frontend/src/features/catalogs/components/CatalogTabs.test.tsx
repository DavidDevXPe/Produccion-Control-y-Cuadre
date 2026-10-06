import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CatalogTabs } from './CatalogTabs'

describe('CatalogTabs', () => {
  it('renders both tabs with the products count', () => {
    render(
      <CatalogTabs activeTab="PRODUCTS" productsCount={42} onSelectTab={vi.fn()} />,
    )

    expect(
      screen.getByRole('button', { name: /Productos y Equivalencias \(42\)/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Parámetros Operativos/ }),
    ).toBeInTheDocument()
  })

  it('highlights the active tab only', () => {
    render(
      <CatalogTabs activeTab="BENCHMARKS" productsCount={3} onSelectTab={vi.fn()} />,
    )

    const products = screen.getByRole('button', { name: /Productos/ })
    const benchmarks = screen.getByRole('button', { name: /Parámetros/ })
    expect(benchmarks.className).toContain('border-brand-700')
    expect(products.className).toContain('border-transparent')
  })

  it('notifies the selected tab on click', () => {
    const onSelectTab = vi.fn()
    render(
      <CatalogTabs activeTab="PRODUCTS" productsCount={3} onSelectTab={onSelectTab} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Parámetros/ }))
    expect(onSelectTab).toHaveBeenLastCalledWith('BENCHMARKS')

    fireEvent.click(screen.getByRole('button', { name: /Productos/ }))
    expect(onSelectTab).toHaveBeenLastCalledWith('PRODUCTS')
  })
})
