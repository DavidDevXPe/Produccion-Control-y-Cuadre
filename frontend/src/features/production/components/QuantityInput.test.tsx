import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QuantityInput } from './QuantityInput'
import { formatQuantityWithThousands, sanitizeQuantityValue } from './quantityInputUtils'

describe('quantityInputUtils', () => {
  describe('sanitizeQuantityValue', () => {
    it('normalizes commas to dots', () => {
      expect(sanitizeQuantityValue('12,5')).toBe('12.5')
      expect(sanitizeQuantityValue('0,75')).toBe('0.75')
    })

    it('normalizes pasted values with thousands separators', () => {
      expect(sanitizeQuantityValue('12,031.50')).toBe('12031.50')
      expect(sanitizeQuantityValue('12031,5')).toBe('12031.5')
      expect(sanitizeQuantityValue('12,031')).toBe('12031')
      expect(sanitizeQuantityValue('1,234,567.89')).toBe('1234567.89')
      expect(sanitizeQuantityValue('12.031,50')).toBe('12031.50')
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

  describe('formatQuantityWithThousands', () => {
    it('formats integers with thousands separators', () => {
      expect(formatQuantityWithThousands('12031')).toBe('12,031')
      expect(formatQuantityWithThousands('1234567')).toBe('1,234,567')
      expect(formatQuantityWithThousands('100')).toBe('100')
      expect(formatQuantityWithThousands('0')).toBe('0')
      expect(formatQuantityWithThousands('')).toBe('')
    })

    it('formats decimals preserving entered digits without forcing extra zeros', () => {
      expect(formatQuantityWithThousands('12031.5')).toBe('12,031.5')
      expect(formatQuantityWithThousands('12031.25')).toBe('12,031.25')
      expect(formatQuantityWithThousands('12031.')).toBe('12,031')
      expect(formatQuantityWithThousands('0.75')).toBe('0.75')
    })
  })
})

describe('QuantityInput', () => {
  it('renders label, formatted thousands value on blur, and kg suffix', () => {
    render(<QuantityInput label="Materia prima" value="1250.50" onChange={vi.fn()} />)
    expect(screen.getByText('Materia prima')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1,250.50')).toBeInTheDocument()
    expect(screen.getByText('kg')).toBeInTheDocument()
  })

  it('switches to raw editable value on focus and restores formatted value on blur', () => {
    const { rerender } = render(
      <QuantityInput label="Materia prima" value="12031.5" onChange={vi.fn()} />,
    )
    const input = screen.getByDisplayValue('1,2031.5'.includes(',') ? '12,031.5' : '12031.5') as HTMLInputElement
    expect(input.value).toBe('12,031.5')

    // Focus: should show raw value
    fireEvent.focus(input)
    expect(input.value).toBe('12031.5')

    // Blur: should show formatted value again
    fireEvent.blur(input)
    expect(input.value).toBe('12,031.5')

    // When value updates from parent
    rerender(<QuantityInput label="Materia prima" value="42516" onChange={vi.fn()} />)
    expect(input.value).toBe('42,516')
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

  it('handles pasted formatted strings and emits normalized raw values', () => {
    const handleChange = vi.fn()
    render(<QuantityInput label="Materia prima" value="" onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '12,031.50' } })
    expect(handleChange).toHaveBeenCalledWith('12031.50')

    fireEvent.change(input, { target: { value: '12031,5' } })
    expect(handleChange).toHaveBeenCalledWith('12031.5')
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
