import type { TubeMpBalance } from './tubeMpBalance'

export type TubeMethodologyKey =
  | 'MANTO_ONLY'
  | 'MANTO_AND_ANILLAS'
  | 'ANILLAS_ONLY'
  | 'NONE'

export interface TubeMethodology {
  readonly key: TubeMethodologyKey
  readonly label: string
  readonly explanation: string
}

/**
 * Describes the active Tube methodology without changing any calculation.
 * Production is inferred from positive finished quantities, never from the
 * presence of a catalog row.
 */
export function getTubeMethodology(
  balance: Pick<
    TubeMpBalance,
    'ptMantoKg100' | 'ptAnillasKg100' | 'hasAnillasProduction'
  >,
): TubeMethodology {
  const hasMantoProduction = balance.ptMantoKg100 > 0
  const hasAnillasProduction =
    balance.hasAnillasProduction ?? balance.ptAnillasKg100 > 0

  if (hasMantoProduction && hasAnillasProduction) {
    return {
      key: 'MANTO_AND_ANILLAS',
      label: 'Manto + Anillas — cálculo conjunto',
      explanation:
        'Hay producción positiva de ambas familias; se aplica la distribución conjunta de MP Tubo.',
    }
  }

  if (hasMantoProduction) {
    return {
      key: 'MANTO_ONLY',
      label: 'Manto individual',
      explanation:
        'Solo hay producción positiva de Manto; no se activa el cálculo teórico de Anillas.',
    }
  }

  if (hasAnillasProduction) {
    return {
      key: 'ANILLAS_ONLY',
      label: 'Anillas individual',
      explanation:
        'Solo hay producción positiva de Anillas; Manto no participa en la distribución.',
    }
  }

  return {
    key: 'NONE',
    label: 'Sin producción registrada',
    explanation:
      'No hay cantidades positivas de Manto o Anillas para aplicar una metodología.',
  }
}
