import {
  type FreezingExcelPreview,
  isTreatmentOnlyProduct,
} from '../capture/freezingExcelPreview'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type {
  ProductionCaptureDraft,
  ProductionCaptureRow,
} from '../capture/productionCapture'
import type { SummaryGroupId } from '../model/types'

export interface FreezingCatalogFamilyOption {
  readonly familyId: string
  readonly familyName: string
  readonly summaryGroupId: SummaryGroupId
}

export function getFreezingCatalogFamilyOptions(
  catalogItems: readonly ProductionCatalogItem[],
): readonly FreezingCatalogFamilyOption[] {
  const families = new Map<string, FreezingCatalogFamilyOption>()

  for (const product of catalogItems) {
    if (product.active === false || isTreatmentOnlyProduct(product)) {
      continue
    }

    if (!families.has(product.familyId)) {
      families.set(product.familyId, {
        familyId: product.familyId,
        familyName: product.familyName,
        summaryGroupId: product.summaryGroupId,
      })
    }
  }

  // NUCA BIKINI puede aparecer en reportes de Congelamiento aunque
  // todavía no exista como producto activo en el catálogo semilla.
  if (!families.has('nuca-bikini')) {
    families.set('nuca-bikini', {
      familyId: 'nuca-bikini',
      familyName: 'NUCA BIKINI',
      summaryGroupId: 'NUCA_BIKINI',
    })
  }

  return Array.from(families.values()).sort((first, second) =>
    first.familyName.localeCompare(second.familyName, 'es-PE'),
  )
}

export function buildUpdatedFreezingDraft(
  current: ProductionCaptureDraft,
  freezingExcelPreview: FreezingExcelPreview,
): ProductionCaptureDraft {
  const importedShift = freezingExcelPreview.shift

  const totalsByProduct = new Map<
    string,
    {
      product: ProductionCatalogItem
      totalKg: number
    }
  >()

  for (const row of freezingExcelPreview.rows) {
    if (!row.product || row.totalKg <= 0) {
      continue
    }

    const existing = totalsByProduct.get(row.product.productId)

    totalsByProduct.set(row.product.productId, {
      product: row.product,
      totalKg: (existing?.totalKg ?? 0) + row.totalKg,
    })
  }

  const nextRows = current.rows.map((row) => {
    const imported = totalsByProduct.get(row.product.productId)

    return {
      ...row,
      ...(importedShift === 'DAY'
        ? {
            dayReportedKg: imported ? String(imported.totalKg) : '0',
          }
        : {
            nightReportedKg: imported ? String(imported.totalKg) : '0',
          }),
    }
  })

  for (const [productId, imported] of totalsByProduct) {
    const exists = nextRows.some(
      (row) => row.product.productId === productId,
    )

    if (exists) {
      continue
    }

    const row: ProductionCaptureRow = {
      key: `excel-freezing-${productId}-${Date.now()}-${nextRows.length}`,
      product: imported.product,
      dayReportedKg:
        importedShift === 'DAY' ? String(imported.totalKg) : '0',
      dayPreviousBalanceKg: '0',
      nightReportedKg:
        importedShift === 'NIGHT' ? String(imported.totalKg) : '0',
      nightPreviousBalanceKg: '0',
      tunnelDayKg: '0',
      tunnelNightKg: '0',
      treatmentKg: '0',
      closingBalanceKg: '0',
      finishedKg: '',
    }

    nextRows.push(row)
  }

  const nextBalanceUses = current.balanceUses.map((balance) =>
    importedShift === 'DAY'
      ? {
          ...balance,
          dayKg: '0',
        }
      : {
          ...balance,
          nightKg: '0',
        },
  )

  return {
    ...current,
    source: 'EXCEL',
    sourceSheet: freezingExcelPreview.sheetName,
    shiftAllocationMode: 'EXPLICIT',
    rows: nextRows,
    balanceUses: nextBalanceUses,
    ...(importedShift === 'DAY'
      ? {
          declaredDayTotalKg: String(freezingExcelPreview.totalKg),
        }
      : {
          declaredNightTotalKg: String(freezingExcelPreview.totalKg),
        }),
  }
}
