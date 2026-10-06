import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ProductionCatalogItem } from '../../production/capture/productionCatalog'
import type { CatalogFamily } from '../hooks/useCatalogsData'
import { CatalogProductModal } from './CatalogProductModal'

const families: readonly CatalogFamily[] = [
  { id: 'aleta-cruda', name: 'ALETA CRUDA', summaryGroupId: 'RECORTE_CRUDO' },
  { id: 'manto-crudo', name: 'MANTO CRUDO', summaryGroupId: 'RECORTE_CRUDO' },
]

const editingProduct: ProductionCatalogItem = {
  familyId: 'aleta-cruda',
  familyName: 'ALETA CRUDA',
  productId: 'aleta-cruda-block',
  productName: 'ALETA CRUDA CONGELADA BLOCK',
  summaryGroupId: 'RECORTE_CRUDO',
  aliases: ['ALETA BLOCK'],
}

function renderModal(
  overrides: Partial<Parameters<typeof CatalogProductModal>[0]> = {},
) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    editingProduct: null,
    formName: '',
    onFormNameChange: vi.fn(),
    formFamilyId: 'aleta-cruda',
    onFormFamilyIdChange: vi.fn(),
    formTechnicalClass: 'GENERAL' as const,
    onFormTechnicalClassChange: vi.fn(),
    newAlias: '',
    onNewAliasChange: vi.fn(),
    onAddAlias: vi.fn(),
    onRemoveAlias: vi.fn(),
    onSave: vi.fn((event: React.FormEvent) => event.preventDefault()),
    families,
    ...overrides,
  }
  const view = render(<CatalogProductModal {...props} />)
  return { props, ...view }
}

describe('CatalogProductModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the creation form without the aliases section', () => {
    renderModal()

    expect(
      screen.getByRole('heading', { name: 'Nuevo Producto en Catálogo' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'MANTO CRUDO' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Nuevo alias en Excel...')).not.toBeInTheDocument()
  })

  it('reports name, family and technical class changes', () => {
    const { props } = renderModal()
    const [familySelect, classSelect] = screen.getAllByRole('combobox')

    fireEvent.change(screen.getByPlaceholderText('Ej. TALLO CRUDO CONGELADO 1-2 KG'), {
      target: { value: 'TALLO CRUDO' },
    })
    expect(props.onFormNameChange).toHaveBeenCalledWith('TALLO CRUDO')

    fireEvent.change(familySelect!, { target: { value: 'manto-crudo' } })
    expect(props.onFormFamilyIdChange).toHaveBeenCalledWith('manto-crudo')

    fireEvent.change(classSelect!, { target: { value: 'USA' } })
    expect(props.onFormTechnicalClassChange).toHaveBeenCalledWith('USA')
  })

  it('shows alias management when editing and wires add/remove callbacks', () => {
    const { props } = renderModal({ editingProduct, newAlias: 'ALETA BLK' })

    expect(screen.getByRole('heading', { name: 'Editar Producto' })).toBeInTheDocument()
    expect(screen.getByText('ALETA BLOCK')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Nuevo alias en Excel...'), {
      target: { value: 'ALETA B' },
    })
    expect(props.onNewAliasChange).toHaveBeenCalledWith('ALETA B')

    fireEvent.click(screen.getByRole('button', { name: 'Agregar Alias' }))
    expect(props.onAddAlias).toHaveBeenCalled()

    fireEvent.click(screen.getByTitle('Eliminar alias'))
    expect(props.onRemoveAlias).toHaveBeenCalledWith('ALETA BLOCK')
  })

  it('shows the empty aliases message when the edited product has none', () => {
    renderModal({ editingProduct: { ...editingProduct, aliases: [] } })
    expect(screen.getByText('No hay sinónimos agregados aún.')).toBeInTheDocument()
  })

  it('submits the form and cancels through the footer buttons', () => {
    const { props } = renderModal({ formName: 'TALLO CRUDO' })

    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }))
    expect(props.onSave).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(props.onClose).toHaveBeenCalled()
  })
})
