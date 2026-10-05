import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProcessChangeDialog } from './ProcessChangeDialog'

describe('ProcessChangeDialog', () => {
  it('renders nothing when pendingProcess is null', () => {
    const { container } = render(
      <ProcessChangeDialog
        pendingProcess={null}
        currentProcess="PACKING"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(container.firstChild).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders confirmation dialog when switching from PACKING to FREEZING', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ProcessChangeDialog
        pendingProcess="FREEZING"
        currentProcess="PACKING"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Cambiar a Congelamiento')).toBeInTheDocument()
    expect(
      screen.getByText(/Existen datos sin guardar en la jornada de Envasado./i),
    ).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: 'Cambiar proceso' })
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledWith('FREEZING')

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    fireEvent.click(cancelButton)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('renders confirmation dialog when switching from FREEZING to PACKING', () => {
    const onConfirm = vi.fn()

    render(
      <ProcessChangeDialog
        pendingProcess="PACKING"
        currentProcess="FREEZING"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByText('Cambiar a Envasado')).toBeInTheDocument()
    expect(
      screen.getByText(/Existen datos sin guardar en la jornada de Congelamiento./i),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar proceso' }))
    expect(onConfirm).toHaveBeenCalledWith('PACKING')
  })
})
