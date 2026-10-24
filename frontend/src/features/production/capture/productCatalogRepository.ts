import { normalizeProductName, productNameSlug } from './productNormalizer'
import { SEED_CAPTURE_PRODUCTS } from './seedProducts'
import type { ProductionCatalogItem } from './productionCatalog'
import { canonicalProductId } from '../model/productIdentity'
import { TRABUNDA_STORAGE_KEYS } from '../../../storage/trabundaStorage'
import { quarantineStoredData } from '../../../storage/storageQuarantine'

const STORAGE_KEY = TRABUNDA_STORAGE_KEYS.productCatalog

function isContaminatedAlias(value: string): boolean {
  return /20\d{2}[-/]\d{1,2}[-/]\d{1,2}/.test(value) && (value.match(/\d[\d.,]*/g)?.length ?? 0) >= 3
}

function readDynamicProducts(): ProductionCatalogItem[] {
  if (typeof window === 'undefined') return []
  try {
    const current = window.localStorage.getItem(STORAGE_KEY)
    const legacy = window.localStorage.getItem(TRABUNDA_STORAGE_KEYS.legacyProductionCatalog)
    const sourceKey = current !== null ? STORAGE_KEY : TRABUNDA_STORAGE_KEYS.legacyProductionCatalog
    const stored = current ?? legacy ?? '[]'
    let parsed: unknown
    try { parsed = JSON.parse(stored) } catch {
      quarantineStoredData(sourceKey, 'INVALID_JSON', stored)
      return []
    }
    const isProduct = (item: unknown): item is ProductionCatalogItem => {
      if (!item || typeof item !== 'object') return false
      const candidate = item as Partial<ProductionCatalogItem>
      return ['productId', 'productName', 'familyId', 'familyName', 'summaryGroupId'].every(
        (key) => typeof candidate[key as keyof ProductionCatalogItem] === 'string',
      ) && (candidate.aliases === undefined || Array.isArray(candidate.aliases))
    }
    if (!Array.isArray(parsed)) {
      quarantineStoredData(sourceKey, 'INVALID_RECORD', parsed)
      return []
    }
    const rejected = parsed.filter((item) => !isProduct(item))
    if (rejected.length > 0) quarantineStoredData(sourceKey, 'INVALID_RECORD', rejected)
    return parsed.filter(isProduct).map((item) => ({
      ...item,
      aliases: (item.aliases ?? []).filter((alias) => typeof alias === 'string' && !isContaminatedAlias(alias)),
    }))
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
  // Si existe el mismo ID o nombre normalizado en seed, solo combinamos aliases
  // y conservamos los datos oficiales del seed.
  for (const dynamicProduct of dynamicProducts) {
    const resolvedId = canonicalProductId(dynamicProduct.productId)
    const normalizedDynamicName = normalizeProductName(dynamicProduct.productName)
    const seedProduct =
      byId.get(resolvedId) ??
      SEED_CAPTURE_PRODUCTS.find(
        (seed) =>
          normalizeProductName(seed.productName) === normalizedDynamicName ||
          (seed.aliases ?? []).some(
            (alias) => normalizeProductName(alias) === normalizedDynamicName,
          ),
      )

    if (!seedProduct) {
      byId.set(dynamicProduct.productId, dynamicProduct)
      continue
    }

    const existingSeed = byId.get(seedProduct.productId) ?? seedProduct
    byId.set(seedProduct.productId, {
      ...existingSeed,
      ...dynamicProduct,
      productId: seedProduct.productId,
      productName: seedProduct.productName,
      canonicalName: seedProduct.canonicalName ?? seedProduct.productName,
      normalizedName: seedProduct.normalizedName ?? normalizeProductName(seedProduct.productName),
      familyId: seedProduct.familyId,
      familyName: seedProduct.familyName,
      summaryGroupId: seedProduct.summaryGroupId,
      ...(seedProduct.technicalClassification
        ? { technicalClassification: seedProduct.technicalClassification }
        : {}),
      aliases: [
        ...new Set([
          ...(existingSeed.aliases ?? []),
          ...(dynamicProduct.aliases ?? []),
        ]),
      ],
    })
  }

  return [...byId.values()]
}

export function addActiveProduct(product: ProductionCatalogItem): ProductionCatalogItem {
  const existing = dynamicProducts.find((item) => item.productId === product.productId)
  if (!existing) {
    dynamicProducts.push({
      ...product,
      active: product.active ?? true,
    })
  } else {
    Object.assign(existing, {
      ...product,
      aliases: [...new Set([...(existing.aliases ?? []), ...(product.aliases ?? [])])],
      active: product.active ?? existing.active ?? true,
    })
  }
  persist()
  return existing ?? product
}

export function updateActiveProduct(
  productId: string,
  updates: Partial<ProductionCatalogItem>,
): ProductionCatalogItem | undefined {
  const activeProducts = getActiveProducts()
  const current = activeProducts.find((item) => item.productId === productId)
  if (!current) return undefined

  const updatedItem: ProductionCatalogItem = {
    ...current,
    ...updates,
    productName: updates.productName?.trim() || current.productName,
    canonicalName: updates.canonicalName?.trim() || updates.productName?.trim() || current.canonicalName || current.productName,
    normalizedName: normalizeProductName(updates.productName || current.productName),
  }

  const existingDynamic = dynamicProducts.find((item) => item.productId === productId)
  if (existingDynamic) {
    Object.assign(existingDynamic, updatedItem)
  } else {
    dynamicProducts.push(updatedItem)
  }

  persist()
  return updatedItem
}

export function removeAliasFromActiveProduct(productId: string, alias: string): void {
  const item = dynamicProducts.find((candidate) => candidate.productId === productId)
  if (item && item.aliases) {
    item.aliases = item.aliases.filter((a) => a !== alias)
    persist()
    return
  }

  const seedItem = SEED_CAPTURE_PRODUCTS.find((candidate) => candidate.productId === productId)
  if (seedItem) {
    const currentAliases = (seedItem.aliases ?? []).filter((a) => a !== alias)
    dynamicProducts.push({
      ...seedItem,
      aliases: currentAliases,
    })
    persist()
  }
}

export function toggleProductActiveStatus(productId: string): boolean {
  const activeProducts = getActiveProducts()
  const current = activeProducts.find((item) => item.productId === productId)
  if (!current) return false

  const newStatus = !(current.active ?? true)
  updateActiveProduct(productId, { active: newStatus })
  return newStatus
}

export function createStableProductId(canonicalName: string): string {
  const slug = productNameSlug(canonicalName)
  const base =
    slug.includes('nucas-crudas-congeladas-block-stto-semi-limpias-100-300')
      ? 'nuca-semilimpia-100-300'
      : slug.startsWith('nuca') && slug.includes('100-300')
        ? 'nuca-semilimpia-100-300'
        : slug
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

export function resetActiveProductCatalogForTests(): void {
  dynamicProducts.splice(0, dynamicProducts.length, ...readDynamicProducts())
}

/**
 * Re-read dynamic products after a change made by another browser tab.
 * Writes in the current tab already update the in-memory collection through
 * the mutation functions above; this function is only for the storage event.
 */
export function reloadActiveProductCatalog(): void {
  dynamicProducts.splice(0, dynamicProducts.length, ...readDynamicProducts())
}
