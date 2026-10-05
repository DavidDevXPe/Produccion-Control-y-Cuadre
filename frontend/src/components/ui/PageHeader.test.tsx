import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders title and description', () => {
    render(
      <PageHeader
        title="Control de Producción"
        description="Gestión integral de jornadas operativas y balances"
      />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Control de Producción' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Gestión integral de jornadas operativas y balances'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/^[A-Z\s]+$/)).not.toBeInTheDocument()
  })

  it('renders eyebrow when provided', () => {
    render(
      <PageHeader
        eyebrow="TRABUNDA · PLANTA"
        title="Dashboard"
        description="Resumen semanal"
      />,
    )

    expect(screen.getByText('TRABUNDA · PLANTA')).toBeInTheDocument()
  })

  it('renders actions container when actions prop is passed', () => {
    render(
      <PageHeader
        title="Jornadas"
        description="Listado de jornadas"
        actions={<button type="button">Nueva Jornada</button>}
        actionsClassName="custom-actions"
      />,
    )

    const button = screen.getByRole('button', { name: 'Nueva Jornada' })
    expect(button).toBeInTheDocument()
    expect(button.parentElement?.className).toContain('custom-actions')
  })
})

