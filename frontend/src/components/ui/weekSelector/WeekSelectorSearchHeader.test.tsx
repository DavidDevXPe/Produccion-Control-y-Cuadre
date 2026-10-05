import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WeekSelectorSearchHeader } from './WeekSelectorSearchHeader'
import type { WeekSelectorOption } from './weekSelectorTypes'

describe('WeekSelectorSearchHeader', () => {
  const currentOption: WeekSelectorOption = {
    number: 38,
    year: 2026,
    startDate: '2026-09-14',
    endDate: '2026-09-20',
    periodLabel: '14 - 20 sep',
    isCurrent: true,
  }

  it('returns null when shouldShowSearch and showCurrentWeekAction are both false', () => {
    const ref = React.createRef<HTMLInputElement>()
    const { container } = render(
      <WeekSelectorSearchHeader
        shouldShowSearch={false}
        showCurrentWeekAction={false}
        currentOption={currentOption}
        searchQuery=""
        searchInputRef={ref}
        onSearchChange={vi.fn()}
        onClose={vi.fn()}
        onFocusFirstOption={vi.fn()}
        onSelectWeek={vi.fn()}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders search input when shouldShowSearch is true and handles change and keys', () => {
    const ref = React.createRef<HTMLInputElement>()
    const handleSearchChange = vi.fn()
    const handleClose = vi.fn()
    const handleFocusFirst = vi.fn()

    render(
      <WeekSelectorSearchHeader
        shouldShowSearch={true}
        showCurrentWeekAction={false}
        currentOption={currentOption}
        searchQuery="38"
        searchInputRef={ref}
        onSearchChange={handleSearchChange}
        onClose={handleClose}
        onFocusFirstOption={handleFocusFirst}
        onSelectWeek={vi.fn()}
      />,
    )

    const input = screen.getByRole('searchbox')
    expect(input).toHaveValue('38')

    fireEvent.change(input, { target: { value: '39' } })
    expect(handleSearchChange).toHaveBeenCalledWith('39')

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledWith(true)

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(handleFocusFirst).toHaveBeenCalled()
  })

  it('renders button to go to current week and handles click', () => {
    const ref = React.createRef<HTMLInputElement>()
    const handleSelectWeek = vi.fn()

    render(
      <WeekSelectorSearchHeader
        shouldShowSearch={false}
        showCurrentWeekAction={true}
        currentOption={currentOption}
        searchQuery=""
        searchInputRef={ref}
        onSearchChange={vi.fn()}
        onClose={vi.fn()}
        onFocusFirstOption={vi.fn()}
        onSelectWeek={handleSelectWeek}
      />,
    )

    const button = screen.getByRole('button', { name: /Ir a semana actual/i })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(handleSelectWeek).toHaveBeenCalledWith(currentOption)
  })
})
