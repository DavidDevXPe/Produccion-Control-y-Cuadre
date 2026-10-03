import type { FamilyYieldProjection } from '../../model/businessRules'

export function formatPercent(value: number | null): string {
  return value === null
    ? 'No disponible'
    : `${value.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`
}

export function yieldStatus(metric: FamilyYieldProjection): {
  tone: 'danger' | 'warning' | 'success' | 'neutral'
  label: string
} {
  switch (metric.status) {
    case 'INTEGRITY_ERROR':
      return { tone: 'danger', label: 'ERROR DE INTEGRIDAD' }
    case 'BELOW_TARGET':
      return { tone: 'warning', label: 'BAJO OBJETIVO' }
    case 'COMPLIES':
      return { tone: 'success', label: 'CUMPLE' }
    default:
      return { tone: 'neutral', label: 'SIN OBJETIVO' }
  }
}
