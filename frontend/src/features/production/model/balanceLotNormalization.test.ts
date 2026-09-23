import { describe, expect, it } from 'vitest'
import { normalizeBalanceLots } from './balanceLotNormalization'
import { kg100 } from './calculations'
import type { BalanceLot } from './types'

function lot(overrides: Partial<BalanceLot> = {}): BalanceLot {
  return {
    id: 'lot-1',
    originDayId: 'origin-a',
    familyId: 'manto-crudo',
    productId: 'manto-estandar',
    originalKg100: kg100(100_00),
    uses: [
      { id: 'use-1', targetDayId: 'freezing-1', shift: 'DAY', kg100: kg100(40_00) },
    ],
    ...overrides,
  }
}

describe('persisted balance lot normalization', () => {
  it('collapses duplicated lots without summing quantities or uses', () => {
    const [normalized, ...rest] = normalizeBalanceLots([
      lot(),
      lot({
        id: 'lot-1-copy',
        originalKg100: kg100(100_00),
        uses: [
          { id: 'use-1-copy', targetDayId: 'freezing-1', shift: 'DAY', kg100: kg100(40_00) },
        ],
      }),
    ])

    expect(rest).toHaveLength(0)
    expect(normalized?.originalKg100).toBe(kg100(100_00))
    expect(normalized?.uses).toHaveLength(1)
    expect(normalized?.uses[0]?.kg100).toBe(kg100(40_00))
  })

  it('keeps the largest original quantity and the largest use per target shift', () => {
    const [normalized] = normalizeBalanceLots([
      lot({ originalKg100: kg100(90_00) }),
      lot({
        id: 'copy',
        originalKg100: kg100(110_00),
        uses: [
          { id: 'u-day', targetDayId: 'freezing-1', shift: 'DAY', kg100: kg100(55_00) },
          { id: 'u-night', targetDayId: 'freezing-1', shift: 'NIGHT', kg100: kg100(5_00) },
        ],
      }),
    ])

    expect(normalized?.originalKg100).toBe(kg100(110_00))
    expect(
      normalized?.uses.map((use) => [use.shift, use.kg100]).sort(),
    ).toEqual([
      ['DAY', kg100(55_00)],
      ['NIGHT', kg100(5_00)],
    ])
  })

  it('keeps uses of different target journeys separate', () => {
    const [normalized] = normalizeBalanceLots([
      lot({
        uses: [
          { id: 'a', targetDayId: 'freezing-1', shift: 'DAY', kg100: kg100(10_00) },
          { id: 'b', targetDayId: 'freezing-2', shift: 'DAY', kg100: kg100(20_00) },
        ],
      }),
    ])

    expect(normalized?.uses).toHaveLength(2)
  })

  it('does not merge lots of different origins, families or processes', () => {
    expect(
      normalizeBalanceLots([
        lot(),
        lot({ id: 'other-origin', originDayId: 'origin-b' }),
        lot({ id: 'other-family', familyId: 'aleta-cruda' }),
        lot({ id: 'freezing-lot', process: 'FREEZING' }),
      ]),
    ).toHaveLength(4)
  })

  it('treats a lot without process as a Packing lot', () => {
    expect(
      normalizeBalanceLots([lot(), lot({ id: 'explicit', process: 'PACKING' })]),
    ).toHaveLength(1)
  })

  it('is idempotent and does not mutate its input', () => {
    const input = [
      lot(),
      lot({ id: 'copy', originalKg100: kg100(120_00) }),
      lot({ id: 'other', originDayId: 'origin-b' }),
    ]
    const snapshot = structuredClone(input)
    const once = normalizeBalanceLots(input)

    expect(normalizeBalanceLots(once)).toEqual(once)
    expect(input).toEqual(snapshot)
  })
})
