import { kg100 } from '../model/calculations'
import type { Kg100 } from '../model/types'
import type { ProductionCaptureBalanceUse } from './productionCapture'

function captureValueToKg100(value: string): Kg100 {
  const parsed = Number(value.trim().replace(',', '.'))

  return Number.isFinite(parsed) && parsed >= 0
    ? kg100(Math.round(parsed * 100))
    : kg100(0)
}

function kg100ToCaptureValue(value: Kg100): string {
  return String(Number((value / 100).toFixed(2)))
}

export function balanceUseIdentity(use: ProductionCaptureBalanceUse): string {
  return [
    use.originDayId,
    use.familyId,
    use.productId,
    use.sourceProductId ?? use.productId,
  ].join('|')
}

/**
 * Deduplicates logical Freezing source links without adding their kilos.
 *
 * Historical drafts may contain the same origin/product link more than once.
 * Summing those copies would create artificial over-consumption, so the safest
 * recovery rule is to keep the maximum registered value per shift.
 */
export function normalizeCaptureBalanceUses(
  uses: readonly ProductionCaptureBalanceUse[],
): ProductionCaptureBalanceUse[] {
  const usesByIdentity = new Map<string, ProductionCaptureBalanceUse>()

  for (const use of uses) {
    const identity = balanceUseIdentity(use)
    const existing = usesByIdentity.get(identity)

    if (!existing) {
      usesByIdentity.set(identity, { ...use })
      continue
    }

    const sourceProductId = existing.sourceProductId ?? use.sourceProductId

    usesByIdentity.set(identity, {
      ...existing,
      availableKg100: kg100(
        Math.max(existing.availableKg100, use.availableKg100),
      ),
      dayKg: kg100ToCaptureValue(
        kg100(
          Math.max(
            captureValueToKg100(existing.dayKg),
            captureValueToKg100(use.dayKg),
          ),
        ),
      ),
      nightKg: kg100ToCaptureValue(
        kg100(
          Math.max(
            captureValueToKg100(existing.nightKg),
            captureValueToKg100(use.nightKg),
          ),
        ),
      ),
      ...(sourceProductId ? { sourceProductId } : {}),
      requiresProductDistribution:
        existing.requiresProductDistribution === true ||
        use.requiresProductDistribution === true,
    })
  }

  return [...usesByIdentity.values()]
}
