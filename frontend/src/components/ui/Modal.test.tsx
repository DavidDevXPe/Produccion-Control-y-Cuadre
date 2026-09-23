import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

function Harness({ onClose = () => undefined }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      {open ? (
        <Modal
          titleId="demo-title"
          onClose={() => {
            onClose()
            setOpen(false)
          }}
        >
          <h2 id="demo-title">Confirmar cierre</h2>
          <button type="button">Primero</button>
          <button type="button">Último</button>
        </Modal>
      ) : null}
    </>
  )
}

describe('Modal', () => {
  it('is a named modal dialog and moves focus inside it', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Abrir' }))

    const dialog = screen.getByRole('dialog', { name: 'Confirmar cierre' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus()
  })

  it('closes with Escape and gives focus back to the element that opened it', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const opener = screen.getByRole('button', { name: 'Abrir' })

    await user.click(opener)
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))

    await user.tab()
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus()
  })

  it('blocks page scrolling while open and restores it afterwards', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.overflow).toBe('')
  })
})
