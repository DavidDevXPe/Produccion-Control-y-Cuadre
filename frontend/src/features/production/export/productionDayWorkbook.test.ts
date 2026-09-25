import { Workbook, type Worksheet } from 'exceljs'
import { describe, expect, it } from 'vitest'
import { closedFreezingDay, closedPackingDay } from '../../../test/productionFixtures'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateProductionDay } from '../model/calculations'
import {
  buildProductionDayWorkbook,
  DETAIL_SHEET,
  FREEZING_ORIGIN_SHEET,
  SUMMARY_SHEET,
} from './productionDayWorkbook'

function findRow(worksheet: Worksheet, label: string): number {
  let found = -1
  worksheet.eachRow((row, rowNumber) => {
    if (found === -1 && row.getCell(1).value === label) found = rowNumber
  })
  if (found === -1) throw new Error(`Row "${label}" not found`)
  return found
}

function headers(worksheet: Worksheet, rowNumber: number): unknown[] {
  const values: unknown[] = []
  worksheet.getRow(rowNumber).eachCell((cell) => values.push(cell.value))
  return values
}

describe('production day workbook (Packing)', () => {
  const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)

  it('opens on a readable summary with the key indicators and the reconciliation', async () => {
    const workbook = buildProductionDayWorkbook(WEDNESDAY_PRODUCTION_DAY, calculation)
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      SUMMARY_SHEET,
      DETAIL_SHEET,
    ])

    const summary = workbook.getWorksheet(SUMMARY_SHEET)!
    expect(summary.getCell('A1').value).toBe('TRABUNDA · PARTE DE PRODUCCIÓN')
    expect(summary.getCell('B6').value).toBe('CUADRADO')
    expect(summary.getCell('B7').value).toBe(323_440)

    const expectedRow = findRow(summary, '= Producto terminado esperado')
    expect(summary.getCell(`B${expectedRow}`).value).toMatchObject({
      formula: expect.stringMatching(/^SUM\(B15:B\d+\)$/),
    })
    expect(summary.getCell(`B${expectedRow + 2}`).value).toMatchObject({
      formula: `B${expectedRow}-B${expectedRow + 1}`,
    })

    // Families and the freezable availability are part of the summary.
    expect(() => findRow(summary, 'TOTALES POR FAMILIA')).not.toThrow()
    const availableRow = findRow(summary, '= Disponible para congelar')
    expect(summary.getCell(`C${availableRow}`).value).toMatch(/jornada de origen/)

    // The file opens again after being written.
    const reopened = new Workbook()
    await reopened.xlsx.load(await workbook.xlsx.writeBuffer())
    expect(reopened.getWorksheet(SUMMARY_SHEET)?.getCell('B6').value).toBe('CUADRADO')
  })

  it('keeps the detail sheet short: adjustment and tunnel columns only when used', () => {
    const workbook = buildProductionDayWorkbook(WEDNESDAY_PRODUCTION_DAY, calculation)
    const detail = workbook.getWorksheet(DETAIL_SHEET)!
    const columns = headers(detail, 5)

    expect(columns).toEqual([
      'Familia',
      'Producto',
      'Día reportado',
      'Saldo anterior procesado Día',
      'Día propio',
      'Noche reportado',
      'Saldo anterior procesado Noche',
      'Noche propio',
      'Tratamiento',
      'Saldo final (queda en esta jornada)',
      'Producto terminado esperado',
      'Producto terminado declarado',
      'Diferencia',
    ])
    expect(detail.getCell('E6').value).toMatchObject({ formula: 'C6-D6' })
    expect(detail.getCell('K6').value).toMatchObject({ formula: 'E6+H6+I6+J6' })
    expect(detail.getCell('M6').value).toMatchObject({ formula: 'K6-L6' })
    expect(detail.autoFilter).toEqual({
      from: { row: 5, column: 1 },
      to: { row: 5 + calculation.products.length, column: 13 },
    })
    const totalRow = 6 + calculation.products.length
    expect(detail.getCell(`A${totalRow}`).value).toBe('TOTAL')
  })

  it('rejects a day that is not closed', () => {
    const draftDay = { ...WEDNESDAY_PRODUCTION_DAY, status: 'DRAFT' as const }

    expect(() => buildProductionDayWorkbook(draftDay)).toThrow(
      'Solo se pueden exportar jornadas cerradas y cuadradas.',
    )
  })

  it('includes accepted closure observations with the product name', () => {
    const product = WEDNESDAY_PRODUCTION_DAY.lines[0]!
    const workbook = buildProductionDayWorkbook(
      {
        ...WEDNESDAY_PRODUCTION_DAY,
        closureObservations: [
          {
            closedAt: '2026-09-02T22:30:00.000Z',
            code: 'GENERAL_YIELD_BELOW_MIN',
            message: 'Cierre aceptado con rendimiento bajo referencia.',
            familyKey: 'ALETA',
            productId: product.productId,
          },
        ],
      },
      calculation,
    )
    const summary = workbook.getWorksheet(SUMMARY_SHEET)!
    const titleRow = findRow(summary, 'OBSERVACIONES DE CIERRE')

    expect(summary.getCell('B6').value).toBe('CUADRADO · OBSERVADO')
    expect(summary.getCell(`B${titleRow + 2}`).value).toBe('GENERAL_YIELD_BELOW_MIN')
    expect(summary.getCell(`C${titleRow + 2}`).value).toBe(product.productName)
    expect(summary.getCell(`F${titleRow + 2}`).value).toBe(
      'Cierre aceptado con rendimiento bajo referencia.',
    )
  })
})

describe('production day workbook (Freezing)', () => {
  it('explains the frozen product and its Packing origin', () => {
    const origin = closedPackingDay('2026-09-08', 100_000)
    const freezing = closedFreezingDay({
      date: '2026-09-09',
      reportedKg: 60_000,
      linkedKg: 60_000,
      origin,
    })
    const workbook = buildProductionDayWorkbook(
      freezing,
      calculateProductionDay(freezing),
      { productionDays: [origin, freezing] },
    )

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      SUMMARY_SHEET,
      FREEZING_ORIGIN_SHEET,
      DETAIL_SHEET,
    ])
    const summary = workbook.getWorksheet(SUMMARY_SHEET)!
    expect(summary.getCell('A1').value).toBe('TRABUNDA · PARTE DE CONGELAMIENTO')
    expect(summary.getCell('B10').value).toBe(60_000)
    expect(summary.getCell('B11').value).toMatchObject({ formula: 'MAX(B9-B10,0)' })

    const originSheet = workbook.getWorksheet(FREEZING_ORIGIN_SHEET)!
    expect(String(originSheet.getCell('A6').value)).toMatch(/2026/)
    expect(originSheet.getCell('F6').value).toMatchObject({ result: 60_000 })
  })
})
