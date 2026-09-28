import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CatalogsPage } from './CatalogsPage'
import { resetActiveProductCatalogForTests } from '../../production/capture/productCatalogRepository'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
  resetActiveProductCatalogForTests()
})

describe('CatalogsPage', () => {
  it('renders title and products table properly', () => {
    render(<CatalogsPage />)

    expect(screen.getByRole('heading', { name: 'Administración de Catálogos' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar por producto, familia o alias...')).toBeInTheDocument()
    expect(screen.getByText(/Productos y Equivalencias/)).toBeInTheDocument()
  })

  it('filters product list when searching', () => {
    render(<CatalogsPage />)

    const searchInput = screen.getByPlaceholderText('Buscar por producto, familia o alias...')
    fireEvent.change(searchInput, { target: { value: 'aleta' } })

    expect(screen.getAllByText(/ALETA CRUDA/).length).toBeGreaterThan(0)
    expect(screen.queryByText('ANILLAS CRUDAS CONGELADAS BLOCK')).not.toBeInTheDocument()
  })

  it('opens new product modal and creates a product', () => {
    render(<CatalogsPage />)

    const newBtn = screen.getByRole('button', { name: 'Nuevo Producto' })
    fireEvent.click(newBtn)

    expect(screen.getByRole('heading', { name: 'Nuevo Producto en Catálogo' })).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText('Ej. TALLO CRUDO CONGELADO 1-2 KG')
    fireEvent.change(nameInput, { target: { value: 'PRODUCTO TEST NUEVO 123' } })

    const saveBtn = screen.getByRole('button', { name: 'Guardar Cambios' })
    fireEvent.click(saveBtn)

    expect(screen.getByText('PRODUCTO TEST NUEVO 123')).toBeInTheDocument()
  })

  it('switches between products tab and benchmarks tab', () => {
    render(<CatalogsPage />)

    const benchmarksTab = screen.getByRole('button', { name: 'Parámetros Operativos' })
    fireEvent.click(benchmarksTab)

    expect(screen.getByText('Metas de Rendimiento por Familia')).toBeInTheDocument()
    expect(screen.getByText('Benchmarks de Eficiencia Operativa')).toBeInTheDocument()
  })
})
