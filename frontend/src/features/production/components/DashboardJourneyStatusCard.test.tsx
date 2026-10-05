import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import {
  DashboardJourneyStatusCard,
  type DashboardJourneyStatusCardProps,
} from './DashboardJourneyStatusCard'

describe('DashboardJourneyStatusCard', () => {
  const defaultProps: DashboardJourneyStatusCardProps = {
    packingDaysCount: 5,
    freezingDaysCount: 4,
    balancedJourneyCount: 6,
    observedJourneyCount: 2,
    reviewJourneyCount: 1,
    notBalancedJourneyCount: 0,
    registeredJourneyCount: 9,
    registeredOperationalDayCount: 5,
  }

  it('renders title, description, and link to journeys', () => {
    render(
      <MemoryRouter>
        <DashboardJourneyStatusCard {...defaultProps} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Estado de jornadas')).toBeInTheDocument()
    expect(
      screen.getByText('9 jornadas en 5 de 7 días.'),
    ).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /Ver jornadas/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/jornadas')
  })

  it('renders progress bars for packing and freezing coverage', () => {
    render(
      <MemoryRouter>
        <DashboardJourneyStatusCard {...defaultProps} />
      </MemoryRouter>,
    )

    const packingBar = screen.getByRole('progressbar', {
      name: 'Cobertura de Envasado',
    })
    expect(packingBar).toHaveAttribute('aria-valuenow', '5')
    expect(packingBar).toHaveAttribute('aria-valuetext', '5 de 7 jornadas')

    const freezingBar = screen.getByRole('progressbar', {
      name: 'Cobertura de Congelamiento',
    })
    expect(freezingBar).toHaveAttribute('aria-valuenow', '4')
    expect(freezingBar).toHaveAttribute('aria-valuetext', '4 de 7 jornadas')
  })

  it('renders status counters for balanced, observed, and review counts', () => {
    render(
      <MemoryRouter>
        <DashboardJourneyStatusCard {...defaultProps} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Cuadradas')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('Sin observaciones')).toBeInTheDocument()

    expect(screen.getByText('Con observación')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Cuadradas con nota')).toBeInTheDocument()

    expect(screen.getByText('Por revisar')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Pendientes o no cuadradas')).toBeInTheDocument()
  })

  it('renders "Por revisar" with danger tone styling when notBalancedJourneyCount > 0', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardJourneyStatusCard
          {...defaultProps}
          notBalancedJourneyCount={2}
          reviewJourneyCount={2}
        />
      </MemoryRouter>,
    )

    const dangerCounter = container.querySelector('.border-rose-300')
    expect(dangerCounter).toBeInTheDocument()
  })
})

