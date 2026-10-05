import { Workbook } from 'exceljs'
import { describe, expect, it } from 'vitest'
import { closedPackingDay } from '../../../test/productionFixtures'
import { kg100 } from '../model/calculations'
import {
  DETAIL_SHEET,
  FREEZING_ORIGIN_SHEET,
  kg,
  productNameById,
  statusLabel,
  subtitle,
  SUMMARY_SHEET,
  writeObservations,
} from './productionDayWorkbookShared'
import { setupWorksheet } from './workbookStyles'

describe('productionDayWorkbookShared', () => {
  const sampleDay = closedPackingDay('2026-09-16', 1000)

  it('exposes correct sheet constant names', () => {
    expect(SUMMARY_SHEET).toBe('Resumen')
    expect(DETAIL_SHEET).toBe('Detalle por producto')
    expect(FREEZING_ORIGIN_SHEET).toBe('Origen del congelado')
  })

  it('converts centi-kg to float kilograms', () => {
    expect(kg(kg100(125050))).toBe(1250.5)
  })

  it('formats statusLabel based on closureObservations', () => {
    expect(statusLabel(sampleDay)).toBe('CUADRADO')

    const observedDay = {
      ...sampleDay,
      closureObservations: [
        {
          code: 'WARNING',
          message: 'Diferencia detectada',
          closedAt: '2026-09-16T12:00:00Z',
        },
      ],
    }
    expect(statusLabel(observedDay)).toBe('CUADRADO · OBSERVADO')
  })

  it('formats subtitle correctly', () => {
    const text = subtitle(sampleDay, 'Envasado')
    expect(text).toContain('Envasado')
    expect(text).toContain('Jornada cerrada')
    expect(text).toContain('CUADRADO')
  })

  it('resolves product name by ID from day lines or returns fallback', () => {
    const firstLine = sampleDay.lines[0]!
    expect(productNameById(sampleDay, firstLine.productId)).toBe(
      firstLine.productName,
    )
    expect(productNameById(sampleDay, 'unknown-id')).toBe('unknown-id')
    expect(productNameById(sampleDay, undefined)).toBe('')
  })

  it('writes observations to worksheet when present', () => {
    const workbook = new Workbook()
    const worksheet = setupWorksheet(
      workbook,
      'Obs',
      [20, 20, 20, 20, 20, 40],
      'Observaciones',
    )
    const observedDay = {
      ...sampleDay,
      closureObservations: [
        {
          code: 'OBS-1',
          message: 'Nota de cierre',
          closedAt: '2026-09-16T12:00:00Z',
        },
      ],
    }

    const lastRow = writeObservations(worksheet, observedDay, 5, 6)
    expect(lastRow).toBe(7)
    expect(worksheet.getCell('B7').value).toBe('OBS-1')
    expect(worksheet.getCell('F7').value).toBe('Nota de cierre')
  })
})
