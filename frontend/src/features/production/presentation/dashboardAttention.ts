import { formatCentiKg, formatIsoWeekday } from '../../../utils/formatters'
import { sumKg100 } from '../model/calculations'
import type {
  FreezingAvailabilityPosition,
  FreezingComparison,
} from '../model/freezing'
import type { ProductionDay, ProductionDayCalculation } from '../model/types'
import type { JourneyStatusView } from './journeyStatus'

export type AttentionTone = 'danger' | 'warning' | 'info'

export type AttentionProcess = 'PACKING' | 'FREEZING'

export interface DashboardAttentionItem {
  readonly key: string
  readonly tone: AttentionTone
  readonly title: string
  readonly description: string
  readonly date: string
  /** Process of the journey; null for items that compare both processes. */
  readonly process: AttentionProcess | null
  /** Destination of the "Revisar" link; defaults to the journey detail. */
  readonly to?: string
}

export interface AttentionJourney {
  readonly day: Pick<ProductionDay, 'id' | 'date' | 'status'>
  readonly calculation: Pick<
    ProductionDayCalculation,
    'differenceKg100' | 'day' | 'night' | 'integrityIssues'
  >
  readonly journey: Pick<JourneyStatusView, 'status' | 'observations'>
}

export interface DashboardAttentionInput {
  readonly packingDays: readonly AttentionJourney[]
  readonly freezingDays: readonly AttentionJourney[]
  readonly comparison: Pick<
    FreezingComparison,
    | 'unexplainedDifferenceKg100'
    | 'physicalReportedKg100'
    | 'linkedKg100'
    | 'linkageExcessKg100'
  >
  readonly freezingPositions: readonly Pick<
    FreezingAvailabilityPosition,
    'excessKg100'
  >[]
  /** Last date of the week; dates the items that compare both processes. */
  readonly weekEndDate: string
}

const tonePriority: Record<AttentionTone, number> = {
  danger: 0,
  warning: 1,
  info: 2,
}

export const MAX_VISIBLE_ATTENTION_ITEMS = 5

/**
 * Traceability inconsistencies must be visible on the Dashboard, not only in
 * the comparison card: they are reported as found, never limited or hidden.
 */
function buildTraceabilityItems({
  comparison,
  freezingPositions,
  weekEndDate,
}: DashboardAttentionInput): DashboardAttentionItem[] {
  const excessPositions = freezingPositions.filter(
    (position) => position.excessKg100 > 0,
  )
  const items: DashboardAttentionItem[] = []

  if (comparison.unexplainedDifferenceKg100 !== 0) {
    items.push({
      key: 'comparison-unexplained-difference',
      tone: 'danger',
      title: 'Diferencia de trazabilidad',
      description: `${formatCentiKg(
        comparison.unexplainedDifferenceKg100,
      )} sin explicar entre Envasado y Congelamiento en la semana.`,
      date: weekEndDate,
      process: null,
      to: '/resumen?view=COMPARISON',
    })
  }

  if (comparison.linkageExcessKg100 > 0) {
    items.push({
      key: 'freezing-linkage-excess',
      tone: 'danger',
      title: 'Vinculado por encima de lo reportado',
      description: `Congelamiento reportó ${formatCentiKg(
        comparison.physicalReportedKg100,
      )} y tiene ${formatCentiKg(
        comparison.linkedKg100,
      )} vinculados a Envasado (${formatCentiKg(
        comparison.linkageExcessKg100,
      )} de exceso).`,
      date: weekEndDate,
      process: null,
      to: '/resumen?view=COMPARISON',
    })
  }

  if (excessPositions.length > 0) {
    items.push({
      key: 'freezing-excess-over-origin',
      tone: 'danger',
      title: 'Congelado por encima del origen',
      description: `${excessPositions.length} ${
        excessPositions.length === 1 ? 'origen tiene' : 'orígenes tienen'
      } ${formatCentiKg(
        sumKg100(excessPositions.map((position) => position.excessKg100)),
      )} congelados por encima de lo envasado.`,
      date: weekEndDate,
      process: null,
      to: '/saldos',
    })
  }

  return items
}

function buildPackingItems({
  day,
  calculation,
  journey,
}: AttentionJourney): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = []
  // An open journey with a difference is follow-up work (amber); only a closed
  // journey that does not balance is a real difference (red).
  const differenceTone: AttentionTone =
    day.status === 'CLOSED' ? 'danger' : 'warning'
  const weekday = formatIsoWeekday(day.date)

  if (calculation.differenceKg100 !== 0) {
    items.push({
      key: `${day.id}-packing-difference`,
      tone: differenceTone,
      title: 'Diferencia de cuadre',
      description: `${weekday} presenta ${formatCentiKg(
        calculation.differenceKg100,
      )} por revisar en Envasado.`,
      date: day.date,
      process: 'PACKING',
    })
  }

  if (
    calculation.day.detailDifferenceKg100 !== 0 ||
    calculation.night.detailDifferenceKg100 !== 0
  ) {
    items.push({
      key: `${day.id}-packing-shifts`,
      tone: differenceTone,
      title: 'Reporte por turno no conciliado',
      description: `${weekday} requiere revisar Día/Noche contra el detalle por producto.`,
      date: day.date,
      process: 'PACKING',
    })
  }

  if (calculation.integrityIssues.length > 0) {
    items.push({
      key: `${day.id}-packing-integrity`,
      tone: 'danger',
      title: 'Validación bloqueante',
      description:
        calculation.integrityIssues[0]?.message ??
        'La jornada tiene una validación de integridad pendiente.',
      date: day.date,
      process: 'PACKING',
    })
  }

  if (
    journey.status === 'NOT_BALANCED' &&
    !items.some((item) => item.tone === 'danger')
  ) {
    items.push({
      key: `${day.id}-packing-not-balanced`,
      tone: 'danger',
      title: 'Jornada cerrada sin cuadrar',
      description: `${weekday} está cerrada pero no cuadra; revisa el detalle de la jornada.`,
      date: day.date,
      process: 'PACKING',
    })
  }

  if (journey.observations.length > 0) {
    items.push({
      key: `${day.id}-packing-observed`,
      tone: 'warning',
      title:
        day.status === 'CLOSED'
          ? 'Envasado cerrado con observaciones'
          : 'Envasado con observaciones',
      description:
        journey.observations[0]?.message ??
        'La jornada tiene observaciones asociadas al cierre.',
      date: day.date,
      process: 'PACKING',
    })
  }

  return items
}

function buildFreezingItems({
  day,
  calculation,
  journey,
}: AttentionJourney): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = []

  if (calculation.integrityIssues.length > 0) {
    items.push({
      key: `${day.id}-freezing-integrity`,
      tone: 'danger',
      title: 'Integridad de Congelamiento',
      description:
        calculation.integrityIssues[0]?.message ??
        'La jornada tiene una validación de integridad pendiente.',
      date: day.date,
      process: 'FREEZING',
    })
  }

  if (journey.status === 'NOT_BALANCED' && items.length === 0) {
    items.push({
      key: `${day.id}-freezing-not-balanced`,
      tone: 'danger',
      title: 'Congelamiento cerrado sin cuadrar',
      description: `${formatIsoWeekday(
        day.date,
      )} está cerrada pero no cuadra; revisa el detalle de la jornada.`,
      date: day.date,
      process: 'FREEZING',
    })
  }

  if (journey.observations.length > 0) {
    items.push({
      key: `${day.id}-freezing-observed`,
      tone: 'warning',
      title:
        day.status === 'CLOSED'
          ? 'Congelamiento cerrado con observaciones'
          : 'Congelamiento con observaciones',
      description:
        journey.observations[0]?.message ??
        'La jornada tiene observaciones de trazabilidad.',
      date: day.date,
      process: 'FREEZING',
    })
  }

  return items
}

/** Every exception of the week: critical first, then observations, newest first. */
export function buildDashboardAttentionItems(
  input: DashboardAttentionInput,
): readonly DashboardAttentionItem[] {
  return [
    ...buildTraceabilityItems(input),
    ...input.packingDays.flatMap(buildPackingItems),
    ...input.freezingDays.flatMap(buildFreezingItems),
  ].sort(
    (first, second) =>
      tonePriority[first.tone] - tonePriority[second.tone] ||
      second.date.localeCompare(first.date),
  )
}

export interface DashboardAttentionSummary {
  readonly visible: readonly DashboardAttentionItem[]
  readonly hiddenCount: number
  readonly criticalCount: number
  readonly observationCount: number
}

/** Shows at most `limit` events; the rest stays behind "ver todas". */
export function summarizeDashboardAttention(
  items: readonly DashboardAttentionItem[],
  limit: number = MAX_VISIBLE_ATTENTION_ITEMS,
): DashboardAttentionSummary {
  const visible = items.slice(0, limit)

  return {
    visible,
    hiddenCount: items.length - visible.length,
    criticalCount: items.filter((item) => item.tone === 'danger').length,
    observationCount: items.filter((item) => item.tone === 'warning').length,
  }
}
