import { formatCentiKg } from '../../../utils/formatters'
import type {
  FreezingComparison,
  FreezingReviewReason,
} from '../model/freezing'

export interface FreezingComparisonReasonMessage {
  readonly reason: FreezingReviewReason
  readonly title: string
  readonly message: string
}

/**
 * Operational explanation of why the Packing vs Freezing comparison needs
 * review. One message per reason, in the order of the model, with the amounts
 * that let the user investigate.
 */
export function describeFreezingReviewReasons(
  comparison: Pick<
    FreezingComparison,
    | 'reviewReasons'
    | 'unexplainedDifferenceKg100'
    | 'physicalReportedKg100'
    | 'linkedKg100'
    | 'linkageExcessKg100'
    | 'originExcessKg100'
    | 'integrityIssueCount'
  >,
): readonly FreezingComparisonReasonMessage[] {
  return comparison.reviewReasons.map((reason) => {
    switch (reason) {
      case 'UNEXPLAINED_DIFFERENCE':
        return {
          reason,
          title: 'Diferencia no explicada',
          message: `${formatCentiKg(
            comparison.unexplainedDifferenceKg100,
          )} entre lo envasado y lo congelado, pendiente o sin origen. Revisa el origen del producto congelado.`,
        }
      case 'LINKAGE_EXCESS':
        return {
          reason,
          title: 'Vinculado por encima de lo reportado',
          message: `Congelamiento reportó ${formatCentiKg(
            comparison.physicalReportedKg100,
          )} pero tiene ${formatCentiKg(
            comparison.linkedKg100,
          )} vinculados a Envasado: ${formatCentiKg(
            comparison.linkageExcessKg100,
          )} de exceso. Revisa los vínculos de la jornada.`,
        }
      case 'ORIGIN_EXCESS':
        return {
          reason,
          title: 'Origen consumido en exceso',
          message: `Se congeló ${formatCentiKg(
            comparison.originExcessKg100,
          )} por encima de lo que Envasado generó en algún origen.`,
        }
      case 'INTEGRITY_ISSUES':
        return {
          reason,
          title: 'Validación de integridad',
          message: `${comparison.integrityIssueCount} ${
            comparison.integrityIssueCount === 1
              ? 'validación de integridad'
              : 'validaciones de integridad'
          } en jornadas de Congelamiento (por ejemplo, sobreuso de saldo). Abre la jornada para ver el detalle.`,
        }
    }
  })
}
