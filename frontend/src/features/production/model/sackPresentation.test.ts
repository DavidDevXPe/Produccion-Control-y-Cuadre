import { describe, expect, it } from 'vitest'
import {
  getSackWeightKg,
  parseSackPresentation,
  roundSackCount,
} from './sackPresentation'

describe('sack presentations from the production guide', () => {
  it.each([
    ['MANTO - SACO 2 x 10 kg', 20],
    ['ANILLAS - SACO 3 x 10 kg', 30],
    ['MEMBRANAS - SACO 3 x 9 kg', 27],
  ])('parses %s as %s kg per sack', (name, totalKg) => {
    expect(parseSackPresentation(name)?.totalKg).toBe(totalKg)
    expect(getSackWeightKg(name)).toBe(totalKg)
  })

  it('keeps the historical 20 kg fallback for legacy names without SACO', () => {
    expect(getSackWeightKg('MANTO ESTANDAR CRUDO')).toBe(20)
  })

  it('derives fractional sack counts using the product presentation', () => {
    expect(roundSackCount(60, 30)).toBe(2)
    expect(roundSackCount(54, 27)).toBe(2)
  })
})
