import { Workbook } from 'exceljs'
import { describe, expect, it } from 'vitest'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateProductionDay } from '../model/calculations'
import { buildProductionDayWorkbook } from './productionDayWorkbook'

describe('production day workbook', () => {
  it('builds an auditable workbook for a closed and balanced day', async () => {
    const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)
    const workbook = buildProductionDayWorkbook(
      WEDNESDAY_PRODUCTION_DAY,
      calculation,
    )
    const worksheet = workbook.getWorksheet('Jornada cerrada')

    expect(worksheet).toBeDefined()
    expect(worksheet?.getCell('A1').value).toBe(
      'TRABUNDA · PARTE DE PRODUCCIÓN',
    )
    expect(worksheet?.getCell('B6').value).toBe('CUADRADO')
    expect(worksheet?.getCell('B7').value).toBe(323_440)
    expect(worksheet?.getCell('B10').value).toBe(0)
    expect(worksheet?.getCell('F19').value).toMatchObject({
      formula: 'C19+D19-E19',
    })
    expect(worksheet?.getCell('M19').value).toMatchObject({
      formula: 'K19+L19',
    })
    expect(worksheet?.getCell('R19').value).toMatchObject({
      formula: 'P19-Q19',
    })
    expect(worksheet?.autoFilter).toEqual({
      from: { row: 18, column: 1 },
      to: { row: 18 + calculation.products.length, column: 18 },
    })

    const exportedBuffer = await workbook.xlsx.writeBuffer()
    const reopenedWorkbook = new Workbook()
    await reopenedWorkbook.xlsx.load(exportedBuffer)

    expect(
      reopenedWorkbook.getWorksheet('Jornada cerrada')?.getCell('B6').value,
    ).toBe('CUADRADO')
  })

  it('rejects a day that is not closed', () => {
    const draftDay = { ...WEDNESDAY_PRODUCTION_DAY, status: 'DRAFT' as const }

    expect(() => buildProductionDayWorkbook(draftDay)).toThrow(
      'Solo se pueden exportar jornadas cerradas y cuadradas.',
    )
  })

  it('includes accepted closure observations in the workbook', () => {
    const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)
    const workbook = buildProductionDayWorkbook(
      {
        ...WEDNESDAY_PRODUCTION_DAY,
        closureObservations: [
          {
            closedAt: '2026-09-02T22:30:00.000Z',
            code: 'GENERAL_YIELD_BELOW_MIN',
            message: 'Cierre aceptado con rendimiento bajo referencia.',
            familyKey: 'ALETA',
          },
        ],
      },
      calculation,
    )
    const worksheet = workbook.getWorksheet('Jornada cerrada')
    const titleRow = 18 + calculation.products.length + 3

    expect(worksheet?.getCell(`A${titleRow}`).value).toBe(
      'OBSERVACIONES DE CIERRE',
    )
    expect(worksheet?.getCell(`B${titleRow + 2}`).value).toBe(
      'GENERAL_YIELD_BELOW_MIN',
    )
    expect(worksheet?.getCell(`F${titleRow + 2}`).value).toBe(
      'Cierre aceptado con rendimiento bajo referencia.',
    )
  })
})
