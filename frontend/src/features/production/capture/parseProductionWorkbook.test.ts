import { Workbook } from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  mergePackingReportIntoDraft,
  parseProductionWorkbook,
} from './parseProductionWorkbook'
import { createEmptyCaptureDraft } from './productionCapture'

async function buildPackingWorkbook(rows: readonly [string, string, number][]) {
  const workbook = new Workbook()
  const worksheet = workbook.addWorksheet('Reporte')

  worksheet.addRow([
    'Producto (Descripción)',
    'Horario',
    'Cantidad de aros (suma)',
    'Ajuste',
    'Total',
    'Total KG',
  ])

  for (const [productName, date, totalKg] of rows) {
    worksheet.addRow([productName, date, 0, 0, totalKg / 10, totalKg])
  }

  worksheet.addRow(['Total general de aros', null, null, rows.reduce((sum, row) => sum + row[2] / 10, 0), null, null])
  worksheet.addRow(['Ajuste', null, null, 0, 0, null])
  worksheet.addRow(['Total (aros + ajuste)', null, null, rows.reduce((sum, row) => sum + row[2] / 10, 0), rows.reduce((sum, row) => sum + row[2], 0), null])

  return workbook.xlsx.writeBuffer()
}

const realReportRows: readonly [string, string, number][] = [
  ['ALETA CRUDA CONGELADA BLOCK S/TTO 2000 g - 3000 g 100% P.N.', '2026-09-18', 13260],
  ['MANTO ESTANDAR CRUDO CONGELADO BLOCK S/TTO C/02 MEMB 2 KG - 4 KG SB 100% P.N.', '2026-09-18', 50960],
  ['NUCAS CRUDAS CONGELADAS BLOCK S/TTO SEMI-LIMPIAS 300-UP 100% P.N.', '2026-09-18', 20850],
  ['REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 1-2 100% P.N.', '2026-09-18', 16040],
  ['ALETA CRUDA CONGELADA BLOCK S/TTO 1000 g - 2000 g (E) 100% P.N.', '2026-09-18', 30780],
  ['ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÃ‘A P POLAR SM SP ST MIXTA 100% P.N.', '2026-09-18', 16260],
  ['REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 50 cm - 70 cm 100% P.N.', '2026-09-18', 5590],
  ['REJO REPRODUCTOR CRUDO CONGELADO BLOCK S/TTO S/U S/V C/T 70 cm - up 100% P.N.', '2026-09-18', 3590],
  ['MANTO JAPONÃ‰S CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.', '2026-09-18', 38080],
  ['REJOS CRUDOS CONGELADOS BLOCK S/TTO BAILARINA S/R 500 G - 1000 G SEMI LIMPIOS 100% P.N.', '2026-09-18', 13440],
  ['MEMBRANAS COCIDAS CONGELADAS BLOCK S/TTO 100% P.N.', '2026-09-18', 330],
  ['RECORTE CRUDO CONGELADO BLOCK S/TTO MANTO JAPONÃ‰S 100% P.N.', '2026-09-18', 840],
  ['CONOS CON PIEL CRUDOS CONGELADOS BLOCK S/TTO 100% P.N.', '2026-09-18', 5330],
  ['RECORTE CRUDO CONGELADO BLOCK S/TTO ANILLAS SM SP ST 100% P.N.', '2026-09-18', 8590],
  ['RECORTES CRUDOS - LABIOS CONGELADOS BLOCK S/TTO 100% P.N.', '2026-09-18', 1120],
  ['ALETA CRUDA CONGELADA BLOCK S/TTO 3000 g - 4000 g 100% P.N.', '2026-09-18', 70],
  ['NUCAS CRUDAS CONGELADAS BLOCK S/TTO SEMI-LIMPIAS 100-300 100% P.N.', '2026-09-18', 860],
  ['ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÃ‘A SM 2DA MIXTA 100% P.N.', '2026-09-18', 0],
  ['RECORTE CRUDO CONGELADO BLOCK S/TTO ALETA 100% PN', '2026-09-18', 490],
  ['ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÃ‘A P CM SP ST MIXTA 100% P.N.', '2026-09-18', 710],
  ['REJO CRUDO CONGELADO BLOCK S/TTO BAA S/R 2-3 100% P.N.', '2026-09-18', 350],
  ['RECORTE CRUDO CONGELADO BLOCK S/TTO ANILLAS SM CP ST 100% P.N.', '2026-09-18', 100],
]

describe('production workbook import', () => {
  it('reads the structured Reporte sheet and ignores footer rows', async () => {
    const parsed = await parseProductionWorkbook(
      await buildPackingWorkbook(realReportRows),
      { fileName: 'resumen_envasado (1).xlsx', operationalDate: '2026-09-18', shift: 'DAY' },
    )

    expect(parsed.sheetName).toBe('Reporte')
    expect(parsed.productiveRows).toBe(22)
    expect(parsed.reconstructedTotalKg).toBe(227_640)
    expect(parsed.footerTotalKg).toBe(227_640)
    expect(parsed.ignoredRows).toHaveLength(0)
    expect(parsed.recognizedRows).toBe(21)
    expect(parsed.newRows).toBe(1)
    expect(parsed.rows.some((row) => row.productName.includes('ESPAÑA'))).toBe(true)
    expect(parsed.rows.some((row) => row.productName.includes('JAPONÉS'))).toBe(true)
    expect(parsed.rows.find((row) => row.product?.productId === 'membranas-cocidas')?.status).toBe('COINCIDENCIA EXACTA')
    expect(parsed.rows.find((row) => row.productName.includes('100-300'))?.status).toBe('NUEVO PRODUCTO')
  })

  it('uses Total KG as the authoritative productive value', async () => {
    const parsed = await parseProductionWorkbook(
      await buildPackingWorkbook([
        ['ALETA CRUDA CONGELADA BLOCK S/TTO 1000 g - 2000 g (E) 100% P.N.', '2026-09-18', 30_780],
      ]),
      { operationalDate: '2026-09-18', shift: 'DAY' },
    )

    expect(parsed.rows[0]?.totalKg).toBe(30_780)
    expect(parsed.reconstructedTotalKg).toBe(30_780)
  })

  it('accepts the next calendar date only for the night turn', async () => {
    const workbook = await buildPackingWorkbook([
      ['ALETA CRUDA CONGELADA BLOCK S/TTO 2000 g - 3000 g 100% P.N.', '2026-09-19', 10_000],
    ])

    const day = await parseProductionWorkbook(workbook, {
      operationalDate: '2026-09-18',
      shift: 'DAY',
    })
    const night = await parseProductionWorkbook(workbook, {
      operationalDate: '2026-09-18',
      shift: 'NIGHT',
    })

    expect(day.rows[0]?.status).toBe('FECHA REQUIERE REVISIÓN')
    expect(night.rows[0]?.status).not.toBe('FECHA REQUIERE REVISIÓN')
  })

  it('merges only the selected shift and preserves existing values in the other shift', async () => {
    const dayImport = await parseProductionWorkbook(
      await buildPackingWorkbook([
        ['ALETA CRUDA CONGELADA BLOCK S/TTO 2000 g - 3000 g 100% P.N.', '2026-09-18', 15_000],
      ]),
      { operationalDate: '2026-09-18', shift: 'DAY' },
    )
    const nightImport = await parseProductionWorkbook(
      await buildPackingWorkbook([
        ['ALETA CRUDA CONGELADA BLOCK S/TTO 2000 g - 3000 g 100% P.N.', '2026-09-19', 25_000],
      ]),
      { operationalDate: '2026-09-18', shift: 'NIGHT' },
    )

    const draft = createEmptyCaptureDraft('2026-09-18')
    const withDay = mergePackingReportIntoDraft(draft, dayImport)
    const withNight = mergePackingReportIntoDraft(withDay, nightImport)

    expect(withNight.declaredDayTotalKg).toBe('15000')
    expect(withNight.declaredNightTotalKg).toBe('25000')
    expect(withNight.rows[0]?.dayReportedKg).toBe('15000')
    expect(withNight.rows[0]?.nightReportedKg).toBe('25000')
  })

  it('reports an incompatible file when required columns are missing', async () => {
    const workbook = new Workbook()
    const worksheet = workbook.addWorksheet('Reporte')
    worksheet.addRow(['Producto (Descripción)', 'Horario'])
    worksheet.addRow(['ALETA CRUDA', '2026-09-18'])

    const parsed = await parseProductionWorkbook(
      await workbook.xlsx.writeBuffer(),
      { operationalDate: '2026-09-18', shift: 'DAY' },
    )

    expect(parsed.status).toBe('ARCHIVO NO COMPATIBLE')
    expect(parsed.missingColumns).toContain('Total KG')
  })
})
