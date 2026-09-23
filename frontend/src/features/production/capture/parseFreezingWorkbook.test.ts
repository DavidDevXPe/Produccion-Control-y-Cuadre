import { Workbook } from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  parseFreezingWorkbook,
  splitFreezingProductName,
} from './parseFreezingWorkbook'

async function buildWorkbook(
  rows: readonly (readonly (string | number | null)[])[],
  sheetName = 'Reporte',
) {
  const workbook = new Workbook()
  const worksheet = workbook.addWorksheet(sheetName)
  for (const row of rows) worksheet.addRow([...row])
  return workbook.xlsx.writeBuffer()
}

const header = ['Producto (Descripción)', 'Cantidad (suma)']

describe('Freezing workbook import', () => {
  it('converts aros to kilograms with 1 aro = 10 kg', async () => {
    const parsed = await parseFreezingWorkbook(
      await buildWorkbook([
        header,
        ['MANTO ESTANDAR CRUDO CONGELADO BLOCK 100% P.N.', 120],
        ['ALETA CRUDA CONGELADA BLOCK 100% P.N.', 35.5],
        ['Total general', 155.5],
      ]),
    )

    expect(parsed.rows.map((row) => row.totalKg)).toEqual([1200, 355])
    expect(parsed.totalAros).toBe(155.5)
    expect(parsed.totalKg).toBe(1555)
    expect(parsed.sourceGrandTotalKg).toBe(1555)
    expect(parsed.reconciled).toBe(true)
    expect(parsed.warnings).toEqual([])
  })

  it('does not derive the weight from the SACO presentation text', async () => {
    const parsed = await parseFreezingWorkbook(
      await buildWorkbook([
        header,
        ['MANTO ESTANDAR 100% P.N. - SACO 3 x 9 kg', 10],
        ['ALETA CRUDA 100% P.N. - SACO 2 x 10 kg', 10],
      ]),
    )

    expect(parsed.rows.map((row) => row.totalKg)).toEqual([100, 100])
    expect(parsed.rows[0]).toMatchObject({
      baseProductName: 'MANTO ESTANDAR 100% P.N.',
      packaging: 'SACO 3 x 9 kg',
    })
  })

  it('separates the logistic presentation without changing the product identity', () => {
    expect(splitFreezingProductName('ALETA  100% P.N. -  SACO 3 X 10 kg')).toEqual({
      baseProductName: 'ALETA 100% P.N.',
      packaging: 'SACO 3 X 10 kg',
    })
    expect(splitFreezingProductName('ALETA 100% P.N.')).toEqual({
      baseProductName: 'ALETA 100% P.N.',
      packaging: null,
    })
  })

  it('reports a warning when the source total does not match the sum of products', async () => {
    const parsed = await parseFreezingWorkbook(
      await buildWorkbook([header, ['MANTO', 100], ['Total general', 90]]),
    )

    expect(parsed.reconciled).toBe(false)
    expect(parsed.warnings.join(' ')).toMatch(/total general/i)
    expect(parsed.totalAros).toBe(100)
  })

  it('skips invalid quantities with an explicit warning instead of importing them', async () => {
    const parsed = await parseFreezingWorkbook(
      await buildWorkbook([header, ['MANTO', 10], ['ALETA', 'n/a'], ['NUCA', -3]]),
    )

    expect(parsed.rows.map((row) => row.baseProductName)).toEqual(['MANTO'])
    expect(parsed.warnings).toHaveLength(2)
  })

  it('detects the header row when the report has a title above it', async () => {
    const parsed = await parseFreezingWorkbook(
      await buildWorkbook([['Reporte de congelamiento'], [], header, ['MANTO', 5]]),
    )

    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0]?.rowNumber).toBe(4)
  })

  it('rejects files without the required columns', async () => {
    await expect(
      parseFreezingWorkbook(await buildWorkbook([['Código', 'Peso'], ['A', 1]])),
    ).rejects.toThrow(/ARCHIVO NO COMPATIBLE/)
  })
})
