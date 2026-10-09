import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProcessSelector } from './ProcessSelector'

describe('ProcessSelector', () => {
  it('switches between Packing and Freezing without changing navigation', () => {
    const onChange = vi.fn()
    render(<ProcessSelector value="PACKING" onChange={onChange} />)

    expect(screen.getByRole('tab', { name: 'Envasado' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Congelamiento' }))
    expect(onChange).toHaveBeenCalledWith('FREEZING')
  })

  it('adds the comparative option only when requested', () => {
    const { rerender } = render(
      <ProcessSelector value="PACKING" onChange={() => undefined} />,
    )
    expect(screen.queryByRole('tab', { name: 'Comparativo' })).toBeNull()

    rerender(
      <ProcessSelector
        value="COMPARISON"
        onChange={() => undefined}
        includeComparison
      />,
    )
    expect(screen.getByRole('tab', { name: 'Comparativo' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('allows selecting Videojet and Palletizado options', () => {
    const onChange = vi.fn()
    render(<ProcessSelector value="PACKING" onChange={onChange} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Videojet' }))
    expect(onChange).toHaveBeenCalledWith('VIDEOJET')

    fireEvent.click(screen.getByRole('tab', { name: 'Paletizado' }))
    expect(onChange).toHaveBeenCalledWith('PALLETIZING')
  })
})
