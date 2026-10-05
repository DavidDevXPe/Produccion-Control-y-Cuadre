import type {
  FamilyYieldProjection,
  FamilyYieldStatus,
} from '../../model/businessRules'
import type { SummaryGroupId } from '../../model/types'

export const FAMILY_FOR_GROUP: Partial<
  Record<SummaryGroupId, FamilyYieldProjection['key']>
> = {
  ALETA: 'ALETA',
  MANTO: 'MANTO',
  REJOS_SPECIAL: 'REJO_REPRODUCTOR',
  REJOS: 'REJO_REPRODUCTOR',
  REPRODUCTOR: 'REJO_REPRODUCTOR',
  NUCA_SEMILIMPIA: 'NUCA',
  NUCA_BIKINI: 'NUCA',
}

export function formatPercent(value: number | null): string {
  return value === null
    ? 'No disponible'
    : `${value.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`
}

export function statusMeta(status: FamilyYieldStatus | 'UNAVAILABLE') {
  switch (status) {
    case 'INTEGRITY_ERROR':
      return { label: 'ERROR DE INTEGRIDAD', tone: 'danger' as const }
    case 'BELOW_TARGET':
      return { label: 'BAJO OBJETIVO', tone: 'warning' as const }
    case 'COMPLIES':
      return { label: 'CUMPLE', tone: 'success' as const }
    case 'NO_TARGET':
      return { label: 'SIN OBJETIVO', tone: 'neutral' as const }
    default:
      return { label: 'SIN DATOS', tone: 'neutral' as const }
  }
}
