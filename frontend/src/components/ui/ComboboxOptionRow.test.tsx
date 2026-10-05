import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ComboboxOptionRow } from './ComboboxOptionRow'
import type { ComboboxOption } from './Combobox'

describe('ComboboxOptionRow', () => {
  const option: ComboboxOption = {
    value: 'opt-1',
    label: 'FILETE DE POTA',
    secondaryText: 'POTA-001',
  }

  it('renders option with role, id, label and secondary text', () => {
    const handleSelect = vi.fn()
    render(
      <ComboboxOptionRow
        id="combobox-opt-0"
        opt={option}
        index={0}
        isSelected={false}
        onSelect={handleSelect}
      />,
    )

    const el = screen.getByRole('option', { name: /FILETE DE POTA/i })
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('id', 'combobox-opt-0')
    expect(el).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByText('POTA-001')).toBeInTheDocument()
  })

  it('applies selected styles and aria-selected true when isSelected is true', () => {
    render(
      <ComboboxOptionRow
        id="combobox-opt-1"
        opt={option}
        index={1}
        isSelected={true}
        onSelect={vi.fn()}
      />,
    )

    const el = screen.getByRole('option')
    expect(el).toHaveAttribute('aria-selected', 'true')
    expect(el.className).toContain('bg-brand-100')
  })

  it('calls onSelect with option when clicked', () => {
    const handleSelect = vi.fn()
    render(
      <ComboboxOptionRow
        id="combobox-opt-2"
        opt={option}
        index={2}
        isSelected={false}
        onSelect={handleSelect}
      />,
    )

    fireEvent.click(screen.getByRole('option'))
    expect(handleSelect).toHaveBeenCalledWith(option)
  })
})

