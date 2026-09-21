import { kg100 } from './calculations'
import { canonicalProductId } from './productIdentity'
import type { BalanceLot, BalanceUse } from './types'

function logicalBalanceLotIdentity(lot: BalanceLot): string {
  return [
    lot.process ?? 'PACKING',
    lot.originDayId,
    lot.familyId,
    canonicalProductId(lot.productId),
    canonicalProductId(lot.sourceProductId ?? lot.productId),
  ].join('|')
}

function logicalBalanceUseIdentity(use: BalanceUse): string {
  return [use.targetDayId, use.shift].join('|')
}

function normalizeBalanceUses(uses: readonly BalanceUse[]): readonly BalanceUse[] {
  const usesByIdentity = new Map<string, BalanceUse>()

  for (const use of uses) {
    const identity = logicalBalanceUseIdentity(use)
    const existing = usesByIdentity.get(identity)

    if (!existing || use.kg100 > existing.kg100) {
      usesByIdentity.set(identity, use)
    }
  }

  return [...usesByIdentity.values()]
}

/**
 * Normalizes duplicate persisted balance lots by logical origin/product.
 *
 * Important: duplicate historical lots are not summed. The valid recovery rule
 * is to keep the largest original quantity and the largest use per target shift,
 * preventing artificial over-consumption after repeated FIFO/manual saves.
 */
export function normalizeBalanceLots(
  lots: readonly BalanceLot[],
): readonly BalanceLot[] {
  const lotsByIdentity = new Map<string, BalanceLot>()

  for (const lot of lots) {
    const identity = logicalBalanceLotIdentity(lot)
    const existing = lotsByIdentity.get(identity)

    if (!existing) {
      lotsByIdentity.set(identity, {
        ...lot,
        productId: canonicalProductId(lot.productId),
        ...(lot.sourceProductId
          ? { sourceProductId: canonicalProductId(lot.sourceProductId) }
          : {}),
        uses: normalizeBalanceUses(lot.uses),
      })
      continue
    }

    const sourceProductId = existing.sourceProductId ?? lot.sourceProductId

    lotsByIdentity.set(identity, {
      ...existing,
      originalKg100: kg100(Math.max(existing.originalKg100, lot.originalKg100)),
      ...(sourceProductId
        ? { sourceProductId: canonicalProductId(sourceProductId) }
        : {}),
      uses: normalizeBalanceUses([...existing.uses, ...lot.uses]),
    })
  }

  return [...lotsByIdentity.values()]
}
