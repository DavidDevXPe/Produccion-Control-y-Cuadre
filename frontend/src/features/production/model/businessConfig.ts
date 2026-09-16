export const GENERAL_MIN_YIELD = 0.8
export const ALETA_TARGET = 0.9
export const REJO_REPRODUCTOR_TARGET = 0.97
export const NUCA_TARGET = 0.45
export const NUCA_BIKINI_REFERENCE = 0.07

export const TUBE_MP_SHARE = 0.5
export const MANTO_STANDARD_YIELD = 0.8
export const ANILLA_POLAR_YIELD = 0.36
export const ANILLA_GENERAL_YIELD = 0.42
export const ANILLA_USA_YIELD = 0.34
export const ALETA_MP_SHARE = 0.2
export const REJO_MP_SHARE = 0.15
export const NUCA_MP_SHARE = 0.15

export type AnillaYieldClass = 'POLAR' | 'GENERAL' | 'USA'
export type ProcessOrigin = 'ANILLAS'

const ANILLA_YIELD_CLASS_BY_PRODUCT_ID: Readonly<
  Record<string, AnillaYieldClass>
> = {
  'anillas-espana-polar-mixta': 'POLAR',
  'anillas-espana-segunda-mixta': 'GENERAL',
  'anillas-espana-cm-2da-mixta': 'GENERAL',
  'anillas-espana-p-sm-sp-st-mixta': 'GENERAL',
  'anillas-espana-p-cm-sp-st-mixta': 'GENERAL',
  'anillas-iqf-tratamiento-usa-sm-cp-st': 'GENERAL',
  'anillas-block-tratamiento-usa-sm-cp-st': 'USA',
  'anillas-block-tratamiento-usa-cm-sp-st': 'USA',
  'anillas-block-tratamiento-usa-sm-sp-st': 'USA',
  'capture-seed-11': 'POLAR',
  'capture-seed-12': 'GENERAL',
  'capture-seed-13': 'GENERAL',
}

const ANILLAS_PROCESS_ORIGIN_PRODUCT_IDS = new Set([
  'boton-espana-sm-sp-st-tratamiento',
  'boton-usa-sm-cp-st-tratamiento',
  'boton-usa-cm-sp-st-tratamiento',
  'boton-usa-sm-sp-st-tratamiento',
  'recorte-crudo-anillas-sm-sp-st',
  'recorte-crudo-anillas-cm-sp-st',
  'membranas-cocidas',
])

export function getAnillaYieldClass(
  productId: string,
): AnillaYieldClass | null {
  return ANILLA_YIELD_CLASS_BY_PRODUCT_ID[productId] ?? null
}

export function getProcessOrigin(productId: string): ProcessOrigin | null {
  return ANILLAS_PROCESS_ORIGIN_PRODUCT_IDS.has(productId) ? 'ANILLAS' : null
}

const BASIS_POINTS = 10_000

export const GENERAL_MIN_YIELD_BPS = Math.round(GENERAL_MIN_YIELD * BASIS_POINTS)
export const ALETA_TARGET_BPS = Math.round(ALETA_TARGET * BASIS_POINTS)
export const REJO_REPRODUCTOR_TARGET_BPS = Math.round(
  REJO_REPRODUCTOR_TARGET * BASIS_POINTS,
)
export const NUCA_TARGET_BPS = Math.round(NUCA_TARGET * BASIS_POINTS)
export const NUCA_BIKINI_REFERENCE_BPS = Math.round(
  NUCA_BIKINI_REFERENCE * BASIS_POINTS,
)
export const TUBE_MP_SHARE_BPS = Math.round(TUBE_MP_SHARE * BASIS_POINTS)
export const MANTO_STANDARD_YIELD_BPS = Math.round(
  MANTO_STANDARD_YIELD * BASIS_POINTS,
)
export const ALETA_MP_SHARE_BPS = Math.round(ALETA_MP_SHARE * BASIS_POINTS)
export const REJO_MP_SHARE_BPS = Math.round(REJO_MP_SHARE * BASIS_POINTS)
export const NUCA_MP_SHARE_BPS = Math.round(NUCA_MP_SHARE * BASIS_POINTS)
