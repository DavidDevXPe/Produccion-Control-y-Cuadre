import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ClosureMessage } from '../model/businessRules'
import { CloseConfirmationDialog } from './CloseConfirmationDialog'

describe('CloseConfirmationDialog', () => {
  const defaultSummaryItems: readonly [string, string][] = [
    ['Materia prima', '64,688.00 kg'],
    ['Total reportado', '56,130.00 kg'],
    ['Aprovechamiento', '86.77%'],
  ]

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CloseConfirmationDialog
        isOpen={false}
        summaryItems={defaultSummaryItems}
        warnings={[]}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(container.firstChild).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog, summary dl, and confirm button when isOpen is true without warnings', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()

    render(
      <CloseConfirmationDialog
        isOpen={true}
        summaryItems={defaultSummaryItems}
        warnings={[]}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(
      screen.getByText('Después del cierre, esta jornada quedará en solo lectura.'),
    ).toBeInTheDocument()

    expect(screen.getByText('Materia prima')).toBeInTheDocument()
    expect(screen.getByText('64,688.00 kg')).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: 'Cerrar jornada' })
    expect(confirmButton).toBeInTheDocument()
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)

    const cancelButton = screen.getByRole('button', { name: 'Volver a revisar' })
    fireEvent.click(cancelButton)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('renders categorized warnings and switches button to "Cerrar con observación"', () => {
    const onConfirm = vi.fn()
    const warnings: ClosureMessage[] = [
      {
        code: 'FREEZING_TRACEABILITY_DIFFERENCE',
        message: 'Existe una diferencia de trazabilidad en congelamiento.',
      },
      {
        code: 'FAMILY_YIELD_BELOW_TARGET',
        familyKey: 'ALETA',
        message: 'Aleta cruda por debajo del objetivo.',
      },
    ]

    render(
      <CloseConfirmationDialog
        isOpen={true}
        summaryItems={defaultSummaryItems}
        warnings={warnings}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByText('Advertencias antes del cierre')).toBeInTheDocument()
    expect(screen.getByText('2 advertencias')).toBeInTheDocument()
    expect(screen.getByText('Diferencia de trazabilidad')).toBeInTheDocument()
    expect(screen.getByText('Rendimiento de familia')).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', {
      name: 'Cerrar con observación',
    })
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
