import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { PERFORMANCE_STORAGE_KEY } from '../data/performanceRepository'
import type { PerformanceRecordInput } from '../model/types'
import { usePerformanceRecords } from './usePerformanceRecords'

function createRecordInput(id: string, overrides: Partial<PerformanceRecordInput> = {}): PerformanceRecordInput {
  return {
    id,
    productionDayId: `day-${id}`,
    date: '2026-09-16',
    weekNumber: 42,
    process: 'PACKING',
    shift: 'DAY',
    supervisor: 'David Castillo',
    workerCount: 20,
    startTime: '07:00',
    endTime: '19:00',
    deadHours: 1,
    createdAt: '2026-09-16T00:00:00.000Z',
    updatedAt: '2026-09-16T00:00:00.000Z',
    ...overrides,
  }
}

describe('usePerformanceRecords', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('initializes with empty array when no records exist in storage', () => {
    const { result } = renderHook(() => usePerformanceRecords())
    expect(result.current.records).toEqual([])
  })

  it('loads preexisting records from repository storage on mount', () => {
    const existing = [createRecordInput('rec-1')]
    window.localStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(existing))

    const { result } = renderHook(() => usePerformanceRecords())
    expect(result.current.records).toEqual(existing)
  })

  it('saves new record and updates state and persistent storage', () => {
    const { result } = renderHook(() => usePerformanceRecords())
    const newRecord = createRecordInput('rec-new')

    act(() => {
      result.current.saveRecord(newRecord)
    })

    expect(result.current.records).toEqual([newRecord])
    const persisted = JSON.parse(window.localStorage.getItem(PERFORMANCE_STORAGE_KEY) ?? '[]')
    expect(persisted).toEqual([newRecord])
  })

  it('updates existing record when matching ID is saved', () => {
    const initial = [createRecordInput('rec-1', { workerCount: 20 })]
    window.localStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(initial))

    const { result } = renderHook(() => usePerformanceRecords())
    expect(result.current.records[0]?.workerCount).toBe(20)

    const updated = createRecordInput('rec-1', { workerCount: 35 })
    act(() => {
      result.current.saveRecord(updated)
    })

    expect(result.current.records).toHaveLength(1)
    expect(result.current.records[0]?.workerCount).toBe(35)
  })
})
