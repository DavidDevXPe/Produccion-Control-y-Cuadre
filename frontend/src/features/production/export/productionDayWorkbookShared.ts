import type { Worksheet } from 'exceljs'
import { formatIsoDate } from '../../../utils/formatters'
import { toKilograms } from '../model/calculations'
import type { Kg100, ProductionDay } from '../model/types'
import {
  writeDataRow,
  writeSectionTitle,
  writeTableHeader,
} from './workbookStyles'

export const SUMMARY_SHEET = 'Resumen'
export const DETAIL_SHEET = 'Detalle por producto'
export const FREEZING_ORIGIN_SHEET = 'Origen del congelado'

export const kg = (value: Kg100) => toKilograms(value)

export function statusLabel(productionDay: ProductionDay): string {
  return (productionDay.closureObservations?.length ?? 0) > 0
    ? 'CUADRADO · OBSERVADO'
    : 'CUADRADO'
}

export function subtitle(
  productionDay: ProductionDay,
  processLabel: string,
): string {
  return `${processLabel} · ${formatIsoDate(productionDay.date)} · Jornada cerrada · ${statusLabel(productionDay)}`
}

export function productNameById(
  productionDay: ProductionDay,
  productId?: string,
): string {
  if (!productId) return ''
  return (
    productionDay.lines.find((line) => line.productId === productId)
      ?.productName ?? productId
  )
}

export function writeObservations(
  worksheet: Worksheet,
  productionDay: ProductionDay,
  startRow: number,
  lastColumn: number,
): number {
  const observations = productionDay.closureObservations ?? []
  if (observations.length === 0) return startRow - 1

  writeSectionTitle(worksheet, startRow, lastColumn, 'OBSERVACIONES DE CIERRE')
  writeTableHeader(worksheet, startRow + 1, [
    'Fecha de cierre',
    'Código',
    'Producto',
    'Familia',
    'Kg',
    'Observación',
  ])
  observations.forEach((observation, index) => {
    const rowNumber = startRow + 2 + index
    const row = writeDataRow(
      worksheet,
      rowNumber,
      [
        new Date(observation.closedAt).toLocaleString('es-PE', {
          timeZone: 'America/Lima',
        }),
        observation.code,
        productNameById(productionDay, observation.productId),
        observation.familyKey ?? '',
        observation.kg100 === undefined ? '' : kg(observation.kg100),
        observation.message,
      ],
      { textColumns: 4 },
    )
    const message = row.getCell(6)
    message.alignment = {
      horizontal: 'left',
      vertical: 'middle',
      wrapText: true,
      indent: 1,
    }
    message.numFmt = '@'
    row.height = 30
  })
  return startRow + 1 + observations.length
}

