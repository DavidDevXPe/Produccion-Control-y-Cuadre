import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SectionCard } from './SectionCard'

describe('SectionCard', () => {
  it('renders children with default classes', () => {
    render(
      <SectionCard>
        <p>Contenido principal</p>
      </SectionCard>,
    )

    expect(screen.getByText('Contenido principal')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders header with title, description, and action when provided', () => {
    render(
      <SectionCard
        title="Detalle de Lotes"
        description="Listado de lotes ingresados"
        action={<button type="button">Exportar</button>}
      >
        <div>Tabla de lotes</div>
      </SectionCard>,
    )

    expect(
      screen.getByRole('heading', { level: 2, name: 'Detalle de Lotes' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Listado de lotes ingresados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument()
  })

  it('applies overflow-clip when allowStickyContent is true, and overflow-hidden otherwise', () => {
    const { container: container1 } = render(
      <SectionCard allowStickyContent={true}>
        <div>Sticky</div>
      </SectionCard>,
    )
    expect(container1.querySelector('section')?.className).toContain(
      'overflow-clip',
    )

    const { container: container2 } = render(
      <SectionCard allowStickyContent={false}>
        <div>Non-sticky</div>
      </SectionCard>,
    )
    expect(container2.querySelector('section')?.className).toContain(
      'overflow-hidden',
    )
  })

  it('applies contentClassName to content container', () => {
    render(
      <SectionCard contentClassName="p-6 space-y-4">
        <div>Contenido</div>
      </SectionCard>,
    )

    const contentDiv = screen.getByText('Contenido').parentElement
    expect(contentDiv?.className).toContain('p-6')
    expect(contentDiv?.className).toContain('space-y-4')
  })
})

