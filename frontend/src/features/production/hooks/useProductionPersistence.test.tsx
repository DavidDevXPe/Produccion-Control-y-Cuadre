import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useProductionPersistence } from './useProductionPersistence'
import { createEmptyCaptureDraft } from '../capture/productionCapture'

describe('useProductionPersistence', () => {
  const activeWeek = {
    number: 38,
    period: {
      startDate: '2026-09-14',
      endDate: '2026-09-20',
    },
  }

  it('rejects saving when date is outside active week period', () => {
    const draft = createEmptyCaptureDraft('2026-09-25', 'PACKING')
    const upsertProductionDay = vi.fn()
    const navigate = vi.fn()
    const setSaveError = vi.fn()

    const { result } = renderHook(() =>
      useProductionPersistence({
        draft,
        editingDate: undefined,
        activeWeek,
        allProductionDays: [],
        subsequentBalanceLots: [],
        upsertProductionDay,
        navigate,
        setSaveError,
      }),
    )

    act(() => {
      result.current.persist(false)
    })

    expect(setSaveError).toHaveBeenCalledWith('La fecha debe permanecer dentro de la semana 38.')
    expect(upsertProductionDay).not.toHaveBeenCalled()
  })

  it('saves draft successfully and navigates to the saved day url', () => {
    const draft = createEmptyCaptureDraft('2026-09-15', 'PACKING')
    const upsertProductionDay = vi.fn()
    const navigate = vi.fn()
    const setSaveError = vi.fn()

    const { result } = renderHook(() =>
      useProductionPersistence({
        draft,
        editingDate: undefined,
        activeWeek,
        allProductionDays: [],
        subsequentBalanceLots: [],
        upsertProductionDay,
        navigate,
        setSaveError,
      }),
    )

    act(() => {
      result.current.persist(false)
    })

    expect(upsertProductionDay).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-09-15',
        status: 'DRAFT',
      }),
      { allowReplace: false },
    )
    expect(navigate).toHaveBeenCalledWith('/jornadas/2026-09-15?process=PACKING')
  })

  it('sets save error if closure validation fails on closeDay=true', () => {
    const draft = createEmptyCaptureDraft('2026-09-15', 'PACKING')
    const upsertProductionDay = vi.fn()
    const navigate = vi.fn()
    const setSaveError = vi.fn()

    const { result } = renderHook(() =>
      useProductionPersistence({
        draft,
        editingDate: undefined,
        activeWeek,
        allProductionDays: [],
        subsequentBalanceLots: [],
        upsertProductionDay,
        navigate,
        setSaveError,
      }),
    )

    act(() => {
      result.current.persist(true)
    })

    expect(setSaveError).toHaveBeenCalled()
    expect(upsertProductionDay).not.toHaveBeenCalled()
  })
})
