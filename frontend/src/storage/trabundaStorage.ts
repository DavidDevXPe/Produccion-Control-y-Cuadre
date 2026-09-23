export const TRABUNDA_STORAGE_KEYS = {
  activeOperationalWeek: 'trabunda-active-operational-week-v1',
  activeProductionProcess: 'trabunda-active-production-process-v1',
  colorTheme: 'trabunda-color-theme',
  performanceRecords: 'trabunda-performance-records-v1',
  productCatalog: 'trabunda-product-catalog-v2',
  legacyProductionCatalog: 'trabunda-production-catalog-v1',
  productionDays: 'trabunda-production-days-v2',
  storageQuarantine: 'trabunda-storage-quarantine-v1',
  weekProcessClosures: 'trabunda-week-process-closures-v2',
} as const

export const TRABUNDA_LEGACY_STORAGE_KEYS = {
  productionDays: 'trabunda-production-days-v1',
  weekClosures: 'trabunda-week-closures-v1',
} as const

export type TrabundaStorageKey =
  (typeof TRABUNDA_STORAGE_KEYS)[keyof typeof TRABUNDA_STORAGE_KEYS]

export const TRABUNDA_BACKUP_STORAGE_KEYS: readonly TrabundaStorageKey[] = [
  TRABUNDA_STORAGE_KEYS.activeOperationalWeek,
  TRABUNDA_STORAGE_KEYS.activeProductionProcess,
  TRABUNDA_STORAGE_KEYS.colorTheme,
  TRABUNDA_STORAGE_KEYS.performanceRecords,
  TRABUNDA_STORAGE_KEYS.productCatalog,
  TRABUNDA_STORAGE_KEYS.legacyProductionCatalog,
  TRABUNDA_STORAGE_KEYS.productionDays,
  TRABUNDA_STORAGE_KEYS.storageQuarantine,
  TRABUNDA_STORAGE_KEYS.weekProcessClosures,
]

export const TRABUNDA_BACKUP_FORMAT = 'TRABUNDA_BACKUP'
export const TRABUNDA_BACKUP_VERSION = 1
