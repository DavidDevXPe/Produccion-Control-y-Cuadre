import { getActiveProducts } from './productCatalogRepository'
import {
  normalizeProductName,
  repairProductMojibake,
} from './productNormalizer'
import type { ProductionCatalogItem } from './productionCatalog'

export type ProductMatchKind =
  | 'EXACT'
  | 'NORMALIZED_ENCODING'
  | 'NORMALIZED_FORMAT'
  | 'ALIAS'
  | 'NEW_PRODUCT'
  | 'REVIEW_REQUIRED'

export interface ProductMatch {
  kind: ProductMatchKind
  product?: ProductionCatalogItem
  normalizedName: string
  score?: number
  reason?: string
}

export interface ProductFeatures {
  family: string | null
  sizeRange: string | null
  classification: 'POLAR' | 'USA' | 'GENERAL' | null
  presentationTokens: readonly string[]
}

export function extractProductFeatures(value: string): ProductFeatures {
  const normalized = normalizeProductName(value)
  const range = normalized.match(/\b(\d+)\s*(?:G|KG)?\s*(?:-|A)\s*(\d+|UP)\b|\b(\d+)\s*(?:G|KG)?\s*UP\b/)
  return {
    family: ['ALETA', 'MANTO', 'ANILLA', 'NUCA', 'REJO', 'RECORTE', 'CONO', 'MEMBRANA'].find((family) => normalized.includes(family)) ?? null,
    sizeRange: range ? range[0].replace(/\s+/g, '') : null,
    classification: normalized.includes('POLAR') ? 'POLAR' : normalized.includes('USA') ? 'USA' : normalized.includes('GENERAL') ? 'GENERAL' : null,
    presentationTokens: normalized.split(' ').filter((token) => /^(SM|SP|ST|CM|E|TTO|STTO|PN)$/.test(token)),
  }
}

function displayName(product: ProductionCatalogItem): string {
  return product.canonicalName ?? product.productName
}

function sameLiteral(first: string, second: string): boolean {
  return first.trim().replace(/\s+/g, ' ') === second.trim().replace(/\s+/g, ' ')
}

export function matchProduct(
  productName: string,
  products: readonly ProductionCatalogItem[] = getActiveProducts(),
): ProductMatch {
  const repairedName = repairProductMojibake(productName)
  const normalizedName = normalizeProductName(repairedName)

  const literal = repairedName === productName
    ? products.find((product) => sameLiteral(displayName(product), repairedName))
    : undefined
  if (literal) {
    return { kind: 'EXACT', product: literal, normalizedName, score: 1 }
  }

  const alias = products.find((product) =>
    product.aliases?.some((value) => normalizeProductName(value) === normalizedName),
  )
  if (alias) {
    return { kind: 'ALIAS', product: alias, normalizedName, score: 1 }
  }

  const normalized = products.find((product) =>
    normalizeProductName(displayName(product)) === normalizedName ||
    product.normalizedName === normalizedName,
  )
  if (normalized) {
    const kind: ProductMatchKind =
      repairedName !== productName ? 'NORMALIZED_ENCODING' : 'NORMALIZED_FORMAT'
    return {
      kind,
      product: normalized,
      normalizedName,
      score: 1,
      reason:
        kind === 'NORMALIZED_ENCODING'
          ? `Normalización de codificación: ${productName} → ${repairedName}`
          : 'Normalización de formato',
    }
  }

  return { kind: 'NEW_PRODUCT', normalizedName }
}
