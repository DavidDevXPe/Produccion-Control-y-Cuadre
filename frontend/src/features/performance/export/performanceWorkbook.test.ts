import type { Workbook } from 'exceljs'
import { describe, expect, it, vi } from 'vitest'
import { kg } from '../../production/model/calculations'
import type { PerformanceRecord } from '../model/types'
import { exportPerformanceWorkbook } from './performanceWorkbook'

const mockDownloadWorkbook = vi.fn().mockResolvedValue(undefined)

vi.mock('../../production/export/workbookStyles', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../production/export/workbookStyles')>()
  return {
    ...actual,
    downloadWorkbook: (workbook: Workbook, fileName: string) =>
      mockDownloadWorkbook(workbook, fileName),
  }
})

function createPerformanceRecord(overrides: Partial<PerformanceRecord> = {}): PerformanceRecord {
  return {
    id: 'perf-1',
    productionDayId: 'day-1',
    date: '2026-09-16',
    weekNumber: 42,
    process: 'PACKING',
    shift: 'DAY',
    supervisor: 'David Castillo',
    workerCount: 25,
    startTime: '07:00',
    endTime: '19:00',
    deadHours: 1,
    createdAt: '2026-09-16T00:00:00.000Z',
    updatedAt: '2026-09-16T00:00:00.000Z',
    scheduledHours: 12,
    effectiveHours: 11,
    processedKg100: kg(22000),
    personHours: 275,
    kgPerHour: 2000,
    kgPerWorkerHour: 80,
    benchmark: 80,
    benchmarkCompliance: 100,
    potentialKg100: kg(22000),
    productivityGapKg100: kg(0),
    benchmarkStatus: 'AT_OR_ABOVE_TARGET',
    isComplete: true,
    validationMessage: null,
    ...overrides,
  }
}

describe('exportPerformanceWorkbook', () => {
  it('generates performance workbook with correct metadata, rows, and format', async () => {
    mockDownloadWorkbook.mockClear()

    const packingDay = createPerformanceRecord({
      process: 'PACKING',
      shift: 'DAY',
      supervisor: 'Juan Perez',
      processedKg100: kg(15000),
      effectiveHours: 10,
      workerCount: 20,
      kgPerWorkerHour: 75,
      benchmarkCompliance: 95.5,
    })

    const freezingNight = createPerformanceRecord({
      process: 'FREEZING',
      shift: 'NIGHT',
      supervisor: '',
      processedKg100: kg(12000),
      effectiveHours: 8,
      workerCount: 15,
      kgPerWorkerHour: 100,
      benchmarkCompliance: null,
    })

    await exportPerformanceWorkbook(42, [packingDay, freezingNight])

    expect(mockDownloadWorkbook).toHaveBeenCalledTimes(1)
    const [workbook, fileName] = mockDownloadWorkbook.mock.calls[0] as [Workbook, string]

    expect(fileName).toBe('TRABUNDA_Rendimiento_Semana_42.xlsx')
    expect(workbook.creator).toBe('TRABUNDA Producción')
    expect(workbook.company).toBe('TRABUNDA Procesos Marinos')
    expect(workbook.calcProperties.fullCalcOnLoad).toBe(true)

    const sheet = workbook.getWorksheet('Rendimiento Operativo')
    expect(sheet).toBeDefined()

    // Row 6 is packingDay
    expect(sheet?.getCell('A6').value).toBe('2026-09-16')
    expect(sheet?.getCell('B6').value).toBe('Envasado')
    expect(sheet?.getCell('C6').value).toBe('Día')
    expect(sheet?.getCell('D6').value).toBe('Juan Perez')
    expect(sheet?.getCell('E6').value).toBe(15000)
    expect(sheet?.getCell('F6').value).toBe(10)
    expect(sheet?.getCell('G6').value).toBe(20)
    expect(sheet?.getCell('H6').value).toBe(75)
    expect(sheet?.getCell('I6').value).toBe(0.955)
    expect(sheet?.getCell('I6').numFmt).toBe('0.00%')

    // Row 7 is freezingNight (with empty supervisor fallback)
    expect(sheet?.getCell('B7').value).toBe('Congelamiento')
    expect(sheet?.getCell('C7').value).toBe('Noche')
    expect(sheet?.getCell('D7').value).toBe('—')
    expect(sheet?.getCell('I7').value).toBe(0)
    expect(sheet?.getCell('I7').numFmt).toBe('0.00%')
  })
})
