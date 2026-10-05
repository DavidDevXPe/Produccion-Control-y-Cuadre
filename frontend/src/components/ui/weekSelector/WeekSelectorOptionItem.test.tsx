import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WeekSelectorOptionItem } from './WeekSelectorOptionItem'
import type { WeekSelectorOption } from './weekSelectorTypes'

describe('WeekSelectorOptionItem', () => {
  const baseOption: WeekSelectorOption = {
    number: 38,
    year: 2026,
    startDate: '2026-09-14',
    endDate: '2026-09-20',
    periodLabel: '14 - 20 sep',
    isCurrent: true,
    hasRecords: true,
    businessStatus: 'OPEN',
    recordCount: 4,
  }

  it('renders option button with week number, current badge, period label and status', () => {
    const handleSelect = vi.fn()
    render(
      <WeekSelectorOptionItem
        option={baseOption}
        isSelected={true}
        onSelect={handleSelect}
        onFocusRelative={vi.fn()}
        onFocusEdge={vi.fn()}
        onClose={vi.fn()}
        onSetRef={vi.fn()}
      />,
    )

    const button = screen.getByRole('option')
    expect(button).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Semana 38')).toBeInTheDocument()
    expect(screen.getByText('Actual')).toBeInTheDocument()
    expect(screen.getByText('14 - 20 sep')).toBeInTheDocument()
    expect(
      screen.getByText('Abierta · 4 de 7 registros'),
    ).toBeInTheDocument()
  })

  it('handles click to select option', () => {
    const handleSelect = vi.fn()
    render(
      <WeekSelectorOptionItem
        option={baseOption}
        isSelected={false}
        onSelect={handleSelect}
        onFocusRelative={vi.fn()}
        onFocusEdge={vi.fn()}
        onClose={vi.fn()}
        onSetRef={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('option'))
    expect(handleSelect).toHaveBeenCalledWith(baseOption)
  })

  it('handles keyboard navigation with arrow keys, enter and escape', () => {
    const handleFocusRelative = vi.fn()
    const handleFocusEdge = vi.fn()
    const handleSelect = vi.fn()
    const handleClose = vi.fn()

    render(
      <WeekSelectorOptionItem
        option={baseOption}
        isSelected={false}
        onSelect={handleSelect}
        onFocusRelative={handleFocusRelative}
        onFocusEdge={handleFocusEdge}
        onClose={handleClose}
        onSetRef={vi.fn()}
      />,
    )

    const button = screen.getByRole('option')

    fireEvent.keyDown(button, { key: 'ArrowDown' })
    expect(handleFocusRelative).toHaveBeenCalledWith(1)

    fireEvent.keyDown(button, { key: 'ArrowUp' })
    expect(handleFocusRelative).toHaveBeenCalledWith(-1)

    fireEvent.keyDown(button, { key: 'Home' })
    expect(handleFocusEdge).toHaveBeenCalledWith('first')

    fireEvent.keyDown(button, { key: 'End' })
    expect(handleFocusEdge).toHaveBeenCalledWith('last')

    fireEvent.keyDown(button, { key: 'Enter' })
    expect(handleSelect).toHaveBeenCalledWith(baseOption)

    fireEvent.keyDown(button, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledWith(true)

    fireEvent.keyDown(button, { key: 'Tab' })
    expect(handleClose).toHaveBeenCalledWith()
  })

  it('renders closed status and disabled state when option is disabled and closed', () => {
    const closedOption: WeekSelectorOption = {
      ...baseOption,
      isCurrent: false,
      isClosed: true,
      disabled: true,
    }

    render(
      <WeekSelectorOptionItem
        option={closedOption}
        isSelected={false}
        onSelect={vi.fn()}
        onFocusRelative={vi.fn()}
        onFocusEdge={vi.fn()}
        onClose={vi.fn()}
        onSetRef={vi.fn()}
      />,
    )

    const button = screen.getByRole('option')
    expect(button).toBeDisabled()
    expect(screen.getByText('Cerrada · Solo lectura')).toBeInTheDocument()
  })
})
