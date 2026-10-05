import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FreezingExcelPreview } from '../capture/freezingExcelPreview'
import type { ParsedPackingReportImport } from '../capture/parseProductionWorkbook'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import {
  ProductionExcelImportSection,
  type ProductionExcelImportSectionProps,
} from './ProductionExcelImportSection'

describe('ProductionExcelImportSection', () => {
  const sampleProduct: ProductionCatalogItem = {
    productId: 'prod-1',
    productName: 'ALETA CRUDA',
    familyId: 'fam-aleta',
    familyName: 'ALETA',
    summaryGroupId: 'ALETA',
    canonicalName: 'ALETA CRUDA',
  }

  const createProps = (
    overrides?: Partial<ProductionExcelImportSectionProps>,
  ): ProductionExcelImportSectionProps => ({
    enabled: true,
    isFreezing: false,
    excelShift: 'DAY',
    fileName: '',
    importState: 'IDLE',
    excelImportMessage: '',
    canConfirmExcelImport: false,
    excelPreview: null,
    freezingExcelPreview: null,
    unresolvedExcelRows: [],
    unresolvedFreezingExcelRows: [],
    excelExistingProductByRow: {},
    freezingNewProductFamilyByRow: {},
    freezingCatalogFamilyOptions: [
      { familyId: 'fam-aleta', familyName: 'ALETA' },
    ],
    catalogItems: [sampleProduct],
    onChangeExcelShift: vi.fn(),
    onWorkbookFileChange: vi.fn(),
    onApplyExcelPreview: vi.fn(),
    onSelectExistingProductForRow: vi.fn(),
    onSelectFreezingFamilyForRow: vi.fn(),
    onAssociateFreezingExcelRowToExisting: vi.fn(),
    onAddFreezingExcelRowToCatalog: vi.fn(),
    onAddExcelRowToCatalog: vi.fn(),
    onAssociateExcelRowToExisting: vi.fn(),
    ...overrides,
  })

  it('renders nothing when enabled is false', () => {
    const { container } = render(
      <ProductionExcelImportSection {...createProps({ enabled: false })} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders section card with Envasado title when isFreezing is false', () => {
    render(<ProductionExcelImportSection {...createProps({ isFreezing: false })} />)
    expect(
      screen.getByRole('heading', { name: 'Importar Excel de Envasado' }),
    ).toBeInTheDocument()
  })

  it('renders section card with Congelamiento title when isFreezing is true', () => {
    render(<ProductionExcelImportSection {...createProps({ isFreezing: true })} />)
    expect(
      screen.getByRole('heading', { name: 'Importar Excel de Congelamiento' }),
    ).toBeInTheDocument()
  })

  it('calls onChangeExcelShift when shift select is changed', () => {
    const onChangeExcelShift = vi.fn()
    render(
      <ProductionExcelImportSection
        {...createProps({ onChangeExcelShift })}
      />,
    )
    const select = screen.getByRole('combobox', { name: 'Turno a importar' })
    fireEvent.change(select, { target: { value: 'NIGHT' } })
    expect(onChangeExcelShift).toHaveBeenCalledWith('NIGHT')
  })

  it('renders unresolved rows alert when there are unresolved items', () => {
    render(
      <ProductionExcelImportSection
        {...createProps({
          unresolvedExcelRows: [{ rowNumber: 1 }],
        })}
      />,
    )
    expect(
      screen.getByText(
        '1 producto(s) requieren revisión antes de confirmar la importación.',
      ),
    ).toBeInTheDocument()
  })

  it('renders Packing preview table when excelPreview is provided', () => {
    const excelPreview: ParsedPackingReportImport = {
      fileName: 'packing.xlsx',
      sheetName: 'REPORTE',
      operationalDate: '2026-09-16',
      shift: 'DAY',
      missingColumns: [],
      footerTotalKg: null,
      productiveRows: 1,
      rows: [
        {
          rowNumber: 1,
          rawProductName: 'ALETA CRUDA',
          productName: 'ALETA CRUDA',
          rowCalendarDate: null,
          totalKg: 1000,
          product: sampleProduct,
          matchKind: 'EXACT',
          status: 'COINCIDENCIA EXACTA',
        },
      ],
      ignoredRows: [],
      warnings: [],
      newRows: 0,
      normalizedRows: 0,
      aliasRows: 0,
      reviewRows: 0,
      recognizedRows: 1,
      reconstructedTotalKg: 1000,
      status: 'EXCEL RECONCILIADO',
    }

    const props = createProps({
      excelPreview,
      canConfirmExcelImport: true,
    })
    render(<ProductionExcelImportSection {...props} />)

    expect(screen.getByText('Vista previa de Envasado')).toBeInTheDocument()
    expect(screen.getAllByText('ALETA CRUDA').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('COINCIDENCIA EXACTA')).toBeInTheDocument()
  })

  it('renders Freezing preview table when freezingExcelPreview is provided', () => {
    const freezingExcelPreview: FreezingExcelPreview = {
      fileName: 'freezing.xlsx',
      sheetName: 'DÍA',
      shift: 'DAY',
      totalAros: 50,
      totalKg: 1250,
      sourceGrandTotalAros: null,
      sourceGrandTotalKg: null,
      recognizedRows: 1,
      reviewRows: 0,
      rows: [
        {
          rowNumber: 1,
          rawProductName: 'ALETA CRUDA',
          baseProductName: 'ALETA CRUDA',
          packaging: null,
          quantityAros: 50,
          totalKg: 1250,
          product: sampleProduct,
          status: 'COINCIDENCIA EXACTA',
        },
      ],
      warnings: [],
      reconciled: true,
      status: 'EXCEL RECONCILIADO',
    }

    const props = createProps({
      isFreezing: true,
      freezingExcelPreview,
      canConfirmExcelImport: true,
    })
    render(<ProductionExcelImportSection {...props} />)

    expect(screen.getByText('Vista previa de Congelamiento')).toBeInTheDocument()
    expect(screen.getAllByText('ALETA CRUDA').length).toBeGreaterThanOrEqual(1)
  })
})
