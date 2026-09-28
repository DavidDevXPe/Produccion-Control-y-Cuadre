import { Workbook } from 'exceljs'
import { downloadWorkbook, setupWorksheet, writeDataRow, writeTableHeader, writeTitle } from '../../production/export/workbookStyles'
import type { PerformanceRecord } from '../model/types'

export async function exportPerformanceWorkbook(
  weekNumber: number,
  records: readonly PerformanceRecord[],
): Promise<void> {
  const workbook = new Workbook()
  workbook.creator = 'TRABUNDA Producción'
  workbook.company = 'TRABUNDA Procesos Marinos'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.calcProperties.fullCalcOnLoad = true

  const worksheet = setupWorksheet(
    workbook,
    'Rendimiento Operativo',
    [16, 16, 12, 22, 18, 14, 14, 18, 16],
    `Rendimiento Semanal ${weekNumber}`,
  )

  writeTitle(
    worksheet,
    9,
    `RENDIMIENTO OPERATIVO · SEMANA ${weekNumber}`,
    'Reporte de Eficiencia Física por Turno',
  )

  writeTableHeader(worksheet, 5, [
    'Fecha',
    'Proceso',
    'Turno',
    'Supervisor',
    'Kg Procesados',
    'Horas Ef.',
    'Personal',
    'Kg/persona-h',
    'Cumplimiento',
  ])

  records.forEach((record, index) => {
    const rowNum = 6 + index
    writeDataRow(
      worksheet,
      rowNum,
      [
        record.date,
        record.process === 'PACKING' ? 'Envasado' : 'Congelamiento',
        record.shift === 'DAY' ? 'Día' : 'Noche',
        record.supervisor || '—',
        (record.processedKg100 ?? 0) / 100,
        record.effectiveHours ?? 0,
        record.workerCount ?? 0,
        record.kgPerWorkerHour ?? 0,
        record.benchmarkCompliance ? record.benchmarkCompliance / 100 : 0,
      ],
      { zebra: index % 2 === 1 },
    )
    worksheet.getCell(`I${rowNum}`).numFmt = '0.00%'
  })

  await downloadWorkbook(workbook, `TRABUNDA_Rendimiento_Semana_${weekNumber}.xlsx`)
}
