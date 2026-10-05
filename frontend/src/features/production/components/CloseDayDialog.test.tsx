import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ClosureMessage } from '../model/businessRules'
import { CloseDayDialog } from './CloseDayDialog'

describe('CloseDayDialog', () => {
  const defaultSummary = [
    { label: 'Materia prima', value: '64,688.00 kg' },
    { label: 'Total reportado', value: '56,130.00 kg' },
    { label: 'Aprovechamiento', value: '86.77%' },
  ]

  it('renders clean confirmation dialog when there are no warnings or errors', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()

    render(
      <CloseDayDialog
        titleId="close-modal-title"
        title="Confirmar cierre de jornada"
        description="Esta acción cambiará el estado a CERRADA."
        summary={defaultSummary}
        warnings={[]}
        error=""
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByText('Confirmar cierre de jornada')).toBeInTheDocument()
    expect(screen.getByText('Esta acción cambiará el estado a CERRADA.')).toBeInTheDocument()
    expect(screen.getByText('Materia prima')).toBeInTheDocument()
    expect(screen.getByText('64,688.00 kg')).toBeInTheDocument()

    // Confirm button text when no warnings
    const confirmButton = screen.getByRole('button', { name: 'Cerrar jornada' })
    expect(confirmButton).toBeInTheDocument()

    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)

    const cancelButton = screen.getByRole('button', { name: 'Volver a revisar' })
    fireEvent.click(cancelButton)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('renders warnings list, count badge, and changes confirm button to "Cerrar con observación"', () => {
    const onConfirm = vi.fn()
    const warnings: ClosureMessage[] = [
      {
        code: 'FAMILY_YIELD_BELOW_TARGET',
        familyKey: 'ALETA',
        message: 'Aleta cruda está por debajo del objetivo mínimo del 90%.',
      },
      {
        code: 'FAMILY_YIELD_BELOW_TARGET',
        familyKey: 'MANTO',
        message: 'Manto crudo está por debajo del objetivo mínimo del 80%.',
      },
    ]

    render(
      <CloseDayDialog
        titleId="close-modal-title"
        title="Cerrar jornada con observaciones"
        description="Revisa las advertencias detectadas."
        summary={defaultSummary}
        warnings={warnings}
        warningTitle={(w) => (w.familyKey ? `Rendimiento de ${w.familyKey}` : null)}
        error=""
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByText('Advertencias antes del cierre')).toBeInTheDocument()
    expect(screen.getByText('2 advertencias')).toBeInTheDocument()
    expect(screen.getByText('Rendimiento de ALETA')).toBeInTheDocument()
    expect(
      screen.getByText('Aleta cruda está por debajo del objetivo mínimo del 90%.'),
    ).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', {
      name: 'Cerrar con observación',
    })
    expect(confirmButton).toBeInTheDocument()

    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('renders error message in an alert container when error prop is provided', () => {
    render(
      <CloseDayDialog
        titleId="close-modal-title"
        title="Error al cerrar"
        description="No se puede cerrar la jornada."
        summary={defaultSummary}
        warnings={[]}
        error="Existen diferencias de cuadre pendientes por resolver."
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(
      'Existen diferencias de cuadre pendientes por resolver.',
    )
  })
})
