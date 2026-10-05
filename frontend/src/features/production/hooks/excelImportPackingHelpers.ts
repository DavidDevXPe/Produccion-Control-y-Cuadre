import type {
  FreezingExcelPreview,
  FreezingExcelPreviewRow,
} from '../capture/freezingExcelPreview'
import type {
  ParsedPackingReportImport,
  ParsedPackingReportRow,
} from '../capture/parseProductionWorkbook'
import type { ProductionCatalogItem } from '../capture/productionCatalog'

export function getUnresolvedPackingRows(
  preview: ParsedPackingReportImport | null,
): readonly ParsedPackingReportRow[] {
  if (!preview) return []
  return preview.rows.filter(
    (row) =>
      row.totalKg > 0 &&
      (row.product === null ||
        row.status === 'REQUIERE REVISIÓN' ||
        row.status === 'NUEVO PRODUCTO'),
  )
}

export function getUnresolvedFreezingRows(
  preview: FreezingExcelPreview | null,
): readonly FreezingExcelPreviewRow[] {
  if (!preview) return []
  return preview.rows.filter(
    (row) => row.totalKg > 0 && row.status === 'REQUIERE REVISIÓN',
  )
}

export function updatePackingPreviewWithProduct(
  current: ParsedPackingReportImport,
  rowNumber: number,
  product: ProductionCatalogItem,
  status: 'COINCIDENCIA EXACTA' | 'ALIAS CONOCIDO',
  matchReason?: string,
): ParsedPackingReportImport {
  const nextRows = current.rows.map((row) =>
    row.rowNumber === rowNumber
      ? {
          ...row,
          product,
          productName: product.canonicalName ?? product.productName,
          matchKind:
            status === 'COINCIDENCIA EXACTA'
              ? ('EXACT' as const)
              : ('ALIAS' as const),
          status,
          matchReason: matchReason ?? row.matchReason,
        }
      : row,
  )

  const productiveRows = nextRows.filter((row) => row.totalKg > 0)
  const reviewRows = productiveRows.filter(
    (row) => row.status === 'REQUIERE REVISIÓN',
  ).length
  const newRows = productiveRows.filter(
    (row) => row.status === 'NUEVO PRODUCTO',
  ).length
  const aliasRows = productiveRows.filter(
    (row) => row.status === 'ALIAS CONOCIDO',
  ).length
  const recognizedRows = productiveRows.filter(
    (row) =>
      row.product !== null &&
      row.status !== 'REQUIERE REVISIÓN' &&
      row.status !== 'NUEVO PRODUCTO',
  ).length

  const hasBlockers = reviewRows > 0 || newRows > 0
  const nextStatus =
    current.status === 'ARCHIVO NO COMPATIBLE'
      ? current.status
      : hasBlockers
        ? 'EXCEL REQUIERE REVISIÓN'
        : 'EXCEL RECONCILIADO'

  return {
    ...current,
    rows: nextRows,
    reviewRows,
    newRows,
    aliasRows,
    recognizedRows,
    status: nextStatus,
  }
}
