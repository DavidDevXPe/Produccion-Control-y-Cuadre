import { describe, expect, it } from 'vitest'
import { THURSDAY_PRODUCTION_DAY } from '../data/thursday'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateOutstandingBalances, kg100 } from './calculations'
import type { BalanceLot } from './types'

function withConsumption(extraKg100: number) {
  const origin = calculateOutstandingBalances([
    WEDNESDAY_PRODUCTION_DAY,
  ]).find((position) => position.generatedKg100 > 0)!
  const lot: BalanceLot = {
    id: 'lot-excess',
    originDayId: WEDNESDAY_PRODUCTION_DAY.id,
    familyId: origin.familyId,
    productId: origin.productId,
    originalKg100: origin.generatedKg100,
    uses: [
      {
        id: 'use-excess',
        targetDayId: THURSDAY_PRODUCTION_DAY.id,
        shift: 'DAY',
        kg100: kg100(origin.generatedKg100 + extraKg100),
      },
    ],
  }
  const thursday = { ...THURSDAY_PRODUCTION_DAY, receivedBalanceLots: [lot] }
  const position = calculateOutstandingBalances([
    WEDNESDAY_PRODUCTION_DAY,
    thursday,
  ]).find(
    (candidate) =>
      candidate.originDayId === WEDNESDAY_PRODUCTION_DAY.id &&
      candidate.productId === origin.productId,
  )!

  return { origin, position }
}

describe('outstanding Packing balance consumed above its origin', () => {
  it('keeps the excess as its own quantity instead of hiding it behind a zero pending balance', () => {
    const { origin, position } = withConsumption(5_000)

    expect(position.generatedKg100).toBe(origin.generatedKg100)
    expect(position.processedTotalKg100).toBe(origin.generatedKg100 + 5_000)
    expect(position.pendingKg100).toBe(0)
    expect(position.excessKg100).toBe(5_000)
  })

  it('has no excess when the consumption is exactly the balance or less', () => {
    expect(withConsumption(0).position).toMatchObject({
      pendingKg100: 0,
      excessKg100: 0,
    })
    expect(withConsumption(-1_000).position).toMatchObject({
      pendingKg100: 1_000,
      excessKg100: 0,
    })
  })
})
