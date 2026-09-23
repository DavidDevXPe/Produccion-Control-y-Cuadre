import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MetricCard } from './MetricCard'

describe('MetricCard', () => {
  it('renders label, value, unit and description', () => {
    render(
      <MetricCard
        label="Envasado de la semana"
        value="1,422.90"
        unit="kg"
        description="4/7 jornadas"
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Envasado de la semana' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1,422.90')).toBeInTheDocument()
    expect(screen.getByText('kg')).toBeInTheDocument()
    expect(screen.getByText('4/7 jornadas')).toBeInTheDocument()
  })

  it('lets the grid decide its height instead of forcing a fixed minimum', () => {
    render(<MetricCard label="Sin descripción" value={1} />)

    const card = screen.getByRole('article')
    expect(card.className).not.toMatch(/(^|\s)(min-)?h-\[/)
    expect(card).toHaveClass('flex', 'flex-col')
  })

  it('keeps the icon decorative for assistive technology', () => {
    render(
      <MetricCard label="Con icono" value={2} icon={<svg data-testid="icon" />} />,
    )

    expect(screen.getByTestId('icon').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })
})
