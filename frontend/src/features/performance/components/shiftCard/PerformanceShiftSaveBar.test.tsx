import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { kg } from '../../../production/model/calculations'
import type { PerformanceRecord } from '../../model/types'
import { PerformanceShiftSaveBar } from './PerformanceShiftSaveBar'

function createPerformanceRecord(overrides: Partial<PerformanceRecord> = {}): PerformanceRecord {
  return {
    id: 'perf-1',
    productionDayId: 'day-1',
    date: '2026-09-16',
    weekNumber: 38,
    process: 'PACKING',
    shift: 'DAY',
    supervisor: 'Carlos Lopez',
    workerCount: 20,
    startTime: '07:00',
    endTime: '19:00',
    deadHours: 1,
    createdAt: '2026-09-16T00:00:00.000Z',
    updatedAt: '2026-09-16T00:00:00.000Z',
    scheduledHours: 12,
    effectiveHours: 11,
    processedKg100: kg(22000),
    personHours: 220,
    kgPerHour: 2000,
    kgPerWorkerHour: 100,
    benchmark: 90,
    benchmarkCompliance: 111.11,
    potentialKg100: kg(19800),
    productivityGapKg100: null,
    benchmarkStatus: 'AT_OR_ABOVE_TARGET',
    isComplete: true,
    validationMessage: null,
    ...overrides,
  }
}

describe('PerformanceShiftSaveBar', () => {
  it('renders SAVED state with success message and status role', () => {
    const record = createPerformanceRecord()
    render(
      <PerformanceShiftSaveBar
        saveState="SAVED"
        performance={record}
        readOnly={false}
        onSave={vi.fn()}
      />,
    )

    const statusMsg = screen.getByRole('status')
    expect(statusMsg).toHaveTextContent('Información de rendimiento guardada.')
  })

  it('renders ERROR state with alert role and validation message', () => {
    const record = createPerformanceRecord({
      isComplete: false,
      validationMessage: 'Las horas muertas no pueden superar las horas programadas.',
    })
    render(
      <PerformanceShiftSaveBar
        saveState="ERROR"
        performance={record}
        readOnly={false}
        onSave={vi.fn()}
      />,
    )

    const alertMsg = screen.getByRole('alert')
    expect(alertMsg).toHaveTextContent(
      'Las horas muertas no pueden superar las horas programadas.',
    )
  })

  it('renders IDLE state message when complete', () => {
    const record = createPerformanceRecord({ isComplete: true })
    render(
      <PerformanceShiftSaveBar
        saveState="IDLE"
        performance={record}
        readOnly={false}
        onSave={vi.fn()}
      />,
    )

    expect(
      screen.getByText('Indicadores recalculados con el reporte físico vigente.'),
    ).toBeInTheDocument()
  })

  it('renders IDLE fallback prompt when incomplete without explicit validation message', () => {
    const record = createPerformanceRecord({
      isComplete: false,
      validationMessage: null,
    })
    render(
      <PerformanceShiftSaveBar
        saveState="IDLE"
        performance={record}
        readOnly={false}
        onSave={vi.fn()}
      />,
    )

    expect(
      screen.getByText('Completa los datos operativos del turno.'),
    ).toBeInTheDocument()
  })

  it('calls onSave when save button is clicked in writable mode', () => {
    const onSave = vi.fn()
    const record = createPerformanceRecord()
    render(
      <PerformanceShiftSaveBar
        saveState="IDLE"
        performance={record}
        readOnly={false}
        onSave={onSave}
      />,
    )

    const button = screen.getByRole('button', { name: 'Guardar rendimiento' })
    fireEvent.click(button)
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('hides save button when readOnly is true', () => {
    const record = createPerformanceRecord()
    render(
      <PerformanceShiftSaveBar
        saveState="IDLE"
        performance={record}
        readOnly={true}
        onSave={vi.fn()}
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Guardar rendimiento' }),
    ).not.toBeInTheDocument()
  })
})
