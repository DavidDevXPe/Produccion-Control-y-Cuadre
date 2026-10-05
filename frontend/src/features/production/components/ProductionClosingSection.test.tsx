import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ProductionCaptureRow } from '../capture/productionCapture'
import { PRODUCTION_CATALOG_ITEMS } from '../capture/productionCatalog'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import {
  calculateProductionBusinessSummary,
} from '../model/businessRules'
import { calculateProductionDay } from '../model/calculations'
import {
  ProductionClosingSection,
  type ProductionClosingSectionProps,
} from './ProductionClosingSection'

describe('ProductionClosingSection', () => {
  const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)
  const businessSummary = calculateProductionBusinessSummary(
    WEDNESDAY_PRODUCTION_DAY,
    calculation,
  )

  const sampleCatalogItem = PRODUCTION_CATALOG_ITEMS[0]!

  const sampleRow: ProductionCaptureRow = {
    key: 'closing-row-1',
    product: sampleCatalogItem,
    dayReportedKg: '0',
    dayPreviousBalanceKg: '0',
    nightReportedKg: '0',
    nightPreviousBalanceKg: '0',
    tunnelDayKg: '0',
    tunnelNightKg: '0',
    treatmentKg: '0',
    closingBalanceKg: '150.50',
    finishedKg: '0',
  }

  function createProps(
    overrides: Partial<ProductionClosingSectionProps> = {},
  ): ProductionClosingSectionProps {
    return {
      enabled: true,
      reportsReconciled: true,
      catalogItems: PRODUCTION_CATALOG_ITEMS,
      rows: [sampleRow],
      businessSummary,
      selectedProcess: 'PACKING',
      searchInputRef: createRef<HTMLInputElement>(),
      onAddProduct: vi.fn(),
      onUpdateRow: vi.fn(),
      onRemoveProduct: vi.fn(),
      ...overrides,
    }
  }

  it('renders nothing when enabled is false', () => {
    const props = createProps({ enabled: false })
    const { container } = render(<ProductionClosingSection {...props} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders section card, badge, and description when enabled', () => {
    const props = createProps()
    render(<ProductionClosingSection {...props} />)

    expect(
      screen.getByRole('heading', { name: 'Saldo generado al cierre' }),
    ).toBeInTheDocument()
    expect(screen.getByText('JORNADA ORIGEN ACTUAL')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Registra únicamente producto real de esta jornada que quedará pendiente para después.',
      ),
    ).toBeInTheDocument()
  })

  it('disables the fieldset and inputs when reports are not reconciled', () => {
    const props = createProps({ reportsReconciled: false })
    render(<ProductionClosingSection {...props} />)

    const fieldset = screen.getByRole('group', {
      name: 'Saldo generado al cierre',
    })
    expect(fieldset).toBeDisabled()

    const quantityInput = screen.getByLabelText(/Saldo al cierre/i)
    expect(quantityInput).toBeDisabled()
  })

  it('renders empty message when there are no rows', () => {
    const props = createProps({ rows: [] })
    render(<ProductionClosingSection {...props} />)

    expect(
      screen.getByText(
        'Busca y agrega únicamente los productos que generaron saldo real.',
      ),
    ).toBeInTheDocument()
  })

  it('renders row with product details, quantity input and removal button', () => {
    const props = createProps()
    render(<ProductionClosingSection {...props} />)

    expect(screen.getByText(sampleCatalogItem.familyName)).toBeInTheDocument()
    expect(screen.getByText(sampleCatalogItem.productName)).toBeInTheDocument()

    const quantityInput = screen.getByLabelText(/Saldo al cierre/i)
    expect(quantityInput).toHaveValue('150.50')

    const deleteBtn = screen.getByRole('button', {
      name: `Eliminar saldo de ${sampleCatalogItem.productName}`,
    })
    expect(deleteBtn).toBeInTheDocument()
  })

  it('triggers onUpdateRow when quantity changes', () => {
    const onUpdateRow = vi.fn()
    const props = createProps({ onUpdateRow })
    render(<ProductionClosingSection {...props} />)

    const quantityInput = screen.getByLabelText(/Saldo al cierre/i)
    fireEvent.change(quantityInput, { target: { value: '250.75' } })

    expect(onUpdateRow).toHaveBeenCalledWith('closing-row-1', '250.75')
  })

  it('triggers onRemoveProduct when delete button is clicked', () => {
    const onRemoveProduct = vi.fn()
    const props = createProps({ onRemoveProduct })
    render(<ProductionClosingSection {...props} />)

    const deleteBtn = screen.getByRole('button', {
      name: `Eliminar saldo de ${sampleCatalogItem.productName}`,
    })
    fireEvent.click(deleteBtn)

    expect(onRemoveProduct).toHaveBeenCalledWith('closing-row-1')
  })

  it('triggers onAddProduct when a product is selected from ProductPicker', () => {
    const onAddProduct = vi.fn()
    const props = createProps({ onAddProduct })
    render(<ProductionClosingSection {...props} />)

    const input = screen.getByRole('combobox', {
      name: 'Buscar producto para saldo',
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
