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
  /**
   * Envasado − Congelado reportado.
   * - Envasado = Congelado -> Cuadrado (0.00 kg)
   * - Envasado > Congelado -> Pendiente de congelar / excedente (+X.XX kg)
   * - Congelado > Envasado -> Congelado sin envasado / déficit (-X.XX kg)
   */
  const differenceKg100 = kg100(availableKg100 - reportedKg100)

  if (reportedKg100 === 0 && linkedKg100 === 0) {
    return {
      tone: 'neutral' as const,
      label: 'SIN MOVIMIENTO',
      pendingToLinkKg100,
      differenceKg100: availableKg100 > 0 ? availableKg100 : kg100(0),
    }
  }

  if (reportedKg100 > availableKg100 || linkedKg100 > reportedKg100) {
    return {
      tone: 'danger' as const,
      label: 'DESCUADRE',
      pendingToLinkKg100,
      differenceKg100,
    }
  }

  if (availableKg100 > reportedKg100) {
    return {
      tone: 'info' as const,
      label: 'EXCEDENTE',
      pendingToLinkKg100,
      differenceKg100,
    }
  }

  return {
    tone: 'success' as const,
    label: 'CUADRADO',
    pendingToLinkKg100,
    differenceKg100,
  }
}

export function packingProductStatus(totalKg100: Kg100) {
  return totalKg100 > 0
    ? { tone: 'success' as const, label: 'REGISTRADO' }
    : { tone: 'neutral' as const, label: 'SIN MOVIMIENTO' }
}
