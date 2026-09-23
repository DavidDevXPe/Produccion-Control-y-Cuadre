import { calculateProductionDay, kg100, sumKg100 } from '../model/calculations'
import type { FreezingAvailabilityPosition } from '../model/freezing'
import type { Kg100, ProductionDay } from '../model/types'

/**
 * State of one Packing origin journey against Freezing:
 * - COMPLETE: everything available was frozen.
 * - PENDING: product still waiting to be frozen. Normal; it keeps its origin
 *   and can be frozen by a later shift, day or week.
 * - EXCESS: more was frozen than the origin generated. Integrity issue.
 */
export type FreezingOriginState = 'COMPLETE' | 'PENDING' | 'EXCESS'

/**
 * Explanation of the freezable availability of one Packing origin journey.
 * Every amount is a sum of the product positions of that journey, so the user
 * can follow the calculation without reading stored data:
 *
 *   own Day + own Night + closing balance = available
 *   available − frozen = pending   (or frozen − available = excess)
 */
export interface FreezingOriginExplanation {
  readonly originDayId: string
  readonly originDate: string
  readonly ownDayKg100: Kg100
  readonly ownNightKg100: Kg100
  readonly closingBalanceKg100: Kg100
  readonly availableKg100: Kg100
  /**
   * Physical Packing report of each shift. Informative: it includes balance
   * from earlier journeys that belongs to those journeys, not to this one.
   * Taken from the Packing reconciliation of the whole journey, so products
   * packed only from received balance (no availability of their own) count.
   */
  readonly physicalDayKg100: Kg100
  readonly physicalNightKg100: Kg100
  readonly receivedBalanceKg100: Kg100
  readonly frozenDayKg100: Kg100
  readonly frozenNightKg100: Kg100
  readonly frozenKg100: Kg100
  readonly pendingKg100: Kg100
  readonly excessKg100: Kg100
  readonly state: FreezingOriginState
  readonly positions: readonly FreezingAvailabilityPosition[]
}

function sumBy(
  positions: readonly FreezingAvailabilityPosition[],
  pick: (position: FreezingAvailabilityPosition) => Kg100,
): Kg100 {
  return sumKg100(positions.map(pick))
}

function explainOrigin(
  positions: readonly FreezingAvailabilityPosition[],
  originDay: ProductionDay | undefined,
): FreezingOriginExplanation {
  const first = positions[0]!
  const pendingKg100 = sumBy(positions, (p) => p.pendingKg100)
  const excessKg100 = sumBy(positions, (p) => p.excessKg100)
  const packing = originDay ? calculateProductionDay(originDay) : null

  return {
    originDayId: first.originDayId,
    originDate: first.originDate,
    ownDayKg100: sumBy(positions, (p) => p.ownDayKg100),
    ownNightKg100: sumBy(positions, (p) => p.ownNightKg100),
    closingBalanceKg100: sumBy(positions, (p) => p.closingBalanceKg100),
    availableKg100: sumBy(positions, (p) => p.generatedKg100),
    physicalDayKg100:
      packing?.day.reportedKg100 ??
      sumBy(positions, (p) => p.physicalDayKg100),
    physicalNightKg100:
      packing?.night.reportedKg100 ??
      sumBy(positions, (p) => p.physicalNightKg100),
    receivedBalanceKg100: packing
      ? kg100(
          packing.day.previousBalanceProcessedKg100 +
            packing.night.previousBalanceProcessedKg100,
        )
      : kg100(
          sumBy(positions, (p) => p.receivedBalanceDayKg100) +
            sumBy(positions, (p) => p.receivedBalanceNightKg100),
        ),
    frozenDayKg100: sumBy(positions, (p) => p.processedDayKg100),
    frozenNightKg100: sumBy(positions, (p) => p.processedNightKg100),
    frozenKg100: sumBy(positions, (p) => p.processedTotalKg100),
    pendingKg100,
    excessKg100,
    // An excess in any product is an integrity issue even if other products
    // still have pending product: it is never netted away.
    state: excessKg100 > 0 ? 'EXCESS' : pendingKg100 > 0 ? 'PENDING' : 'COMPLETE',
    positions,
  }
}

/**
 * Groups Freezing availability positions by their Packing origin journey,
 * oldest origin first (FIFO order). `productionDays` provides the physical
 * report of each origin journey; without it the physical figures fall back to
 * the products that generated availability.
 */
export function explainFreezingAvailabilityByOrigin(
  positions: readonly FreezingAvailabilityPosition[],
  productionDays: readonly ProductionDay[] = [],
): readonly FreezingOriginExplanation[] {
  const daysById = new Map(productionDays.map((day) => [day.id, day]))
  const byOrigin = new Map<string, FreezingAvailabilityPosition[]>()

  for (const position of positions) {
    const group = byOrigin.get(position.originDayId)
    if (group) group.push(position)
    else byOrigin.set(position.originDayId, [position])
  }

  return [...byOrigin.values()]
    .map((group) => explainOrigin(group, daysById.get(group[0]!.originDayId)))
    .sort((first, second) => first.originDate.localeCompare(second.originDate))
}
