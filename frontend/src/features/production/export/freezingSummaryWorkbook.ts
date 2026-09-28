import { Workbook } from 'exceljs'
import { formatIsoDate } from '../../../utils/formatters'
import {
  calculateProductionDay,
  kg100,
  sumKg100,
  toKilograms,
} from '../model/calculations'
import {
  calculateFreezingAvailability,
  calculateFrozenPhysicalKg100,
} from '../model/freezing'
import type { Kg100, ProductionDay } from '../model/types'
import type { OperationalWeekView } from '../state/ProductionDataContext'
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

export interface ExportFreezingSummaryInput {
  readonly week: OperationalWeekView
  readonly allProductionDays: readonly ProductionDay[]
}

const kg = (value: Kg100) => toKilograms(value)

export function buildFreezingSummaryWorkbook(
  input: ExportFreezingSummaryInput,
): Workbook {
  const { week, allProductionDays } = input
  const workbook = new Workbook()
  workbook.creator = 'TRABUNDA Producción'
  workbook.company = 'TRABUNDA Procesos Marinos'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.calcProperties.fullCalcOnLoad = true

  const calculations = week.productionDays.map((day) => ({
    day,
    calculation: calculateProductionDay(day),
  }))
  const dayKg100 = sumKg100(
    week.productionDays.map((day) => day.declaredShiftTotalsKg100.DAY),
  )
  const nightKg100 = sumKg100(
    week.productionDays.map((day) => day.declaredShiftTotalsKg100.NIGHT),
  )
  const physicalKg100 = sumKg100(
    week.productionDays.map(calculateFrozenPhysicalKg100),
  )
  const linkedKg100 = sumKg100(
    calculations.map(
      ({ calculation }) => calculation.processedPreviousBalanceKg100,
    ),
  )
  const differenceKg100 = kg100(physicalKg100 - linkedKg100)
  const pendingKg100 = sumKg100(
    calculateFreezingAvailability(allProductionDays, week.period.endDate).map(
      (position) => position.pendingKg100,
    ),
  )

  const summarySheet = setupWorksheet(
    workbook,
    'Resumen Congelamiento',
    [38, 22, 50],
    `Resumen Congelamiento ${week.number}`,
  )

  writeTitle(
    summarySheet,
    3,
    `RESUMEN SEMANAL DE CONGELAMIENTO · SEMANA ${week.number}`,
    `${formatIsoDate(week.period.startDate)} al ${formatIsoDate(
      week.period.endDate,
    )}`,
  )

  writeSectionTitle(summarySheet, 5, 3, 'INDICADORES DE CONGELAMIENTO')
  writeMetric(
    summarySheet,
    6,
    1,
    'Congelado Físicamente Total',
    kg(physicalKg100),
    { format: '#,##0.00 "kg"' },
  )
  writeMetric(summarySheet, 7, 1, 'Turno Día', kg(dayKg100), {
    format: '#,##0.00 "kg"',
  })
  writeMetric(summarySheet, 8, 1, 'Turno Noche', kg(nightKg100), {
    format: '#,##0.00 "kg"',
  })
  writeMetric(
    summarySheet,
    9,
    1,
    'Pendiente de Congelar',
    kg(pendingKg100),
    {
      format: '#,##0.00 "kg"',
      tone: pendingKg100 > 0 ? 'warning' : 'success',
    },
  )

  writeSectionTitle(summarySheet, 11, 3, 'CUADRE DE CONGELAMIENTO')
  writeMetric(
    summarySheet,
    12,
    1,
    'Congelado Atribuible (Vinculado)',
    kg(linkedKg100),
    { format: '#,##0.00 "kg"' },
  )
  writeMetric(
    summarySheet,
    13,
    1,
    'Diferencia no Explicada',
    kg(differenceKg100),
    {
      format: '#,##0.00 "kg"',
      tone: differenceKg100 === 0 ? 'success' : 'danger',
    },
  )

  // Sheet 2: Products
  const productTotals = new Map<
    string,
    {
      familyName: string
      productName: string
      dayKg100: number
      nightKg100: number
    }
  >()

  for (const day of week.productionDays) {
    for (const line of day.lines) {
      const current = productTotals.get(line.productId)
      productTotals.set(line.productId, {
        familyName: line.familyName,
        productName: line.productName,
        dayKg100: (current?.dayKg100 ?? 0) + line.shifts.DAY.reportedKg100,
        nightKg100: (current?.nightKg100 ?? 0) + line.shifts.NIGHT.reportedKg100,
      })
    }
  }

  const productsSheet = setupWorksheet(
    workbook,
    'Congelado por Producto',
    [24, 38, 20, 20, 20],
    'Congelado por Producto',
  )
  writeTitle(
    productsSheet,
    4,
    'CONGELADO SEMANAL POR PRODUCTO Y TURNO',
    `Semana ${week.number}`,
  )

  writeTableHeader(productsSheet, 5, [
    'Familia',
    'Producto',
    'Día (kg)',
    'Noche (kg)',
    'Total (kg)',
  ])

  const productList = [...productTotals.values()]
  productList.forEach((product, idx) => {
    const rowNum = 6 + idx
    const dayKg = kg(kg100(product.dayKg100))
    const nightKg = kg(kg100(product.nightKg100))
    const totalKg = dayKg + nightKg

    writeDataRow(
      productsSheet,
      rowNum,
      [product.familyName, product.productName, dayKg, nightKg, totalKg],
      { zebra: idx % 2 === 1 },
    )
  })

  const lastProdRow = 5 + productList.length
  if (productList.length > 0) {
    writeTotalsRow(productsSheet, lastProdRow + 1, 6, lastProdRow, 3, 5)
  }

  return workbook
}

export async function exportFreezingSummaryWorkbook(
  input: ExportFreezingSummaryInput,
): Promise<void> {
  const workbook = buildFreezingSummaryWorkbook(input)
  await downloadWorkbook(
    workbook,
    `TRABUNDA_Resumen_Congelamiento_Semana_${input.week.number}.xlsx`,
  )
}
