import type { Cell, Row, Workbook, Worksheet } from 'exceljs'

/** Shared look of every TRABUNDA workbook, so all exports read the same way. */
export const COLORS = {
  navy: 'FF0B2F44',
  blue: 'FF0B7DA3',
  lightBlue: 'FFE9F7FC',
  lightSlate: 'FFF1F5F9',
  zebra: 'FFF8FAFC',
  white: 'FFFFFFFF',
  green: 'FF047857',
  lightGreen: 'FFECFDF5',
  amber: 'FFB45309',
  lightAmber: 'FFFFFBEB',
  red: 'FFBE123C',
  lightRed: 'FFFFF1F2',
  slate: 'FF475569',
  border: 'FFCBD5E1',
} as const

export const KG_FORMAT = '#,##0.00 "kg";[Red]-#,##0.00 "kg"'
export const PERCENT_FORMAT = '0.00%'

export type Tone = 'neutral' | 'success' | 'warning' | 'danger'

const toneColors: Record<Tone, { font: string; fill: string }> = {
  neutral: { font: COLORS.navy, fill: COLORS.lightSlate },
  success: { font: COLORS.green, fill: COLORS.lightGreen },
  warning: { font: COLORS.amber, fill: COLORS.lightAmber },
  danger: { font: COLORS.red, fill: COLORS.lightRed },
}

export function applyThinBorder(cell: Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  }
}

export function setupWorksheet(
  workbook: Workbook,
  name: string,
  columnWidths: readonly number[],
  footer: string,
): Worksheet {
  const worksheet = workbook.addWorksheet(name, {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
  })
  worksheet.properties.defaultRowHeight = 18
  worksheet.headerFooter.oddFooter = `&LTRABUNDA Producción&C&P de &N&R${footer}`
  worksheet.columns = columnWidths.map((width) => ({ width }))
  return worksheet
}

/** Big title (rows 1–2) and subtitle (row 3) across `lastColumn` columns. */
export function writeTitle(
  worksheet: Worksheet,
  lastColumn: number,
  title: string,
  subtitle: string,
) {
  worksheet.mergeCells(1, 1, 2, lastColumn)
  const titleCell = worksheet.getCell(1, 1)
  titleCell.value = title
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } }
  titleCell.font = { color: { argb: COLORS.white }, bold: true, size: 16 }
  titleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  worksheet.getRow(1).height = 22
  worksheet.getRow(2).height = 14

  worksheet.mergeCells(3, 1, 3, lastColumn)
  const subtitleCell = worksheet.getCell(3, 1)
  subtitleCell.value = subtitle
  subtitleCell.font = { color: { argb: COLORS.blue }, bold: true, size: 11 }
  subtitleCell.alignment = { vertical: 'middle', indent: 1 }
  worksheet.getRow(3).height = 20
}

export function writeSectionTitle(
  worksheet: Worksheet,
  rowNumber: number,
  lastColumn: number,
  title: string,
) {
  worksheet.mergeCells(rowNumber, 1, rowNumber, lastColumn)
  const cell = worksheet.getCell(rowNumber, 1)
  cell.value = title
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } }
  cell.font = { color: { argb: COLORS.white }, bold: true, size: 11 }
  cell.alignment = { vertical: 'middle', indent: 1 }
  worksheet.getRow(rowNumber).height = 22
}

export function writeTableHeader(
  worksheet: Worksheet,
  rowNumber: number,
  headers: readonly string[],
) {
  const row = worksheet.getRow(rowNumber)
  row.values = [...headers]
  styleHeaderRow(row)
}

export function styleHeaderRow(row: Row) {
  row.height = 30
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.blue } }
    cell.font = { color: { argb: COLORS.white }, bold: true, size: 9 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    applyThinBorder(cell)
  })
}

/**
 * Writes one data row. Columns up to `textColumns` are text (left aligned),
 * the rest are kilograms unless a format is given in `formats`.
 */
export function writeDataRow(
  worksheet: Worksheet,
  rowNumber: number,
  values: readonly unknown[],
  options: {
    textColumns?: number
    formats?: Readonly<Record<number, string>>
    zebra?: boolean
  } = {},
) {
  const { textColumns = 1, formats = {}, zebra = false } = options
  const row = worksheet.getRow(rowNumber)
  row.values = [...values] as Row['values']
  row.height = 19
  row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    if (columnNumber > values.length) return
    applyThinBorder(cell)
    const isText = columnNumber <= textColumns
    cell.alignment = {
      horizontal: isText ? 'left' : 'right',
      vertical: 'middle',
      indent: isText ? 1 : 0,
    }
    if (!isText) cell.numFmt = formats[columnNumber] ?? KG_FORMAT
    if (zebra) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebra } }
    }
  })
  return row
}

/** TOTAL row with SUM formulas for columns `fromColumn..toColumn`. */
export function writeTotalsRow(
  worksheet: Worksheet,
  rowNumber: number,
  firstDataRow: number,
  lastDataRow: number,
  fromColumn: number,
  toColumn: number,
  label = 'TOTAL',
  textColumns = 1,
  formats: Readonly<Record<number, string>> = {},
) {
  const row = worksheet.getRow(rowNumber)
  row.getCell(1).value = label
  if (textColumns > 1) worksheet.mergeCells(rowNumber, 1, rowNumber, textColumns)
  for (let column = fromColumn; column <= toColumn; column += 1) {
    const letter = worksheet.getColumn(column).letter
    row.getCell(column).value =
      lastDataRow >= firstDataRow
        ? { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})` }
        : 0
    row.getCell(column).numFmt = formats[column] ?? KG_FORMAT
  }
  row.height = 22
  for (let column = 1; column <= toColumn; column += 1) {
    const cell = row.getCell(column)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightSlate } }
    cell.font = { bold: true, color: { argb: COLORS.navy } }
    cell.alignment = {
      horizontal: column <= textColumns ? 'left' : 'right',
      vertical: 'middle',
      indent: column <= textColumns ? 1 : 0,
    }
    applyThinBorder(cell)
  }
}

/** Label/value pair used in summary blocks. */
export function writeMetric(
  worksheet: Worksheet,
  rowNumber: number,
  column: number,
  label: string,
  value: string | number | { formula: string; result?: number },
  options: { format?: string; tone?: Tone; hint?: string } = {},
) {
  const labelCell = worksheet.getCell(rowNumber, column)
  const valueCell = worksheet.getCell(rowNumber, column + 1)
  labelCell.value = label
  labelCell.font = { bold: true, color: { argb: COLORS.navy } }
  labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } }
  labelCell.alignment = { vertical: 'middle', indent: 1, wrapText: true }
  valueCell.value = value as Cell['value']
  const tone = toneColors[options.tone ?? 'neutral']
  valueCell.font = { bold: true, color: { argb: tone.font } }
  if (options.tone && options.tone !== 'neutral') {
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tone.fill } }
  }
  valueCell.alignment = {
    horizontal: typeof value === 'string' ? 'left' : 'right',
    vertical: 'middle',
    indent: typeof value === 'string' ? 1 : 0,
  }
  if (options.format) valueCell.numFmt = options.format
  applyThinBorder(labelCell)
  applyThinBorder(valueCell)
  if (options.hint) {
    const hintCell = worksheet.getCell(rowNumber, column + 2)
    hintCell.value = options.hint
    hintCell.font = { italic: true, size: 9, color: { argb: COLORS.slate } }
    hintCell.alignment = { vertical: 'middle', indent: 1 }
  }
  worksheet.getRow(rowNumber).height = 20
}

export function toneColor(tone: Tone): string {
  return toneColors[tone].font
}

export async function downloadWorkbook(workbook: Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
