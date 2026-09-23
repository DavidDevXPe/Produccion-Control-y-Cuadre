import { describe, expect, it } from 'vitest'
import {
  closedFreezingDay,
  closedPackingDay,
} from '../../../test/productionFixtures'
import { kg } from './calculations'
import { calculateFreezingComparison } from './freezing'
import { getProductionDayOperationalState } from './productionLifecycle'

const week = { startDate: '2026-09-07', endDate: '2026-09-13' } as const
const origin = closedPackingDay('2026-09-08', 100_000)

function compare(reportedKg: number, linkedKg: number) {
  const freezing = closedFreezingDay({
    date: '2026-09-09',
    reportedKg,
    linkedKg,
    origin,
  })

  return { freezing, comparison: calculateFreezingComparison([origin, freezing], week) }
}

describe('Freezing comparison status', () => {
  it('is CONCILIADO when everything packed is physically frozen and linked', () => {
    const { comparison } = compare(100_000, 100_000)

    expect(comparison.status).toBe('BALANCED')
    expect(comparison.reviewReasons).toEqual([])
    expect(comparison.unexplainedDifferenceKg100).toBe(0)
    expect(comparison.linkageExcessKg100).toBe(0)
  })

  it('stays CONCILIADO with a legitimate pending balance: Freezing need not consume everything', () => {
    const { comparison } = compare(60_000, 60_000)

    expect(comparison.status).toBe('BALANCED')
    expect(comparison.pendingKg100).toBe(kg(40_000))
    expect(comparison.physicalReportedKg100).toBe(kg(60_000))
    expect(comparison.linkedKg100).toBe(kg(60_000))
  })

  it('needs review when physical Freezing has no origin, and keeps that quantity separate', () => {
    const { comparison } = compare(120_000, 100_000)

    expect(comparison.status).toBe('REVIEW')
    expect(comparison.reviewReasons).toEqual(['UNEXPLAINED_DIFFERENCE'])
    expect(comparison.physicalReportedKg100).toBe(kg(120_000))
    expect(comparison.linkedKg100).toBe(kg(100_000))
    expect(comparison.unlinkedPhysicalKg100).toBe(kg(20_000))
    expect(comparison.linkageExcessKg100).toBe(0)
  })

  describe('linked above the physical report (80 t reported, 100 t linked)', () => {
    const { freezing, comparison } = compare(80_000, 100_000)

    it('is REVIEW even though the net difference is zero', () => {
      expect(comparison.unexplainedDifferenceKg100).toBe(0)
      expect(comparison.status).toBe('REVIEW')
      expect(comparison.reviewReasons).toContain('LINKAGE_EXCESS')
    })

    it('keeps physical, linked, pending and excess as different concepts', () => {
      expect(comparison.physicalReportedKg100).toBe(kg(80_000))
      expect(comparison.linkedKg100).toBe(kg(100_000))
      expect(comparison.unlinkedPhysicalKg100).toBe(0)
      expect(comparison.pendingKg100).toBe(0)
      expect(comparison.linkageExcessKg100).toBe(kg(20_000))
    })

    it('reports the excess in the family and product rows', () => {
      expect(comparison.byFamily[0]?.linkageExcessKg100).toBe(kg(20_000))
      expect(comparison.byProduct[0]?.linkageExcessKg100).toBe(kg(20_000))
    })

    it('also carries the journey integrity issues that the closure validation already raises', () => {
      const state = getProductionDayOperationalState(freezing)

      expect(state.isBalanced).toBe(false)
      expect(comparison.integrityIssueCount).toBe(
        state.calculation.integrityIssues.length,
      )
      expect(comparison.reviewReasons).toContain('INTEGRITY_ISSUES')
    })
  })

  it('needs review when an origin is consumed above what Packing generated', () => {
    const { comparison } = compare(150_000, 150_000)

    expect(comparison.status).toBe('REVIEW')
    expect(comparison.reviewReasons).toContain('ORIGIN_EXCESS')
    expect(comparison.originExcessKg100).toBe(kg(50_000))
    expect(comparison.unexplainedDifferenceKg100).toBeLessThan(0)
  })

  it('counts links to a product the Freezing report does not list as linked above a physical report of zero', () => {
    const { freezing } = compare(100_000, 100_000)
    const comparison = calculateFreezingComparison(
      [origin, { ...freezing, lines: [] }],
      week,
    )

    expect(comparison.physicalReportedKg100).toBe(0)
    expect(comparison.linkedKg100).toBe(kg(100_000))
    expect(comparison.linkageExcessKg100).toBe(kg(100_000))
    expect(comparison.status).toBe('REVIEW')
  })

  it('ignores Freezing journeys outside the compared period', () => {
    const { freezing } = compare(80_000, 100_000)
    const comparison = calculateFreezingComparison([origin, freezing], {
      startDate: '2026-09-14',
      endDate: '2026-09-20',
    })

    expect(comparison.linkageExcessKg100).toBe(0)
    expect(comparison.reviewReasons).not.toContain('LINKAGE_EXCESS')
  })
})
