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

  it('extracts presentation ranges without dropping product numbers', () => {
    expect(extractProductFeatures('ALETA CRUDA 1000 g - 2000 g (E)').sizeRange).toBe('1000G-2000')
    expect(extractProductFeatures('NUCAS CRUDAS 300-UP').sizeRange).toBe('300-UP')
  })
})
