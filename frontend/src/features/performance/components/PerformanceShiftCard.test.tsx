import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WEDNESDAY_PRODUCTION_DAY } from '../../production/data/wednesday'
import { PerformanceShiftCard } from './PerformanceShiftCard'

describe('PerformanceShiftCard', () => {
  it('renders shift card with correct default schedules and worker label for packing', () => {
    const onSave = vi.fn()
    render(
      <PerformanceShiftCard
        productionDay={WEDNESDAY_PRODUCTION_DAY}
        shift="DAY"
        weekNumber={36}
        readOnly={false}
        onSave={onSave}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Turno Día' })).toBeInTheDocument()
    expect(
      screen.getByText('Fuente de kilos: Reporte Día · solo lectura.'),
    ).toBeInTheDocument()
    expect(screen.getByText('N° Envasadores')).toBeInTheDocument()
    expect(screen.getByLabelText('Supervisor')).toHaveValue('')
    expect(screen.getByLabelText('Hora inicio')).toHaveValue('07:00')
    expect(screen.getByLabelText('Hora final')).toHaveValue('19:00')
    expect(screen.getByLabelText('Horas muertas')).toHaveValue(0)
    expect(screen.getByRole('button', { name: 'Guardar rendimiento' })).toBeInTheDocument()
  })

  it('renders Night shift with 19:00 start and 07:00 end defaults', () => {
    const onSave = vi.fn()
    render(
      <PerformanceShiftCard
        productionDay={WEDNESDAY_PRODUCTION_DAY}
        shift="NIGHT"
        weekNumber={36}
        readOnly={false}
        onSave={onSave}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Turno Noche' })).toBeInTheDocument()
    expect(screen.getByLabelText('Hora inicio')).toHaveValue('19:00')
    expect(screen.getByLabelText('Hora final')).toHaveValue('07:00')
  })

  it('updates inputs and submits performance record on save', () => {
    const onSave = vi.fn()
    render(
      <PerformanceShiftCard
        productionDay={WEDNESDAY_PRODUCTION_DAY}
        shift="DAY"
        weekNumber={36}
        readOnly={false}
        onSave={onSave}
      />,
    )

    fireEvent.change(screen.getByLabelText('Supervisor'), {
      target: { value: 'Juan Perez' },
    })
    fireEvent.change(screen.getByLabelText('N° Envasadores'), {
      target: { value: '15' },
    })
    fireEvent.change(screen.getByLabelText('Horas muertas'), {
      target: { value: '1' },
    })

    const saveButton = screen.getByRole('button', { name: 'Guardar rendimiento' })
    fireEvent.click(saveButton)

    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0]![0]
    expect(saved.supervisor).toBe('Juan Perez')
    expect(saved.workerCount).toBe(15)
    expect(saved.deadHours).toBe(1)
    expect(saved.shift).toBe('DAY')
    expect(saved.weekNumber).toBe(36)
    expect(screen.getByText('Información de rendimiento guardada.')).toBeInTheDocument()
  })

  it('disables inputs and hides save button when readOnly is true', () => {
    render(
      <PerformanceShiftCard
        productionDay={WEDNESDAY_PRODUCTION_DAY}
        shift="DAY"
        weekNumber={36}
        readOnly={true}
        onSave={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Supervisor')).toBeDisabled()
    expect(screen.getByLabelText('N° Envasadores')).toBeDisabled()
    expect(screen.getByLabelText('Hora inicio')).toBeDisabled()
    expect(screen.getByLabelText('Hora final')).toBeDisabled()
    expect(screen.getByLabelText('Horas muertas')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Guardar rendimiento' })).not.toBeInTheDocument()
  })

  it('prevents saving and displays error state when dead hours exceed scheduled hours', () => {
    const onSave = vi.fn()
    render(
      <PerformanceShiftCard
        productionDay={WEDNESDAY_PRODUCTION_DAY}
        shift="DAY"
        weekNumber={36}
        readOnly={false}
        onSave={onSave}
      />,
    )

    // Set dead hours to 15 when scheduled hours is 12 (07:00 to 19:00)
    fireEvent.change(screen.getByLabelText('Horas muertas'), {
      target: { value: '15' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar rendimiento' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(
      screen.getByText('Las horas muertas deben estar entre 0 y las horas programadas.'),
    ).toBeInTheDocument()
  })
})
