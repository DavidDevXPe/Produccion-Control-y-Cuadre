import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ProductionCatalogItem } from '../../production/capture/productionCatalog'
import { CatalogProductTable } from './CatalogProductTable'

const activeProduct: ProductionCatalogItem = {
  familyId: 'aleta-cruda',
  familyName: 'ALETA CRUDA',
  productId: 'aleta-cruda-block',
  productName: 'ALETA CRUDA CONGELADA BLOCK',
  summaryGroupId: 'RECORTE_CRUDO',
  aliases: ['ALETA BLOCK', 'ALETA CRUDA BLK'],
  technicalClassification: 'POLAR',
}

const inactiveProduct: ProductionCatalogItem = {
  familyId: 'manto-crudo',
  familyName: 'MANTO CRUDO',
  productId: 'manto-crudo-iqf',
  productName: 'MANTO CRUDO IQF',
  summaryGroupId: 'RECORTE_CRUDO',
  active: false,
}

describe('CatalogProductTable', () => {
  it('renders the empty message when there are no products', () => {
    render(
      <CatalogProductTable products={[]} onEditProduct={vi.fn()} onToggleStatus={vi.fn()} />,
    )

    expect(
      screen.getByText('No se encontraron productos con los filtros seleccionados.'),
    ).toBeInTheDocument()
  })

  it('renders product details, aliases and active status', () => {
    render(
      <CatalogProductTable
        products={[activeProduct]}
        onEditProduct={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    )

    expect(screen.getByText('ALETA CRUDA CONGELADA BLOCK')).toBeInTheDocument()
    expect(screen.getByText('aleta-cruda-block')).toBeInTheDocument()
    expect(screen.getByText('ALETA CRUDA')).toBeInTheDocument()
    expect(screen.getByText('POLAR')).toBeInTheDocument()
    expect(screen.getByText('ALETA BLOCK')).toBeInTheDocument()
    expect(screen.getByText('ALETA CRUDA BLK')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByTitle('Desactivar producto')).toBeInTheDocument()
  })

  it('falls back to GENERAL classification and shows inactive state without aliases', () => {
    render(
      <CatalogProductTable
        products={[inactiveProduct]}
        onEditProduct={vi.fn()}
        onToggleStatus={vi.fn()}
      />,
    )

    expect(screen.getByText('GENERAL')).toBeInTheDocument()
    expect(screen.getByText('Sin alias mapeados')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
    expect(screen.getByTitle('Activar producto')).toBeInTheDocument()
  })

  it('invokes edit and toggle callbacks for the row product', () => {
    const onEditProduct = vi.fn()
    const onToggleStatus = vi.fn()
    render(
      <CatalogProductTable
        products={[activeProduct]}
        onEditProduct={onEditProduct}
        onToggleStatus={onToggleStatus}
      />,
    )

    fireEvent.click(screen.getByTitle('Editar producto'))
    expect(onEditProduct).toHaveBeenCalledWith(activeProduct)

    fireEvent.click(screen.getByTitle('Desactivar producto'))
    expect(onToggleStatus).toHaveBeenCalledWith('aleta-cruda-block')
  })
})
