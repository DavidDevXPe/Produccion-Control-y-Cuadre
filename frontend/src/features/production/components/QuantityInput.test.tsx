import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QuantityInput } from './QuantityInput'
import { sanitizeQuantityValue } from './quantityInputUtils'

describe('sanitizeQuantityValue', () => {
  it('normalizes commas to dots', () => {
    expect(sanitizeQuantityValue('12,5')).toBe('12.5')
    expect(sanitizeQuantityValue('0,75')).toBe('0.75')
  })

  it('allows empty string and integers', () => {
    expect(sanitizeQuantityValue('')).toBe('')
    expect(sanitizeQuantityValue('100')).toBe('100')
  })

  it('allows up to 2 decimal places and trailing dot while typing', () => {
    expect(sanitizeQuantityValue('10.')).toBe('10.')
    expect(sanitizeQuantityValue('10.5')).toBe('10.5')
    expect(sanitizeQuantityValue('10.55')).toBe('10.55')
  })

  it('rejects more than 2 decimals', () => {
    expect(sanitizeQuantityValue('10.555')).toBeNull()
  })

  it('rejects letters, negative numbers and extra dots', () => {
    expect(sanitizeQuantityValue('abc')).toBeNull()
    expect(sanitizeQuantityValue('-10')).toBeNull()
    expect(sanitizeQuantityValue('10.5.2')).toBeNull()
  })
})

describe('QuantityInput', () => {
  it('renders label and value', () => {
    render(<QuantityInput label="Materia prima" value="1250.50" onChange={vi.fn()} />)
    expect(screen.getByText('Materia prima')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1250.50')).toBeInTheDocument()
    expect(screen.getByText('kg')).toBeInTheDocument()
  })

  it('clears zero on focus, selects all text, and restores it on blur if left empty', () => {
    const handleChange = vi.fn()
    const { rerender } = render(
      <QuantityInput label="Materia prima" value="0" onChange={handleChange} />,
    )

    const input = screen.getByDisplayValue('0') as HTMLInputElement
    const selectSpy = vi.spyOn(input, 'select')
    fireEvent.focus(input)
    expect(handleChange).toHaveBeenCalledWith('')
    expect(selectSpy).toHaveBeenCalled()

    // Simulate parent state update to empty string
    rerender(<QuantityInput label="Materia prima" value="" onChange={handleChange} />)
    fireEvent.blur(input)
    expect(handleChange).toHaveBeenCalledWith('0')
  })

  it('does not clear positive values on focus but still selects all text', () => {
    const handleChange = vi.fn()
    render(<QuantityInput label="Materia prima" value="450" onChange={handleChange} />)

    const input = screen.getByDisplayValue('450') as HTMLInputElement
    const selectSpy = vi.spyOn(input, 'select')
    fireEvent.focus(input)
    expect(handleChange).not.toHaveBeenCalled()
    expect(selectSpy).toHaveBeenCalled()
  })

  it('sanitizes input on change, converting comma to dot', () => {
    const handleChange = vi.fn()
    render(<QuantityInput label="Materia prima" value="45" onChange={handleChange} />)

    const input = screen.getByDisplayValue('45')
    fireEvent.change(input, { target: { value: '45,5' } })
    expect(handleChange).toHaveBeenCalledWith('45.5')
  })

  it('ignores invalid changes (letters, >2 decimals)', () => {
    const handleChange = vi.fn()
    render(<QuantityInput label="Materia prima" value="45" onChange={handleChange} />)

    const input = screen.getByDisplayValue('45')
    fireEvent.change(input, { target: { value: '45a' } })
    expect(handleChange).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '45.123' } })
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('blurs on mouse wheel event to prevent accidental changes', () => {
    render(<QuantityInput label="Materia prima" value="100" onChange={vi.fn()} />)
    const input = screen.getByDisplayValue('100') as HTMLInputElement
    const blurSpy = vi.spyOn(input, 'blur')
    fireEvent.wheel(input)
    expect(blurSpy).toHaveBeenCalled()
  })
})
