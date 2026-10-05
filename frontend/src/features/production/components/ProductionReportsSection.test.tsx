import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  createEmptyCaptureDraft,
  type ProductionCaptureDraft,
  type ProductionCaptureRow,
} from '../capture/productionCapture'
import { PRODUCTION_CATALOG_ITEMS } from '../capture/productionCatalog'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateReportFamilySubtotals } from '../model/businessRules'
import { calculateProductionDay, kg100 } from '../model/calculations'
import {
  ProductionReportsSection,
  type ProductionReportsSectionProps,
} from './ProductionReportsSection'

describe('ProductionReportsSection', () => {
  const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)
  const wednesdayCatalogProduct = PRODUCTION_CATALOG_ITEMS.find(
    (item) => item.productId === 'aleta-cruda-codificada',
  ) ?? {
    productId: 'aleta-cruda-codificada',
    productName: 'ALETA CRUDA CONGELADA BLOCK S/TTO CODIFICADA',
    familyId: 'aleta-cruda',
    familyName: 'ALETA CRUDA',
    summaryGroupId: 'ALETA' as const,
  }

  const sampleSubtotals = calculateReportFamilySubtotals(
    WEDNESDAY_PRODUCTION_DAY,
    calculation,
  )
    .filter((subtotal) =>
      subtotal.productIds.includes(wednesdayCatalogProduct.productId),
    )
    .map((subtotal) => ({
      ...subtotal,
      productIds: [wednesdayCatalogProduct.productId],
    }))

  function createSampleRow(key = 'row-1'): ProductionCaptureRow {
    return {
      key,
      product: wednesdayCatalogProduct,
      dayReportedKg: '20010',
      dayPreviousBalanceKg: '0',
      nightReportedKg: '36120',
      nightPreviousBalanceKg: '0',
      tunnelDayKg: '0',
      tunnelNightKg: '0',
      treatmentKg: '0',
      closingBalanceKg: '0',
      finishedKg: '56130',
    }
  }

  function createProps(
    overrides: Partial<ProductionReportsSectionProps> = {},
  ): ProductionReportsSectionProps {
    const defaultDraft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-09-16', 'PACKING'),
      shiftAllocationMode: 'EXPLICIT',
      rows: [createSampleRow()],
    }

    return {
      draft: defaultDraft,
      calculation,
      reportCatalogItems: PRODUCTION_CATALOG_ITEMS,
      freezingAvailabilityByProduct: new Map(),
      reportFamilySubtotals: sampleSubtotals,
      orderedProductIds: [wednesdayCatalogProduct.productId],
      dayHasReportData: true,
      nightHasReportData: true,
      isFreezing: false,
      isBalanceOnly: false,
      isEditingAllowed: true,
      mode: 'MANUAL',
      selectedProcess: 'PACKING',
      searchInputRef: createRef<HTMLInputElement>(),
      getFreezingPotentialAvailabilityKg100: () => kg100(0),
      autoLinkFreezingProduct: vi.fn(),
      onAddReportProduct: vi.fn(),
      onUpdateRow: vi.fn(),
      onRemoveRow: vi.fn(),
      getCaptureCellProps: () => ({}),
      ...overrides,
    }
  }

  it('renders explicit shifts badge and description when shiftAllocationMode is EXPLICIT', () => {
    const props = createProps()
    render(<ProductionReportsSection {...props} />)

    expect(screen.getByText('Reportes Día / Noche')).toBeInTheDocument()
    expect(screen.getByText('TURNOS EXPLÍCITOS')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Registra los productos informados por los supervisores y concilia cada turno.',
      ),
    ).toBeInTheDocument()
  })

  it('renders reconciled distribution badge and description when shiftAllocationMode is RECONCILED_INFERENCE', () => {
    const baseDraft = createEmptyCaptureDraft('2026-09-16', 'PACKING')
    const reconciledDraft: ProductionCaptureDraft = {
      ...baseDraft,
      shiftAllocationMode: 'RECONCILED_INFERENCE',
      rows: [createSampleRow()],
    }
    const props = createProps({ draft: reconciledDraft })
    render(<ProductionReportsSection {...props} />)

    expect(screen.getByText('REPARTO CONCILIADO')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Día y Noche se distribuyen desde los totales del Excel y conservan su trazabilidad.',
      ),
    ).toBeInTheDocument()
  })

  it('shows empty placeholder when draft has no rows', () => {
    const emptyDraft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-09-16', 'PACKING'),
      rows: [],
    }
    const props = createProps({ draft: emptyDraft })
    render(<ProductionReportsSection {...props} />)

    expect(
      screen.getByText(
        'Carga una captura de producción para construir la lista de productos de esta jornada.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders ProductPicker in MANUAL mode and allows selecting a product', () => {
    const onAddReportProduct = vi.fn()
    const props = createProps({
      mode: 'MANUAL',
      onAddReportProduct,
    })
    render(<ProductionReportsSection {...props} />)

    const searchInput = screen.getByPlaceholderText(
      'Buscar producto o seleccionar del catálogo (ej.: aleta, manto o nuca)...',
    )
    expect(searchInput).toBeInTheDocument()

    fireEvent.change(searchInput, {
      target: { value: wednesdayCatalogProduct.productName },
    })
    const addButton = screen.getByRole('button', { name: 'Agregar producto' })
    expect(addButton).toBeInTheDocument()
  })

  it('hides ProductPicker when mode is EXCEL', () => {
    const props = createProps({ mode: 'EXCEL' })
    render(<ProductionReportsSection {...props} />)

    expect(
      screen.queryByPlaceholderText(
        'Buscar producto o seleccionar del catálogo (ej.: aleta, manto o nuca)...',
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Agregar producto' }),
    ).not.toBeInTheDocument()
  })

  it('renders capture table when rows are present', () => {
    const props = createProps()
    render(<ProductionReportsSection {...props} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(
      screen.getByText(wednesdayCatalogProduct.productName),
    ).toBeInTheDocument()
  })
})
