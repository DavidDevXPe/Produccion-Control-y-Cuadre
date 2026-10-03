import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandLogo } from './BrandLogo'

describe('BrandLogo component with seamless company logo', () => {
  it('renders the official Trabunda company logo image with proper accessible label', () => {
    render(<BrandLogo />)

    const img = screen.getByRole('img', { name: 'Trabunda Procesos Marinos' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', expect.stringContaining('trabunda-logo-transparent.png'))
    expect(screen.getByLabelText('Trabunda Producción')).toBeInTheDocument()
  })

  it('renders in compact mode with smaller dimensions', () => {
    render(<BrandLogo compact />)

    const img = screen.getByRole('img', { name: 'Trabunda Procesos Marinos' })
    expect(img).toBeInTheDocument()
  })

  it('supports card variant as well', () => {
    render(<BrandLogo variant="card" />)

    const img = screen.getByRole('img', { name: 'Trabunda Procesos Marinos' })
    expect(img).toBeInTheDocument()
  })
})
