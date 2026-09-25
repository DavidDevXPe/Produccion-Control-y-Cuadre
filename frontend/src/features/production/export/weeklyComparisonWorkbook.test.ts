import { Workbook } from 'exceljs'
import { describe, expect, it } from 'vitest'
import { closedFreezingDay, closedPackingDay } from '../../../test/productionFixtures'
import {
  buildWeeklyComparisonWorkbook,
  COMPARISON_FAMILY_SHEET,
  COMPARISON_ORIGIN_SHEET,
  COMPARISON_PRODUCT_SHEET,
  COMPARISON_SUMMARY_SHEET,
} from './weeklyComparisonWorkbook'

function workbookIsRecalculatedOnOpen() {
  return buildWeeklyComparisonWorkbook({
    weekNumber: 1,
    period: { startDate: '2026-09-07', endDate: '2026-09-13' },
    productionDays: [],
    packingClosed: false,
    freezingClosed: false,
  }).calcProperties.fullCalcOnLoad
}

describe('weekly comparison workbook', () => {
  const origin = closedPackingDay('2026-09-08', 100_000)
  const freezing = closedFreezingDay({
    date: '2026-09-09',
    reportedKg: 60_000,
    linkedKg: 60_000,
    origin,
  })
  const input = {
    weekNumber: 42,
    period: { startDate: '2026-09-07', endDate: '2026-09-13' },
    productionDays: [origin, freezing],
    packingClosed: false,
    freezingClosed: false,
  }

  it('contains the summary, family, product and origin sheets', async () => {
    const workbook = buildWeeklyComparisonWorkbook(input)

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      COMPARISON_SUMMARY_SHEET,
      COMPARISON_FAMILY_SHEET,
      COMPARISON_PRODUCT_SHEET,
      COMPARISON_ORIGIN_SHEET,
    ])

    const reopened = new Workbook()
    await reopened.xlsx.load(await workbook.xlsx.writeBuffer())
    expect(reopened.worksheets).toHaveLength(4)
  })

  it('shows the reconciliation as an explicit equation that must end in zero', () => {
    const summary = buildWeeklyComparisonWorkbook(input).getWorksheet(
      COMPARISON_SUMMARY_SHEET,
    )!

    expect(summary.getCell('B6').value).toBe('CONCILIADO')
    expect(summary.getCell('B11').value).toBe(100_000)
    expect(summary.getCell('B12').value).toBe(60_000)
    expect(summary.getCell('B13').value).toBe(40_000)
    expect(summary.getCell('B15').value).toMatchObject({
      formula: 'B11-B12-B13-B14',
    })
    expect(workbookIsRecalculatedOnOpen()).toBe(true)
  })

  it('explains each Packing origin of the week', () => {
    const originSheet = buildWeeklyComparisonWorkbook(input).getWorksheet(
      COMPARISON_ORIGIN_SHEET,
    )!

    expect(originSheet.getCell('E6').value).toMatchObject({
      formula: 'B6+C6+D6',
      result: 100_000,
    })
    expect(originSheet.getCell('I6').value).toBe(40_000)
    expect(originSheet.getCell('K6').value).toBe('PENDIENTE DE CONGELAR')
  })
})
