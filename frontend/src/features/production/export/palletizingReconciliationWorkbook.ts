import { Workbook } from 'exceljs'
import { kg100, toKilograms } from '../model/calculations'
import {
  calculatePalletizingRow,
  calculatePalletizingTotals,
} from '../model/palletizingCalculations'
import type {
  PalletizingComparisonMode,
  PalletizingRowCalculation,
  PalletizingRowInput,
} from '../model/palletizingTypes'
import {
  PALLETIZING_SAMPLE_DESCUADRE,
} from '../data/palletizingSampleData'
import {
  applyThinBorder,
  downloadWorkbook,
  setupWorksheet,
} from './workbookStyles'

export interface BuildPalletizingWorkbookInput {
  readonly rows?: readonly PalletizingRowInput[] | undefined
  readonly title?: string
  readonly subtitle?: string
  readonly comparisonMode?: PalletizingComparisonMode
}

export function buildPalletizingReconciliationWorkbook(
  input: BuildPalletizingWorkbookInput,
): Workbook {
  const workbook = new Workbook()
  workbook.creator = 'TRABUNDA Producción'
  workbook.company = 'TRABUNDA Procesos Marinos'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.calcProperties.fullCalcOnLoad = true

  const rows = input.rows && input.rows.length > 0 ? input.rows : PALLETIZING_SAMPLE_DESCUADRE
  const calculations: PalletizingRowCalculation[] = rows.map((row) =>
    calculatePalletizingRow(row, { comparisonMode: input.comparisonMode }),
  )
  const totals = calculatePalletizingTotals(calculations)

  // -------------------------------------------------------------
  // HOJA 1: CONTROL OPERATIVO (TABLA 1)
  // -------------------------------------------------------------
  const colWidths1 = [6, 45, 15, 18, 19, 16, 21, 15, 19, 12, 16]
  const ws1 = setupWorksheet(
    workbook,
    'Control Rápido',
    colWidths1,
    'Sistema de Control Operativo y Trazabilidad',
  )

  // Título
  ws1.mergeCells('B2:K2')
  const titleCell1 = ws1.getCell('B2')
  titleCell1.value = 'CONTROL DE ENVASADO, CONGELAMIENTO, VIDEOJET Y PALETIZADO'
  titleCell1.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  titleCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF071B2E' } }
  titleCell1.alignment = { horizontal: 'center', vertical: 'middle' }
  ws1.getRow(2).height = 26

  ws1.mergeCells('B3:K3')
  const subCell1 = ws1.getCell('B3')
  subCell1.value = 'Sistema de Control Operativo, Trazabilidad QR y Cuadre de Producción'
  subCell1.font = { italic: true, size: 10, color: { argb: 'FF8BA7BE' } }
  subCell1.alignment = { horizontal: 'center', vertical: 'middle' }
  ws1.getRow(3).height = 18

  // KPIs Cabecera (Fila 5 y 6)
  const kpis1 = [
    { label: 'TOTAL ENVASADO', val: toKilograms(totals.totalPackingKg100), col: 'B' },
    { label: 'TOTAL CONGELADO', val: toKilograms(totals.totalFreezingKg100), col: 'D' },
    { label: 'TOTAL VIDEOJET QR', val: toKilograms(totals.totalVideojetQrKg100), col: 'F' },
    { label: 'TOTAL PALETIZADO', val: toKilograms(totals.totalPalletizedKg100), col: 'H' },
    { label: 'PENDIENTE PALETIZAR', val: toKilograms(totals.totalDiffToPalletizeKg100), col: 'J' },
  ]

  kpis1.forEach((kpi) => {
    const nextCol = String.fromCharCode(kpi.col.charCodeAt(0) + 1)
    ws1.mergeCells(`${kpi.col}5:${nextCol}5`)
    ws1.mergeCells(`${kpi.col}6:${nextCol}6`)
    const lbl = ws1.getCell(`${kpi.col}5`)
    lbl.value = kpi.label
    lbl.font = { bold: true, size: 9, color: { argb: 'FF475569' } }
    lbl.alignment = { horizontal: 'center', vertical: 'middle' }
    lbl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }

    const val = ws1.getCell(`${kpi.col}6`)
    val.value = kpi.val
    val.numFmt = '#,##0'
    val.font = { bold: true, size: 14, color: { argb: 'FF0F172A' } }
    val.alignment = { horizontal: 'center', vertical: 'middle' }
    val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    applyThinBorder(lbl)
    applyThinBorder(val)
  })
  ws1.getRow(5).height = 18
  ws1.getRow(6).height = 24

  // Encabezados Tabla 1 (Fila 8)
  const headers1 = [
    'N°',
    'Descripción del Producto / Presentación',
    'Envasado (kg)',
    'Congelamiento (kg)',
    'Dif. Env. vs Cong. (kg)',
    'Videojet QR (kg)',
    'Dif. Cong. vs Videojet (kg)',
    'Paletizado (kg)',
    'Dif. por Paletizar (kg)',
    'N° Sacos',
    'Semáforo / Estado',
  ]
  const hRow1 = ws1.getRow(8)
  hRow1.height = 28
  headers1.forEach((h, idx) => {
    const cell = hRow1.getCell(idx + 1)
    cell.value = h
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2B48' } }
    cell.alignment = { horizontal: idx === 1 ? 'left' : 'center', vertical: 'middle', wrapText: true }
    applyThinBorder(cell)
  })

  // Filas de datos
  let rIdx = 9
  calculations.forEach((c, i) => {
    const row = ws1.getRow(rIdx)
    row.height = 20
    row.getCell(1).value = i + 1
    row.getCell(1).alignment = { horizontal: 'center' }

    row.getCell(2).value = c.row.productName
    row.getCell(2).alignment = { horizontal: 'left' }

    row.getCell(3).value = toKilograms(c.row.packingKg100)
    row.getCell(3).numFmt = '#,##0'

    row.getCell(4).value = toKilograms(c.row.freezingKg100)
    row.getCell(4).numFmt = '#,##0'

    // Fórmulas de diferencias
    row.getCell(5).value = { formula: `C${rIdx}-D${rIdx}`, result: toKilograms(c.diffPackingVsFreezingKg100) }
    row.getCell(5).numFmt = '#,##0'

    row.getCell(6).value = toKilograms(c.row.videojetQrKg100)
    row.getCell(6).numFmt = '#,##0'

    row.getCell(7).value = { formula: `D${rIdx}-F${rIdx}`, result: toKilograms(c.diffFreezingVsVideojetKg100) }
    row.getCell(7).numFmt = '#,##0'

    row.getCell(8).value = toKilograms(c.row.palletizedKg100)
    row.getCell(8).numFmt = '#,##0'

    const initialKg = toKilograms(c.row.initialCameraBalanceKg100 ?? kg100(0))
    const diffToPalletizeFormula =
      initialKg > 0
        ? `(C${rIdx}+${initialKg})-H${rIdx}`
        : `C${rIdx}-H${rIdx}`

    row.getCell(9).value = { formula: diffToPalletizeFormula, result: toKilograms(c.diffToPalletizeKg100) }
    row.getCell(9).numFmt = '#,##0'

    row.getCell(10).value = c.bagsCount
    row.getCell(10).numFmt = '#,##0'
    row.getCell(10).alignment = { horizontal: 'right' }

    const semCell = row.getCell(11)
    if (c.status === 'CUADRADO') {
      semCell.value = '🟢 Cuadrado'
      semCell.font = { color: { argb: 'FF065F46' }, bold: true }
    } else if (c.status === 'PENDIENTE') {
      semCell.value = '🟡 Pendiente'
      semCell.font = { color: { argb: 'FFB45309' }, bold: true }
    } else {
      semCell.value = '🔴 Descuadre'
      semCell.font = { color: { argb: 'FFB91C1C' }, bold: true }
    }
    semCell.alignment = { horizontal: 'center' }

    for (let col = 1; col <= 11; col++) {
      applyThinBorder(row.getCell(col))
      if (col >= 3 && col <= 9) {
        row.getCell(col).alignment = { horizontal: 'right', vertical: 'middle' }
      }
    }
    rIdx++
  })

  // Fila Total General
  const totalRow1 = ws1.getRow(rIdx)
  totalRow1.height = 24
  totalRow1.getCell(2).value = 'TOTAL GENERAL'
  totalRow1.getCell(2).font = { bold: true, size: 10 }

  totalRow1.getCell(3).value = { formula: `SUM(C9:C${rIdx - 1})`, result: toKilograms(totals.totalPackingKg100) }
  totalRow1.getCell(4).value = { formula: `SUM(D9:D${rIdx - 1})`, result: toKilograms(totals.totalFreezingKg100) }
  totalRow1.getCell(5).value = { formula: `C${rIdx}-D${rIdx}`, result: toKilograms(totals.totalDiffPackingVsFreezingKg100) }
  totalRow1.getCell(6).value = { formula: `SUM(F9:F${rIdx - 1})`, result: toKilograms(totals.totalVideojetQrKg100) }
  totalRow1.getCell(7).value = { formula: `D${rIdx}-F${rIdx}`, result: toKilograms(totals.totalDiffFreezingVsVideojetKg100) }
  totalRow1.getCell(8).value = { formula: `SUM(H9:H${rIdx - 1})`, result: toKilograms(totals.totalPalletizedKg100) }
  totalRow1.getCell(9).value = { formula: `SUM(I9:I${rIdx - 1})`, result: toKilograms(totals.totalDiffToPalletizeKg100) }
  totalRow1.getCell(10).value = { formula: `SUM(J9:J${rIdx - 1})`, result: totals.totalBagsCount }

  const totalSem1 = totalRow1.getCell(11)
  totalSem1.value = totals.overallStatus === 'CUADRADO' ? '🟢 Cuadrado' : totals.overallStatus === 'PENDIENTE' ? '🟡 Pendiente' : '🔴 Descuadre'
  totalSem1.alignment = { horizontal: 'center' }

  for (let col = 1; col <= 11; col++) {
    const c = totalRow1.getCell(col)
    c.font = { bold: true, size: 10 }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    applyThinBorder(c)
    if (col >= 3 && col <= 10) {
      c.numFmt = '#,##0'
      c.alignment = { horizontal: 'right', vertical: 'middle' }
    }
  }

  // Notas al pie
  rIdx += 2
  ws1.getCell(`B${rIdx}`).value = '* Criterios de Cuadre y Semáforo Operativo:'
  ws1.getCell(`B${rIdx}`).font = { bold: true, size: 9, color: { argb: 'FF334155' } }
  rIdx++
  const notes1 = [
    '• Dif. Env. vs Cong. (kg) = Envasado − Congelamiento  (Control de balance de masa y mermas en túneles de frío).',
    '• Dif. Cong. vs Videojet (kg) = Congelamiento − Videojet QR  (Control de trazabilidad de rotulado por código QR).',
    '• Dif. por Paletizar (kg) = Envasado − Paletizado  (Volumen físico que permanece en cámara esperando completar pallet).',
    '• Semáforo de Control Rápido (Basado en Envasado vs Congelado y Paletizado):',
    '    🟢 Cuadrado : Proceso 100% conciliado (Diferencias = 0 kg, sin saldos pendientes).',
    '    🔴 Descuadre : Alerta operativa. Existe faltante/sobrante entre envasado y congelado, o sobregiro en paletizado (< 0 kg).',
    '    🟡 Pendiente : Proceso cuadrado en túneles (Dif. = 0 kg), con saldo normal en cámara a la espera de completar pallet.',
  ]
  notes1.forEach((note) => {
    ws1.getCell(`B${rIdx}`).value = note
    ws1.getCell(`B${rIdx}`).font = { size: 8.5, color: { argb: 'FF64748B' } }
    rIdx++
  })

  // -------------------------------------------------------------
  // HOJA 2: AUDITORÍA Y SALDOS DE CÁMARA (TABLA 2)
  // -------------------------------------------------------------
  const colWidths2 = [5, 45, 14, 16, 17, 16, 16, 18, 15, 15, 17, 18, 17, 18, 16]
  const ws2 = setupWorksheet(
    workbook,
    'Conciliación de Cámara',
    colWidths2,
    'Auditoría y Conciliación Física de Cámara',
  )

  ws2.mergeCells('B2:O2')
  const titleCell2 = ws2.getCell('B2')
  titleCell2.value = 'CONTROL DE ENVASADO, CONGELAMIENTO, VIDEOJET Y PALETIZADO'
  titleCell2.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF071B2E' } }
  titleCell2.alignment = { horizontal: 'center', vertical: 'middle' }
  ws2.getRow(2).height = 26

  ws2.mergeCells('B3:O3')
  const subCell2 = ws2.getCell('B3')
  subCell2.value = 'Sistema de Control Operativo, Trazabilidad QR y Conciliación de Saldos'
  subCell2.font = { italic: true, size: 10, color: { argb: 'FF8BA7BE' } }
  subCell2.alignment = { horizontal: 'center', vertical: 'middle' }
  ws2.getRow(3).height = 18

  // KPIs Cabecera Hoja 2
  const kpis2 = [
    { label: 'TOTAL ENVASADO', val: toKilograms(totals.totalPackingKg100), col: 'B' },
    { label: 'TOTAL CONGELADO', val: toKilograms(totals.totalFreezingKg100), col: 'E' },
    { label: 'TOTAL VIDEOJET QR', val: toKilograms(totals.totalVideojetQrKg100), col: 'H' },
    { label: 'TOTAL PALETIZADO', val: toKilograms(totals.totalPalletizedKg100), col: 'K' },
    { label: 'SALDO TOTAL EN CÁMARA', val: toKilograms(totals.totalCameraBalanceKg100), col: 'N' },
  ]
  kpis2.forEach((kpi) => {
    const nextCol = String.fromCharCode(kpi.col.charCodeAt(0) + 1)
    ws2.mergeCells(`${kpi.col}5:${nextCol}5`)
    ws2.mergeCells(`${kpi.col}6:${nextCol}6`)
    const lbl = ws2.getCell(`${kpi.col}5`)
    lbl.value = kpi.label
    lbl.font = { bold: true, size: 9, color: { argb: 'FF475569' } }
    lbl.alignment = { horizontal: 'center', vertical: 'middle' }
    lbl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }

    const val = ws2.getCell(`${kpi.col}6`)
    val.value = kpi.val
    val.numFmt = '#,##0'
    val.font = { bold: true, size: 14, color: { argb: 'FF0F172A' } }
    val.alignment = { horizontal: 'center', vertical: 'middle' }
    val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    applyThinBorder(lbl)
    applyThinBorder(val)
  })
  ws2.getRow(5).height = 18
  ws2.getRow(6).height = 24

  // Encabezados Tabla 2 (Fila 8)
  const headers2 = [
    'N°',
    'Descripción del Producto / Presentación',
    'Envasado (kg)',
    'Congelamiento (kg)',
    'Dif. Env. vs Cong. (kg)',
    'Videojet (Sacos QR)',
    'Videojet QR (kg)',
    'Saldo Block sin QR (kg)',
    'Dif. Videojet (kg)',
    'Paletizado (kg)',
    'Saldo Inicial Block (kg)',
    'Dif. Física Paletizar (kg)',
    'Sacos Paletizados (Und)',
    'Saldo Final en Cámara (kg)',
    'Semáforo / Cuadre',
  ]
  const hRow2 = ws2.getRow(8)
  hRow2.height = 30
  headers2.forEach((h, idx) => {
    const cell = hRow2.getCell(idx + 1)
    cell.value = h
    cell.font = { bold: true, size: 8.5, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2B48' } }
    cell.alignment = { horizontal: idx === 1 ? 'left' : 'center', vertical: 'middle', wrapText: true }
    applyThinBorder(cell)
  })

  // Filas Tabla 2
  let rIdx2 = 9
  calculations.forEach((c, i) => {
    const row = ws2.getRow(rIdx2)
    row.height = 20
    row.getCell(1).value = i + 1
    row.getCell(1).alignment = { horizontal: 'center' }

    row.getCell(2).value = c.row.productName
    row.getCell(2).alignment = { horizontal: 'left' }

    row.getCell(3).value = toKilograms(c.row.packingKg100)
    row.getCell(3).numFmt = '#,##0'

    row.getCell(4).value = toKilograms(c.row.freezingKg100)
    row.getCell(4).numFmt = '#,##0'

    row.getCell(5).value = { formula: `C${rIdx2}-D${rIdx2}`, result: toKilograms(c.diffPackingVsFreezingKg100) }
    row.getCell(5).numFmt = '#,##0'

    row.getCell(6).value = c.row.videojetBagsCount ?? Math.floor(toKilograms(c.row.videojetQrKg100) / 20)
    row.getCell(6).numFmt = '#,##0'

    row.getCell(7).value = toKilograms(c.row.videojetQrKg100)
    row.getCell(7).numFmt = '#,##0'

    row.getCell(8).value = toKilograms(c.row.looseBlockWithoutQrKg100 ?? kg100(0))
    row.getCell(8).numFmt = '#,##0'

    row.getCell(9).value = { formula: `(D${rIdx2}+K${rIdx2})-G${rIdx2}-H${rIdx2}`, result: toKilograms(c.diffFreezingVsVideojetKg100) }
    row.getCell(9).numFmt = '#,##0'

    row.getCell(10).value = toKilograms(c.row.palletizedKg100)
    row.getCell(10).numFmt = '#,##0'

    row.getCell(11).value = toKilograms(c.row.initialCameraBalanceKg100 ?? kg100(0))
    row.getCell(11).numFmt = '#,##0'

    row.getCell(12).value = { formula: `(D${rIdx2}+K${rIdx2})-(J${rIdx2}+N${rIdx2})`, result: toKilograms(c.diffPhysicalPalletizeKg100) }
    row.getCell(12).numFmt = '#,##0'

    row.getCell(13).value = c.bagsCount
    row.getCell(13).numFmt = '#,##0.0'

    row.getCell(14).value = toKilograms(c.row.finalCameraBalanceKg100 ?? kg100(0))
    row.getCell(14).numFmt = '#,##0'

    const semCell = row.getCell(15)
    semCell.value = c.status === 'CUADRADO' ? '🟢 Cuadrado' : c.status === 'PENDIENTE' ? '🟡 Pendiente' : '🔴 Descuadre'
    semCell.font = { bold: true, color: { argb: c.status === 'CUADRADO' ? 'FF065F46' : c.status === 'PENDIENTE' ? 'FFB45309' : 'FFB91C1C' } }
    semCell.alignment = { horizontal: 'center' }

    for (let col = 1; col <= 15; col++) {
      applyThinBorder(row.getCell(col))
      if (col >= 3 && col <= 14) {
        row.getCell(col).alignment = { horizontal: 'right', vertical: 'middle' }
      }
    }
    rIdx2++
  })

  // Total General Tabla 2
  const totalRow2 = ws2.getRow(rIdx2)
  totalRow2.height = 24
  totalRow2.getCell(2).value = 'TOTAL GENERAL'
  totalRow2.getCell(2).font = { bold: true, size: 9.5 }

  totalRow2.getCell(3).value = { formula: `SUM(C9:C${rIdx2 - 1})`, result: toKilograms(totals.totalPackingKg100) }
  totalRow2.getCell(4).value = { formula: `SUM(D9:D${rIdx2 - 1})`, result: toKilograms(totals.totalFreezingKg100) }
  totalRow2.getCell(5).value = { formula: `C${rIdx2}-D${rIdx2}`, result: toKilograms(totals.totalDiffPackingVsFreezingKg100) }
  totalRow2.getCell(6).value = { formula: `SUM(F9:F${rIdx2 - 1})` }
  totalRow2.getCell(7).value = { formula: `SUM(G9:G${rIdx2 - 1})`, result: toKilograms(totals.totalVideojetQrKg100) }
  totalRow2.getCell(8).value = { formula: `SUM(H9:H${rIdx2 - 1})` }
  totalRow2.getCell(9).value = { formula: `(D${rIdx2}+K${rIdx2})-G${rIdx2}-H${rIdx2}`, result: toKilograms(totals.totalDiffFreezingVsVideojetKg100) }
  totalRow2.getCell(10).value = { formula: `SUM(J9:J${rIdx2 - 1})`, result: toKilograms(totals.totalPalletizedKg100) }
  totalRow2.getCell(11).value = { formula: `SUM(K9:K${rIdx2 - 1})` }
  totalRow2.getCell(12).value = { formula: `(D${rIdx2}+K${rIdx2})-(J${rIdx2}+N${rIdx2})` }
  totalRow2.getCell(13).value = { formula: `SUM(M9:M${rIdx2 - 1})`, result: totals.totalBagsCount }
  totalRow2.getCell(14).value = { formula: `SUM(N9:N${rIdx2 - 1})`, result: toKilograms(totals.totalCameraBalanceKg100) }

  const totalSem2 = totalRow2.getCell(15)
  totalSem2.value = totals.overallStatus === 'CUADRADO' ? '🟢 Cuadrado' : totals.overallStatus === 'PENDIENTE' ? '🟡 Pendiente' : '🔴 Descuadre'
  totalSem2.alignment = { horizontal: 'center' }

  for (let col = 1; col <= 15; col++) {
    const c = totalRow2.getCell(col)
    c.font = { bold: true, size: 9.5 }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    applyThinBorder(c)
    if (col >= 3 && col <= 14) {
      c.numFmt = '#,##0'
      c.alignment = { horizontal: 'right', vertical: 'middle' }
    }
  }

  // Notas al pie Tabla 2
  rIdx2 += 2
  ws2.getCell(`B${rIdx2}`).value = '* Criterios de Conciliación y Auditoría Operativa:'
  ws2.getCell(`B${rIdx2}`).font = { bold: true, size: 9, color: { argb: 'FF334155' } }
  rIdx2++
  const notes2 = [
    '• Presentación y Pesajes: Envasado y congelamiento operan en blocks de 10 kg. Videojet y Paletizado operan por sacos de 20 kg (2 blocks por saco).',
    '• Saldo Inicial y Arrastre: Los blocks sueltos (10 kg) del turno anterior se integran a la producción del turno actual para completar sacos de 20 kg (ej. Manto Estándar: 10 kg hoy + 10 kg anterior = 20 kg paletizados).',
    '• Dif. Videojet (kg) = (Congelamiento + Saldo Inicial) − Videojet QR kg − Saldo Block sin QR = 0 kg.',
    '• Dif. Física Paletizar (kg) = (Congelamiento + Saldo Inicial) − (Paletizado + Saldo Final en Cámara) = 0 kg (conciliación exacta al descontar el stock físico en cámara).',
    '• Semáforo de Cuadre Conciliado:',
    '    🟢 Cuadrado : Proceso 100% conciliado en frío, rotulado Videojet y estiba de cámara. No existe merma ni faltante.',
    '    🔴 Descuadre : Alerta operativa. Existe merma física en túneles (F ≠ 0), desfase en QR (J ≠ 0) o diferencia física no justificada en cámara (M ≠ 0).',
    '    🟡 Pendiente : Diferencia física de paletizado pendiente de justificar o ingresar como saldo de cámara.',
  ]
  notes2.forEach((note) => {
    ws2.getCell(`B${rIdx2}`).value = note
    ws2.getCell(`B${rIdx2}`).font = { size: 8.5, color: { argb: 'FF64748B' } }
    rIdx2++
  })

  return workbook
}

export async function downloadPalletizingReconciliationWorkbook(
  input: BuildPalletizingWorkbookInput,
  filename = 'Control_Envasado_Congelamiento_Videojet_Paletizado.xlsx',
): Promise<void> {
  const workbook = buildPalletizingReconciliationWorkbook(input)
  await downloadWorkbook(workbook, filename)
}
