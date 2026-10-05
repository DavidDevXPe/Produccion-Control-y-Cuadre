import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ProductionCaptureRow } from '../capture/productionCapture'
import { PRODUCTION_CATALOG_ITEMS } from '../capture/productionCatalog'
import {
  ProductionTreatmentSection,
  type ProductionTreatmentSectionProps,
} from './ProductionTreatmentSection'

describe('ProductionTreatmentSection', () => {
  const sampleCatalogItem = PRODUCTION_CATALOG_ITEMS[0]!

  const sampleRow: ProductionCaptureRow = {
    key: 'treatment-row-1',
    product: sampleCatalogItem,
    dayReportedKg: '0',
    dayPreviousBalanceKg: '0',
    nightReportedKg: '0',
    nightPreviousBalanceKg: '0',
    tunnelDayKg: '0',
    tunnelNightKg: '0',
    treatmentKg: '420.50',
    closingBalanceKg: '0',
    finishedKg: '0',
  }

  function createProps(
    overrides: Partial<ProductionTreatmentSectionProps> = {},
  ): ProductionTreatmentSectionProps {
    return {
      enabled: true,
      reportsReconciled: true,
      catalogItems: PRODUCTION_CATALOG_ITEMS,
      rows: [sampleRow],
      selectedProcess: 'PACKING',
      searchInputRef: createRef<HTMLInputElement>(),
      onAddProduct: vi.fn(),
      onUpdateRow: vi.fn(),
      onRemoveProduct: vi.fn(),
      getTreatmentCellProps: () => ({}),
      ...overrides,
    }
  }

  it('renders nothing when enabled is false', () => {
    const props = createProps({ enabled: false })
    const { container } = render(<ProductionTreatmentSection {...props} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders section card, badge, and description when enabled and reconciled', () => {
    const props = createProps()
    render(<ProductionTreatmentSection {...props} />)

    expect(screen.getByRole('heading', { name: 'Tratamiento' })).toBeInTheDocument()
    expect(screen.getByText('DISPONIBLE')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Registra movimientos de tratamiento de forma independiente al reporte de los turnos.',
      ),
    ).toBeInTheDocument()
  })

  it('renders pending badge and disables fieldset when reports are not reconciled', () => {
    const props = createProps({ reportsReconciled: false })
    render(<ProductionTreatmentSection {...props} />)

    expect(screen.getByText('ESPERANDO CUADRE DE TURNOS')).toBeInTheDocument()
    const fieldset = screen.getByRole('group', {
      name: 'Registro de tratamiento',
    })
    expect(fieldset).toBeDisabled()
  })

  it('renders empty message when rows is empty', () => {
    const props = createProps({ rows: [] })
    render(<ProductionTreatmentSection {...props} />)

    expect(
      screen.getByText('No hay productos de tratamiento registrados.'),
    ).toBeInTheDocument()
  })

  it('renders rows with product name, quantity input and removal button', () => {
    const props = createProps()
    render(<ProductionTreatmentSection {...props} />)

    expect(screen.getByText(sampleCatalogItem.familyName)).toBeInTheDocument()
    expect(screen.getByText(sampleCatalogItem.productName)).toBeInTheDocument()

    const input = screen.getByLabelText(/Kg tratamiento/i)
    expect(input).toHaveValue('420.50')

    const deleteBtn = screen.getByRole('button', {
      name: `Eliminar tratamiento de ${sampleCatalogItem.productName}`,
    })
    expect(deleteBtn).toBeInTheDocument()
  })

  it('triggers onUpdateRow when quantity changes', () => {
    const onUpdateRow = vi.fn()
    const props = createProps({ onUpdateRow })
    render(<ProductionTreatmentSection {...props} />)

    const input = screen.getByLabelText(/Kg tratamiento/i)
    fireEvent.change(input, { target: { value: '550' } })

    expect(onUpdateRow).toHaveBeenCalledWith('treatment-row-1', '550')
  })

  it('triggers onRemoveProduct when delete button is clicked', () => {
    const onRemoveProduct = vi.fn()
    const props = createProps({ onRemoveProduct })
    render(<ProductionTreatmentSection {...props} />)

    const deleteBtn = screen.getByRole('button', {
      name: `Eliminar tratamiento de ${sampleCatalogItem.productName}`,
    })
    fireEvent.click(deleteBtn)

    expect(onRemoveProduct).toHaveBeenCalledWith('treatment-row-1')
  })

  it('triggers onAddProduct when selecting a product from ProductPicker', () => {
    const onAddProduct = vi.fn()
    const props = createProps({ onAddProduct })
    render(<ProductionTreatmentSection {...props} />)

    const input = screen.getByRole('combobox', {
      name: 'Buscar producto de tratamiento',
    })
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'aleta' } })

    const option = screen.getByRole('option', {
      name: new RegExp(sampleCatalogItem.productName, 'i'),
    })
    fireEvent.click(option)

    expect(onAddProduct).toHaveBeenCalledWith(sampleCatalogItem.productId)
  })
})
