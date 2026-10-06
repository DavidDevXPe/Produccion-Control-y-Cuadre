import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PerformanceShiftInputs } from './PerformanceShiftInputs'

describe('PerformanceShiftInputs', () => {
  const defaultProps = {
    supervisor: 'Carlos Lopez',
    workerCount: '18',
    startTime: '07:00',
    endTime: '19:00',
    deadHours: '1.5',
    workerLabel: 'N° Envasadores',
    scheduledHours: 12,
    readOnly: false,
    onSupervisorChange: vi.fn(),
    onWorkerCountChange: vi.fn(),
    onStartTimeChange: vi.fn(),
    onEndTimeChange: vi.fn(),
    onDeadHoursChange: vi.fn(),
  }

  it('renders all inputs with their current values and label text', () => {
    render(<PerformanceShiftInputs {...defaultProps} />)

    expect(screen.getByLabelText('Supervisor')).toHaveValue('Carlos Lopez')
    expect(screen.getByLabelText('N° Envasadores')).toHaveValue(18)
    expect(screen.getByLabelText('Hora inicio')).toHaveValue('07:00')
    expect(screen.getByLabelText('Hora final')).toHaveValue('19:00')
    expect(screen.getByLabelText('Horas muertas')).toHaveValue(1.5)
  })

  it('triggers change handlers when input values are modified', () => {
    const onSupervisorChange = vi.fn()
    const onWorkerCountChange = vi.fn()
    const onStartTimeChange = vi.fn()
    const onEndTimeChange = vi.fn()
    const onDeadHoursChange = vi.fn()

    render(
      <PerformanceShiftInputs
        {...defaultProps}
        onSupervisorChange={onSupervisorChange}
        onWorkerCountChange={onWorkerCountChange}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        onDeadHoursChange={onDeadHoursChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('Supervisor'), {
      target: { value: 'Maria Rodriguez' },
    })
    expect(onSupervisorChange).toHaveBeenCalledWith('Maria Rodriguez')

    fireEvent.change(screen.getByLabelText('N° Envasadores'), {
      target: { value: '22' },
    })
    expect(onWorkerCountChange).toHaveBeenCalledWith('22')

    fireEvent.change(screen.getByLabelText('Hora inicio'), {
      target: { value: '08:00' },
    })
    expect(onStartTimeChange).toHaveBeenCalledWith('08:00')

    fireEvent.change(screen.getByLabelText('Hora final'), {
      target: { value: '20:00' },
    })
    expect(onEndTimeChange).toHaveBeenCalledWith('20:00')

    fireEvent.change(screen.getByLabelText('Horas muertas'), {
      target: { value: '2' },
    })
    expect(onDeadHoursChange).toHaveBeenCalledWith('2')
  })

  it('disables all inputs when readOnly is true', () => {
    render(<PerformanceShiftInputs {...defaultProps} readOnly={true} />)

    expect(screen.getByLabelText('Supervisor')).toBeDisabled()
    expect(screen.getByLabelText('N° Envasadores')).toBeDisabled()
    expect(screen.getByLabelText('Hora inicio')).toBeDisabled()
    expect(screen.getByLabelText('Hora final')).toBeDisabled()
    expect(screen.getByLabelText('Horas muertas')).toBeDisabled()
  })

  it('sets max attribute on deadHours when scheduledHours is provided', () => {
    render(<PerformanceShiftInputs {...defaultProps} scheduledHours={10} />)
    const deadHoursInput = screen.getByLabelText('Horas muertas')
    expect(deadHoursInput).toHaveAttribute('max', '10')
  })

  it('omits max attribute on deadHours when scheduledHours is null', () => {
    render(<PerformanceShiftInputs {...defaultProps} scheduledHours={null} />)
    const deadHoursInput = screen.getByLabelText('Horas muertas')
    expect(deadHoursInput).not.toHaveAttribute('max')
  })
})
