import { Workbook } from 'exceljs'
import { calculateProductionDay } from '../model/calculations'
import { getProductionProcess } from '../model/productionProcess'
import type {
  ProductionDay,
  ProductionDayCalculation,
} from '../model/types'
import {
  writePackingDetail,
  writePackingSummary,
} from './productionDayPackingSheets'
import { writeFreezingWorkbook } from './productionDayFreezingSheets'
import {
  DETAIL_SHEET,
  FREEZING_ORIGIN_SHEET,
  SUMMARY_SHEET,
} from './productionDayWorkbookShared'
import { downloadWorkbook } from './workbookStyles'

export { DETAIL_SHEET, FREEZING_ORIGIN_SHEET, SUMMARY_SHEET }

export interface ProductionDayWorkbookOptions {
  /** All known journeys, used to show the date of each Freezing origin. */
  readonly productionDays?: readonly ProductionDay[]
}

export function buildProductionDayWorkbook(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation = calculateProductionDay(productionDay),
  options: ProductionDayWorkbookOptions = {},
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
  // Excel recalculates every formula when the file is opened.
  workbook.calcProperties.fullCalcOnLoad = true

  if (getProductionProcess(productionDay) === 'FREEZING') {
    writeFreezingWorkbook(
      workbook,
      calculation,
      productionDay,
      options.productionDays ?? [],
    )
  } else {
    writePackingSummary(workbook, calculation, productionDay)
    writePackingDetail(workbook, calculation, productionDay)
  }

  return workbook
}

export async function exportProductionDayWorkbook(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation = calculateProductionDay(productionDay),
  options: ProductionDayWorkbookOptions = {},
): Promise<void> {
  const workbook = buildProductionDayWorkbook(
    productionDay,
    calculation,
    options,
  )
  const process =
    getProductionProcess(productionDay) === 'FREEZING'
      ? 'Congelamiento'
      : 'Envasado'
  await downloadWorkbook(
    workbook,
    `TRABUNDA_${process}_${productionDay.date}.xlsx`,
  )
}

