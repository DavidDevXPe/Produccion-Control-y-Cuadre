import { describe, expect, it } from 'vitest'
import { clearTrabundaStorage, TRABUNDA_STORAGE_KEYS, TRABUNDA_LEGACY_STORAGE_KEYS } from './trabundaStorage'

describe('application storage reset', () => {
  it('clears current and legacy application data without deleting other apps on the same origin', () => {
    const values = new Map<string, string>([['another-app', 'preserve']])
    const keys = [...Object.values(TRABUNDA_STORAGE_KEYS), ...Object.values(TRABUNDA_LEGACY_STORAGE_KEYS)]
    keys.forEach((key) => values.set(key, 'data'))
    const storage = { removeItem: (key: string) => { values.delete(key) } }
    clearTrabundaStorage(storage)
    expect([...values]).toEqual([['another-app', 'preserve']])
  })
})
