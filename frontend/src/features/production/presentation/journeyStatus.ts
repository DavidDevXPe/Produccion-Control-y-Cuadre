import type { ProductionClosureValidation } from '../model/businessRules'
import type { ProductionDayOperationalState } from '../model/productionLifecycle'
import type { ProductionDay } from '../model/types'

/**
 * Operational status of one journey as shown to the user.
 *
 * - BALANCED: closed and balanced, nothing to report.
 * - BALANCED_OBSERVED: closed and balanced, with documented observations.
 * - PENDING_REVIEW: not closed yet (or arithmetic still open) but no blocking
 *   integrity problem. It is follow-up work, not a failure.
 * - NOT_BALANCED: a closed journey that does not balance, or any journey with a
 *   blocking integrity issue.
 */
export type JourneyStatus =
  | 'BALANCED'
  | 'BALANCED_OBSERVED'
  | 'PENDING_REVIEW'
  | 'NOT_BALANCED'

export type JourneyStatusTone = 'success' | 'warning' | 'danger'

export interface JourneyObservation {
  readonly code: string
  readonly message: string
}

/** The part of the operational state that decides the journey status. */
export type JourneyStateInput = Pick<
  ProductionDayOperationalState,
  'lifecycle' | 'isBalanced'
> & {
  readonly validation: Pick<ProductionClosureValidation, 'warnings'>
  readonly calculation: { readonly integrityIssues: readonly unknown[] }
}

export interface JourneyStatusView {
  readonly status: JourneyStatus
  readonly label: string
  readonly tone: JourneyStatusTone
  readonly observations: readonly JourneyObservation[]
}

const statusPresentation: Record<
  JourneyStatus,
  { label: string; tone: JourneyStatusTone }
> = {
  BALANCED: { label: 'CUADRADO', tone: 'success' },
  BALANCED_OBSERVED: { label: 'CUADRADO · OBSERVADO', tone: 'warning' },
  PENDING_REVIEW: { label: 'POR REVISAR', tone: 'warning' },
  NOT_BALANCED: { label: 'NO CUADRADO', tone: 'danger' },
}

/**
 * Observations of a journey. Accepted observations saved at closing take
 * precedence; historical journeys that were closed without persisting them
 * still expose their validation warnings, which must not be lost.
 */
export function getJourneyObservations(
  day: Pick<ProductionDay, 'closureObservations'>,
  operationalState: Pick<JourneyStateInput, 'validation'>,
): readonly JourneyObservation[] {
  return day.closureObservations?.length
    ? day.closureObservations
    : operationalState.validation.warnings
}

export function getJourneyStatus(
  day: Pick<ProductionDay, 'closureObservations'>,
  operationalState: JourneyStateInput,
): JourneyStatusView {
  const observations = getJourneyObservations(day, operationalState)
  const isClosed = operationalState.lifecycle === 'CLOSED'
  const hasIntegrityIssues =
    operationalState.calculation.integrityIssues.length > 0

  const status: JourneyStatus =
    hasIntegrityIssues || (isClosed && !operationalState.isBalanced)
      ? 'NOT_BALANCED'
      : !isClosed
        ? 'PENDING_REVIEW'
        : observations.length > 0
          ? 'BALANCED_OBSERVED'
          : 'BALANCED'

  return { status, ...statusPresentation[status], observations }
}
