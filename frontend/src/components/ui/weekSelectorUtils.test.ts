import { describe, expect, it } from 'vitest'
import {
  filterWeekOptions,
  groupWeeksByYear,
  WEEK_SELECTOR_SEARCH_THRESHOLD,
} from './weekSelectorUtils'
import type { WeekSelectorOption } from './weekSelector/weekSelectorTypes'

describe('weekSelectorUtils', () => {
  const sampleOptions: readonly WeekSelectorOption[] = [
    {
      number: 38,
      year: 2026,
      startDate: '2026-09-14',
      endDate: '2026-09-20',
      periodLabel: '14 - 20 sep',
      isCurrent: true,
      hasRecords: true,
      businessStatus: 'OPEN',
      recordCount: 5,
    },
    {
      number: 37,
      year: 2026,
      startDate: '2026-09-07',
      endDate: '2026-09-13',
      periodLabel: '07 - 13 sep',
      isCurrent: false,
      hasRecords: true,
      businessStatus: 'CLOSED',
      recordCount: 6,
    },
    {
      number: 52,
      year: 2025,
      startDate: '2025-12-22',
      endDate: '2025-12-28',
      periodLabel: '22 - 28 dic',
      isCurrent: false,
      hasRecords: true,
      businessStatus: 'OPEN',
      recordCount: 3,
    },
  ]

  it('exports search threshold as 12', () => {
    expect(WEEK_SELECTOR_SEARCH_THRESHOLD).toBe(12)
  })

  describe('filterWeekOptions', () => {
    it('returns all options when query is empty or whitespace', () => {
      expect(filterWeekOptions(sampleOptions, '')).toEqual(sampleOptions)
      expect(filterWeekOptions(sampleOptions, '   ')).toEqual(sampleOptions)
    })

    it('filters by week number', () => {
      const results = filterWeekOptions(sampleOptions, '38')
      expect(results).toHaveLength(1)
      expect(results[0]?.number).toBe(38)
    })

    it('filters by year', () => {
      const results = filterWeekOptions(sampleOptions, '2025')
      expect(results).toHaveLength(1)
      expect(results[0]?.number).toBe(52)
    })

    it('filters by month string in periodLabel', () => {
      const results = filterWeekOptions(sampleOptions, 'sep')
      expect(results).toHaveLength(2)
    })

    it('filters with multi-word terms insensitive to accents and case', () => {
      const results = filterWeekOptions(sampleOptions, '38 sÉp')
      expect(results).toHaveLength(1)
      expect(results[0]?.number).toBe(38)
    })

    it('returns empty array when nothing matches', () => {
      const results = filterWeekOptions(sampleOptions, 'inexistente')
      expect(results).toHaveLength(0)
    })
  })

  describe('groupWeeksByYear', () => {
    it('groups options by year, newest year first, and newest week first within year', () => {
      const groups = groupWeeksByYear(sampleOptions)
      expect(groups).toHaveLength(2)

      expect(groups[0]?.year).toBe(2026)
      expect(groups[0]?.options.map((o) => o.number)).toEqual([38, 37])

      expect(groups[1]?.year).toBe(2025)
      expect(groups[1]?.options.map((o) => o.number)).toEqual([52])
    })
  })
})
