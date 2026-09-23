import { TRABUNDA_STORAGE_KEYS } from './trabundaStorage'

export type StorageQuarantineReason =
  | 'INVALID_JSON'
  | 'INVALID_RECORD'
  | 'PERMANENT_DAY_COLLISION'

export interface StorageQuarantineEntry {
  readonly sourceKey: string
  readonly reason: StorageQuarantineReason
  readonly quarantinedAt: string
  readonly payload: unknown
}

function readEntries(storage: Storage): StorageQuarantineEntry[] {
  try {
    const parsed: unknown = JSON.parse(
      storage.getItem(TRABUNDA_STORAGE_KEYS.storageQuarantine) ?? '[]',
    )
    return Array.isArray(parsed) ? (parsed as StorageQuarantineEntry[]) : []
  } catch {
    return []
  }
}

/**
 * Keeps a non-destructive copy of stored data that the app cannot (or must not)
 * load into memory. The next save of the original key overwrites it with the
 * in-memory state, so anything skipped while loading would otherwise be lost.
 *
 * This never throws and never modifies the source key. Identical payloads are
 * stored only once, so reloading the app does not grow the quarantine.
 */
export function quarantineStoredData(
  sourceKey: string,
  reason: StorageQuarantineReason,
  payload: unknown,
  storage: Storage | undefined = typeof window === 'undefined'
    ? undefined
    : window.localStorage,
): void {
  if (!storage) return

  try {
    const serializedPayload = JSON.stringify(payload)
    const entries = readEntries(storage)
    const alreadyStored = entries.some(
      (entry) =>
        entry.sourceKey === sourceKey &&
        entry.reason === reason &&
        JSON.stringify(entry.payload) === serializedPayload,
    )
    if (alreadyStored) return

    storage.setItem(
      TRABUNDA_STORAGE_KEYS.storageQuarantine,
      JSON.stringify([
        ...entries,
        {
          sourceKey,
          reason,
          quarantinedAt: new Date().toISOString(),
          payload,
        } satisfies StorageQuarantineEntry,
      ]),
    )
  } catch {
    // The quarantine is a safety net: if storage is full or blocked, loading
    // must still continue exactly as before.
  }
}
