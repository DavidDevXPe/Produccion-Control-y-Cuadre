import { describe, expect, it } from 'vitest'
import type { FreezingExcelPreview } from '../capture/freezingExcelPreview'
import type {
  ParsedPackingReportImport,
} from '../capture/parseProductionWorkbook'
import { PRODUCTION_CATALOG_ITEMS } from '../capture/productionCatalog'
import {
  getUnresolvedFreezingRows,
  getUnresolvedPackingRows,
  updatePackingPreviewWithProduct,
} from './excelImportPackingHelpers'

describe('excelImportPackingHelpers', () => {
  const createSamplePackingPreview = (): ParsedPackingReportImport => {
    return {
      fileName: 'packing_report.xlsx',
      sheetName: 'REPORTE',
      operationalDate: '2026-09-16',
      shift: 'DAY',
      missingColumns: [],
      footerTotalKg: null,
      productiveRows: 1,
      rows: [
        {
          rowNumber: 2,
          rawProductName: 'PRODUCTO DESCONOCIDO',
          productName: 'PRODUCTO DESCONOCIDO',
          rowCalendarDate: null,
          totalKg: 500,
          product: null,
          matchKind: 'REVIEW_REQUIRED',
          status: 'NUEVO PRODUCTO',
        },
      ],
      ignoredRows: [],
      warnings: [],
      newRows: 1,
      normalizedRows: 0,
      aliasRows: 0,
      reviewRows: 1,
      recognizedRows: 0,
      reconstructedTotalKg: 500,
      status: 'EXCEL REQUIERE REVISIÓN',
    }
  }

  it('filters unresolved packing rows based on status and totalKg', () => {
    const preview = createSamplePackingPreview()
    expect(getUnresolvedPackingRows(preview)).toHaveLength(1)

    // With 0 kg it should not be considered unresolved blocker
    const zeroKgPreview: ParsedPackingReportImport = {
      ...preview,
      rows: [{ ...preview.rows[0]!, totalKg: 0 }],
    }
    expect(getUnresolvedPackingRows(zeroKgPreview)).toHaveLength(0)
    expect(getUnresolvedPackingRows(null)).toHaveLength(0)
  })

  it('filters unresolved freezing rows based on REQUIERE REVISIÓN status', () => {
    const preview: FreezingExcelPreview = {
      fileName: 'freezing.xlsx',
      sheetName: 'DÍA',
      shift: 'DAY',
      totalAros: 20,
      totalKg: 400,
      sourceGrandTotalAros: null,
      sourceGrandTotalKg: null,
      recognizedRows: 0,
      reviewRows: 1,
      rows: [
        {
          rowNumber: 1,
          rawProductName: 'DESC',
          baseProductName: 'PROD',
          packaging: null,
          quantityAros: 20,
          totalKg: 400,
          product: null,
          status: 'REQUIERE REVISIÓN',
        },
      ],
      warnings: [],
      reconciled: false,
      status: 'EXCEL REQUIERE REVISIÓN',
    }

    expect(getUnresolvedFreezingRows(preview)).toHaveLength(1)
    expect(getUnresolvedFreezingRows(null)).toHaveLength(0)
  })

  it('updates packing preview with resolved product and transitions status', () => {
    const preview = createSamplePackingPreview()
    const product = PRODUCTION_CATALOG_ITEMS[0]!

    const resolved = updatePackingPreviewWithProduct(
      preview,
      2,
      product,
      'COINCIDENCIA EXACTA',
      'Asignado manualmente',
    )

    expect(resolved.rows[0]!.product?.productId).toBe(product.productId)
    expect(resolved.rows[0]!.status).toBe('COINCIDENCIA EXACTA')
    expect(resolved.reviewRows).toBe(0)
    expect(resolved.newRows).toBe(0)
    expect(resolved.recognizedRows).toBe(1)
    expect(resolved.status).toBe('EXCEL RECONCILIADO')
  })
})
