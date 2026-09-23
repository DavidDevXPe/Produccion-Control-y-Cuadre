import { describe, expect, it } from 'vitest'
import { kg100 } from '../model/calculations'
import {
  buildDashboardAttentionItems,
  summarizeDashboardAttention,
  type AttentionJourney,
  type DashboardAttentionInput,
} from './dashboardAttention'

function journey(
  date: string,
  overrides: {
    status?: 'DRAFT' | 'CLOSED'
    differenceKg100?: number
    integrity?: readonly { code: string; message: string }[]
    observations?: readonly { code: string; message: string }[]
    journeyStatus?: AttentionJourney['journey']['status']
  } = {},
): AttentionJourney {
  return {
    day: { id: `day-${date}`, date, status: overrides.status ?? 'CLOSED' },
    calculation: {
      differenceKg100: kg100(overrides.differenceKg100 ?? 0),
      day: { detailDifferenceKg100: kg100(0) },
      night: { detailDifferenceKg100: kg100(0) },
      integrityIssues: overrides.integrity ?? [],
    } as unknown as AttentionJourney['calculation'],
    journey: {
      status: overrides.journeyStatus ?? 'BALANCED',
      observations: overrides.observations ?? [],
    },
  }
}

const observation = { code: 'GENERAL_YIELD_BELOW_MIN', message: 'Por debajo de 80%' }

function input(overrides: Partial<DashboardAttentionInput> = {}): DashboardAttentionInput {
  return {
    packingDays: [],
    freezingDays: [],
    comparison: {
      unexplainedDifferenceKg100: kg100(0),
      physicalReportedKg100: kg100(0),
      linkedKg100: kg100(0),
      linkageExcessKg100: kg100(0),
    },
    freezingPositions: [],
    weekEndDate: '2026-09-13',
    ...overrides,
  }
}

describe('dashboard attention items', () => {
  it('has no items for balanced journeys without observations or traceability problems', () => {
    expect(
      buildDashboardAttentionItems(input({ packingDays: [journey('2026-09-08')] })),
    ).toEqual([])
  })

  it('orders critical events before observations, newest first inside each level', () => {
    const items = buildDashboardAttentionItems(
      input({
        packingDays: [
          journey('2026-09-08', { journeyStatus: 'BALANCED_OBSERVED', observations: [observation] }),
          journey('2026-09-10', { journeyStatus: 'BALANCED_OBSERVED', observations: [observation] }),
          journey('2026-09-09', { integrity: [{ code: 'X', message: 'Sobreuso' }], journeyStatus: 'NOT_BALANCED' }),
        ],
      }),
    )

    expect(items.map((item) => [item.tone, item.date])).toEqual([
      ['danger', '2026-09-09'],
      ['warning', '2026-09-10'],
      ['warning', '2026-09-08'],
    ])
  })

  it('treats a difference on an open journey as follow-up (amber) and on a closed one as critical (red)', () => {
    const items = buildDashboardAttentionItems(
      input({
        packingDays: [
          journey('2026-09-08', { status: 'DRAFT', differenceKg100: 500, journeyStatus: 'PENDING_REVIEW' }),
          journey('2026-09-09', { status: 'CLOSED', differenceKg100: 500, journeyStatus: 'NOT_BALANCED' }),
        ],
      }),
    )

    expect(items.find((item) => item.key === 'day-2026-09-08-packing-difference')?.tone).toBe('warning')
    expect(items.find((item) => item.key === 'day-2026-09-09-packing-difference')?.tone).toBe('danger')
  })

  it('adds traceability inconsistencies as critical events linked to where they are investigated', () => {
    const items = buildDashboardAttentionItems(
      input({
        comparison: {
          unexplainedDifferenceKg100: kg100(-2_000_00),
          physicalReportedKg100: kg100(80_000_00),
          linkedKg100: kg100(100_000_00),
          linkageExcessKg100: kg100(20_000_00),
        },
        freezingPositions: [{ excessKg100: kg100(5_000_00) }, { excessKg100: kg100(0) }],
      }),
    )

    expect(items.map((item) => [item.key, item.tone, item.to])).toEqual([
      ['comparison-unexplained-difference', 'danger', '/resumen?view=COMPARISON'],
      ['freezing-linkage-excess', 'danger', '/resumen?view=COMPARISON'],
      ['freezing-excess-over-origin', 'danger', '/saldos'],
    ])
  })

  it('shows at most five events and counts the ones left behind "ver todas"', () => {
    const items = buildDashboardAttentionItems(
      input({
        packingDays: Array.from({ length: 8 }, (_, index) =>
          journey(`2026-09-0${index + 1}`, {
            journeyStatus: 'BALANCED_OBSERVED',
            observations: [observation],
          }),
        ),
      }),
    )
    const summary = summarizeDashboardAttention(items)

    expect(items).toHaveLength(8)
    expect(summary.visible).toHaveLength(5)
    expect(summary.hiddenCount).toBe(3)
    expect(summary.observationCount).toBe(8)
    expect(summary.criticalCount).toBe(0)
    expect(summary.visible.map((item) => item.date)).toEqual([
      '2026-09-08',
      '2026-09-07',
      '2026-09-06',
      '2026-09-05',
      '2026-09-04',
    ])
  })

  it('keeps every critical event visible before any observation when the limit is reached', () => {
    const items = buildDashboardAttentionItems(
      input({
        packingDays: [
          ...Array.from({ length: 6 }, (_, index) =>
            journey(`2026-09-0${index + 1}`, { journeyStatus: 'BALANCED_OBSERVED', observations: [observation] }),
          ),
          journey('2026-09-01', { integrity: [{ code: 'X', message: 'Sobreuso' }], journeyStatus: 'NOT_BALANCED' }),
        ],
      }),
    )
    const summary = summarizeDashboardAttention(items)

    expect(summary.visible[0]?.tone).toBe('danger')
    expect(summary.criticalCount).toBe(1)
  })
})
