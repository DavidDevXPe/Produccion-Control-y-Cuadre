import type { Kg100 } from '../../model/types'

export interface FreezingBalanceExplanation {
  readonly selectedAvailableKg100: Kg100
  readonly pendingInSelectedKg100: Kg100
  readonly untouchedKg100: Kg100
  readonly untracedFrozenKg100: Kg100
  readonly physicalDifferenceKg100: Kg100
  readonly untouchedPositions: readonly {
    readonly originDayId: string
    readonly productId: string
    readonly productName: string
    readonly originDate: string
    readonly pendingKg100: Kg100
  }[]
}

export interface FreezingTraceabilitySummary {
  readonly totalProducts: number
  readonly traceableProducts: number
  readonly pendingProducts: number
  readonly problemProducts: number
  readonly tracedKg100: Kg100
  readonly reportedKg100: Kg100
  readonly pendingKg100: Kg100
  readonly excessLinkedKg100: Kg100
}

export interface FreezingBalanceUseSummary {
  readonly originCount: number
  readonly availableKg100: Kg100
  readonly usedKg100: Kg100
  readonly remainingKg100: Kg100
  readonly reviewCount: number
}
