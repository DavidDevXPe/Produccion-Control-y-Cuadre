import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BulkFreezingLinkDialog } from './BulkFreezingLinkDialog'

describe('BulkFreezingLinkDialog', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <BulkFreezingLinkDialog
        isOpen={false}
        pendingLinkCount={3}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(container.firstChild).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog with product count and dispatches onConfirm and onCancel', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()

    render(
      <BulkFreezingLinkDialog
        isOpen={true}
        pendingLinkCount={4}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByText('Vincular productos mediante FIFO'),
    ).toBeInTheDocument()
    expect(screen.getByText('4 productos')).toBeInTheDocument()
    expect(
      screen.getByText(/utilizando primero las jornadas origen de Envasado/i),
    ).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', {
      name: 'Vincular todos FIFO',
    })
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    fireEvent.click(cancelButton)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('formats singular "1 producto" when pendingLinkCount is 1', () => {
    render(
      <BulkFreezingLinkDialog
        isOpen={true}
        pendingLinkCount={1}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('1 producto')).toBeInTheDocument()
  })
})
