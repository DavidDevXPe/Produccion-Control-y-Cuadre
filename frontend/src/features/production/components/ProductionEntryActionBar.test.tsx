import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Kg100 } from '../model/types'
import { ProductionEntryActionBar } from './ProductionEntryActionBar'

const kg100 = (value: number) => value as Kg100

describe('ProductionEntryActionBar', () => {
  it('keeps the three desktop groups in the explicit action-bar layout', () => {
    const { container } = render(
      <ProductionEntryActionBar
        canClose={false}
        footerStatus={{ title: 'Texto heredado largo', description: 'No debe ocupar el footer' }}
        pendingClosureReasons={['Falta dato general', 'Falta conciliación']}
        dayShift={{
          reportedKg100: kg100(1000),
          ownProductionKg100: kg100(1000),
          declaredReportedKg100: kg100(1000),
          detailDifferenceKg100: kg100(0),
        }}
        nightShift={{
          reportedKg100: kg100(800),
          ownProductionKg100: kg100(800),
          declaredReportedKg100: kg100(800),
          detailDifferenceKg100: kg100(0),
        }}
        dayHasReportData
        nightHasReportData
        onSaveDraft={vi.fn()}
        onCloseDay={vi.fn()}
      />,
    )

    const layout = container.querySelector('.production-entry-action-bar__layout')
    expect(layout).toBeInTheDocument()
    expect(layout).not.toHaveClass('flex-col', 'flex-wrap', 'justify-center')
    expect(layout?.querySelector(':scope > .production-entry-action-bar__status')).toBeInTheDocument()
    expect(layout?.querySelector(':scope > .production-entry-action-bar__shifts')).toBeInTheDocument()
    expect(layout?.querySelector(':scope > .production-entry-action-bar__actions')).toBeInTheDocument()

    expect(screen.getByText('Cierre pendiente')).toBeInTheDocument()
    expect(screen.getByText('2 validaciones para el cierre')).toBeInTheDocument()
    expect(screen.getByTestId('sticky-shift-chip-día')).toHaveTextContent('Día')
    expect(screen.getByTestId('sticky-shift-chip-noche')).toHaveTextContent('Noche')
    expect(screen.getByLabelText('Turno Día conciliado')).toHaveAttribute('data-tooltip', 'Turno Día conciliado')
    expect(screen.getByLabelText('Turno Noche conciliado')).toHaveAttribute('data-tooltip', 'Turno Noche conciliado')
    expect(screen.getByRole('button', { name: 'Revisar pendientes (2)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar jornada' })).toBeDisabled()
  })

  it('opens a compact pending panel with navigation and closes with Escape or outside click', () => {
    const target = document.createElement('div')
    target.id = 'pendientes-para-cerrar'
    document.body.appendChild(target)

    render(
      <ProductionEntryActionBar
        canClose={false}
        footerStatus={{ title: 'Estado', description: 'Descripción' }}
        pendingClosureReasons={['Turno Día: faltan 10.00 kg']}
        dayShift={{ reportedKg100: kg100(0), declaredReportedKg100: kg100(0), detailDifferenceKg100: kg100(0) }}
        nightShift={{ reportedKg100: kg100(0), declaredReportedKg100: kg100(0), detailDifferenceKg100: kg100(0) }}
        dayHasReportData
        nightHasReportData
        onSaveDraft={vi.fn()}
        onCloseDay={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Revisar pendientes (1)' }))
    expect(screen.getByRole('dialog', { name: 'Validaciones para el cierre' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir a revisar' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Validaciones para el cierre' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Revisar pendientes (1)' }))
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('dialog', { name: 'Validaciones para el cierre' })).not.toBeInTheDocument()

    target.remove()
  })

  it('keeps non-blocking observations available after the journey is closable', () => {
    const { container } = render(
      <ProductionEntryActionBar
        canClose
        footerStatus={{ title: 'Lista con observaciones', description: 'Revisar antes de cerrar' }}
        pendingClosureReasons={[]}
        reviewReasons={['La reconstrucción teórica de las Anillas supera la MP disponible.']}
        dayShift={{ reportedKg100: kg100(1000), declaredReportedKg100: kg100(1000), detailDifferenceKg100: kg100(0) }}
        nightShift={{ reportedKg100: kg100(800), declaredReportedKg100: kg100(800), detailDifferenceKg100: kg100(0) }}
        dayHasReportData
        nightHasReportData
        onSaveDraft={vi.fn()}
        onCloseDay={vi.fn()}
      />,
    )

    expect(screen.getByText('Lista con observaciones')).toBeInTheDocument()
    expect(screen.getByText('1 observación para revisar')).toBeInTheDocument()
    expect(container.querySelector('.production-entry-action-bar__status svg')).toHaveClass(
      'text-amber-600',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Revisar observaciones (1)' }))
    const panel = screen.getByRole('dialog', { name: 'Observaciones para revisar' })
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveClass('left-auto', 'top-auto', 'right-0')
    expect(panel.closest('.production-entry-action-bar__actions')).toBeInTheDocument()
    expect(screen.getByText(/reconstrucción teórica de las Anillas/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar jornada' })).toBeEnabled()
  })

  it('uses the same review item count in the footer and its panel', () => {
    render(
      <ProductionEntryActionBar
        canClose={false}
        footerStatus={{ title: 'Requiere revisión', description: 'Hay pendientes' }}
        pendingClosureReasons={['Pendiente 1', 'Pendiente 2']}
        reviewItems={[
          { id: 'one', severity: 'BLOCKER', message: 'Pendiente 1' },
          { id: 'two', severity: 'BLOCKER', message: 'Pendiente 2' },
          { id: 'three', severity: 'BLOCKER', message: 'Pendiente 3' },
          { id: 'four', severity: 'WARNING', message: 'Observación 1' },
          { id: 'five', severity: 'WARNING', message: 'Observación 2' },
        ]}
        dayShift={{ reportedKg100: kg100(0), declaredReportedKg100: kg100(0), detailDifferenceKg100: kg100(0) }}
        nightShift={{ reportedKg100: kg100(0), declaredReportedKg100: kg100(0), detailDifferenceKg100: kg100(0) }}
        dayHasReportData
        nightHasReportData
        onSaveDraft={vi.fn()}
        onCloseDay={vi.fn()}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Revisar pendientes (5)' })
    fireEvent.click(trigger)
    const panel = screen.getByRole('dialog', { name: 'Validaciones para el cierre' })
    expect(panel.querySelectorAll('li')).toHaveLength(5)
  })
})
