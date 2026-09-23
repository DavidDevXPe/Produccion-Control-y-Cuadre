import { describe, expect, it } from 'vitest'
import { kg } from '../model/calculations'
import { WEEK_36_2026_PRODUCTION_DAYS } from '../data/week36'
import { calculateFreezingAvailability } from '../model/freezing'
import type { FreezingAvailabilityPosition } from '../model/freezing'
import { explainFreezingAvailabilityByOrigin } from './freezingAvailabilityExplanation'

function position(
  overrides: Partial<FreezingAvailabilityPosition> & {
    originDayId: string
    originDate: string
    productId: string
  },
): FreezingAvailabilityPosition {
  return {
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productName: overrides.productId,
    summaryGroupId: 'MANTO',
    physicalDayKg100: kg(0),
    physicalNightKg100: kg(0),
    receivedBalanceDayKg100: kg(0),
    receivedBalanceNightKg100: kg(0),
    ownDayKg100: kg(0),
    ownNightKg100: kg(0),
    closingBalanceKg100: kg(0),
    generatedKg100: kg(0),
    processedDayKg100: kg(0),
    processedNightKg100: kg(0),
    processedTotalKg100: kg(0),
    pendingKg100: kg(0),
    excessKg100: kg(0),
    ...overrides,
  }
}

describe('explainFreezingAvailabilityByOrigin', () => {
  it('explains the available product as own Day + own Night + closing balance', () => {
    const [origin] = explainFreezingAvailabilityByOrigin([
      position({
        originDayId: 'packing-a',
        originDate: '2026-09-14',
        productId: 'manto-1',
        physicalDayKg100: kg(25_000),
        ownDayKg100: kg(25_000),
        ownNightKg100: kg(15_000),
        closingBalanceKg100: kg(5_700),
        generatedKg100: kg(45_700),
        processedDayKg100: kg(30_000),
        processedTotalKg100: kg(30_000),
        pendingKg100: kg(15_700),
      }),
      position({
        originDayId: 'packing-a',
        originDate: '2026-09-14',
        productId: 'manto-2',
        physicalDayKg100: kg(15_000),
        ownDayKg100: kg(15_000),
        ownNightKg100: kg(10_000),
        generatedKg100: kg(25_000),
        processedNightKg100: kg(25_000),
        processedTotalKg100: kg(25_000),
      }),
    ])

    expect(origin?.ownDayKg100).toBe(kg(40_000))
    expect(origin?.ownNightKg100).toBe(kg(25_000))
    expect(origin?.closingBalanceKg100).toBe(kg(5_700))
    expect(origin?.availableKg100).toBe(kg(70_700))
    expect(origin?.frozenDayKg100).toBe(kg(30_000))
    expect(origin?.frozenNightKg100).toBe(kg(25_000))
    expect(origin?.frozenKg100).toBe(kg(55_000))
    expect(origin?.pendingKg100).toBe(kg(15_700))
    expect(origin?.state).toBe('PENDING')
    expect(origin?.positions).toHaveLength(2)
  })

  it('keeps received balance as information, outside the available product', () => {
    const [origin] = explainFreezingAvailabilityByOrigin([
      position({
        originDayId: 'packing-b',
        originDate: '2026-09-15',
        productId: 'manto-1',
        physicalDayKg100: kg(50_000),
        receivedBalanceDayKg100: kg(5_700),
        ownDayKg100: kg(44_300),
        ownNightKg100: kg(30_000),
        generatedKg100: kg(74_300),
        pendingKg100: kg(74_300),
      }),
    ])

    expect(origin?.physicalDayKg100).toBe(kg(50_000))
    expect(origin?.receivedBalanceKg100).toBe(kg(5_700))
    expect(origin?.availableKg100).toBe(kg(74_300))
  })

  it('marks an origin with excess even when another product is still pending', () => {
    const [origin] = explainFreezingAvailabilityByOrigin([
      position({
        originDayId: 'packing-a',
        originDate: '2026-09-14',
        productId: 'manto-1',
        pendingKg100: kg(100),
      }),
      position({
        originDayId: 'packing-a',
        originDate: '2026-09-14',
        productId: 'manto-2',
        excessKg100: kg(50),
      }),
    ])

    expect(origin?.state).toBe('EXCESS')
    expect(origin?.pendingKg100).toBe(kg(100))
    expect(origin?.excessKg100).toBe(kg(50))
  })

  it('orders origins FIFO, oldest first, and marks a fully frozen origin complete', () => {
    const origins = explainFreezingAvailabilityByOrigin([
      position({ originDayId: 'new', originDate: '2026-09-15', productId: 'p', pendingKg100: kg(1) }),
      position({ originDayId: 'old', originDate: '2026-09-14', productId: 'p' }),
    ])

    expect(origins.map((origin) => origin.originDayId)).toEqual(['old', 'new'])
    expect(origins[0]?.state).toBe('COMPLETE')
  })

  it('takes the physical report from the whole Packing journey, including products packed only from received balance', () => {
    // Real week 41: on Thursday 03/09 Membranas Cocidas (1,850 kg) were packed
    // entirely from Wednesday's balance, so they generate no availability of
    // their own, but they are part of Thursday's physical report.
    const thursday = WEEK_36_2026_PRODUCTION_DAYS.find(
      (day) => day.date === '2026-09-03',
    )!
    const positions = calculateFreezingAvailability(
      WEEK_36_2026_PRODUCTION_DAYS,
    ).filter((position) => position.originDayId === thursday.id)

    const [withDays] = explainFreezingAvailabilityByOrigin(
      positions,
      WEEK_36_2026_PRODUCTION_DAYS,
    )
    const [withoutDays] = explainFreezingAvailabilityByOrigin(positions)

    expect(withDays?.receivedBalanceKg100).toBe(kg(40_298.3))
    expect(withoutDays?.receivedBalanceKg100).toBe(kg(38_448.3))
    // The physical Day report minus the received balance is the own Day
    // production: the available product does not change.
    expect(withDays!.physicalDayKg100 - withDays!.receivedBalanceKg100).toBe(
      withDays!.ownDayKg100,
    )
    expect(withDays?.availableKg100).toBe(withoutDays?.availableKg100)
  })
})
