import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ProductionCaptureRow } from '../capture/productionCapture'
import { PRODUCTION_CATALOG_ITEMS } from '../capture/productionCatalog'
import { kg100 } from '../model/calculations'
import {
  ProductionTunnelSection,
  type ProductionTunnelSectionProps,
} from './ProductionTunnelSection'

describe('ProductionTunnelSection', () => {
  const sampleCatalogItem = PRODUCTION_CATALOG_ITEMS[0]!

  const sampleRow: ProductionCaptureRow = {
    key: 'tunnel-row-1',
    product: sampleCatalogItem,
    dayReportedKg: '0',
    dayPreviousBalanceKg: '0',
    nightReportedKg: '0',
    nightPreviousBalanceKg: '0',
    tunnelDayKg: '500',
    tunnelNightKg: '300.50',
    treatmentKg: '0',
    closingBalanceKg: '0',
    finishedKg: '0',
  }

  function createProps(
    overrides: Partial<ProductionTunnelSectionProps> = {},
  ): ProductionTunnelSectionProps {
    return {
      enabled: true,
      reportsReconciled: true,
      tunnelMovementRequired: false,
      dayKg100: kg100(50000),
      nightKg100: kg100(30050),
      totalKg100: kg100(80050),
      catalogItems: PRODUCTION_CATALOG_ITEMS,
      rows: [sampleRow],
      selectedProcess: 'PACKING',
      searchInputRef: createRef<HTMLInputElement>(),
      onAddProduct: vi.fn(),
      onUpdateRow: vi.fn(),
      getTunnelCellProps: () => ({}),
      ...overrides,
    }
  }

  it('renders nothing when enabled is false', () => {
    const props = createProps({ enabled: false })
    const { container } = render(<ProductionTunnelSection {...props} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders section card, badge, and metric cards when reconciled', () => {
    const props = createProps()
    render(<ProductionTunnelSection {...props} />)

    expect(screen.getByRole('heading', { name: 'Túnel' })).toBeInTheDocument()
    expect(screen.getByText('TÚNEL DISPONIBLE')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Registra producción adicional por turno sin mezclarla con los reportes del supervisor.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Túnel Día')).toBeInTheDocument()
    expect(screen.getByText('Túnel Noche')).toBeInTheDocument()
    expect(screen.getByText('Total Túnel')).toBeInTheDocument()
  })

  it('renders warning badge and disables fieldset when reports are not reconciled', () => {
    const props = createProps({ reportsReconciled: false })
    render(<ProductionTunnelSection {...props} />)

    expect(screen.getByText('TÚNEL ESPERANDO CUADRE')).toBeInTheDocument()
    const fieldset = screen.getByRole('group', {
      name: 'Registro de producción de Túnel',
    })
    expect(fieldset).toBeDisabled()
  })

  it('renders warning alert when tunnelMovementRequired is true', () => {
    const props = createProps({ tunnelMovementRequired: true })
    render(<ProductionTunnelSection {...props} />)

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent(
      'Se indicó que existe producto para Túnel, pero no se registraron productos.',
    )
  })

  it('renders empty message when rows is empty', () => {
    const props = createProps({ rows: [] })
    render(<ProductionTunnelSection {...props} />)

    expect(
      screen.getByText('No hay productos de Túnel registrados.'),
    ).toBeInTheDocument()
  })

  it('renders row with day and night inputs and displays calculated total', () => {
    const props = createProps()
    render(<ProductionTunnelSection {...props} />)

    expect(screen.getByText(sampleCatalogItem.familyName)).toBeInTheDocument()
    expect(screen.getByText(sampleCatalogItem.productName)).toBeInTheDocument()

    const dayInput = screen.getByLabelText(/Kg Día/i)
    const nightInput = screen.getByLabelText(/Kg Noche/i)
    expect(dayInput).toHaveValue('500')
    expect(nightInput).toHaveValue('300.50')

    // Sum of 500 + 300.50 = 800.50 kg (appears in MetricCard and in row total)
    expect(screen.getAllByText('800.50 kg')).toHaveLength(2)
  })

  it('triggers onUpdateRow for day and night changes', () => {
    const onUpdateRow = vi.fn()
    const props = createProps({ onUpdateRow })
    render(<ProductionTunnelSection {...props} />)

    const dayInput = screen.getByLabelText(/Kg Día/i)
    fireEvent.change(dayInput, { target: { value: '600' } })
    expect(onUpdateRow).toHaveBeenCalledWith('tunnel-row-1', 'tunnelDayKg', '600')

    const nightInput = screen.getByLabelText(/Kg Noche/i)
    fireEvent.change(nightInput, { target: { value: '450' } })
    expect(onUpdateRow).toHaveBeenCalledWith('tunnel-row-1', 'tunnelNightKg', '450')
  })

  it('triggers onAddProduct when selecting a product from ProductPicker', () => {
    const onAddProduct = vi.fn()
    const props = createProps({ onAddProduct })
    render(<ProductionTunnelSection {...props} />)

    const input = screen.getByRole('combobox', {
      name: 'Buscar producto de Túnel',
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
