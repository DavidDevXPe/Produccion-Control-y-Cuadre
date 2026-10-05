import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { closedPackingDay } from '../../../test/productionFixtures'
import { calculateWeeklySummary, kg100 } from '../model/calculations'
import type { WeeklySummary } from '../model/types'
import { DashboardWeeklyValidationBanner } from './DashboardWeeklyValidationBanner'

describe('DashboardWeeklyValidationBanner', () => {
  const createMockSummary = (
    overrides?: Partial<WeeklySummary>,
  ): WeeklySummary => {
    const base = calculateWeeklySummary([closedPackingDay('2026-09-16', 1000)])
    return {
      ...base,
      ...overrides,
    }
  }

  it('renders nothing when weekSummary is null', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardWeeklyValidationBanner weekSummary={null} isWeekValid={false} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders validation section with difference and valid status tone when isWeekValid is true', () => {
    const summary = createMockSummary({ differenceKg100: kg100(250) })

    render(
      <MemoryRouter>
        <DashboardWeeklyValidationBanner weekSummary={summary} isWeekValid={true} />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('region', { name: 'Validación semanal' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Validación semanal de Envasado')).toBeInTheDocument()
    expect(screen.getByText('Diferencia acumulada:')).toBeInTheDocument()
    expect(screen.getByText('2.50 kg')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /Revisar resumen/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/resumen')
  })

  it('applies amber background styling when week is not valid and summary status is not VALID', () => {
    const summary = createMockSummary({
      differenceKg100: kg100(1500),
      status: 'INVALID',
    })

    const { container } = render(
      <MemoryRouter>
        <DashboardWeeklyValidationBanner weekSummary={summary} isWeekValid={false} />
      </MemoryRouter>,
    )

    const iconWrapper = container.querySelector('.bg-amber-500')
    expect(iconWrapper).toBeInTheDocument()
  })

  it('applies sky background styling when week is not strictly valid but summary status is VALID', () => {
    const summary = createMockSummary({
      status: 'VALID',
    })

    const { container } = render(
      <MemoryRouter>
        <DashboardWeeklyValidationBanner weekSummary={summary} isWeekValid={false} />
      </MemoryRouter>,
    )

    const iconWrapper = container.querySelector('.bg-sky-600')
    expect(iconWrapper).toBeInTheDocument()
  })
})

