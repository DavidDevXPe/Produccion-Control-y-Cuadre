import { Workbook, type Cell, type Row, type Worksheet } from 'exceljs'
import { formatIsoDate } from '../../../utils/formatters'
import { calculateProductionDay, sumKg100, toKilograms } from '../model/calculations'
import type {
  ProductionDay,
  ProductionDayCalculation,
  ProductReconciliation,
} from '../model/types'

const NAVY = 'FF0B2F44'
const BLUE = 'FF0B7DA3'
const LIGHT_BLUE = 'FFE9F7FC'
const LIGHT_SLATE = 'FFF1F5F9'
const WHITE = 'FFFFFFFF'
const GREEN = 'FF047857'
const AMBER = 'FFB45309'
const RED = 'FFBE123C'
const BORDER = 'FFCBD5E1'
const KG_FORMAT = '#,##0.00 "kg"'
const PERCENT_FORMAT = '0.00%'

function applyThinBorder(cell: Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: BORDER } },
    left: { style: 'thin', color: { argb: BORDER } },
    bottom: { style: 'thin', color: { argb: BORDER } },
    right: { style: 'thin', color: { argb: BORDER } },
  }
}

function styleSectionTitle(row: Row) {
  row.height = 22
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
    cell.font = { color: { argb: WHITE }, bold: true, size: 11 }
    cell.alignment = { vertical: 'middle' }
  })
}

function styleTableHeader(row: Row) {
  row.height = 31
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
    cell.font = { color: { argb: WHITE }, bold: true, size: 9 }
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    }
    applyThinBorder(cell)
  })
}

function setSummaryMetric(
  worksheet: Worksheet,
  rowNumber: number,
  label: string,
  value: string | number,
  numberFormat?: string,
) {
  const labelCell = worksheet.getCell(rowNumber, 1)
  const valueCell = worksheet.getCell(rowNumber, 2)

  labelCell.value = label
  labelCell.font = { bold: true, color: { argb: NAVY } }
  labelCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: LIGHT_BLUE },
  }
  valueCell.value = value
  valueCell.font = { bold: true }
  valueCell.alignment = { horizontal: typeof value === 'number' ? 'right' : 'left' }
  if (numberFormat) valueCell.numFmt = numberFormat
  applyThinBorder(labelCell)
  applyThinBorder(valueCell)
}

function addProductRow(
  worksheet: Worksheet,
  product: ProductReconciliation,
  rowNumber: number,
) {
  const row = worksheet.getRow(rowNumber)
  const dayAdjustment = toKilograms(product.day.adjustmentKg100)
  const nightAdjustment = toKilograms(product.night.adjustmentKg100)

  row.values = [
    product.familyName,
    product.productName,
    toKilograms(product.day.reportedKg100),
    dayAdjustment,
    toKilograms(product.day.previousBalanceProcessedKg100),
    { formula: `C${rowNumber}+D${rowNumber}-E${rowNumber}`, result: toKilograms(product.day.ownProductionKg100) },
    toKilograms(product.night.reportedKg100),
    nightAdjustment,
    toKilograms(product.night.previousBalanceProcessedKg100),
    { formula: `G${rowNumber}+H${rowNumber}-I${rowNumber}`, result: toKilograms(product.night.ownProductionKg100) },
    toKilograms(product.tunnel.DAY.ownProductionKg100),
    toKilograms(product.tunnel.NIGHT.ownProductionKg100),
    { formula: `K${rowNumber}+L${rowNumber}`, result: toKilograms(sumKg100([product.tunnel.DAY.ownProductionKg100, product.tunnel.NIGHT.ownProductionKg100])) },
    toKilograms(product.treatmentKg100),
    toKilograms(product.newClosingBalanceKg100),
    { formula: `F${rowNumber}+J${rowNumber}+M${rowNumber}+N${rowNumber}+O${rowNumber}`, result: toKilograms(product.expectedFinishedKg100) },
    toKilograms(product.declaredFinishedKg100),
    { formula: `P${rowNumber}-Q${rowNumber}`, result: toKilograms(product.differenceKg100) },
  ]

  row.height = 20
  row.eachCell((cell, columnNumber) => {
    applyThinBorder(cell)
    cell.alignment = {
      horizontal: columnNumber <= 2 ? 'left' : 'right',
      vertical: 'middle',
    }
    if (columnNumber > 2) cell.numFmt = KG_FORMAT
  })
}

function addTotalsRow(
  worksheet: Worksheet,
  rowNumber: number,
  firstDetailRow: number,
  lastDetailRow: number,
) {
  const row = worksheet.getRow(rowNumber)
  row.getCell(1).value = 'TOTAL'
  worksheet.mergeCells(rowNumber, 1, rowNumber, 2)

  for (let column = 3; column <= 18; column += 1) {
    const letter = worksheet.getColumn(column).letter
    row.getCell(column).value = {
      formula: `SUM(${letter}${firstDetailRow}:${letter}${lastDetailRow})`,
    }
    row.getCell(column).numFmt = KG_FORMAT
  }

  row.height = 23
  row.eachCell((cell, columnNumber) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_SLATE } }
    cell.font = { bold: true, color: { argb: NAVY } }
    cell.alignment = {
      horizontal: columnNumber <= 2 ? 'left' : 'right',
      vertical: 'middle',
    }
    applyThinBorder(cell)
  })
}

export function buildProductionDayWorkbook(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation = calculateProductionDay(productionDay),
): Workbook {
  if (productionDay.status !== 'CLOSED' || calculation.status !== 'BALANCED') {
    throw new Error('Solo se pueden exportar jornadas cerradas y cuadradas.')
  }

  if (calculation.integrityIssues.length > 0) {
    throw new Error('La jornada tiene observaciones de integridad pendientes.')
  }

  const workbook = new Workbook()
  workbook.creator = 'TRABUNDA Producción'
  workbook.company = 'TRABUNDA Procesos Marinos'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet('Jornada cerrada', {
    views: [{ state: 'frozen', ySplit: 18, activeCell: 'A19' }],
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
  worksheet.headerFooter.oddFooter = '&LTRABUNDA Producción&C&P de &N&RJornada cerrada y cuadrada'
  worksheet.columns = [
    { key: 'family', width: 22 },
    { key: 'product', width: 31 },
    { key: 'dayReported', width: 15 },
    { key: 'dayAdjustment', width: 14 },
    { key: 'dayBalance', width: 15 },
    { key: 'dayOwn', width: 15 },
    { key: 'nightReported', width: 15 },
    { key: 'nightAdjustment', width: 14 },
    { key: 'nightBalance', width: 15 },
    { key: 'nightOwn', width: 15 },
    { key: 'tunnelDay', width: 15 },
    { key: 'tunnelNight', width: 15 },
    { key: 'tunnelTotal', width: 15 },
    { key: 'treatment', width: 15 },
    { key: 'closingBalance', width: 15 },
    { key: 'expected', width: 17 },
    { key: 'finished', width: 17 },
    { key: 'difference', width: 15 },
  ]

  worksheet.mergeCells('A1:R2')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'TRABUNDA · PARTE DE PRODUCCIÓN'
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  titleCell.font = { color: { argb: WHITE }, bold: true, size: 18 }
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' }
  worksheet.getRow(1).height = 24
  worksheet.getRow(2).height = 14

  worksheet.mergeCells('A3:R3')
  const subtitleCell = worksheet.getCell('A3')
  subtitleCell.value = `${formatIsoDate(productionDay.date)} · Jornada cerrada y cuadrada`
  subtitleCell.font = { color: { argb: BLUE }, bold: true, size: 11 }
  subtitleCell.alignment = { vertical: 'middle' }

  worksheet.mergeCells('A5:R5')
  worksheet.getCell('A5').value = 'RESUMEN DE CIERRE'
  styleSectionTitle(worksheet.getRow(5))

  setSummaryMetric(worksheet, 6, 'Estado del cuadre', 'CUADRADO')
  setSummaryMetric(worksheet, 7, 'Materia prima', toKilograms(productionDay.declaredRawMaterialKg100), KG_FORMAT)
  setSummaryMetric(worksheet, 8, 'Producto terminado', toKilograms(calculation.declaredFinishedKg100), KG_FORMAT)
  setSummaryMetric(worksheet, 9, 'Saldo final generado', toKilograms(calculation.newClosingBalanceKg100), KG_FORMAT)
  setSummaryMetric(worksheet, 10, 'Diferencia', toKilograms(calculation.differenceKg100), KG_FORMAT)
  setSummaryMetric(
    worksheet,
    11,
    'Aprovechamiento general',
    calculation.performance.ratio ?? 'No disponible',
    calculation.performance.ratio === null ? undefined : PERCENT_FORMAT,
  )
  setSummaryMetric(worksheet, 12, 'Saldo anterior recibido', toKilograms(calculation.receivedPreviousBalanceKg100), KG_FORMAT)
  setSummaryMetric(worksheet, 13, 'Saldo anterior procesado', toKilograms(calculation.processedPreviousBalanceKg100), KG_FORMAT)
  setSummaryMetric(worksheet, 14, 'Saldo anterior pendiente', toKilograms(calculation.pendingPreviousBalanceKg100), KG_FORMAT)
  setSummaryMetric(worksheet, 15, 'Tratamiento', toKilograms(calculation.treatmentKg100), KG_FORMAT)
  setSummaryMetric(worksheet, 16, 'Túnel', toKilograms(calculation.tunnel.totalKg100), KG_FORMAT)

  const statusCell = worksheet.getCell('B6')
  statusCell.font = { bold: true, color: { argb: GREEN } }
  const performanceCell = worksheet.getCell('B11')
  performanceCell.font = {
    bold: true,
    color: {
      argb:
        calculation.performance.status === 'BELOW_REFERENCE' ? AMBER : GREEN,
    },
  }
  worksheet.getCell('B10').font = {
    bold: true,
    color: { argb: calculation.differenceKg100 === 0 ? GREEN : RED },
  }

  worksheet.mergeCells('A17:R17')
  worksheet.getCell('A17').value = 'DETALLE POR FAMILIA Y PRODUCTO'
  styleSectionTitle(worksheet.getRow(17))

  const headerRow = worksheet.getRow(18)
  headerRow.values = [
    'Familia',
    'Producto',
    'Día reportado',
    'Ajuste Día',
    'Saldo ant. Día',
    'Propio Día',
    'Noche reportado',
    'Ajuste Noche',
    'Saldo ant. Noche',
    'Propio Noche',
    'Túnel Día',
    'Túnel Noche',
    'Total Túnel',
    'Tratamiento',
    'Saldo final',
    'Esperado',
    'P. terminado',
    'Diferencia',
  ]
  styleTableHeader(headerRow)

  const firstDetailRow = 19
  calculation.products.forEach((product, index) => {
    addProductRow(worksheet, product, firstDetailRow + index)
  })
  const lastDetailRow = firstDetailRow + calculation.products.length - 1
  const totalsRow = lastDetailRow + 1
  addTotalsRow(worksheet, totalsRow, firstDetailRow, lastDetailRow)

  let lastPrintableRow = totalsRow
  if ((productionDay.closureObservations?.length ?? 0) > 0) {
    const observationsTitleRow = totalsRow + 2
    worksheet.mergeCells(observationsTitleRow, 1, observationsTitleRow, 18)
    worksheet.getCell(observationsTitleRow, 1).value = 'OBSERVACIONES DE CIERRE'
    styleSectionTitle(worksheet.getRow(observationsTitleRow))

    const observationsHeaderRow = worksheet.getRow(observationsTitleRow + 1)
    observationsHeaderRow.values = [
      'Fecha cierre',
      'Codigo',
      'Producto',
      'Familia',
      'Kg',
      'Observacion',
    ]
    styleTableHeader(observationsHeaderRow)

    productionDay.closureObservations!.forEach((observation, index) => {
      const rowNumber = observationsTitleRow + 2 + index
      const row = worksheet.getRow(rowNumber)

      row.values = [
        observation.closedAt,
        observation.code,
        observation.productId ?? '',
        observation.familyKey ?? '',
        observation.kg100 === undefined ? '' : toKilograms(observation.kg100),
        observation.message,
      ]
      row.height = 24
      row.eachCell((cell, columnNumber) => {
        applyThinBorder(cell)
        cell.alignment = {
          horizontal: columnNumber === 5 ? 'right' : 'left',
          vertical: 'middle',
          wrapText: columnNumber === 6,
        }
        if (columnNumber === 5 && typeof cell.value === 'number') {
          cell.numFmt = KG_FORMAT
        }
      })
    })
    lastPrintableRow =
      observationsTitleRow + 1 + productionDay.closureObservations!.length
  }

  worksheet.autoFilter = {
    from: { row: 18, column: 1 },
    to: { row: lastDetailRow, column: 18 },
  }
  worksheet.pageSetup.printArea = `A1:R${lastPrintableRow}`
  worksheet.pageSetup.printTitlesRow = '1:18'

  return workbook
}

export async function exportProductionDayWorkbook(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation = calculateProductionDay(productionDay),
): Promise<void> {
  const workbook = buildProductionDayWorkbook(productionDay, calculation)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = `TRABUNDA_Produccion_${productionDay.date}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
