import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type {
  OperationalCalendarDay,
  OperationalWeekView,
} from '../state/productionDataTypes'
import { ProductionDaysCloseWeekModal } from './ProductionDaysCloseWeekModal'

describe('ProductionDaysCloseWeekModal', () => {
  const sampleCalendarDays: readonly OperationalCalendarDay[] = [
    { label: 'Lun', date: '14/09', isoDate: '2026-09-14' },
    { label: 'Mar', date: '15/09', isoDate: '2026-09-15' },
    { label: 'Mié', date: '16/09', isoDate: '2026-09-16' },
    { label: 'Jue', date: '17/09', isoDate: '2026-09-17' },
    { label: 'Vie', date: '18/09', isoDate: '2026-09-18' },
    { label: 'Sáb', date: '19/09', isoDate: '2026-09-19' },
    { label: 'Dom', date: '20/09', isoDate: '2026-09-20' },
  ]

  const mockActiveWeek: OperationalWeekView = {
    number: 38,
    process: 'PACKING',
    period: {
      startDate: '2026-09-14',
      endDate: '2026-09-20',
    },
    calendarDays: sampleCalendarDays,
    productionDays: [],
    temporalStatus: 'CURRENT',
    businessStatus: 'OPEN',
    closureType: null,
    closedAt: null,
    isCurrent: true,
    isPast: false,
    isFuture: false,
    isClosed: false,
    isReadOnly: false,
    canCreate: true,
    canCloseManually: true,
    closureBlockers: [],
  }

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ProductionDaysCloseWeekModal
        isOpen={false}
        onClose={vi.fn()}
        activeWeek={mockActiveWeek}
        selectedProcess="PACKING"
        registeredDaysCount={5}
        missingCalendarDays={[]}
        weekCloseError=""
        onConfirmWeekClosure={vi.fn()}
      />,
    )

    expect(container.firstChild).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders modal with week details, missing days list, and allows closure when there are no blockers', () => {
    const onClose = vi.fn()
    const onConfirmWeekClosure = vi.fn()
    const missingDays: OperationalCalendarDay[] = [
      { label: 'Dom', date: '20/09', isoDate: '2026-09-20' },
    ]

    render(
      <ProductionDaysCloseWeekModal
        isOpen={true}
        onClose={onClose}
        activeWeek={mockActiveWeek}
        selectedProcess="PACKING"
        registeredDaysCount={6}
        missingCalendarDays={missingDays}
        weekCloseError=""
        onConfirmWeekClosure={onConfirmWeekClosure}
      />,
    )

    expect(
      screen.getByText('Cerrar semana 38 · Envasado'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Jornadas registradas: 6 de 7/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Días sin registro')).toBeInTheDocument()
    expect(screen.getByText('Dom 20/09 · SIN REGISTRO')).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: 'Cerrar semana' })
    expect(confirmButton).not.toBeDisabled()
    fireEvent.click(confirmButton)
    expect(onConfirmWeekClosure).toHaveBeenCalledTimes(1)

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    fireEvent.click(cancelButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('disables close button and shows alert when there are closure blockers', () => {
    const weekWithBlockers: OperationalWeekView = {
      ...mockActiveWeek,
      closureBlockers: [
        {
          dayId: 'production-day-2026-09-16',
          date: '2026-09-16',
          displayName: 'Miércoles 16',
          message: 'Miércoles 16 tiene una diferencia de cuadre de -25.00 kg.',
        },
      ],
    }

    render(
      <ProductionDaysCloseWeekModal
        isOpen={true}
        onClose={vi.fn()}
        activeWeek={weekWithBlockers}
        selectedProcess="PACKING"
        registeredDaysCount={6}
        missingCalendarDays={[]}
        weekCloseError=""
        onConfirmWeekClosure={vi.fn()}
      />,
    )

    expect(
      screen.getByText('Jornadas que requieren revisión:'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '• Miércoles 16 tiene una diferencia de cuadre de -25.00 kg.',
      ),
    ).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: 'Cerrar semana' })
    expect(confirmButton).toBeDisabled()
  })

  it('renders weekCloseError message when provided', () => {
    render(
      <ProductionDaysCloseWeekModal
        isOpen={true}
        onClose={vi.fn()}
        activeWeek={mockActiveWeek}
        selectedProcess="PACKING"
        registeredDaysCount={6}
        missingCalendarDays={[]}
        weekCloseError="No tienes permisos de supervisor para cerrar semanas."
        onConfirmWeekClosure={vi.fn()}
      />,
    )

    expect(
      screen.getByText('No tienes permisos de supervisor para cerrar semanas.'),
    ).toBeInTheDocument()
  })
})
