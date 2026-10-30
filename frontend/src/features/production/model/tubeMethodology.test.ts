import { describe, expect, it } from 'vitest'
import { kg100 } from './calculations'
import { getTubeMethodology } from './tubeMethodology'

describe('getTubeMethodology', () => {
  it('identifies Manto individual from positive Manto output', () => {
    expect(
      getTubeMethodology({
        ptMantoKg100: kg100(100),
        ptAnillasKg100: kg100(0),
        hasAnillasProduction: false,
      }),
    ).toMatchObject({
      key: 'MANTO_ONLY',
      label: 'Manto individual',
    })
  })

  it('identifies the combined methodology only when both families have production', () => {
    expect(
      getTubeMethodology({
        ptMantoKg100: kg100(100),
        ptAnillasKg100: kg100(25),
        hasAnillasProduction: true,
      }),
    ).toMatchObject({
      key: 'MANTO_AND_ANILLAS',
      label: 'Manto + Anillas — cálculo conjunto',
    })
  })

  it('identifies Anillas individual when Manto has no positive output', () => {
    expect(
      getTubeMethodology({
        ptMantoKg100: kg100(0),
        ptAnillasKg100: kg100(25),
        hasAnillasProduction: true,
      }),
    ).toMatchObject({
      key: 'ANILLAS_ONLY',
      label: 'Anillas individual',
    })
  })

  it('reports no production when all valid outputs are zero', () => {
    expect(
      getTubeMethodology({
        ptMantoKg100: kg100(0),
        ptAnillasKg100: kg100(25),
        hasAnillasProduction: false,
      }),
    ).toMatchObject({
      key: 'NONE',
      label: 'Sin producción registrada',
    })
  })

  it('falls back to the Anillas output when the production flag is unavailable', () => {
    expect(
      getTubeMethodology({
        ptMantoKg100: kg100(0),
        ptAnillasKg100: kg100(25),
      }),
    ).toMatchObject({ key: 'ANILLAS_ONLY' })
  })
})
