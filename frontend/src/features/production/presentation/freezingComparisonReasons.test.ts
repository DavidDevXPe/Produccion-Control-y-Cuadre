import { describe, expect, it } from 'vitest'
import { kg } from '../model/calculations'
import { calculateFreezingComparison } from '../model/freezing'
import {
  closedFreezingDay,
  closedPackingDay,
} from '../../../test/productionFixtures'
import { describeFreezingReviewReasons } from './freezingComparisonReasons'

const week = { startDate: '2026-09-07', endDate: '2026-09-13' } as const
const origin = closedPackingDay('2026-09-08', 100_000)

describe('Freezing comparison review reasons', () => {
  it('has nothing to explain when the comparison is balanced', () => {
    const comparison = calculateFreezingComparison(
      [origin, closedFreezingDay({ date: '2026-09-09', reportedKg: 100_000, linkedKg: 100_000, origin })],
      week,
    )

    expect(describeFreezingReviewReasons(comparison)).toEqual([])
  })

  it('explains a link above the physical report with reported, linked and excess amounts', () => {
    const comparison = calculateFreezingComparison(
      [origin, closedFreezingDay({ date: '2026-09-09', reportedKg: 80_000, linkedKg: 100_000, origin })],
      week,
    )
    const reasons = describeFreezingReviewReasons(comparison)
    const linkage = reasons.find((item) => item.reason === 'LINKAGE_EXCESS')

    expect(linkage?.title).toBe('Vinculado por encima de lo reportado')
    expect(linkage?.message).toContain('80,000.00 kg')
    expect(linkage?.message).toContain('100,000.00 kg')
    expect(linkage?.message).toContain('20,000.00 kg de exceso')
    expect(comparison.linkageExcessKg100).toBe(kg(20_000))
  })

  it('explains physical quantity without origin as an unexplained difference', () => {
    const comparison = calculateFreezingComparison(
      [origin, closedFreezingDay({ date: '2026-09-09', reportedKg: 120_000, linkedKg: 100_000, origin })],
      week,
    )

    expect(
      describeFreezingReviewReasons(comparison).map((item) => item.reason),
    ).toEqual(['UNEXPLAINED_DIFFERENCE'])
  })
})
