import { normalizeProductName, productNameSlug } from './productNormalizer'
import { SEED_CAPTURE_PRODUCTS } from './seedProducts'
import type { ProductionCatalogItem } from './productionCatalog'
import { TRABUNDA_STORAGE_KEYS } from '../../../storage/trabundaStorage'

const STORAGE_KEY = TRABUNDA_STORAGE_KEYS.productCatalog

function isContaminatedAlias(value: string): boolean {
  return /20\d{2}[-/]\d{1,2}[-/]\d{1,2}/.test(value) && (value.match(/\d[\d.,]*/g)?.length ?? 0) >= 3
}

function readDynamicProducts(): ProductionCatalogItem[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is ProductionCatalogItem => Boolean(item && typeof item === 'object' && typeof (item as { productId?: unknown }).productId === 'string')).map((item) => ({
      ...item,
      aliases: (item.aliases ?? []).filter((alias) => typeof alias === 'string' && !isContaminatedAlias(alias)),
    })) : []
  } catch {
    return []
  }
}

const dynamicProducts = readDynamicProducts()

function persist() {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dynamicProducts)) } catch { /* memory remains usable */ }
}

export function getActiveProducts(): ProductionCatalogItem[] {
  const byId = new Map<string, ProductionCatalogItem>()

  // El catálogo seed es la definición oficial actual.
  for (const seedProduct of SEED_CAPTURE_PRODUCTS) {
    byId.set(seedProduct.productId, seedProduct)
  }

  // Los productos dinámicos nuevos sí se agregan.
  // Si existe el mismo ID en seed, solo combinamos aliases
  // y conservamos los datos oficiales del seed.
  for (const dynamicProduct of dynamicProducts) {
    const seedProduct = byId.get(dynamicProduct.productId)

    if (!seedProduct) {
      byId.set(dynamicProduct.productId, dynamicProduct)
      continue
    }

    byId.set(dynamicProduct.productId, {
      ...seedProduct,
      aliases: [
        ...new Set([
          ...(seedProduct.aliases ?? []),
          ...(dynamicProduct.aliases ?? []),
        ]),
      ],
    })
  }

  return [...byId.values()]
}

export function addActiveProduct(product: ProductionCatalogItem): ProductionCatalogItem {
  const existing = dynamicProducts.find((item) => item.productId === product.productId)
  if (!existing) dynamicProducts.push(product)
  persist()
  return existing ?? product
}

export function createStableProductId(canonicalName: string): string {
  const base = `capture-${productNameSlug(canonicalName)}`
  const active = getActiveProducts()
  if (!active.some((item) => item.productId === base)) return base
  let suffix = 2
  while (active.some((item) => item.productId === `${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export function addAliasToActiveProduct(productId: string, alias: string): void {
  if (!alias.trim() || isContaminatedAlias(alias) || normalizeProductName(alias).length < 5) return
  const active = getActiveProducts().find((candidate) => candidate.productId === productId)
  if (!active || active.aliases?.includes(alias)) return
  const item = dynamicProducts.find((candidate) => candidate.productId === productId)
  if (item) {
    item.aliases = [...(item.aliases ?? []), alias]
  } else {
    dynamicProducts.push({ ...active, aliases: [...(active.aliases ?? []), alias] })
  }
  persist()
}
