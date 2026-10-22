import { normalizeProductName, productNameSlug } from '../capture/productNormalizer'
import { SEED_CAPTURE_PRODUCTS } from '../capture/seedProducts'

export const LEGACY_PRODUCT_ID_TO_CANONICAL = {
  'capture-seed-6': 'aleta-cruda-block-1000-2000-e',
  'capture-seed-7': 'aleta-cruda-block-500-1000',
  'capture-seed-8': 'aleta-cruda-block-2000-3000',
  'boton-espana-sm-sp-tratamiento': 'boton-espana-sm-sp-st-tratamiento',
} as const

const SEED_SLUG_TO_CANONICAL_ID: Readonly<Record<string, string>> = (() => {
  const map: Record<string, string> = {}
  for (const seed of SEED_CAPTURE_PRODUCTS) {
    const names = [
      seed.productName,
      seed.canonicalName,
      ...(seed.aliases ?? []),
    ].filter((name): name is string => Boolean(name))
    for (const name of names) {
      const slug = productNameSlug(name)
      if (slug && slug !== seed.productId) {
        map[slug] = seed.productId
        map[`captura-${slug}`] = seed.productId
      }
    }
  }
  return map
})()

export function canonicalProductId(productId: string): string {
  return (
    LEGACY_PRODUCT_ID_TO_CANONICAL[
      productId as keyof typeof LEGACY_PRODUCT_ID_TO_CANONICAL
    ] ??
    SEED_SLUG_TO_CANONICAL_ID[productId] ??
    productId
  )
}

export function productIdsEquivalent(
  firstProductId: string,
  secondProductId: string,
): boolean {
  return canonicalProductId(firstProductId) === canonicalProductId(secondProductId)
}

export function productsMatch(
  first: { productId: string; familyId?: string; productName?: string },
  second: { productId: string; familyId?: string; productName?: string },
): boolean {
  if (productIdsEquivalent(first.productId, second.productId)) {
    return true
  }
  if (
    first.familyId &&
    second.familyId &&
    first.familyId !== second.familyId
  ) {
    return false
  }
  if (first.productName && second.productName) {
    return (
      normalizeProductName(first.productName) ===
      normalizeProductName(second.productName)
    )
  }
  return false
}

export function balanceProductId(
  product: { productId: string; sourceProductId?: string },
): string {
  return canonicalProductId(product.sourceProductId ?? product.productId)
}
