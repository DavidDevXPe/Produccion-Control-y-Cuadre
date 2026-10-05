import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders with default neutral tone and icon', () => {
    const { container } = render(<StatusBadge>PENDIENTE</StatusBadge>)

    expect(screen.getByText('PENDIENTE')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.firstElementChild?.className).toContain('text-slate-700')
    expect(container.firstElementChild?.className).toContain('max-w-full')
  })

  it('renders with success tone styles and icon', () => {
    const { container } = render(
      <StatusBadge tone="success">CUADRADO</StatusBadge>,
    )

    expect(screen.getByText('CUADRADO')).toBeInTheDocument()
    expect(container.firstElementChild?.className).toContain('text-emerald-800')
    expect(container.firstElementChild?.className).toContain('bg-emerald-50')
  })

  it('renders with danger tone styles', () => {
    const { container } = render(
      <StatusBadge tone="danger">NO CUADRADO</StatusBadge>,
    )

    expect(screen.getByText('NO CUADRADO')).toBeInTheDocument()
    expect(container.firstElementChild?.className).toContain('text-rose-800')
    expect(container.firstElementChild?.className).toContain('bg-rose-50')
  })

  it('renders with warning, info, orange and yellow tones', () => {
    const { container: cWarn } = render(
      <StatusBadge tone="warning">ALERTA</StatusBadge>,
    )
    expect(cWarn.firstElementChild?.className).toContain('text-amber-900')

    const { container: cInfo } = render(
      <StatusBadge tone="info">INFO</StatusBadge>,
    )
    expect(cInfo.firstElementChild?.className).toContain('text-brand-800')

    const { container: cOrange } = render(
      <StatusBadge tone="orange">NARANJA</StatusBadge>,
    )
    expect(cOrange.firstElementChild?.className).toContain('text-orange-900')

    const { container: cYellow } = render(
      <StatusBadge tone="yellow">AMARILLO</StatusBadge>,
    )
    expect(cYellow.firstElementChild?.className).toContain('text-yellow-900')
  })

  it('omits icon when showIcon is false', () => {
    const { container } = render(
      <StatusBadge showIcon={false}>SIN ICONO</StatusBadge>,
    )

    expect(screen.getByText('SIN ICONO')).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('applies max-w-none when truncateText is false', () => {
    const { container } = render(
      <StatusBadge truncateText={false}>TEXTO LARGO</StatusBadge>,
    )

    expect(container.firstElementChild?.className).toContain('max-w-none')
  })
})

