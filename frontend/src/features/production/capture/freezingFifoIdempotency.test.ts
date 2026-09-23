import { describe, expect, it } from 'vitest'
import { kg100 } from '../model/calculations'
import type { FreezingAvailabilityPosition } from '../model/freezing'
import { buildFreezingFifoAllocation } from './freezingFifo'

const targetProduct = {
  productId: 'manto-estandar',
  productName: 'MANTO ESTANDAR',
  familyId: 'manto-crudo',
  familyName: 'MANTO CRUDO',
}

function position(
  originDayId: string,
  originDate: string,
  pendingKg: number,
): FreezingAvailabilityPosition {
  return {
    originDayId,
    originDate,
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-estandar',
    productName: 'MANTO ESTANDAR',
    summaryGroupId: 'MANTO',
    physicalDayKg100: kg100(pendingKg * 100),
    physicalNightKg100: kg100(0),
    receivedBalanceDayKg100: kg100(0),
    receivedBalanceNightKg100: kg100(0),
    ownDayKg100: kg100(pendingKg * 100),
    ownNightKg100: kg100(0),
    closingBalanceKg100: kg100(0),
    generatedKg100: kg100(pendingKg * 100),
    processedDayKg100: kg100(0),
    processedNightKg100: kg100(0),
    processedTotalKg100: kg100(0),
    pendingKg100: kg100(pendingKg * 100),
    excessKg100: kg100(0),
  }
}

const positions = [
  position('origin-newer', '2026-09-09', 100),
  position('origin-older', '2026-09-08', 40),
]

describe('freezing FIFO idempotency and limits', () => {
  it('a second FIFO run over its own result adds nothing and duplicates nothing', () => {
    const args = {
      targetProduct,
      reportedDayKg100: kg100(30 * 100),
      reportedNightKg100: kg100(30 * 100),
      positions,
    }
    const first = buildFreezingFifoAllocation({ ...args, existingUses: [] })
    const second = buildFreezingFifoAllocation({
      ...args,
      existingUses: first.balanceUses,
    })
    const third = buildFreezingFifoAllocation({
      ...args,
      existingUses: second.balanceUses,
    })

    expect(first.allocatedKg100).toBe(kg100(60 * 100))
    expect(second.allocatedKg100).toBe(0)
    expect(second.balanceUses).toEqual(first.balanceUses)
    expect(third.balanceUses).toEqual(first.balanceUses)
  })

  it('consumes the oldest origin first, Day before Night inside it, and moves on only when it is exhausted', () => {
    const result = buildFreezingFifoAllocation({
      targetProduct,
      reportedDayKg100: kg100(30 * 100),
      reportedNightKg100: kg100(30 * 100),
      positions,
      existingUses: [],
    })
    const byOrigin = Object.fromEntries(
      result.balanceUses.map((use) => [use.originDayId, use]),
    )

    // The older origin (40 kg) is filled first: 30 Day + 10 Night.
    expect(byOrigin['origin-older']).toMatchObject({ dayKg: '30', nightKg: '10' })
    // The remaining Night quantity continues on the newer origin.
    expect(byOrigin['origin-newer']).toMatchObject({ dayKg: '0', nightKg: '20' })
  })

  it('never allocates more than the traceable availability and leaves the rest unlinked', () => {
    const result = buildFreezingFifoAllocation({
      targetProduct,
      reportedDayKg100: kg100(200 * 100),
      reportedNightKg100: kg100(0),
      positions,
      existingUses: [],
    })

    expect(result.allocatedKg100).toBe(kg100(140 * 100))
    expect(result.remainingDayKg100).toBe(kg100(60 * 100))
    const linked = result.balanceUses.reduce(
      (total, use) => total + Number(use.dayKg) + Number(use.nightKg),
      0,
    )
    expect(linked).toBe(140)
  })
})
