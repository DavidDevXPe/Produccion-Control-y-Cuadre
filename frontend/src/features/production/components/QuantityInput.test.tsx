import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QuantityInput } from './QuantityInput'

describe('QuantityInput', () => {
  it('renders label and value', () => {
    render(<QuantityInput label="Materia prima" value="1250.50" onChange={vi.fn()} />)
    expect(screen.getByText('Materia prima')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1250.50')).toBeInTheDocument()
    expect(screen.getByText('kg')).toBeInTheDocument()
  })

  it('clears zero on focus and restores it on blur if left empty', () => {
    const handleChange = vi.fn()
    const { rerender } = render(
      <QuantityInput label="Materia prima" value="0" onChange={handleChange} />,
    )

    const input = screen.getByDisplayValue('0')
    fireEvent.focus(input)
    expect(handleChange).toHaveBeenCalledWith('')

    // Simulate parent state update to empty string
    rerender(<QuantityInput label="Materia prima" value="" onChange={handleChange} />)
    fireEvent.blur(input)
    expect(handleChange).toHaveBeenCalledWith('0')
  })

  it('does not clear positive values on focus', () => {
    const handleChange = vi.fn()
    render(<QuantityInput label="Materia prima" value="450" onChange={handleChange} />)

    const input = screen.getByDisplayValue('450')
    fireEvent.focus(input)
    expect(handleChange).not.toHaveBeenCalled()
  })
})

