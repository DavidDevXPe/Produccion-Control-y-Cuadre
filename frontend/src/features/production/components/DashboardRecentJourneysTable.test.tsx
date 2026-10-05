import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { closedFreezingDay, closedPackingDay } from '../../../test/productionFixtures'
import { calculateProductionDay, kg100 } from '../model/calculations'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import type { DashboardJourneyRow } from '../hooks/useDashboardData'
import { DashboardRecentJourneysTable } from './DashboardRecentJourneysTable'

describe('DashboardRecentJourneysTable', () => {
  const buildPackingRow = (
    date: string,
    amountKg: number,
    overrides?: Partial<DashboardJourneyRow>,
  ): DashboardJourneyRow => {
    const day = closedPackingDay(date, amountKg)
    const opState = getProductionDayOperationalState(day)
    return {
      day,
      operationalState: opState,
      calculation: opState.calculation,
      journey: {
        status: 'BALANCED',
        label: 'CUADRADO',
        tone: 'success',
        observations: [],
      },
      process: 'PACKING',
      registeredKg100: kg100(amountKg * 100),
      ...overrides,
    }
  }

  const buildFreezingRow = (
    date: string,
    reportedKg: number,
    overrides?: Partial<DashboardJourneyRow>,
  ): DashboardJourneyRow => {
    const packingOrigin = closedPackingDay('2026-09-16', 1000)
    const day = closedFreezingDay({
      date,
      reportedKg,
      linkedKg: reportedKg,
      origin: packingOrigin,
    })
    const calculation = calculateProductionDay(day)
    const opState = getProductionDayOperationalState(day)
    return {
      day,
      operationalState: opState,
      calculation,
      journey: {
        status: 'BALANCED_OBSERVED',
        label: 'CUADRADO · OBSERVADO',
        tone: 'warning',
        observations: [{ code: 'OBS-1', message: 'Nota de congelado' }],
      },
      process: 'FREEZING',
      registeredKg100: kg100(reportedKg * 100),
      ...overrides,
    }
  }

  it('renders table headers and empty state table without errors', () => {
    render(
      <MemoryRouter>
        <DashboardRecentJourneysTable journeyRows={[]} packingWeekNumber={38} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Últimas jornadas')).toBeInTheDocument()
    expect(screen.getByText('Fecha')).toBeInTheDocument()
    expect(screen.getByText('Proceso')).toBeInTheDocument()
    expect(screen.getByText('Kg registrados')).toBeInTheDocument()
    expect(screen.getByText('Aprovechamiento')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Detalle')).toBeInTheDocument()
  })

  it('renders packing row with formatted date, process, kg, yield, and status', () => {
    const packingRow = buildPackingRow('2026-09-16', 1000)

    render(
      <MemoryRouter>
        <DashboardRecentJourneysTable
          journeyRows={[packingRow]}
          packingWeekNumber={38}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Envasado')).toBeInTheDocument()
    expect(screen.getByText('1,000.00 kg')).toBeInTheDocument()
    expect(screen.getByText('CUADRADO')).toBeInTheDocument()

    const detailLink = screen.getByRole('link', { name: /Ver jornada de/i })
    expect(detailLink).toHaveAttribute(
      'href',
      '/jornadas/2026-09-16?process=PACKING',
    )
  })

  it('renders NO APLICA for freezing process journeys', () => {
    const freezingRow = buildFreezingRow('2026-09-17', 850)

    render(
      <MemoryRouter>
        <DashboardRecentJourneysTable
          journeyRows={[freezingRow]}
          packingWeekNumber={38}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Congelamiento')).toBeInTheDocument()
    expect(screen.getByText('850.00 kg')).toBeInTheDocument()
    expect(screen.getByText('NO APLICA')).toBeInTheDocument()
    expect(screen.getByText('CUADRADO · OBSERVADO')).toBeInTheDocument()
  })

  it('renders NO APLICA for balance-only packing journeys', () => {
    const balanceOnlyDay = {
      ...closedPackingDay('2026-09-18', 400),
      operationMode: 'BALANCE_ONLY' as const,
    }
    const opState = getProductionDayOperationalState(balanceOnlyDay)
    const row: DashboardJourneyRow = {
      day: balanceOnlyDay,
      operationalState: opState,
      calculation: opState.calculation,
      journey: {
        status: 'BALANCED',
        label: 'CUADRADO',
        tone: 'success',
        observations: [],
      },
      process: 'PACKING',
      registeredKg100: kg100(40000),
    }

    render(
      <MemoryRouter>
        <DashboardRecentJourneysTable
          journeyRows={[row]}
          packingWeekNumber={38}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('NO APLICA')).toBeInTheDocument()
  })
})
