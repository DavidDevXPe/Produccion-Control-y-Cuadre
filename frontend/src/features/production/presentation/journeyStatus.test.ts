import { describe, expect, it } from 'vitest'
import { WEEK_36_2026_PRODUCTION_DAYS } from '../data/week36'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import {
  getJourneyObservations,
  getJourneyStatus,
  type JourneyStateInput,
} from './journeyStatus'

const warning = { code: 'GENERAL_YIELD_BELOW_MIN', message: 'Por debajo de 80%' }

function state(overrides: {
  lifecycle?: JourneyStateInput['lifecycle']
  isBalanced?: boolean
  warnings?: readonly { code: string; message: string }[]
  integrityIssues?: readonly unknown[]
}): JourneyStateInput {
  return {
    lifecycle: overrides.lifecycle ?? 'CLOSED',
    isBalanced: overrides.isBalanced ?? true,
    validation: { warnings: overrides.warnings ?? [] },
    calculation: { integrityIssues: overrides.integrityIssues ?? [] },
  }
}

describe('journey status', () => {
  it('marks a closed balanced journey without observations as CUADRADO', () => {
    expect(getJourneyStatus({}, state({}))).toMatchObject({
      status: 'BALANCED',
      label: 'CUADRADO',
      tone: 'success',
    })
  })

  it('marks a closed balanced journey with persisted observations as CUADRADO · OBSERVADO', () => {
    const view = getJourneyStatus(
      { closureObservations: [{ closedAt: '2026-09-05', ...warning }] },
      state({}),
    )

    expect(view).toMatchObject({
      status: 'BALANCED_OBSERVED',
      label: 'CUADRADO · OBSERVADO',
      tone: 'warning',
    })
    expect(view.observations).toHaveLength(1)
  })

  it('keeps validation warnings of historical journeys that have no persisted observations', () => {
    const view = getJourneyStatus({}, state({ warnings: [warning] }))

    expect(view.status).toBe('BALANCED_OBSERVED')
    expect(view.observations).toEqual([warning])
  })

  it('prefers persisted observations over validation warnings', () => {
    const persisted = { closedAt: '2026-09-05', code: 'X', message: 'Aceptada' }

    expect(
      getJourneyObservations(
        { closureObservations: [persisted] },
        state({ warnings: [warning] }),
      ),
    ).toEqual([persisted])
  })

  it('shows a draft as POR REVISAR in amber, never as a critical failure', () => {
    expect(
      getJourneyStatus(
        {},
        state({ lifecycle: 'DRAFT', isBalanced: false, warnings: [warning] }),
      ),
    ).toMatchObject({ status: 'PENDING_REVIEW', tone: 'warning' })
  })

  it('reserves red for a closed journey that does not balance', () => {
    expect(
      getJourneyStatus({}, state({ lifecycle: 'CLOSED', isBalanced: false })),
    ).toMatchObject({
      status: 'NOT_BALANCED',
      label: 'NO CUADRADO',
      tone: 'danger',
    })
  })

  it('reserves red for blocking integrity issues even when the journey is a draft', () => {
    expect(
      getJourneyStatus(
        {},
        state({
          lifecycle: 'DRAFT',
          isBalanced: false,
          integrityIssues: [{ code: 'BALANCE_OVERUSED' }],
        }),
      ),
    ).toMatchObject({ status: 'NOT_BALANCED', tone: 'danger' })
  })

  it('classifies the closed week 41 journeys as balanced with observations', () => {
    const statuses = WEEK_36_2026_PRODUCTION_DAYS.map((day) =>
      getJourneyStatus(day, getProductionDayOperationalState(day)),
    )

    expect(statuses.length).toBeGreaterThan(0)
    for (const view of statuses) {
      expect(view.status).toBe('BALANCED_OBSERVED')
      expect(view.observations.length).toBeGreaterThan(0)
    }
  })
})
