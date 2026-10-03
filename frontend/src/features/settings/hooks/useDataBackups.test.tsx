import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as backupService from '../backup/backupService'
import { useDataBackups, backupFilename } from './useDataBackups'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('useDataBackups', () => {
  it('generates consistent backup filenames with given prefix and date', () => {
    const filename = backupFilename('custom-prefix')
    expect(filename).toMatch(/^custom-prefix-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('calculates used bytes and default states', () => {
    localStorage.setItem('test-key', 'hello') // 5 chars * 2 = 10 bytes

    const { result } = renderHook(() => useDataBackups())

    expect(Number(result.current.usedKb)).toBeGreaterThanOrEqual(0)
    expect(result.current.usagePercentage).toBeGreaterThanOrEqual(0)
    expect(result.current.preview).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isDragging).toBe(false)
    expect(result.current.showResetModal).toBe(false)
  })

  it('triggers backup export through backupService', () => {
    const downloadSpy = vi
      .spyOn(backupService, 'downloadJsonFile')
      .mockImplementation(() => undefined)

    const { result } = renderHook(() => useDataBackups())

    act(() => {
      result.current.exportBackup()
    })

    expect(downloadSpy).toHaveBeenCalledTimes(1)
    expect(downloadSpy.mock.calls[0]?.[0]).toMatch(/^trabunda-backup-/)
  })

  it('triggers quarantine export through backupService', () => {
    const downloadSpy = vi
      .spyOn(backupService, 'downloadJsonFile')
      .mockImplementation(() => undefined)

    const { result } = renderHook(() => useDataBackups())

    act(() => {
      result.current.exportQuarantine()
    })

    expect(downloadSpy).toHaveBeenCalledTimes(1)
    expect(downloadSpy.mock.calls[0]?.[0]).toMatch(/^trabunda-datos-apartados-/)
  })

  it('handles drag over and drag leave events', () => {
    const { result } = renderHook(() => useDataBackups())

    const preventDefault = vi.fn()

    act(() => {
      result.current.handleDragOver({ preventDefault } as unknown as React.DragEvent<HTMLLabelElement>)
    })

    expect(preventDefault).toHaveBeenCalled()
    expect(result.current.isDragging).toBe(true)

    act(() => {
      result.current.handleDragLeave({ preventDefault } as unknown as React.DragEvent<HTMLLabelElement>)
    })

    expect(result.current.isDragging).toBe(false)
  })

  it('updates modal visibility state', () => {
    const { result } = renderHook(() => useDataBackups())

    act(() => {
      result.current.setShowResetModal(true)
    })

    expect(result.current.showResetModal).toBe(true)

    act(() => {
      result.current.setShowResetModal(false)
    })

    expect(result.current.showResetModal).toBe(false)
  })
})
