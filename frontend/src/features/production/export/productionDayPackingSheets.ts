import type { Workbook } from 'exceljs'
import { kg100, sumKg100 } from '../model/calculations'
import type {
  Kg100,
  ProductionDay,
  ProductionDayCalculation,
  ProductReconciliation,
} from '../model/types'
import {
  DETAIL_SHEET,
  SUMMARY_SHEET,
  kg,
  statusLabel,
  subtitle,
  writeObservations,
} from './productionDayWorkbookShared'
import {
  COLORS,
  KG_FORMAT,
  PERCENT_FORMAT,
  setupWorksheet,
  writeDataRow,
  writeMetric,
  writeSectionTitle,
  writeTableHeader,
  writeTitle,
  writeTotalsRow,
} from './workbookStyles'

export interface DetailColumn {
  readonly key: string
  readonly header: string
  readonly width: number
  readonly value: (product: ProductReconciliation) => number
}

export function buildDetailColumns(
  calculation: ProductionDayCalculation,
): readonly DetailColumn[] {
  const products = calculation.products
  const hasAdjustments = products.some(
    (product) =>
      product.day.adjustmentKg100 !== 0 || product.night.adjustmentKg100 !== 0,
  )
  const hasTunnel = products.some(
    (product) =>
      product.tunnel.DAY.ownProductionKg100 !== 0 ||
      product.tunnel.NIGHT.ownProductionKg100 !== 0,
  )

  return [
    {
      key: 'dayReported',
      header: 'Día reportado',
      width: 15,
      value: (p) => kg(p.day.reportedKg100),
    },
    {
      key: 'dayBalance',
      header: 'Saldo anterior procesado Día',
      width: 16,
      value: (p) => kg(p.day.previousBalanceProcessedKg100),
    },
    ...(hasAdjustments
      ? [
          {
            key: 'dayAdjustment',
            header: 'Ajuste Día',
            width: 13,
            value: (p: ProductReconciliation) => kg(p.day.adjustmentKg100),
          },
        ]
      : []),
    {
      key: 'dayOwn',
      header: 'Día propio',
      width: 15,
      value: (p) => kg(p.day.ownProductionKg100),
    },
    {
      key: 'nightReported',
      header: 'Noche reportado',
      width: 15,
      value: (p) => kg(p.night.reportedKg100),
    },
    {
      key: 'nightBalance',
      header: 'Saldo anterior procesado Noche',
      width: 16,
      value: (p) => kg(p.night.previousBalanceProcessedKg100),
    },
    ...(hasAdjustments
      ? [
          {
            key: 'nightAdjustment',
            header: 'Ajuste Noche',
            width: 13,
            value: (p: ProductReconciliation) => kg(p.night.adjustmentKg100),
          },
        ]
      : []),
    {
      key: 'nightOwn',
      header: 'Noche propio',
      width: 15,
      value: (p) => kg(p.night.ownProductionKg100),
    },
    ...(hasTunnel
      ? [
          {
            key: 'tunnel',
            header: 'Túnel',
            width: 13,
            value: (p: ProductReconciliation) =>
              kg(
                sumKg100([
                  p.tunnel.DAY.ownProductionKg100,
                  p.tunnel.NIGHT.ownProductionKg100,
                ]),
              ),
          },
        ]
      : []),
    {
      key: 'treatment',
      header: 'Tratamiento',
      width: 14,
      value: (p) => kg(p.treatmentKg100),
    },
    {
      key: 'closing',
      header: 'Saldo final (queda en esta jornada)',
      width: 17,
      value: (p) => kg(p.newClosingBalanceKg100),
    },
    {
      key: 'expected',
      header: 'Producto terminado esperado',
      width: 17,
      value: (p) => kg(p.expectedFinishedKg100),
    },
    {
      key: 'declared',
      header: 'Producto terminado declarado',
      width: 17,
      value: (p) => kg(p.declaredFinishedKg100),
    },
    {
      key: 'difference',
      header: 'Diferencia',
      width: 14,
      value: (p) => kg(p.differenceKg100),
    },
  ]
}

export function writePackingDetail(
  workbook: Workbook,
  calculation: ProductionDayCalculation,
  productionDay: ProductionDay,
) {
  const columns = buildDetailColumns(calculation)
  const lastColumn = columns.length + 2
  const worksheet = setupWorksheet(
    workbook,
    DETAIL_SHEET,
    [22, 60, ...columns.map((column) => column.width)],
    'Detalle por producto',
  )
  writeTitle(
    worksheet,
    lastColumn,
    'TRABUNDA · DETALLE POR PRODUCTO',
    subtitle(productionDay, 'Envasado'),
  )

  const headerRowNumber = 5
  writeTableHeader(worksheet, headerRowNumber, [
    'Familia',
    'Producto',
    ...columns.map((column) => column.header),
  ])

  const letterOf = (key: string) =>
    worksheet.getColumn(columns.findIndex((column) => column.key === key) + 3)
      .letter
  const has = (key: string) => columns.some((column) => column.key === key)
  const firstDataRow = headerRowNumber + 1
  let previousFamily = ''
  let shaded = false

  calculation.products.forEach((product, index) => {
    const rowNumber = firstDataRow + index
    if (product.familyName !== previousFamily) {
      shaded = !shaded
      previousFamily = product.familyName
    }
    const values: unknown[] = [
      product.familyName,
      product.productName,
      ...columns.map((column) => column.value(product)),
    ]
    const cell = (key: string) => `${letterOf(key)}${rowNumber}`
    const setFormula = (key: string, formula: string) => {
      const position = columns.findIndex((column) => column.key === key) + 2
      values[position] = { formula, result: values[position] }
    }
    const adjustment = (shift: 'day' | 'night') =>
      has(`${shift}Adjustment`) ? `+${cell(`${shift}Adjustment`)}` : ''

    setFormula(
      'dayOwn',
      `${cell('dayReported')}${adjustment('day')}-${cell('dayBalance')}`,
    )
    setFormula(
      'nightOwn',
      `${cell('nightReported')}${adjustment('night')}-${cell('nightBalance')}`,
    )
    setFormula(
      'expected',
      [
        cell('dayOwn'),
        cell('nightOwn'),
        ...(has('tunnel') ? [cell('tunnel')] : []),
        cell('treatment'),
        cell('closing'),
      ].join('+'),
    )
    setFormula('difference', `${cell('expected')}-${cell('declared')}`)

    const row = writeDataRow(worksheet, rowNumber, values, {
      textColumns: 2,
      zebra: shaded,
    })
    const differenceCell = row.getCell(lastColumn)
    differenceCell.font = {
      bold: true,
      color: {
        argb: product.differenceKg100 === 0 ? COLORS.green : COLORS.red,
      },
    }
    for (const key of ['dayOwn', 'nightOwn', 'expected']) {
      row.getCell(columns.findIndex((column) => column.key === key) + 3).font = {
        bold: true,
        color: { argb: COLORS.navy },
      }
    }
  })

  const lastDataRow = firstDataRow + calculation.products.length - 1
  writeTotalsRow(
    worksheet,
    lastDataRow + 1,
    firstDataRow,
    lastDataRow,
    3,
    lastColumn,
    'TOTAL',
    2,
  )

  worksheet.views = [
    { state: 'frozen', xSplit: 2, ySplit: headerRowNumber, activeCell: 'C6' },
  ]
  worksheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: lastDataRow, column: lastColumn },
  }
  worksheet.pageSetup.printTitlesRow = `${headerRowNumber}:${headerRowNumber}`
}

export function writePackingSummary(
  workbook: Workbook,
  calculation: ProductionDayCalculation,
  productionDay: ProductionDay,
) {
  const lastColumn = 7
  const worksheet = setupWorksheet(
    workbook,
    SUMMARY_SHEET,
    [38, 20, 18, 18, 18, 20, 14],
    'Jornada cerrada y cuadrada',
  )
  writeTitle(
    worksheet,
    lastColumn,
    'TRABUNDA · PARTE DE PRODUCCIÓN',
    subtitle(productionDay, 'Envasado'),
  )

  // --- Key indicators -------------------------------------------------------
  writeSectionTitle(worksheet, 5, lastColumn, 'INDICADORES CLAVE')
  const observed = (productionDay.closureObservations?.length ?? 0) > 0
  const yieldRatio = calculation.performance.ratio
  writeMetric(worksheet, 6, 1, 'Estado de la jornada', statusLabel(productionDay), {
    tone: observed ? 'warning' : 'success',
  })
  writeMetric(
    worksheet,
    7,
    1,
    'Materia prima',
    kg(productionDay.declaredRawMaterialKg100),
    { format: KG_FORMAT },
  )
  writeMetric(
    worksheet,
    8,
    1,
    'Producto terminado',
    kg(calculation.declaredFinishedKg100),
    { format: KG_FORMAT },
  )
  writeMetric(
    worksheet,
    9,
    1,
    'Aprovechamiento general',
    yieldRatio ?? 'No disponible',
    {
      ...(yieldRatio === null ? {} : { format: PERCENT_FORMAT }),
      tone:
        yieldRatio === null
          ? 'neutral'
          : calculation.performance.status === 'BELOW_REFERENCE'
            ? 'warning'
            : 'success',
      hint: 'Producto terminado ÷ materia prima. Referencia: 80%.',
    },
  )
  writeMetric(
    worksheet,
    10,
    1,
    'Diferencia de cuadre',
    kg(calculation.differenceKg100),
    {
      format: KG_FORMAT,
      tone: calculation.differenceKg100 === 0 ? 'success' : 'danger',
      hint: 'Esperado − declarado. Debe ser 0.',
    },
  )
  writeMetric(
    worksheet,
    11,
    1,
    'Saldo recibido de jornadas anteriores',
    kg(calculation.receivedPreviousBalanceKg100),
    {
      format: KG_FORMAT,
      hint: `Procesado: ${kg(
        calculation.processedPreviousBalanceKg100,
      ).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
      })} kg · Pendiente: ${kg(
        calculation.pendingPreviousBalanceKg100,
      ).toLocaleString('es-PE', { minimumFractionDigits: 2 })} kg`,
    },
  )
  writeMetric(
    worksheet,
    12,
    1,
    'Saldo final generado',
    kg(calculation.newClosingBalanceKg100),
    {
      format: KG_FORMAT,
      hint: 'Queda pendiente y pertenece a esta jornada.',
    },
  )

  // --- Reconciliation, step by step ------------------------------------------
  writeSectionTitle(worksheet, 14, lastColumn, 'CUADRE DE LA JORNADA')
  const dayOwn = calculation.day.ownProductionKg100
  const nightOwn = calculation.night.ownProductionKg100
  const tunnel = calculation.tunnel.totalKg100
  const steps: [string, Kg100, string][] = [
    [
      'Producción propia Turno Día',
      dayOwn,
      'Reportado − saldo anterior procesado ± ajustes',
    ],
    [
      '+ Producción propia Turno Noche',
      nightOwn,
      'Reportado − saldo anterior procesado ± ajustes',
    ],
    ...(tunnel !== 0
      ? ([['+ Túnel', tunnel, 'Producción adicional del túnel']] as [
          string,
          Kg100,
          string,
        ][])
      : []),
    ['+ Tratamiento', calculation.treatmentKg100, ''],
    [
      '+ Saldo final generado',
      calculation.newClosingBalanceKg100,
      'Pertenece a esta jornada',
    ],
  ]
  let rowNumber = 15
  steps.forEach(([label, value, hint]) => {
    writeMetric(worksheet, rowNumber, 1, label, kg(value), {
      format: KG_FORMAT,
      hint,
    })
    rowNumber += 1
  })
  const firstStep = 15
  const lastStep = rowNumber - 1
  writeMetric(
    worksheet,
    rowNumber,
    1,
    '= Producto terminado esperado',
    {
      formula: `SUM(B${firstStep}:B${lastStep})`,
      result: kg(calculation.expectedFinishedKg100),
    },
    { format: KG_FORMAT },
  )
  const expectedRow = rowNumber
  writeMetric(
    worksheet,
    rowNumber + 1,
    1,
    'Producto terminado declarado',
    kg(calculation.declaredFinishedKg100),
    { format: KG_FORMAT },
  )
  writeMetric(
    worksheet,
    rowNumber + 2,
    1,
    'Diferencia',
    {
      formula: `B${expectedRow}-B${expectedRow + 1}`,
      result: kg(calculation.differenceKg100),
    },
    {
      format: KG_FORMAT,
      tone: calculation.differenceKg100 === 0 ? 'success' : 'danger',
    },
  )
  rowNumber += 4

  // --- By shift ---------------------------------------------------------------
  writeSectionTitle(worksheet, rowNumber, lastColumn, 'RESUMEN POR TURNO')
  writeTableHeader(worksheet, rowNumber + 1, [
    'Turno',
    'Reportado físico',
    'Saldo anterior procesado',
    'Ajustes',
    'Producción propia',
  ])
  const shiftRows: [string, typeof calculation.day][] = [
    ['Día (07:00 – 19:00)', calculation.day],
    ['Noche (19:00 – 07:00)', calculation.night],
  ]
  shiftRows.forEach(([label, shift], index) => {
    const current = rowNumber + 2 + index
    writeDataRow(worksheet, current, [
      label,
      kg(shift.reportedKg100),
      kg(shift.previousBalanceProcessedKg100),
      kg(shift.adjustmentKg100),
      {
        formula: `B${current}-C${current}+D${current}`,
        result: kg(shift.ownProductionKg100),
      },
    ])
  })
  writeTotalsRow(worksheet, rowNumber + 4, rowNumber + 2, rowNumber + 3, 2, 5)
  rowNumber += 6

  // --- By family --------------------------------------------------------------
  writeSectionTitle(worksheet, rowNumber, lastColumn, 'TOTALES POR FAMILIA')
  writeTableHeader(worksheet, rowNumber + 1, [
    'Familia',
    'Día propio',
    'Noche propio',
    'Tratamiento',
    'Saldo final',
    'Producto terminado',
    '% del total',
  ])
  const families = new Map<string, ProductReconciliation[]>()
  for (const product of calculation.products) {
    families.set(product.familyName, [
      ...(families.get(product.familyName) ?? []),
      product,
    ])
  }
  const familyFirstRow = rowNumber + 2
  const familyLastRow = familyFirstRow + families.size - 1
  const totalFamilyRow = familyLastRow + 1
  ;[...families.entries()].forEach(([familyName, products], index) => {
    const current = familyFirstRow + index
    const sum = (pick: (product: ProductReconciliation) => Kg100) =>
      kg(sumKg100(products.map(pick)))
    writeDataRow(
      worksheet,
      current,
      [
        familyName,
        sum((product) => product.day.ownProductionKg100),
        sum((product) => product.night.ownProductionKg100),
        sum((product) => product.treatmentKg100),
        sum((product) => product.newClosingBalanceKg100),
        sum((product) => product.declaredFinishedKg100),
        {
          formula: `IF($F$${totalFamilyRow}=0,0,F${current}/$F$${totalFamilyRow})`,
        },
      ],
      { formats: { 7: PERCENT_FORMAT }, zebra: index % 2 === 1 },
    )
  })
  writeTotalsRow(
    worksheet,
    totalFamilyRow,
    familyFirstRow,
    familyLastRow,
    2,
    6,
  )
  rowNumber = totalFamilyRow + 2

  // --- Freezable availability ---------------------------------------------
  writeSectionTitle(
    worksheet,
    rowNumber,
    lastColumn,
    'DISPONIBLE PARA CONGELAMIENTO',
  )
  const ownDayForFreezing = sumKg100(
    calculation.products.map((product) =>
      kg100(
        product.day.reportedKg100 - product.day.previousBalanceProcessedKg100,
      ),
    ),
  )
  const ownNightForFreezing = sumKg100(
    calculation.products.map((product) =>
      kg100(
        product.night.reportedKg100 -
          product.night.previousBalanceProcessedKg100,
      ),
    ),
  )
  const availabilityFirst = rowNumber + 1
  writeMetric(
    worksheet,
    availabilityFirst,
    1,
    'Envasado propio Turno Día',
    kg(ownDayForFreezing),
    { format: KG_FORMAT },
  )
  writeMetric(
    worksheet,
    availabilityFirst + 1,
    1,
    '+ Envasado propio Turno Noche',
    kg(ownNightForFreezing),
    { format: KG_FORMAT },
  )
  writeMetric(
    worksheet,
    availabilityFirst + 2,
    1,
    '+ Saldo final generado',
    kg(calculation.newClosingBalanceKg100),
    { format: KG_FORMAT },
  )
  writeMetric(
    worksheet,
    availabilityFirst + 3,
    1,
    '= Disponible para congelar',
    {
      formula: `SUM(B${availabilityFirst}:B${availabilityFirst + 2})`,
      result: kg(
        sumKg100([
          ownDayForFreezing,
          ownNightForFreezing,
          calculation.newClosingBalanceKg100,
        ]),
      ),
    },
    {
      format: KG_FORMAT,
      hint: 'El saldo recibido de otras jornadas se cuenta en su jornada de origen.',
    },
  )
  rowNumber = availabilityFirst + 5

  const lastRow = writeObservations(worksheet, productionDay, rowNumber, 6)
  worksheet.pageSetup.printArea = `A1:G${Math.max(lastRow, rowNumber)}`
}
