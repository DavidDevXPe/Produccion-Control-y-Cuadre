import { describe, expect, it } from 'vitest'
import type { FreezingExcelPreview } from '../capture/freezingExcelPreview'
import {
  createEmptyCaptureDraft,
  type ProductionCaptureDraft,
} from '../capture/productionCapture'
import { PRODUCTION_CATALOG_ITEMS } from '../capture/productionCatalog'
import {
  buildUpdatedFreezingDraft,
  getFreezingCatalogFamilyOptions,
} from './excelImportFreezingHelpers'

describe('excelImportFreezingHelpers', () => {
  it('extracts unique family options with familyId and familyName', () => {
    const items = [
      {
        productId: '1',
        productName: 'P1',
        familyId: 'fam-1',
        familyName: 'Familia 1',
        summaryGroupId: 'MANTO',
      },
      {
        productId: '2',
        productName: 'P2',
        familyId: 'fam-1',
        familyName: 'Familia 1',
        summaryGroupId: 'MANTO',
      },
      {
        productId: '3',
        productName: 'P3',
        familyId: 'fam-2',
        familyName: 'Familia 2',
        summaryGroupId: 'ALETA',
      },
    ]

    const options = getFreezingCatalogFamilyOptions(items as never)
    expect(options).toHaveLength(3)
    expect(options[0]).toEqual({
      familyId: 'fam-1',
      familyName: 'Familia 1',
      summaryGroupId: 'MANTO',
    })
    expect(options[1]).toEqual({
      familyId: 'fam-2',
      familyName: 'Familia 2',
      summaryGroupId: 'ALETA',
    })
    expect(options[2]).toEqual({
      familyId: 'nuca-bikini',
      familyName: 'NUCA BIKINI',
      summaryGroupId: 'NUCA_BIKINI',
    })
  })

  it('updates draft with Day shift freezing Excel preview and sets declaredDayTotalKg', () => {
    const initialDraft: ProductionCaptureDraft = createEmptyCaptureDraft(
      '2026-09-16',
      'FREEZING',
    )
    const product = PRODUCTION_CATALOG_ITEMS[0]!

    const preview: FreezingExcelPreview = {
      fileName: 'freezing_day.xlsx',
      sheetName: 'CONGELAMIENTO DÍA',
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
          product,
          status: 'COINCIDENCIA EXACTA',
        },
      ],
      warnings: [],
      reconciled: true,
      status: 'EXCEL RECONCILIADO',
    }

    const updated = buildUpdatedFreezingDraft(initialDraft, preview)

    expect(updated.source).toBe('EXCEL')
    expect(updated.sourceSheet).toBe('CONGELAMIENTO DÍA')
    expect(updated.declaredDayTotalKg).toBe('1250')
    expect(updated.rows).toHaveLength(1)
    expect(updated.rows[0]!.product.productId).toBe(product.productId)
    expect(updated.rows[0]!.dayReportedKg).toBe('1250')
    expect(updated.rows[0]!.nightReportedKg).toBe('0')
  })

  it('updates draft with Night shift freezing Excel preview and resets balanceUses for that shift', () => {
    const initialDraft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-09-16', 'FREEZING'),
      balanceUses: [
        {
          key: 'bal-1',
          originDayId: 'day-1',
          originDate: '2026-09-15',
          productId: 'p-1',
          productName: 'P1',
          familyId: 'f-1',
          familyName: 'F1',
          availableKg100: 10000 as never,
          dayKg: '100',
          nightKg: '50',
        },
      ],
    }
    const product = PRODUCTION_CATALOG_ITEMS[0]!

    const preview: FreezingExcelPreview = {
      fileName: 'freezing_night.xlsx',
      sheetName: 'CONGELAMIENTO NOCHE',
      shift: 'NIGHT',
      totalAros: 30,
      totalKg: 750,
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
          quantityAros: 30,
          totalKg: 750,
          product,
          status: 'COINCIDENCIA EXACTA',
        },
      ],
      warnings: [],
      reconciled: true,
      status: 'EXCEL RECONCILIADO',
    }

    const updated = buildUpdatedFreezingDraft(initialDraft, preview)

    expect(updated.declaredNightTotalKg).toBe('750')
    expect(updated.rows[0]!.nightReportedKg).toBe('750')
    expect(updated.balanceUses[0]!.dayKg).toBe('100')
    expect(updated.balanceUses[0]!.nightKg).toBe('0')
  })
})
