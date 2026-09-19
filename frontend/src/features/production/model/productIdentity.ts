export const LEGACY_PRODUCT_ID_TO_CANONICAL = {
  'capture-seed-6': 'aleta-cruda-block-1000-2000-e',
  'capture-seed-7': 'aleta-cruda-block-500-1000',
  'capture-seed-8': 'aleta-cruda-block-2000-3000',
  'boton-espana-sm-sp-tratamiento': 'boton-espana-sm-sp-st-tratamiento',
} as const

export function canonicalProductId(productId: string): string {
  return (
    LEGACY_PRODUCT_ID_TO_CANONICAL[
      productId as keyof typeof LEGACY_PRODUCT_ID_TO_CANONICAL
    ] ?? productId
  )
}

export function productIdsEquivalent(
  firstProductId: string,
  secondProductId: string,
): boolean {
  return canonicalProductId(firstProductId) === canonicalProductId(secondProductId)
}

export function balanceProductId(
  product: { productId: string; sourceProductId?: string },
): string {
  return canonicalProductId(product.sourceProductId ?? product.productId)
}
