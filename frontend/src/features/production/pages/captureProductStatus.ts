import type { Kg100 } from '../model/types'
import { kg100 } from '../model/calculations'

export function freezingTraceabilityStatus(
  reportedKg100: Kg100,
  availableKg100: Kg100,
  linkedKg100: Kg100,
) {
  const pendingToLinkKg100 = kg100(
    Math.max(reportedKg100 - linkedKg100, 0),
  )

  if (reportedKg100 === 0 && linkedKg100 === 0) {
    return {
      tone: 'neutral' as const,
      label: 'SIN MOVIMIENTO',
      pendingToLinkKg100,
    }
  }

  if (linkedKg100 > reportedKg100) {
    return {
      tone: 'danger' as const,
      label: 'REVISAR VÍNCULO',
      pendingToLinkKg100,
    }
  }

  if (availableKg100 === 0) {
    return {
      tone: 'danger' as const,
      label: 'SIN ORIGEN TRAZABLE',
      pendingToLinkKg100,
    }
  }

  if (availableKg100 < reportedKg100) {
    return {
      tone: 'danger' as const,
      label: 'ORIGEN INSUFICIENTE',
      pendingToLinkKg100,
    }
  }

  if (linkedKg100 < reportedKg100) {
    return {
      tone: 'warning' as const,
      label: 'PENDIENTE VINCULAR',
      pendingToLinkKg100,
    }
  }

  return {
    tone: 'success' as const,
    label: 'TRAZABLE',
    pendingToLinkKg100,
  }
}

export function packingProductStatus(totalKg100: Kg100) {
  return totalKg100 > 0
    ? { tone: 'success' as const, label: 'REGISTRADO' }
    : { tone: 'neutral' as const, label: 'SIN MOVIMIENTO' }
}
