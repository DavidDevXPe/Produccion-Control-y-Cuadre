import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CatalogFamily } from '../hooks/useCatalogsData'
import { CatalogProductFilters } from './CatalogProductFilters'

const families: readonly CatalogFamily[] = [
  { id: 'aleta-cruda', name: 'ALETA CRUDA', summaryGroupId: 'RECORTE_CRUDO' },
  { id: 'manto-crudo', name: 'MANTO CRUDO', summaryGroupId: 'RECORTE_CRUDO' },
]

function renderFilters(overrides: Partial<Parameters<typeof CatalogProductFilters>[0]> = {}) {
  const props = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    selectedFamily: 'ALL',
    onFamilyChange: vi.fn(),
    selectedStatus: 'ALL' as const,
    onStatusChange: vi.fn(),
    families,
    ...overrides,
  }
  render(<CatalogProductFilters {...props} />)
  return props
}

describe('CatalogProductFilters', () => {
  it('renders the search box and one family option per catalog family', () => {
    renderFilters({ searchTerm: 'tallo' })

    expect(
      screen.getByPlaceholderText('Buscar por producto, familia o alias...'),
    ).toHaveValue('tallo')
    expect(screen.getByRole('option', { name: 'Todas las familias' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'ALETA CRUDA' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'MANTO CRUDO' })).toBeInTheDocument()
  })

  it('reports search text changes', () => {
    const props = renderFilters()

    fireEvent.change(
      screen.getByPlaceholderText('Buscar por producto, familia o alias...'),
      { target: { value: 'anillas' } },
    )
    expect(props.onSearchChange).toHaveBeenCalledWith('anillas')
  })

  it('reports family and status selections', () => {
    const props = renderFilters()
    const [familySelect, statusSelect] = screen.getAllByRole('combobox')

    fireEvent.change(familySelect!, { target: { value: 'manto-crudo' } })
    expect(props.onFamilyChange).toHaveBeenCalledWith('manto-crudo')

    fireEvent.change(statusSelect!, { target: { value: 'INACTIVE' } })
    expect(props.onStatusChange).toHaveBeenCalledWith('INACTIVE')
  })
})
