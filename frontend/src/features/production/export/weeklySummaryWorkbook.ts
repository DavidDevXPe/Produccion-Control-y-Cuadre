import { Workbook } from 'exceljs'
import { formatIsoDate } from '../../../utils/formatters'
import { toKilograms } from '../model/calculations'
import type { Kg100, ProductionDay, WeeklySummary, WeeklySummaryPeriod } from '../model/types'
import {
  downloadWorkbook,
  setupWorksheet,
  writeDataRow,
  writeMetric,
  writeSectionTitle,
  writeTableHeader,
  writeTitle,
  writeTotalsRow,
} from './workbookStyles'

export interface ExportWeeklySummaryInput {
  readonly weekNumber: number
  readonly period: WeeklySummaryPeriod
  readonly summary: WeeklySummary
  readonly productionDays: readonly ProductionDay[]
}

const kg = (value: Kg100) => toKilograms(value)

export function buildWeeklySummaryWorkbook(input: ExportWeeklySummaryInput): Workbook {
  const workbook = new Workbook()
  workbook.creator = 'TRABUNDA Producción'
  workbook.company = 'TRABUNDA Procesos Marinos'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.calcProperties.fullCalcOnLoad = true

  const summarySheet = setupWorksheet(
    workbook,
    'Resumen Semanal',
    [38, 22, 50],
    `Resumen Semanal ${input.weekNumber}`,
  )

  writeTitle(
    summarySheet,
    3,
    `RESUMEN SEMANAL DE ENVASADO · SEMANA ${input.weekNumber}`,
    `${formatIsoDate(input.period.startDate)} al ${formatIsoDate(input.period.endDate)}`,
  )

  writeSectionTitle(summarySheet, 5, 3, 'TOTALES DE PRODUCCIÓN')
  writeMetric(summarySheet, 6, 1, 'Materia Prima Semanal', kg(input.summary.rawMaterialKg100), {
    format: '#,##0.00 "kg"',
  })
  writeMetric(
    summarySheet,
    7,
    1,
    'Producto Terminado Total',
    kg(input.summary.detailFinishedKg100),
    { format: '#,##0.00 "kg"' },
  )
  writeMetric(summarySheet, 8, 1, 'Diferencia Semanal', kg(input.summary.differenceKg100), {
    format: '#,##0.00 "kg"',
    tone: input.summary.differenceKg100 !== 0 ? 'danger' : 'success',
  })
  writeMetric(
    summarySheet,
    9,
    1,
    'Aprovechamiento Acumulado',
    input.summary.performance.ratio ?? 0,
    { format: '0.00%' },
  )

  writeSectionTitle(summarySheet, 11, 3, 'DISTRIBUCIÓN DE MATERIA PRIMA')
  writeMetric(summarySheet, 12, 1, 'Tubo (50%)', kg(input.summary.distribution.tubeKg100), {
    format: '#,##0.00 "kg"',
  })
  writeMetric(summarySheet, 13, 1, 'Aleta (20%)', kg(input.summary.distribution.aletaKg100), {
    format: '#,##0.00 "kg"',
  })
  writeMetric(summarySheet, 14, 1, 'Rejos (15%)', kg(input.summary.distribution.rejosKg100), {
    format: '#,##0.00 "kg"',
  })
  writeMetric(summarySheet, 15, 1, 'Nuca Semilimpia (15%)', kg(input.summary.distribution.nucasKg100), {
    format: '#,##0.00 "kg"',
  })

  // Sheet 2: Products
  const productsSheet = setupWorksheet(
    workbook,
    'Detalle por Producto',
    [24, 38, 20, 20],
    'Detalle de Productos',
  )
  writeTitle(productsSheet, 4, 'PRODUCCIÓN POR PRODUCTO Y FAMILIA', `Semana ${input.weekNumber}`)

  writeTableHeader(productsSheet, 5, [
    'Familia',
    'Producto',
    'Total Producido (kg)',
    'Participación MP (%)',
  ])

  input.summary.productTotals.forEach((product, idx) => {
    const rowNum = 6 + idx
    const share =
      input.summary.rawMaterialKg100 > 0
        ? product.totalKg100 / input.summary.rawMaterialKg100
        : 0
    writeDataRow(
      productsSheet,
      rowNum,
      [product.familyName, product.productName, kg(product.totalKg100), share],
      { zebra: idx % 2 === 1 },
    )
    productsSheet.getCell(`D${rowNum}`).numFmt = '0.00%'
  })

  const lastProdRow = 5 + input.summary.productTotals.length
  if (input.summary.productTotals.length > 0) {
    writeTotalsRow(productsSheet, lastProdRow + 1, 6, lastProdRow, 3, 3)
  }

  return workbook
}

export async function exportWeeklySummaryWorkbook(
  input: ExportWeeklySummaryInput,
): Promise<void> {
  const workbook = buildWeeklySummaryWorkbook(input)
  await downloadWorkbook(
    workbook,
    `TRABUNDA_Resumen_Semanal_${input.weekNumber}.xlsx`,
  )
}
