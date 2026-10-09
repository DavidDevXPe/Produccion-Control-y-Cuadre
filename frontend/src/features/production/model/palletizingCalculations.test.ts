import { describe, expect, it } from 'vitest'
import { kg100 } from './calculations'
import {
  calculatePalletizingRow,
  calculatePalletizingTotals,
} from './palletizingCalculations'
import type { PalletizingRowInput } from './palletizingTypes'

describe('Palletizing Calculations - Table 1 (Descuadres y Control Rápido)', () => {
  const table1Data: PalletizingRowInput[] = [
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
      productName: 'MANTO ESTANDAR CRUDO CONGELADO BLOCK S/TTO C/02 MEMB 2 KG - 4 KG SB 100% P.N. - SACO 2 x 10 kg',
      packingKg100: kg100(5_090_00),
      freezingKg100: kg100(5_090_00),
      videojetQrKg100: kg100(5_060_00),
      palletizedKg100: kg100(5_120_00),
      palletizedBagsCount: 256,
    },
    {
      productId: '3',
      productName: 'RECORTES CRUDOS - LABIOS CONGELADOS BLOCK S/TTO 100% P.N. - SACO 2 x 10 kg',
      packingKg100: kg100(80_00),
      freezingKg100: kg100(80_00),
      videojetQrKg100: kg100(80_00),
      palletizedKg100: kg100(80_00),
      palletizedBagsCount: 4,
    },
    {
      productId: '10',
      productName: 'ALETA CRUDA CONGELADA BLOCK S/TTO 1000 g - 2000 g (E) 100% P.N. - SACO 2 x 10 kg',
      packingKg100: kg100(1_980_00),
      freezingKg100: kg100(1_980_00),
      videojetQrKg100: kg100(1_980_00),
      palletizedKg100: kg100(1_900_00),
      palletizedBagsCount: 95,
    },
  ]

  it('detects tunnel descuadre in Manto Japones', () => {
    const calc = calculatePalletizingRow(table1Data[0]!)
    expect(calc.diffPackingVsFreezingKg100).toBe(kg100(570_00))
    expect(calc.diffFreezingVsVideojetKg100).toBe(kg100(-1_440_00))
    expect(calc.diffToPalletizeKg100).toBe(kg100(50_00))
    expect(calc.bagsCount).toBe(121)
    expect(calc.status).toBe('DESCUADRE')
    expect(calc.statusTone).toBe('danger')
  })

  it('detects palletized overdraw descuadre in Manto Estandar', () => {
    const calc = calculatePalletizingRow(table1Data[1]!)
    expect(calc.diffPackingVsFreezingKg100).toBe(kg100(0))
    expect(calc.diffFreezingVsVideojetKg100).toBe(kg100(30_00))
    expect(calc.diffToPalletizeKg100).toBe(kg100(-30_00))
    expect(calc.bagsCount).toBe(256)
    expect(calc.status).toBe('DESCUADRE')
    expect(calc.statusTone).toBe('danger')
  })

  it('marks 100% square for Recortes Labios', () => {
    const calc = calculatePalletizingRow(table1Data[2]!)
    expect(calc.diffPackingVsFreezingKg100).toBe(kg100(0))
    expect(calc.diffFreezingVsVideojetKg100).toBe(kg100(0))
    expect(calc.diffToPalletizeKg100).toBe(kg100(0))
    expect(calc.bagsCount).toBe(4)
    expect(calc.status).toBe('CUADRADO')
    expect(calc.statusTone).toBe('success')
  })

  it('marks Pendiente when tunnel is squared but there is balance to palletize in camera', () => {
    const calc = calculatePalletizingRow(table1Data[3]!)
    expect(calc.diffPackingVsFreezingKg100).toBe(kg100(0))
    expect(calc.diffFreezingVsVideojetKg100).toBe(kg100(0))
    expect(calc.diffToPalletizeKg100).toBe(kg100(80_00))
    expect(calc.bagsCount).toBe(95)
    expect(calc.status).toBe('PENDIENTE')
    expect(calc.statusTone).toBe('warning')
  })

  it('handles SMART_CLOSEST mode identifying freezing when packing has tunnel shrinkage', () => {
    // Rejos bailarina: Envasado 540 kg, Congelado 520 kg, Videojet 800 kg, Paletizado 520 kg
    const bailarina: PalletizingRowInput = {
      productId: '12',
      productName: 'REJOS CRUDOS BAILARINA',
      packingKg100: kg100(540_00),
      freezingKg100: kg100(520_00),
      videojetQrKg100: kg100(800_00),
      palletizedKg100: kg100(520_00),
      palletizedBagsCount: 26,
    }
    // Under EXCEL mode: 540 - 520 = 20 kg
    const excelCalc = calculatePalletizingRow(bailarina, { comparisonMode: 'EXCEL' })
    expect(excelCalc.diffToPalletizeKg100).toBe(kg100(20_00))
    expect(excelCalc.comparisonBasis).toBe('PACKING')

    // Under SMART_CLOSEST mode: matches Freezing exactly (520 - 520 = 0 kg)
    const smartCalc = calculatePalletizingRow(bailarina, { comparisonMode: 'SMART_CLOSEST' })
    expect(smartCalc.diffToPalletizeKg100).toBe(kg100(0))
    expect(smartCalc.comparisonBasis).toBe('FREEZING')
    expect(smartCalc.status).toBe('CUADRADO')
    expect(smartCalc.statusTone).toBe('success')

    // Under VIDEOJET mode: 800 - 520 = 280 kg
    const vCalc = calculatePalletizingRow(bailarina, { comparisonMode: 'VIDEOJET' })
    expect(vCalc.diffToPalletizeKg100).toBe(kg100(280_00))
    expect(vCalc.comparisonBasis).toBe('VIDEOJET')
  })

  it('handles SMART_CLOSEST mode identifying packing when videojet missed QR codes', () => {
    // Nucas: Envasado 1640 kg, Congelado 1640 kg, Videojet 1000 kg, Paletizado 1640 kg
    const nucas: PalletizingRowInput = {
      productId: '6',
      productName: 'NUCAS CRUDAS',
      packingKg100: kg100(1_640_00),
      freezingKg100: kg100(1_640_00),
      videojetQrKg100: kg100(1_000_00),
      palletizedKg100: kg100(1_640_00),
      palletizedBagsCount: 82,
    }
    const smartCalc = calculatePalletizingRow(nucas, { comparisonMode: 'SMART_CLOSEST' })
    expect(smartCalc.diffToPalletizeKg100).toBe(kg100(0))
    expect(smartCalc.status).toBe('CUADRADO')
    expect(smartCalc.statusTone).toBe('success')

    // Under VIDEOJET mode: 1000 - 1640 = -640 kg (false descuadre in palletizing)
    const vCalc = calculatePalletizingRow(nucas, { comparisonMode: 'VIDEOJET' })
    expect(vCalc.diffToPalletizeKg100).toBe(kg100(-640_00))
    expect(vCalc.status).toBe('DESCUADRE')
  })
})

describe('Palletizing Calculations - Table 2 (Conciliación Exacta con Saldos de Cámara)', () => {
  const table2Data: PalletizingRowInput[] = [
    {
      productId: '1',
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
    {
      productId: '2',
      productName: 'ALETA CRUDA CONGELADA BLOCK S/TTO 2000 g - 3000 g 100% P.N.',
      packingKg100: kg100(650_00),
      freezingKg100: kg100(650_00),
      initialCameraBalanceKg100: kg100(0),
      videojetQrKg100: kg100(640_00),
      looseBlockWithoutQrKg100: kg100(10_00),
      palletizedKg100: kg100(640_00),
      finalCameraBalanceKg100: kg100(10_00),
      palletizedBagsCount: 32,
    },
    {
      productId: '10',
      productName: 'MANTO ESTANDAR CRUDO CONGELADO BLOCK S/TTO C/02 MEMB 2 KG - 4 KG SB 100% P.N.',
      packingKg100: kg100(10_00),
      freezingKg100: kg100(10_00),
      initialCameraBalanceKg100: kg100(10_00),
      videojetQrKg100: kg100(20_00),
      looseBlockWithoutQrKg100: kg100(0),
      palletizedKg100: kg100(20_00),
      finalCameraBalanceKg100: kg100(0),
      palletizedBagsCount: 1,
    },
  ]

  it('accurately reconciles loose block of 10 kg without QR in Aleta 2000-3000', () => {
    const calc = calculatePalletizingRow(table2Data[1]!)
    expect(calc.diffPackingVsFreezingKg100).toBe(kg100(0))
    expect(calc.diffFreezingVsVideojetKg100).toBe(kg100(0))
    expect(calc.diffPhysicalPalletizeKg100).toBe(kg100(0))
    expect(calc.status).toBe('CUADRADO')
    expect(calc.statusTone).toBe('success')
  })

  it('accurately reconciles initial balance carryover of 10 kg in Manto Estandar', () => {
    const calc = calculatePalletizingRow(table2Data[2]!)
    expect(calc.diffPackingVsFreezingKg100).toBe(kg100(0))
    expect(calc.diffFreezingVsVideojetKg100).toBe(kg100(0))
    expect(calc.diffToPalletizeKg100).toBe(kg100(0))
    expect(calc.diffPhysicalPalletizeKg100).toBe(kg100(0))
    expect(calc.bagsCount).toBe(1)
    expect(calc.status).toBe('CUADRADO')
    expect(calc.statusTone).toBe('success')
  })

  it('computes total general matching Table 2 totals', () => {
    const calcs = table2Data.map((r) => calculatePalletizingRow(r))
    const totals = calculatePalletizingTotals(calcs)
    expect(totals.totalPackingKg100).toBe(kg100(1_920_00))
    expect(totals.totalDiffToPalletizeKg100).toBe(kg100(10_00))
    expect(totals.overallStatus).toBe('CUADRADO')
    expect(totals.overallStatusTone).toBe('success')
  })

  it('computes full PALLETIZING_SAMPLE_CUADRADO totals exactly matching user CSV', async () => {
    const { PALLETIZING_SAMPLE_CUADRADO } = await import(
      '../data/palletizingSampleData'
    )
    const calcs = PALLETIZING_SAMPLE_CUADRADO.map((r) => calculatePalletizingRow(r))
    const totals = calculatePalletizingTotals(calcs)
    expect(totals.totalPackingKg100).toBe(kg100(4_970_00))
    expect(totals.totalFreezingKg100).toBe(kg100(4_970_00))
    expect(totals.totalDiffPackingVsFreezingKg100).toBe(kg100(0))
    expect(totals.totalVideojetQrKg100).toBe(kg100(4_940_00))
    expect(totals.totalDiffFreezingVsVideojetKg100).toBe(kg100(0))
    expect(totals.totalPalletizedKg100).toBe(kg100(4_940_00))
    expect(totals.totalDiffToPalletizeKg100).toBe(kg100(40_00))
    expect(totals.totalLooseBlockWithoutQrKg100).toBe(kg100(40_00))
    expect(totals.totalInitialCameraBalanceKg100).toBe(kg100(10_00))
    expect(totals.totalBagsCount).toBe(247)
    expect(totals.totalCameraBalanceKg100).toBe(kg100(40_00))
    expect(totals.overallStatus).toBe('CUADRADO')
  })
})
