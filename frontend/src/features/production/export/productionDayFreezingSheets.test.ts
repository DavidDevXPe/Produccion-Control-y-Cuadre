import { Workbook } from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  closedFreezingDay,
  closedPackingDay,
} from '../../../test/productionFixtures'
import { calculateProductionDay } from '../model/calculations'
import {
  originDateOf,
  writeFreezingWorkbook,
} from './productionDayFreezingSheets'
import {
  DETAIL_SHEET,
  FREEZING_ORIGIN_SHEET,
  SUMMARY_SHEET,
} from './productionDayWorkbookShared'

describe('productionDayFreezingSheets', () => {
  const originDay = closedPackingDay('2026-09-16', 1000)
  const sampleFreezingDay = closedFreezingDay({
    date: '2026-09-17',
    reportedKg: 1000,
    linkedKg: 1000,
    origin: originDay,
  })
  const calculation = calculateProductionDay(sampleFreezingDay)

  it('resolves originDateOf from productionDays list or falls back to date regex / id', () => {
    const days = [sampleFreezingDay]
    expect(originDateOf(sampleFreezingDay.id, days)).toBe(
      sampleFreezingDay.date,
    )
    expect(originDateOf('origin-2026-09-10-other', [])).toBe('2026-09-10')
    expect(originDateOf('unmatched-id', [])).toBe('unmatched-id')
  })

  it('writes Freezing workbook sheets including summary, origin, and detail', () => {
    const workbook = new Workbook()
    writeFreezingWorkbook(workbook, calculation, sampleFreezingDay, [
      originDay,
      sampleFreezingDay,
    ])

    const sheetNames = workbook.worksheets.map((sheet) => sheet.name)
    expect(sheetNames).toContain(SUMMARY_SHEET)
    expect(sheetNames).toContain(FREEZING_ORIGIN_SHEET)
    expect(sheetNames).toContain(DETAIL_SHEET)

    const summary = workbook.getWorksheet(SUMMARY_SHEET)!
    expect(summary.getCell('A1').value).toBe(
      'TRABUNDA · PARTE DE CONGELAMIENTO',
    )
    expect(summary.getCell('B6').value).toBe('CUADRADO')
  })
})
