import type { ClosureMessage } from './businessRules'
import type { ClosureObservationRecord } from './types'

/**
 * Turns the warnings accepted while closing a journey into the observations
 * that stay with it as an auditable record.
 */
export function buildClosureObservations(
  warnings: readonly ClosureMessage[],
  closedAt: string,
): readonly ClosureObservationRecord[] {
  return warnings.map(
    (warning) =>
      ({
        closedAt,
        code: warning.code,
        message: warning.message,
        userId: 'local-user',
        ...(warning.familyKey !== undefined
          ? { familyKey: warning.familyKey }
          : {}),
        ...(warning.productId !== undefined
          ? { productId: warning.productId }
          : {}),
      }) satisfies ClosureObservationRecord,
  )
}
