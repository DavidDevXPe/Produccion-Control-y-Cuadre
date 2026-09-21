import { Workbook, type CellValue, type Worksheet } from 'exceljs'
import {
  createUnconfirmedCatalogItem,
  type ProductionCatalogItem,
} from './productionCatalog'
import type {
  ProductionCaptureDraft,
  ProductionCaptureRow,
} from './productionCapture'
import { matchProduct, type ProductMatchKind } from './productMatcher'
import {
  normalizeProductName,
  repairProductMojibake,
} from './productNormalizer'
import { normalizeProductionDate } from './productionDate'

export type ExcelImportShift = 'DAY' | 'NIGHT'
export type ExcelImportRowStatus =
  | 'COINCIDENCIA EXACTA'
  | 'COINCIDENCIA NORMALIZADA'
  | 'ALIAS CONOCIDO'
  | 'REQUIERE REVISIÓN'
  | 'NUEVO PRODUCTO'
  | 'FILA IGNORADA'
  | 'FECHA REQUIERE REVISIÓN'

export interface ParsedPackingReportRow {
  rowNumber: number
  rawProductName: string
  productName: string
  rowCalendarDate: string | null
  totalKg: number
  product: ProductionCatalogItem | null
  matchKind: ProductMatchKind
  status: ExcelImportRowStatus
  matchReason?: string | undefined
  ignoredReason?: string
}

export interface ParsedPackingReportImport {
  fileName: string
  sheetName: string
  operationalDate: string
  shift: ExcelImportShift
  rows: readonly ParsedPackingReportRow[]
  ignoredRows: readonly ParsedPackingReportRow[]
  warnings: readonly string[]
  missingColumns: readonly string[]
  footerTotalKg: number | null
  reconstructedTotalKg: number
  productiveRows: number
  recognizedRows: number
  normalizedRows: number
  aliasRows: number
  newRows: number
  reviewRows: number
  status: 'EXCEL RECONCILIADO' | 'EXCEL REQUIERE REVISIÓN' | 'ARCHIVO NO COMPATIBLE'
}

const REQUIRED_COLUMNS = ['Producto', 'Horario', 'Total KG'] as const

function getFormulaResult(value: CellValue): unknown {
  if (value && typeof value === 'object' && 'result' in value) {
    return value.result
  }
  return value
}

function cellText(value: CellValue): string {
  const resolved = getFormulaResult(value)
  if (resolved instanceof Date) return resolved.toISOString().slice(0, 10)
  if (typeof resolved === 'object' && resolved !== null && 'text' in resolved) {
    return String((resolved as { text?: unknown }).text ?? '').trim()
  }
  return String(resolved ?? '').trim()
}

function parseExcelNumber(value: CellValue): number | null {
  const resolved = getFormulaResult(value)
  if (typeof resolved === 'number' && Number.isFinite(resolved)) return resolved
  const text = cellText(value)
  if (!text) return null
  const compact = text.replace(/\s/g, '')
  const lastComma = compact.lastIndexOf(',')
  const lastDot = compact.lastIndexOf('.')
  const normalized =
    lastComma >= 0 && lastDot >= 0
      ? lastComma > lastDot
        ? compact.replace(/\./g, '').replace(',', '.')
        : compact.replace(/,/g, '')
      : compact.replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseExcelDate(value: CellValue): string | null {
  const resolved = getFormulaResult(value)
  if (resolved instanceof Date) return resolved.toISOString().slice(0, 10)
  return normalizeProductionDate(cellText(value))
}

function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function isDateAccepted(
  rowCalendarDate: string | null,
  operationalDate: string,
  shift: ExcelImportShift,
): boolean {
  if (!rowCalendarDate) return false
  if (rowCalendarDate === operationalDate) return true
  return shift === 'NIGHT' && rowCalendarDate === addDaysToIsoDate(operationalDate, 1)
}

function normalizeHeader(value: string): string {
  return normalizeProductName(value)
    .replace(/\bDESCRIPCION\b/g, '')
    .replace(/\bSUMA\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectColumns(worksheet: Worksheet): {
  headerRow: number
  productColumn?: number
  dateColumn?: number
  totalKgColumn?: number
} | null {
  for (let rowNumber = 1; rowNumber <= Math.min(worksheet.rowCount, 20); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const detected: ReturnType<typeof detectColumns> = { headerRow: rowNumber }

    row.eachCell((cell, columnNumber) => {
      const header = normalizeHeader(cellText(cell.value))
      if (header.includes('PRODUCTO')) detected.productColumn = columnNumber
      if (header === 'HORARIO' || header.includes('FECHA')) detected.dateColumn = columnNumber
      if (header === 'TOTAL KG' || header === 'TOTAL KGS') detected.totalKgColumn = columnNumber
    })

    if (detected.productColumn || detected.dateColumn || detected.totalKgColumn) return detected
  }

  return null
}

function buildMissingColumns(columns: ReturnType<typeof detectColumns>): readonly string[] {
  if (!columns) return REQUIRED_COLUMNS
  return [
    columns.productColumn ? null : 'Producto',
    columns.dateColumn ? null : 'Horario',
    columns.totalKgColumn ? null : 'Total KG',
  ].filter((value): value is string => value !== null)
}

function isFooterProductName(value: string): boolean {
  return /total general|ajuste|total \(?aros/i.test(value)
}

function rowStatusFor(matchKind: ProductMatchKind): ExcelImportRowStatus {
  if (matchKind === 'EXACT') return 'COINCIDENCIA EXACTA'
  if (matchKind === 'ALIAS') return 'ALIAS CONOCIDO'
  if (matchKind === 'NORMALIZED_ENCODING' || matchKind === 'NORMALIZED_FORMAT') return 'COINCIDENCIA NORMALIZADA'
  if (matchKind === 'REVIEW_REQUIRED') return 'REQUIERE REVISIÓN'
  return 'NUEVO PRODUCTO'
}

function parsePackingReportWorksheet(
  worksheet: Worksheet,
  options: {
    fileName: string
    operationalDate: string
    shift: ExcelImportShift
  },
): ParsedPackingReportImport {
  const columns = detectColumns(worksheet)
  const missingColumns = buildMissingColumns(columns)
  const warnings: string[] = []
  const rows: ParsedPackingReportRow[] = []
  const ignoredRows: ParsedPackingReportRow[] = []
  let footerTotalKg: number | null = null

  if (missingColumns.length > 0 || !columns?.productColumn || !columns.dateColumn || !columns.totalKgColumn) {
    return {
      fileName: options.fileName,
      sheetName: worksheet.name,
      operationalDate: options.operationalDate,
      shift: options.shift,
      rows: [],
      ignoredRows: [],
      warnings: [`ARCHIVO NO COMPATIBLE. Falta columna: ${missingColumns.join(', ')}.`],
      missingColumns,
      footerTotalKg: null,
      reconstructedTotalKg: 0,
      productiveRows: 0,
      recognizedRows: 0,
      normalizedRows: 0,
      aliasRows: 0,
      newRows: 0,
      reviewRows: 0,
      status: 'ARCHIVO NO COMPATIBLE',
    }
  }

  for (let rowNumber = columns.headerRow + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const rawProductName = cellText(row.getCell(columns.productColumn).value)
    const totalKg = parseExcelNumber(row.getCell(columns.totalKgColumn).value)
    const fallbackFooterKg = parseExcelNumber(row.getCell(Math.max(columns.totalKgColumn - 1, 1)).value)

    if (!rawProductName) continue

    if (isFooterProductName(rawProductName)) {
      if (/total \(?aros/i.test(rawProductName) && fallbackFooterKg !== null) {
        footerTotalKg = fallbackFooterKg
      }
      continue
    }

    const productName = repairProductMojibake(rawProductName)
    const rowCalendarDate = parseExcelDate(row.getCell(columns.dateColumn).value)

    if (rowCalendarDate === null || totalKg === null) {
      ignoredRows.push({
        rowNumber,
        rawProductName,
        productName,
        rowCalendarDate,
        totalKg: totalKg ?? 0,
        product: null,
        matchKind: 'NEW_PRODUCT',
        status: 'FILA IGNORADA',
        ignoredReason: rowCalendarDate === null ? 'Fecha inválida' : 'Total KG inválido',
      })
      continue
    }

    const match = matchProduct(productName)
    const product = match.product ?? createUnconfirmedCatalogItem(productName)
    const dateAccepted = isDateAccepted(rowCalendarDate, options.operationalDate, options.shift)
    const status = dateAccepted ? rowStatusFor(match.kind) : 'FECHA REQUIERE REVISIÓN'

    rows.push({
      rowNumber,
      rawProductName,
      productName,
      rowCalendarDate,
      totalKg,
      product,
      matchKind: match.kind,
      status,
      matchReason: match.reason,
    })
  }

  const reconstructedTotalKg = rows.reduce((sum, row) => sum + row.totalKg, 0)
  const reviewRows = rows.filter((row) =>
    row.totalKg > 0 && (
      row.status === 'NUEVO PRODUCTO' ||
      row.status === 'REQUIERE REVISIÓN' ||
      row.status === 'FECHA REQUIERE REVISIÓN'
    ),
  ).length + ignoredRows.length
  const newRows = rows.filter((row) => row.status === 'NUEVO PRODUCTO').length
  const normalizedRows = rows.filter((row) => row.status === 'COINCIDENCIA NORMALIZADA').length
  const aliasRows = rows.filter((row) => row.status === 'ALIAS CONOCIDO').length
  const recognizedRows = rows.length - newRows - rows.filter((row) => row.status === 'FECHA REQUIERE REVISIÓN').length

  if (footerTotalKg !== null && Math.abs(footerTotalKg - reconstructedTotalKg) > 0.01) {
    warnings.push(
      `El total del footer es ${footerTotalKg.toLocaleString('es-PE')} kg, pero la suma de Total KG es ${reconstructedTotalKg.toLocaleString('es-PE')} kg.`,
    )
  }
  if (ignoredRows.length > 0) {
    warnings.push(`${ignoredRows.length} fila(s) fueron ignoradas por datos incompletos.`)
  }
  if (rows.some((row) => row.status === 'FECHA REQUIERE REVISIÓN')) {
    warnings.push('Hay filas con fecha fuera del turno seleccionado.')
  }

  return {
    fileName: options.fileName,
    sheetName: worksheet.name,
    operationalDate: options.operationalDate,
    shift: options.shift,
    rows,
    ignoredRows,
    warnings,
    missingColumns,
    footerTotalKg,
    reconstructedTotalKg,
    productiveRows: rows.length,
    recognizedRows,
    normalizedRows,
    aliasRows,
    newRows,
    reviewRows,
    status:
      reviewRows === 0 &&
      warnings.length === 0 &&
      (footerTotalKg === null || Math.abs(footerTotalKg - reconstructedTotalKg) <= 0.01)
        ? 'EXCEL RECONCILIADO'
        : 'EXCEL REQUIERE REVISIÓN',
  }
}

export async function parseProductionWorkbook(
  file: ArrayBuffer,
  options: {
    fileName?: string
    operationalDate: string
    shift: ExcelImportShift
  },
): Promise<ParsedPackingReportImport> {
  const workbook = new Workbook()
  await workbook.xlsx.load(file)
  const worksheet = workbook.getWorksheet('Reporte') ?? workbook.worksheets[0]
  if (!worksheet) {
    return {
      fileName: options.fileName ?? 'archivo.xlsx',
      sheetName: 'Sin hoja',
      operationalDate: options.operationalDate,
      shift: options.shift,
      rows: [],
      ignoredRows: [],
      warnings: ['ARCHIVO NO COMPATIBLE. El libro no contiene hojas.'],
      missingColumns: REQUIRED_COLUMNS,
      footerTotalKg: null,
      reconstructedTotalKg: 0,
      productiveRows: 0,
      recognizedRows: 0,
      normalizedRows: 0,
      aliasRows: 0,
      newRows: 0,
      reviewRows: 0,
      status: 'ARCHIVO NO COMPATIBLE',
    }
  }

  return parsePackingReportWorksheet(worksheet, {
    fileName: options.fileName ?? 'archivo.xlsx',
    operationalDate: options.operationalDate,
    shift: options.shift,
  })
}

function rowFromImport(
  row: ParsedPackingReportRow,
  index: number,
  shift: ExcelImportShift,
): ProductionCaptureRow | null {
  if (!row.product) return null
  return {
    key: `excel-${row.product.productId}-${index}`,
    product: row.product,
    dayReportedKg: shift === 'DAY' ? String(row.totalKg) : '0',
    dayPreviousBalanceKg: '0',
    nightReportedKg: shift === 'NIGHT' ? String(row.totalKg) : '0',
    nightPreviousBalanceKg: '0',
    tunnelDayKg: '0',
    tunnelNightKg: '0',
    treatmentKg: '0',
    closingBalanceKg: '0',
    finishedKg: '',
  }
}

export function mergePackingReportIntoDraft(
  draft: ProductionCaptureDraft,
  parsed: ParsedPackingReportImport,
): ProductionCaptureDraft {
  const shift = parsed.shift
  const rows = draft.rows.map((row) =>
    shift === 'DAY'
      ? { ...row, dayReportedKg: '0' }
      : { ...row, nightReportedKg: '0' },
  )

  for (const [index, parsedRow] of parsed.rows.entries()) {
    if (
      !parsedRow.product ||
      parsedRow.status === 'FECHA REQUIERE REVISIÓN' ||
      parsedRow.status === 'NUEVO PRODUCTO' ||
      parsedRow.status === 'REQUIERE REVISIÓN'
    ) continue
    const existing = rows.find((row) => row.product.productId === parsedRow.product?.productId)
    if (!existing) {
      const next = rowFromImport(parsedRow, index, shift)
      if (next) rows.push(next)
      continue
    }
    const currentValue = Number(shift === 'DAY' ? existing.dayReportedKg : existing.nightReportedKg) || 0
    const value = String(currentValue + parsedRow.totalKg)
    const replacement =
      shift === 'DAY'
        ? { ...existing, dayReportedKg: value }
        : { ...existing, nightReportedKg: value }
    rows[rows.indexOf(existing)] = replacement
  }

  const totalKg = parsed.rows
    .filter((row) =>
      row.status !== 'FECHA REQUIERE REVISIÓN' &&
      row.status !== 'NUEVO PRODUCTO' &&
      row.status !== 'REQUIERE REVISIÓN',
    )
    .reduce((sum, row) => sum + row.totalKg, 0)

  return {
    ...draft,
    source: 'EXCEL',
    sourceSheet: parsed.sheetName,
    finishedTotalMode: 'DERIVED_FROM_REPORTS',
    shiftAllocationMode: 'EXPLICIT',
    declaredDayTotalKg: shift === 'DAY' ? String(totalKg) : draft.declaredDayTotalKg || '0',
    declaredNightTotalKg: shift === 'NIGHT' ? String(totalKg) : draft.declaredNightTotalKg || '0',
    rows,
  }
}
