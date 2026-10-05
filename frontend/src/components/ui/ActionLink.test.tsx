import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ActionLink } from './ActionLink'

describe('ActionLink', () => {
  it('renders link with default variant (primary) and size (md)', () => {
    render(
      <MemoryRouter>
        <ActionLink to="/test">Click me</ActionLink>
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Click me' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
    expect(link.className).toContain('min-h-10')
    expect(link.className).toContain('bg-brand-700')
  })

  it('renders secondary variant with appropriate classes', () => {
    render(
      <MemoryRouter>
        <ActionLink to="/secondary" variant="secondary">
          Secondary Action
        </ActionLink>
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Secondary Action' })
    expect(link.className).toContain('border-slate-300')
  })

  it('renders ghost variant and sm size', () => {
    render(
      <MemoryRouter>
        <ActionLink to="/ghost" variant="ghost" size="sm">
          Ghost Action
        </ActionLink>
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Ghost Action' })
    expect(link.className).toContain('bg-transparent')
    expect(link.className).toContain('min-h-9')
    expect(link.className).toContain('px-3')
  })

  it('merges custom className without losing base classes', () => {
    render(
      <MemoryRouter>
        <ActionLink to="/custom" className="custom-class-123">
          Custom
        </ActionLink>
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Custom' })
    expect(link.className).toContain('custom-class-123')
    expect(link.className).toContain('inline-flex')
  })
})

