import { afterEach, describe, expect, it } from 'vitest'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { loadStoredDays } from '../state/productionDataHelpers'
import { TRABUNDA_STORAGE_KEYS } from '../../../storage/trabundaStorage'
import { isProductionDay } from './productionDayValidation'

const validDay = { ...WEDNESDAY_PRODUCTION_DAY, id: 'local-validation', date: '2026-10-20' }

afterEach(() => localStorage.clear())

describe('stored production structures', () => {
  it('accepts existing production records', () => {
    expect(isProductionDay(validDay)).toBe(true)
  })
  it.each([
    { lines: [null] },
    { declaredShiftTotalsKg100: null },
    { receivedBalanceLots: [null] },
    { date: '2026-02-30' },
    { declaredFinishedTotalKg100: Infinity },
    { lines: [{ ...validDay.lines[0], shifts: { DAY: null, NIGHT: null } }] },
  ])('quarantines invalid nested data without losing valid neighboring records: %j', (invalid) => {
    localStorage.setItem(TRABUNDA_STORAGE_KEYS.productionDays, JSON.stringify([
      validDay, { ...validDay, id: 'broken', ...invalid },
    ]))
    expect(loadStoredDays().map((day) => day.id)).toEqual(['local-validation'])
    expect(localStorage.getItem(TRABUNDA_STORAGE_KEYS.storageQuarantine)).toContain('broken')
  })
})
