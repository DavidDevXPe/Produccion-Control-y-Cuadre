import {
  TRABUNDA_BACKUP_FORMAT,
  TRABUNDA_BACKUP_STORAGE_KEYS,
  TRABUNDA_BACKUP_VERSION,
  TRABUNDA_STORAGE_KEYS,
  type TrabundaStorageKey,
} from '../../../storage/trabundaStorage'
import { LEGACY_PRODUCT_ID_TO_CANONICAL } from '../../production/model/productIdentity'
import type { ProductionDay } from '../../production/model/types'
import { isProductionDay } from '../../production/model/productionDayValidation'

export interface TrabundaBackupFile {
  readonly format: typeof TRABUNDA_BACKUP_FORMAT
  readonly version: typeof TRABUNDA_BACKUP_VERSION
  readonly exportedAt: string
  readonly data: Partial<Record<TrabundaStorageKey, string>>
}

export interface TrabundaBackupPreview {
  readonly backup: TrabundaBackupFile
  readonly sourceFormat: 'VERSIONED' | 'LEGACY_LOCAL_STORAGE'
  /** Versioned exports are normalized in memory before being restored. */
  readonly migratedFromVersion: number | null
  readonly productionDays: number
  readonly performanceRecords: number
  readonly catalogProducts: number
  readonly weekProcessClosures: number
  readonly dateRange: string | null
  readonly detectedHistoricalProductIds: readonly string[]
  readonly detectedExternalOriginDayIds: readonly string[]
  readonly warnings: readonly string[]
}

const productionDaysKey = 'trabunda-production-days-v2' as TrabundaStorageKey
const performanceKey = 'trabunda-performance-records-v1' as TrabundaStorageKey
const productCatalogKey = 'trabunda-product-catalog-v2' as TrabundaStorageKey
const closuresKey = 'trabunda-week-process-closures-v2' as TrabundaStorageKey

function parseJson<T>(value: string | undefined): T | null {
  if (!value) return null

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function validateBackupData(data: TrabundaBackupFile['data']) {
  const arrayKeys: readonly string[] = [productionDaysKey, performanceKey, productCatalogKey,
    TRABUNDA_STORAGE_KEYS.legacyProductionCatalog, TRABUNDA_STORAGE_KEYS.storageQuarantine]
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') {
      throw new Error(`El respaldo contiene un valor inválido en ${key}.`)
    }
    if (arrayKeys.includes(key) || key === closuresKey) {
      let collection: unknown
      try { collection = JSON.parse(value) } catch {
        throw new Error(`El respaldo contiene JSON inválido en ${key}.`)
      }
      const valid = Array.isArray(collection)
      if (!valid) throw new Error(`El respaldo contiene una estructura inválida en ${key}.`)
      if (key === productionDaysKey && Array.isArray(collection)) {
        for (const day of collection) {
          if (!isProductionDay(day)) {
            throw new Error('El respaldo contiene jornadas con una estructura inválida.')
          }
        }
      }
    }
  }
}

function normalizeIncomingBackup(parsed: unknown): {
  backup: TrabundaBackupFile
  sourceFormat: TrabundaBackupPreview['sourceFormat']
  migratedFromVersion: number | null
} {
  if (
    isRecord(parsed) &&
    parsed.format === TRABUNDA_BACKUP_FORMAT &&
    (parsed.version === 1 || parsed.version === TRABUNDA_BACKUP_VERSION) &&
    isRecord(parsed.data)
  ) {
    const backupData = parsed.data
    for (const key of TRABUNDA_BACKUP_STORAGE_KEYS) {
      if (key in backupData && typeof backupData[key] !== 'string') {
        throw new Error(`El respaldo contiene un valor inválido en ${key}.`)
      }
    }

    return {
      backup: {
        format: TRABUNDA_BACKUP_FORMAT,
        version: TRABUNDA_BACKUP_VERSION,
        exportedAt:
          typeof parsed.exportedAt === 'string'
            ? parsed.exportedAt
            : new Date().toISOString(),
        data: Object.fromEntries(
          TRABUNDA_BACKUP_STORAGE_KEYS.flatMap((key) => {
            const value = backupData[key]
            return typeof value === 'string' ? [[key, value]] : []
          }),
        ),
      },
      sourceFormat: 'VERSIONED',
      migratedFromVersion:
        parsed.version === TRABUNDA_BACKUP_VERSION ? null : parsed.version,
    }
  }

  if (isRecord(parsed) && !('format' in parsed) && !('version' in parsed)) {
    const data = Object.fromEntries(
      TRABUNDA_BACKUP_STORAGE_KEYS.flatMap((key) => {
        const value = parsed[key]
        return typeof value === 'string' ? [[key, value]] : []
      }),
    ) as Partial<Record<TrabundaStorageKey, string>>

    if (Object.keys(data).length > 0) {
      return {
        backup: {
          format: TRABUNDA_BACKUP_FORMAT,
          version: TRABUNDA_BACKUP_VERSION,
          exportedAt: new Date().toISOString(),
          data,
        },
        sourceFormat: 'LEGACY_LOCAL_STORAGE',
        migratedFromVersion: null,
      }
    }
  }

  throw new Error('El archivo no corresponde a un respaldo válido de Trabunda.')
}

function getProductionDays(data: Partial<Record<TrabundaStorageKey, string>>) {
  return parseJson<ProductionDay[]>(data[productionDaysKey]) ?? []
}

function collectHistoricalIds(days: readonly ProductionDay[]): string[] {
  const legacyIds = new Set(Object.keys(LEGACY_PRODUCT_ID_TO_CANONICAL))
  const found = new Set<string>()

  for (const day of days) {
    for (const line of day.lines ?? []) {
      if (legacyIds.has(line.productId)) found.add(line.productId)
    }

    for (const lot of day.receivedBalanceLots ?? []) {
      if (legacyIds.has(lot.productId)) found.add(lot.productId)
      if (lot.sourceProductId && legacyIds.has(lot.sourceProductId)) {
        found.add(lot.sourceProductId)
      }
    }
  }

  return [...found].sort()
}

function collectExternalOrigins(days: readonly ProductionDay[]): string[] {
  const dayIds = new Set(days.map((day) => day.id))
  const origins = new Set<string>()

  for (const day of days) {
    for (const lot of day.receivedBalanceLots ?? []) {
      if (lot.originDayId && !dayIds.has(lot.originDayId)) {
        origins.add(lot.originDayId)
      }
    }
  }

  return [...origins].sort()
}

export function createTrabundaBackup(storage = window.localStorage): TrabundaBackupFile {
  const data: Partial<Record<TrabundaStorageKey, string>> = {}

  for (const key of TRABUNDA_BACKUP_STORAGE_KEYS) {
    const value = storage.getItem(key)
    if (value !== null) data[key] = value
  }

  return {
    format: TRABUNDA_BACKUP_FORMAT,
    version: TRABUNDA_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function parseTrabundaBackup(text: string): TrabundaBackupPreview {
  const parsed = JSON.parse(text) as unknown
  const { backup, sourceFormat, migratedFromVersion } =
    normalizeIncomingBackup(parsed)
  validateBackupData(backup.data)
  const days = getProductionDays(backup.data)
  const dates = days.map((day) => day.date).filter(Boolean).sort()
  const performanceRecords =
    parseJson<unknown[]>(backup.data[performanceKey])?.length ?? 0
  const catalogProducts =
    parseJson<unknown[]>(backup.data[productCatalogKey])?.length ?? 0
  const weekProcessClosures =
    parseJson<unknown[]>(backup.data[closuresKey])?.length ?? 0
  const detectedHistoricalProductIds = collectHistoricalIds(days)
  const detectedExternalOriginDayIds = collectExternalOrigins(days)
  const warnings: string[] = []

  if (days.length === 0) {
    warnings.push('El respaldo no contiene jornadas de producción.')
  }
  if (sourceFormat === 'LEGACY_LOCAL_STORAGE') {
    warnings.push('Formato antiguo detectado: se importará y quedará listo para exportarse en formato versionado.')
  }
  if (migratedFromVersion !== null) {
    warnings.push(
      `Respaldo v${migratedFromVersion} detectado: se validar\u00e1 y restaurar\u00e1 con el formato v${TRABUNDA_BACKUP_VERSION}.`,
    )
  }
  if (detectedHistoricalProductIds.length > 0) {
    warnings.push('Se detectaron IDs históricos; se conservarán y se resolverán contra sus productos actuales.')
  }
  if (detectedExternalOriginDayIds.length > 0) {
    warnings.push('Hay saldos con jornada de origen externa al respaldo; se conservarán como origen histórico.')
  }

  return {
    backup,
    sourceFormat,
    migratedFromVersion,
    productionDays: days.length,
    performanceRecords,
    catalogProducts,
    weekProcessClosures,
    dateRange:
      dates.length > 0 ? `${dates.at(0)} — ${dates.at(-1)}` : null,
    detectedHistoricalProductIds,
    detectedExternalOriginDayIds,
    warnings,
  }
}

export function restoreTrabundaBackup(
  preview: TrabundaBackupPreview,
  storage = window.localStorage,
) {
  const previousValues = new Map<TrabundaStorageKey, string | null>()
  validateBackupData(preview.backup.data)

  for (const key of TRABUNDA_BACKUP_STORAGE_KEYS) {
    previousValues.set(key, storage.getItem(key))
  }

  try {
    for (const key of TRABUNDA_BACKUP_STORAGE_KEYS) {
      const value = preview.backup.data[key]
      if (typeof value === 'string') {
        storage.setItem(key, value)
      } else if (key !== TRABUNDA_STORAGE_KEYS.storageQuarantine) {
        // The quarantine holds data the app skipped while loading; an older
        // backup that predates it must not erase that safety copy.
        storage.removeItem(key)
      }
    }

    for (const key of Object.keys(preview.backup.data) as TrabundaStorageKey[]) {
      const expected = preview.backup.data[key]
      if (typeof expected === 'string' && storage.getItem(key) !== expected) {
        throw new Error(`No se pudo verificar la clave ${key}.`)
      }
    }
  } catch (error) {
    for (const key of TRABUNDA_BACKUP_STORAGE_KEYS) {
      const previousValue = previousValues.get(key) ?? null
      if (previousValue === null) {
        storage.removeItem(key)
      } else {
        storage.setItem(key, previousValue)
      }
    }

    throw error
  }
}

export function downloadJsonFile(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
