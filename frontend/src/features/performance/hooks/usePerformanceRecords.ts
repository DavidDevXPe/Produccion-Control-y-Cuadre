import { useCallback, useEffect, useState } from 'react'
import {
  getBrowserPerformanceRepository,
} from '../data/performanceRepository'
import type { PerformanceRecordInput } from '../model/types'
import { TRABUNDA_STORAGE_KEYS } from '../../../storage/trabundaStorage'

export function usePerformanceRecords() {
  const [records, setRecords] = useState<readonly PerformanceRecordInput[]>(
    () => getBrowserPerformanceRepository()?.getRecords() ?? [],
  )

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== window.localStorage) return
      if (
        event.key !== null &&
        event.key !== TRABUNDA_STORAGE_KEYS.performanceRecords
      ) {
        return
      }

      setRecords(getBrowserPerformanceRepository()?.getRecords() ?? [])
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const saveRecord = useCallback((record: PerformanceRecordInput) => {
    const repository = getBrowserPerformanceRepository()
    if (!repository) return
    setRecords(repository.save(record))
  }, [])

  return { records, saveRecord }
}
