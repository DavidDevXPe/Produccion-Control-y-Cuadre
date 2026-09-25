import { Workbook, type Worksheet } from 'exceljs'
import { formatIsoDate } from '../../../utils/formatters'
import { toKilograms } from '../model/calculations'
import {
  calculateFreezingAvailability,
  calculateFreezingComparison,
  type FreezingComparisonRow,
} from '../model/freezing'
import type { Kg100, ProductionDay, WeeklySummaryPeriod } from '../model/types'
import {
  explainFreezingAvailabilityByOrigin,
  type FreezingOriginState,
} from '../presentation/freezingAvailabilityExplanation'
import { describeFreezingReviewReasons } from '../presentation/freezingComparisonReasons'
import {
  COLORS,
  KG_FORMAT,
  downloadWorkbook,
  setupWorksheet,
  writeDataRow,
  writeMetric,
  writeSectionTitle,
  writeTableHeader,
  writeTitle,
  writeTotalsRow,
} from './workbookStyles'

export const COMPARISON_SUMMARY_SHEET = 'Resumen'
export const COMPARISON_FAMILY_SHEET = 'Por familia'
export const COMPARISON_PRODUCT_SHEET = 'Por producto'
export const COMPARISON_ORIGIN_SHEET = 'Por jornada de origen'

export interface WeeklyComparisonWorkbookInput {
  readonly weekNumber: number
  readonly period: WeeklySummaryPeriod
  readonly productionDays: readonly ProductionDay[]
  readonly packingClosed: boolean
  readonly freezingClosed: boolean
}

const kg = (value: Kg100) => toKilograms(value)

const originStateLabels: Record<FreezingOriginState, string> = {
  COMPLETE: 'CONGELADO 100%',
  PENDING: 'PENDIENTE DE CONGELAR',
  EXCESS: 'EXCESO · REVISAR',
}

function periodLabel(input: WeeklyComparisonWorkbookInput) {
  return `Semana ${input.weekNumber} · ${formatIsoDate(input.period.startDate)} al ${formatIsoDate(input.period.endDate)}`
}

function writeComparisonTable(
  workbook: Workbook,
  sheetName: string,
  labelHeader: string,
  rows: readonly FreezingComparisonRow[],
  input: WeeklyComparisonWorkbookInput,
) {
  const worksheet = setupWorksheet(
    workbook,
    sheetName,
    [labelHeader === 'Producto' ? 64 : 34, 18, 18, 18, 18, 18],
    `Comparativo ${sheetName.toLowerCase()}`,
  )
  writeTitle(worksheet, 6, `ENVASADO VS CONGELAMIENTO · ${sheetName.toUpperCase()}`, periodLabel(input))
  const note = worksheet.getCell(4, 1)
  note.value = 'Envasado = Congelado atribuible + Pendiente + Diferencia no explicada.'
  note.font = { italic: true, size: 9, color: { argb: COLORS.slate } }

  writeTableHeader(worksheet, 5, [
    labelHeader,
    'Envasado',
    'Congelado atribuible',
    'Pendiente',
    'Diferencia no explicada',
    'Exceso vinculado',
  ])
  rows.forEach((row, index) => {
    const current = 6 + index
    const written = writeDataRow(
      worksheet,
      current,
      [
        row.label,
        kg(row.packedKg100),
        kg(row.frozenKg100),
        kg(row.pendingKg100),
        kg(row.unexplainedDifferenceKg100),
        kg(row.linkageExcessKg100),
      ],
      { zebra: index % 2 === 1 },
    )
    written.getCell(5).font = {
      bold: true,
      color: { argb: row.unexplainedDifferenceKg100 === 0 ? COLORS.green : COLORS.red },
    }
    if (row.linkageExcessKg100 !== 0) {
      written.getCell(6).font = { bold: true, color: { argb: COLORS.red } }
    }
  })
  const last = 5 + rows.length
  writeTotalsRow(worksheet, last + 1, 6, last, 2, 6)
  worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 5, activeCell: 'B6' }]
  if (rows.length > 0) {
    worksheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: last, column: 6 } }
  }
}

function writeOriginSheet(
  workbook: Workbook,
  input: WeeklyComparisonWorkbookInput,
) {
  const positions = calculateFreezingAvailability(input.productionDays).filter(
    (position) =>
      position.originDate >= input.period.startDate &&
      position.originDate <= input.period.endDate,
  )
  const origins = explainFreezingAvailabilityByOrigin(positions, input.productionDays)
  const worksheet = setupWorksheet(
    workbook,
    COMPARISON_ORIGIN_SHEET,
    [36, 17, 17, 17, 18, 16, 16, 17, 17, 14, 26],
    'Por jornada de origen',
  )
  writeTitle(worksheet, 11, 'CUADRE POR JORNADA DE ENVASADO', periodLabel(input))
  const note = worksheet.getCell(4, 1)
  note.value =
    'Disponible = Día propio + Noche propio + Saldo al cierre. El saldo recibido de otra jornada se cuenta solo en su jornada de origen.'
  note.font = { italic: true, size: 9, color: { argb: COLORS.slate } }

  writeTableHeader(worksheet, 5, [
    'Jornada de Envasado',
    'Envasado propio Día',
    'Envasado propio Noche',
    'Saldo al cierre',
    'Disponible para congelar',
    'Congelado Día',
    'Congelado Noche',
    'Congelado total',
    'Pendiente',
    'Exceso',
    'Estado',
  ])
  origins.forEach((origin, index) => {
    const current = 6 + index
    const row = writeDataRow(
      worksheet,
      current,
      [
        formatIsoDate(origin.originDate),
        kg(origin.ownDayKg100),
        kg(origin.ownNightKg100),
        kg(origin.closingBalanceKg100),
        { formula: `B${current}+C${current}+D${current}`, result: kg(origin.availableKg100) },
        kg(origin.frozenDayKg100),
        kg(origin.frozenNightKg100),
        { formula: `F${current}+G${current}`, result: kg(origin.frozenKg100) },
        kg(origin.pendingKg100),
        kg(origin.excessKg100),
        originStateLabels[origin.state],
      ],
      { zebra: index % 2 === 1 },
    )
    const state = row.getCell(11)
    state.numFmt = '@'
    state.alignment = { horizontal: 'center', vertical: 'middle' }
    state.font = {
      bold: true,
      color: {
        argb:
          origin.state === 'EXCESS'
            ? COLORS.red
            : origin.state === 'PENDING'
              ? COLORS.amber
              : COLORS.green,
      },
    }
    row.getCell(5).font = { bold: true, color: { argb: COLORS.navy } }
  })
  const last = 5 + origins.length
  writeTotalsRow(worksheet, last + 1, 6, last, 2, 10)
  worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 5, activeCell: 'B6' }]
}

function writeSummary(
  worksheet: Worksheet,
  input: WeeklyComparisonWorkbookInput,
) {
  const comparison = calculateFreezingComparison(input.productionDays, input.period)
  const reasons = describeFreezingReviewReasons(comparison)
  const balanced = comparison.status === 'BALANCED'
  const cycleClosed = input.packingClosed && input.freezingClosed && balanced

  writeTitle(worksheet, 3, 'TRABUNDA · ENVASADO VS CONGELAMIENTO', periodLabel(input))

  writeSectionTitle(worksheet, 5, 3, 'ESTADO')
  writeMetric(
    worksheet,
    6,
    1,
    'Estado del comparativo',
    cycleClosed ? 'CICLO CERRADO' : balanced ? 'CONCILIADO' : 'REVISAR',
    { tone: balanced ? 'success' : 'danger' },
  )
  writeMetric(worksheet, 7, 1, 'Envasado', input.packingClosed ? 'CERRADO' : 'ABIERTO', {
    tone: input.packingClosed ? 'success' : 'warning',
  })
  writeMetric(worksheet, 8, 1, 'Congelamiento', input.freezingClosed ? 'CERRADO' : 'ABIERTO', {
    tone: input.freezingClosed ? 'success' : 'warning',
  })

  writeSectionTitle(worksheet, 10, 3, 'CUADRE POR ORIGEN PRODUCTIVO')
  writeMetric(worksheet, 11, 1, 'Envasado de la semana (disponible)', kg(comparison.packedKg100), {
    format: KG_FORMAT,
    hint: 'Día propio + Noche propio + Saldo al cierre de cada jornada.',
  })
  writeMetric(worksheet, 12, 1, '− Congelado atribuible', kg(comparison.frozenKg100), {
    format: KG_FORMAT,
    hint: 'Congelado vinculado a esas jornadas de origen (FIFO).',
  })
  writeMetric(worksheet, 13, 1, '− Pendiente de congelar', kg(comparison.pendingKg100), {
    format: KG_FORMAT,
    tone: comparison.pendingKg100 > 0 ? 'warning' : 'success',
    hint: 'Sigue perteneciendo a su jornada; se congela después.',
  })
  writeMetric(worksheet, 14, 1, '− Congelado físico sin origen', kg(comparison.unlinkedPhysicalKg100), {
    format: KG_FORMAT,
    hint: 'Reportado en Congelamiento sin Envasado vinculado.',
  })
  writeMetric(
    worksheet,
    15,
    1,
    '= Diferencia no explicada',
    { formula: 'B11-B12-B13-B14', result: kg(comparison.unexplainedDifferenceKg100) },
    {
      format: KG_FORMAT,
      tone: comparison.unexplainedDifferenceKg100 === 0 ? 'success' : 'danger',
      hint: 'Debe ser 0.',
    },
  )

  writeSectionTitle(worksheet, 17, 3, 'CONCILIACIÓN FÍSICA DE CONGELAMIENTO')
  writeMetric(worksheet, 18, 1, 'Congelado físico reportado', kg(comparison.physicalReportedKg100), { format: KG_FORMAT })
  writeMetric(worksheet, 19, 1, 'Vinculado a Envasado', kg(comparison.linkedKg100), { format: KG_FORMAT })
  writeMetric(worksheet, 20, 1, 'Exceso de vinculación', kg(comparison.linkageExcessKg100), {
    format: KG_FORMAT,
    tone: comparison.linkageExcessKg100 > 0 ? 'danger' : 'success',
    hint: 'Vinculado por encima de lo reportado físicamente.',
  })
  writeMetric(worksheet, 21, 1, 'Consumido por encima del origen', kg(comparison.originExcessKg100), {
    format: KG_FORMAT,
    tone: comparison.originExcessKg100 > 0 ? 'danger' : 'success',
  })

  let row = 23
  writeSectionTitle(worksheet, row, 3, 'MOTIVOS DE REVISIÓN')
  row += 1
  if (reasons.length === 0) {
    writeMetric(worksheet, row, 1, 'Sin motivos de revisión', 'El comparativo está conciliado.', {
      tone: 'success',
    })
    row += 1
  } else {
    for (const reason of reasons) {
      writeMetric(worksheet, row, 1, reason.title, reason.message, { tone: 'danger' })
      const cell = worksheet.getCell(row, 2)
      cell.alignment = { wrapText: true, vertical: 'middle', indent: 1 }
      worksheet.mergeCells(row, 2, row, 3)
      worksheet.getRow(row).height = 34
      row += 1
    }
  }
  worksheet.pageSetup.printArea = `A1:C${row}`
}

export function buildWeeklyComparisonWorkbook(
  input: WeeklyComparisonWorkbookInput,
): Workbook {
  const workbook = new Workbook()
  workbook.creator = 'TRABUNDA Producción'
  workbook.company = 'TRABUNDA Procesos Marinos'
  workbook.created = new Date()
  workbook.modified = new Date()
  // Excel recalculates every formula when the file is opened.
  workbook.calcProperties.fullCalcOnLoad = true

  const summary = setupWorksheet(workbook, COMPARISON_SUMMARY_SHEET, [40, 22, 56], 'Comparativo semanal')
  writeSummary(summary, input)

  const comparison = calculateFreezingComparison(input.productionDays, input.period)
  writeComparisonTable(workbook, COMPARISON_FAMILY_SHEET, 'Familia', comparison.byFamily, input)
  writeComparisonTable(workbook, COMPARISON_PRODUCT_SHEET, 'Producto', comparison.byProduct, input)
  writeOriginSheet(workbook, input)

  return workbook
}

export async function exportWeeklyComparisonWorkbook(
  input: WeeklyComparisonWorkbookInput,
): Promise<void> {
  const workbook = buildWeeklyComparisonWorkbook(input)
  await downloadWorkbook(
    workbook,
    `TRABUNDA_Comparativo_Semana_${input.weekNumber}.xlsx`,
  )
}
