import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WeekSelectorTrigger } from './WeekSelectorTrigger'

describe('WeekSelectorTrigger', () => {
  it('renders trigger button with aria attributes and label', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(
      <WeekSelectorTrigger
        selectedWeekNumber={38}
        compact={false}
        isOpen={false}
        listboxId="week-listbox"
        triggerRef={ref}
        onToggle={vi.fn()}
        onOpen={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    const button = screen.getByRole('button', {
      name: 'Seleccionar semana operativa. Semana 38',
    })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-haspopup', 'listbox')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls', 'week-listbox')
    expect(screen.getByText('Semana 38')).toBeInTheDocument()
  })

  it('renders compact label variations when compact is true', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(
      <WeekSelectorTrigger
        selectedWeekNumber={38}
        compact={true}
        isOpen={true}
        listboxId="week-listbox"
        triggerRef={ref}
        onToggle={vi.fn()}
        onOpen={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('S. 38')).toBeInTheDocument()
    expect(screen.getByText('Semana 38')).toBeInTheDocument()
  })

  it('handles click and keyboard events to toggle/open/close listbox', () => {
    const ref = React.createRef<HTMLButtonElement>()
    const handleToggle = vi.fn()
    const handleOpen = vi.fn()
    const handleClose = vi.fn()

    render(
      <WeekSelectorTrigger
        selectedWeekNumber={38}
        compact={false}
        isOpen={false}
        listboxId="week-listbox"
        triggerRef={ref}
        onToggle={handleToggle}
        onOpen={handleOpen}
        onClose={handleClose}
      />,
    )

    const button = screen.getByRole('button')

    fireEvent.click(button)
    expect(handleToggle).toHaveBeenCalled()

    fireEvent.keyDown(button, { key: 'ArrowDown' })
    expect(handleOpen).toHaveBeenCalled()

    fireEvent.keyDown(button, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalled()
  })
})

