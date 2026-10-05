import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { kg100 } from '../model/calculations'
import type { PendingFamilyBalance } from '../hooks/useDashboardData'
import { DashboardPendingBalancesCard } from './DashboardPendingBalancesCard'

describe('DashboardPendingBalancesCard', () => {
  it('renders empty state when there are no pending family balances', () => {
    render(
      <MemoryRouter>
        <DashboardPendingBalancesCard
          pendingBalancesByFamily={[]}
          hiddenPendingFamilyCount={0}
          pendingTraceableKg100={kg100(0)}
          packingWeekNumber={38}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Saldos pendientes por familia')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Envasado de la semana 38 que todavía puede pasar a Congelamiento.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('No existe saldo trazable pendiente de congelar.'),
    ).toBeInTheDocument()
  })

  it('renders family items with rank, name, formatted kg, and singular/plural product counts', () => {
    const families: PendingFamilyBalance[] = [
      {
        familyName: 'PULPAS',
        pendingKg100: kg100(45000),
        productIds: new Set(['PULP-1', 'PULP-2']),
      },
      {
        familyName: 'CONCENTRADOS',
        pendingKg100: kg100(12500),
        productIds: new Set(['CONC-1']),
      },
    ]

    render(
      <MemoryRouter>
        <DashboardPendingBalancesCard
          pendingBalancesByFamily={families}
          hiddenPendingFamilyCount={0}
          pendingTraceableKg100={kg100(57500)}
          packingWeekNumber={38}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('PULPAS')).toBeInTheDocument()
    expect(screen.getByText('450.00 kg')).toBeInTheDocument()
    expect(screen.getByText('2 productos pendientes')).toBeInTheDocument()

    expect(screen.getByText('CONCENTRADOS')).toBeInTheDocument()
    expect(screen.getByText('125.00 kg')).toBeInTheDocument()
    expect(screen.getByText('1 producto pendiente')).toBeInTheDocument()

    expect(screen.getByText('Pendiente trazable total')).toBeInTheDocument()
    expect(screen.getByText('575.00 kg')).toBeInTheDocument()
  })

  it('renders additional families link when hiddenPendingFamilyCount > 0', () => {
    const families: PendingFamilyBalance[] = [
      {
        familyName: 'PULPAS',
        pendingKg100: kg100(45000),
        productIds: new Set(['PULP-1']),
      },
    ]

    render(
      <MemoryRouter>
        <DashboardPendingBalancesCard
          pendingBalancesByFamily={families}
          hiddenPendingFamilyCount={4}
          pendingTraceableKg100={kg100(80000)}
          packingWeekNumber={38}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('4 familias adicionales')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Ver todos los saldos/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Pendiente trazable total'),
    ).not.toBeInTheDocument()
  })
})
