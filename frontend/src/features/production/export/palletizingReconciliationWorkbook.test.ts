import { describe, expect, it } from 'vitest'
import { kg100 } from '../model/calculations'
import type { PalletizingRowInput } from '../model/palletizingTypes'
import { buildPalletizingReconciliationWorkbook } from './palletizingReconciliationWorkbook'

describe('Palletizing Reconciliation Workbook Export', () => {
  const sampleData: PalletizingRowInput[] = [
    {
      productId: '1',
      productName: 'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N. - SACO 2 x 10 kg',
      packingKg100: kg100(2_470_00),
      freezingKg100: kg100(1_900_00),
      videojetQrKg100: kg100(3_340_00),
      palletizedKg100: kg100(2_420_00),
      palletizedBagsCount: 121,
    },
    {
      productId: '2',
      productName: 'ALETA CRUDA CONGELADA BLOCK S/TTO 1000 g - 2000 g (E) 100% P.N.',
      packingKg100: kg100(1_260_00),
      freezingKg100: kg100(1_260_00),
      initialCameraBalanceKg100: kg100(0),
      videojetQrKg100: kg100(1_260_00),
      looseBlockWithoutQrKg100: kg100(0),
      palletizedKg100: kg100(1_260_00),
      finalCameraBalanceKg100: kg100(0),
      palletizedBagsCount: 63,
    },
  ]

  it('builds a workbook with both sheets (Control Rápido and Conciliación de Cámara)', () => {
    const workbook = buildPalletizingReconciliationWorkbook({ rows: sampleData })
    expect(workbook.worksheets).toHaveLength(2)

    const ws1 = workbook.getWorksheet('Control Rápido')
    expect(ws1).toBeDefined()
    expect(ws1?.getCell('B2').value).toBe('CONTROL DE ENVASADO, CONGELAMIENTO, VIDEOJET Y PALETIZADO')

    const ws2 = workbook.getWorksheet('Conciliación de Cámara')
    expect(ws2).toBeDefined()
    expect(ws2?.getCell('B2').value).toBe('CONTROL DE ENVASADO, CONGELAMIENTO, VIDEOJET Y PALETIZADO')
  })
})
