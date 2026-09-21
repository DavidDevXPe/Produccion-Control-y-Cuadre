import { describe, expect, it } from 'vitest'
import { extractProductFeatures, matchProduct } from './productMatcher'
import { normalizeProductName } from './productNormalizer'
import { SEED_CAPTURE_PRODUCTS } from './seedProducts'

describe('product normalization and matching', () => {
  it('matches accents, import punctuation and spacing', () => {
    expect(normalizeProductName('MANTO JAPONÉS  2 KG-4 KG')).toBe(
      normalizeProductName('MANTO JAPONES 2 KG - 4 KG'),
    )
  })

  it('reports safe normalization reasons without fuzzy matching', () => {
    const encoding = matchProduct(
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÃ‘A P POLAR SM SP ST MIXTA 100% P.N.',
      SEED_CAPTURE_PRODUCTS,
    )
    const format = matchProduct(
      'MANTO JAPONES CRUDO CONGELADO BLOCK S TTO 2 KG - 4 KG SB 100% PN',
      SEED_CAPTURE_PRODUCTS,
    )

    expect(encoding.kind).toBe('NORMALIZED_ENCODING')
    expect(format.kind).toBe('NORMALIZED_FORMAT')
  })

  it('resolves Membranas with the new canonical name and the historical alias', () => {
    const current = matchProduct(
      'MEMBRANAS COCIDAS CONGELADAS BLOCK S/TTO 100% P.N.',
      SEED_CAPTURE_PRODUCTS,
    )
    const legacy = matchProduct(
      'MEMBRANAS COCIDAS CONGELADAS 100% P.N.',
      SEED_CAPTURE_PRODUCTS,
    )

    expect(current.kind).toBe('EXACT')
    expect(current.product?.productId).toBe('membranas-cocidas')
    expect(legacy.kind).toBe('ALIAS')
    expect(legacy.product?.productId).toBe('membranas-cocidas')
  })

  it('does not merge different sizes', () => {
    const first = matchProduct('ALETA CRUDA CONGELADA BLOCK S/TTO 500 g - 1000 g 100% P.N.', SEED_CAPTURE_PRODUCTS)
    const second = matchProduct('ALETA CRUDA CONGELADA BLOCK S/TTO 1000 g - 2000 g (E) 100% P.N.', SEED_CAPTURE_PRODUCTS)
    expect(first.product?.productId).not.toBe(second.product?.productId)
  })

  it('returns new product without persisting or inventing a match', () => {
    const result = matchProduct('PRODUCTO TOTALMENTE NUEVO 9000', SEED_CAPTURE_PRODUCTS)
    expect(result.kind).toBe('NEW_PRODUCT')
    expect(result.product).toBeUndefined()
  })

  it('keeps Nuca semilimpia 100-300 as a real new product before human confirmation', () => {
    const result = matchProduct(
      'NUCAS CRUDAS CONGELADAS BLOCK S/TTO SEMI-LIMPIAS 100-300 100% P.N.',
      SEED_CAPTURE_PRODUCTS,
    )

    expect(result.kind).toBe('NEW_PRODUCT')
    expect(result.product?.familyId).not.toBe('nuca-bikini')
  })

  it('extracts presentation ranges without dropping product numbers', () => {
    expect(extractProductFeatures('ALETA CRUDA 1000 g - 2000 g (E)').sizeRange).toBe('1000G-2000')
    expect(extractProductFeatures('NUCAS CRUDAS 300-UP').sizeRange).toBe('300-UP')
  })
})
