import { Workbook } from 'exceljs'
import { describe, expect, it } from 'vitest'
import { closedPackingDay } from '../../../test/productionFixtures'
import { calculateProductionDay } from '../model/calculations'
import {
  buildDetailColumns,
  writePackingDetail,
  writePackingSummary,
} from './productionDayPackingSheets'
import { DETAIL_SHEET, SUMMARY_SHEET } from './productionDayWorkbookShared'

describe('productionDayPackingSheets', () => {
  const sampleDay = closedPackingDay('2026-09-16', 1000)
  const calculation = calculateProductionDay(sampleDay)

  it('builds detail columns list including base and conditional columns', () => {
    const columns = buildDetailColumns(calculation)
    expect(columns.length).toBeGreaterThan(5)
    expect(columns.some((col) => col.key === 'dayReported')).toBe(true)
    expect(columns.some((col) => col.key === 'nightReported')).toBe(true)
    expect(columns.some((col) => col.key === 'difference')).toBe(true)
  })

  it('writes Packing summary worksheet with title and key indicator values', () => {
    const workbook = new Workbook()
    writePackingSummary(workbook, calculation, sampleDay)

    const worksheet = workbook.getWorksheet(SUMMARY_SHEET)
    expect(worksheet).toBeDefined()
    expect(worksheet?.getCell('A1').value).toBe('TRABUNDA · PARTE DE PRODUCCIÓN')
    expect(worksheet?.getCell('B6').value).toBe('CUADRADO')
  })

  it('writes Packing detail worksheet with headers, data rows and total formula', () => {
    const workbook = new Workbook()
    writePackingDetail(workbook, calculation, sampleDay)

    const worksheet = workbook.getWorksheet(DETAIL_SHEET)
    expect(worksheet).toBeDefined()
    expect(worksheet?.getCell('A1').value).toBe(
      'TRABUNDA · DETALLE POR PRODUCTO',
    )
    expect(worksheet?.getCell('A5').value).toBe('Familia')
    expect(worksheet?.getCell('B5').value).toBe('Producto')
  })
})

