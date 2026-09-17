import { WEEK_36_2026_PRODUCTION_DAYS } from '../data/week36'
import {
  getAnillaYieldClass,
  getProcessOrigin,
  type AnillaYieldClass,
  type ProcessOrigin,
} from '../model/businessConfig'
import type { SummaryGroupId } from '../model/types'
import { getActiveProducts, addActiveProduct, createStableProductId } from './productCatalogRepository'
import { normalizeProductName } from './productNormalizer'

const PRODUCTION_CATALOG_STORAGE_KEY = 'trabunda-production-catalog-v1'

export interface ProductionCatalogItem {
  familyId: string
  familyName: string
  productId: string
  productName: string
  summaryGroupId: SummaryGroupId
  anillaYieldClass?: AnillaYieldClass
  processOrigin?: ProcessOrigin
  canonicalName?: string
  normalizedName?: string
  aliases?: string[]
  source?: 'CAPTURE' | 'SEED' | 'MANUAL'
  createdAt?: string
  active?: boolean
  technicalClassification?: 'POLAR' | 'USA' | 'GENERAL' | 'UNCLASSIFIED'
}

const extraCatalogItems: readonly ProductionCatalogItem[] = [
  {
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'conos-con-piel-crudos',
    productName: 'CONOS CON PIEL CRUDOS CONGELADO BLOCK S/TTO 100% P.N.',
    summaryGroupId: 'MANTO',
  },
  {
    familyId: 'aleta-cruda',
    familyName: 'ALETA CRUDA',
    productId: 'aleta-cruda-ucrania-codificada',
    productName: 'ALETA CRUDA CONGELADA BLOCK S/TTO UCRANIA CODIFICADA',
    summaryGroupId: 'ALETA',
  },
  {
    familyId: 'pico',
    familyName: 'PICO',
    productId: 'pico-crudo',
    productName: 'PICO CRUDO CONGELADO BLOCK S/TTO',
    summaryGroupId: 'PICO',
  },
  {
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-block-tratamiento-usa-sm-sp-st',
    productName: 'ANILLAS CRUDAS CONG. BLOCK C/TTO USA SM SP ST',
    summaryGroupId: 'ANILLAS',
  },
]

const catalogByProductId = new Map<string, ProductionCatalogItem>()

for (const day of WEEK_36_2026_PRODUCTION_DAYS) {
  for (const line of day.lines) {
    if (catalogByProductId.has(line.productId)) continue
    const anillaYieldClass = getAnillaYieldClass(line.productId)
    const processOrigin = getProcessOrigin(line.productId)
    catalogByProductId.set(line.productId, {
      familyId: line.familyId,
      familyName: line.familyName,
      productId: line.productId,
      productName: line.productName,
      summaryGroupId: line.summaryGroupId,
      ...(anillaYieldClass ? { anillaYieldClass } : {}),
      ...(processOrigin ? { processOrigin } : {}),
    })
  }
}

for (const item of extraCatalogItems) {
  if (!catalogByProductId.has(item.productId)) {
    const anillaYieldClass = getAnillaYieldClass(item.productId)
    const processOrigin = getProcessOrigin(item.productId)
    catalogByProductId.set(item.productId, {
      ...item,
      ...(anillaYieldClass ? { anillaYieldClass } : {}),
      ...(processOrigin ? { processOrigin } : {}),
    })
  }
}

const baseCatalogItems = [...catalogByProductId.values()].sort(
  (first, second) =>
    first.familyName.localeCompare(second.familyName, 'es-PE') ||
    first.productName.localeCompare(second.productName, 'es-PE'),
)

function readStoredCatalogItems(): ProductionCatalogItem[] {
  if (typeof window === 'undefined') return []

  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(PRODUCTION_CATALOG_STORAGE_KEY) ?? '[]',
    )
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is ProductionCatalogItem => {
      if (!item || typeof item !== 'object') return false
      const candidate = item as Partial<ProductionCatalogItem>
      return (
        typeof candidate.familyId === 'string' &&
        typeof candidate.familyName === 'string' &&
        typeof candidate.productId === 'string' &&
        typeof candidate.productName === 'string' &&
        typeof candidate.summaryGroupId === 'string'
      )
    })
  } catch {
    return []
  }
}

export const PRODUCTION_CATALOG_ITEMS: ProductionCatalogItem[] = [
  ...baseCatalogItems,
  ...readStoredCatalogItems().filter(
    (stored) => !baseCatalogItems.some((item) => item.productId === stored.productId),
  ),
]

/** Products that have appeared in an imported production screenshot. */
export const CAPTURE_CATALOG_ITEMS: ProductionCatalogItem[] = [
  ...getActiveProducts(),
]

function persistStoredCatalogItems() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      PRODUCTION_CATALOG_STORAGE_KEY,
      JSON.stringify(CAPTURE_CATALOG_ITEMS),
    )
  } catch {
    // The in-memory catalog remains available for the current session.
  }
}

function normalizeProductKey(value: string): string {
  return normalizeProductName(value).toLocaleLowerCase('es-PE')
}

function catalogMetadataForName(productName: string): Pick<
  ProductionCatalogItem,
  'familyId' | 'familyName' | 'summaryGroupId'
> {
  const normalized = normalizeProductKey(productName)
  if (normalized.includes('aleta')) return { familyId: 'aleta-cruda', familyName: 'ALETA CRUDA', summaryGroupId: 'ALETA' }
  if (normalized.includes('panza') && normalized.includes('ballena')) return { familyId: 'recorte-cocido', familyName: 'RECORTE COCIDO', summaryGroupId: 'RECORTE_COCIDO' }
  if (normalized.includes('manto') || normalized.includes('cono')) return { familyId: 'manto-crudo', familyName: 'MANTO CRUDO', summaryGroupId: 'MANTO' }
  if (normalized.includes('anilla')) return { familyId: 'anillas', familyName: 'ANILLAS', summaryGroupId: 'ANILLAS' }
  if (normalized.includes('reproductor')) return { familyId: 'reproductor-crudo', familyName: 'REPRODUCTOR CRUDO', summaryGroupId: 'REPRODUCTOR' }
  if (normalized.includes('rejo')) return { familyId: 'rejos-crudo', familyName: 'REJOS CRUDO', summaryGroupId: 'REJOS' }
  if (normalized.includes('nuca')) return { familyId: 'nuca-semilimpia', familyName: 'NUCA SEMILIMPIA', summaryGroupId: 'NUCA_SEMILIMPIA' }
  if (normalized.includes('pico')) return { familyId: 'pico', familyName: 'PICO', summaryGroupId: 'PICO' }
  if (normalized.includes('recorte')) return { familyId: 'recorte-crudo', familyName: 'RECORTE CRUDO', summaryGroupId: 'RECORTE_CRUDO' }
  return { familyId: 'producto-importado', familyName: 'PRODUCTO IMPORTADO', summaryGroupId: 'MANTO' }
}

export function addProductionCatalogItem(productName: string): ProductionCatalogItem {
  const existing = findCatalogItemByName(productName)
  if (existing) {
    if (!CAPTURE_CATALOG_ITEMS.some((item) => item.productId === existing.productId)) {
      CAPTURE_CATALOG_ITEMS.push(existing)
      persistStoredCatalogItems()
    }
    return existing
  }

  const normalizedName = productName.trim().replace(/\s+/g, ' ')
  const productId = `captura-${normalizeProductKey(normalizedName).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
  const item: ProductionCatalogItem = {
    productId,
    productName: normalizedName,
    canonicalName: normalizedName,
    normalizedName: normalizeProductName(normalizedName),
    aliases: [],
    source: 'CAPTURE',
    createdAt: new Date().toISOString(),
    active: true,
    technicalClassification: 'UNCLASSIFIED',
    ...catalogMetadataForName(normalizedName),
  }
  PRODUCTION_CATALOG_ITEMS.push(item)
  CAPTURE_CATALOG_ITEMS.push(item)
  PRODUCTION_CATALOG_ITEMS.sort(
    (first, second) =>
      first.familyName.localeCompare(second.familyName, 'es-PE') ||
      first.productName.localeCompare(second.productName, 'es-PE'),
  )
  persistStoredCatalogItems()
  return item
}

export function filterProductionCatalogItems(
  query: string,
): readonly ProductionCatalogItem[] {
  const normalizedQuery = normalizeProductName(query)

  if (!normalizedQuery) return PRODUCTION_CATALOG_ITEMS

  const queryWords = normalizedQuery.split(' ')

  return PRODUCTION_CATALOG_ITEMS.filter((item) => {
    const searchableText = normalizeProductName(
      `${item.familyName} ${item.productName}`,
    )

    return queryWords.every((word) => searchableText.includes(word))
  })
}

export function filterCaptureCatalogItems(
  query: string,
  items: readonly ProductionCatalogItem[] = CAPTURE_CATALOG_ITEMS,
): readonly ProductionCatalogItem[] {
  const normalizedQuery = normalizeProductName(query)

  if (!normalizedQuery) return items

  const queryWords = normalizedQuery.split(' ')

  return items.filter((item) => {
    const searchableText = normalizeProductName(
      `${item.familyName} ${item.productName}`,
    )

    return queryWords.every((word) => searchableText.includes(word))
  })
}

export function createUnconfirmedCatalogItem(productName: string): ProductionCatalogItem {
  const normalizedName = productName.trim().replace(/\s+/g, ' ')
  return {
    productId: createStableProductId(normalizedName),
    productName: normalizedName,
    canonicalName: normalizedName,
    normalizedName: normalizeProductName(normalizedName),
    aliases: [],
    source: 'CAPTURE',
    createdAt: new Date().toISOString(),
    active: true,
    technicalClassification: 'UNCLASSIFIED',
    ...catalogMetadataForName(normalizedName),
  }
}

export function confirmProductionCatalogItem(item: ProductionCatalogItem): ProductionCatalogItem {
  const confirmed = addActiveProduct(item)
  if (!CAPTURE_CATALOG_ITEMS.some((candidate) => candidate.productId === confirmed.productId)) {
    CAPTURE_CATALOG_ITEMS.push(confirmed)
  }
  return confirmed
}

export function findCatalogItemByName(
  productName: string,
): ProductionCatalogItem | undefined {
  const normalizedName = normalizeProductName(productName)
  return PRODUCTION_CATALOG_ITEMS.find(
    (item) => normalizeProductName(item.productName) === normalizedName,
  )
}

export function findActiveCatalogItemByName(productName: string): ProductionCatalogItem | undefined {
  const normalizedName = normalizeProductName(productName)
  return CAPTURE_CATALOG_ITEMS.find(
    (item) => item.normalizedName === normalizedName || normalizeProductName(item.productName) === normalizedName,
  )
}
