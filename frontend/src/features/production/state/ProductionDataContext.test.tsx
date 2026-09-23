import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { MONDAY_WEEK_42_PRODUCTION_DAY } from '../data/mondayWeek42'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'

import {
  ProductionDataProvider,
  useProductionData,
} from './ProductionDataContext'

function ActiveWeekProbe() {
  const {
    activeWeek,
    activeWeekNumber,
    availableWeekNumbers,
    allProductionDays,
    findProductionDay,
    isUserManagedDay,
  } =
    useProductionData()
  const monday = findProductionDay('2026-09-07')
  return (
    <>
      <span>Semana {activeWeekNumber}</span>
      <span>{activeWeek.isReadOnly ? 'Solo lectura' : 'Editable'}</span>
      <span data-testid="available-weeks">{availableWeekNumbers.join(',')}</span>
      <span data-testid="active-days">
        {activeWeek.productionDays.map((day) => day.date).join(',')}
      </span>
      <span data-testid="all-day-count">{allProductionDays.length}</span>
      <span data-testid="monday-origin">
        {isUserManagedDay('2026-09-07') ? 'local' : 'permanente'}
      </span>
      <span data-testid="monday-status">{monday?.status}</span>
    </>
  )
}

const editableDay = {
  ...WEDNESDAY_PRODUCTION_DAY,
  id: 'production-day-2026-09-08',
  date: '2026-09-08',
  displayName: 'Martes 08/09/2026',
  status: 'DRAFT' as const,
}

function PersistenceProbe() {
  const { upsertProductionDay } = useProductionData()
  const [message, setMessage] = useState('')

  const save = (allowReplace = false) => {
    try {
      upsertProductionDay(editableDay, { allowReplace })
      setMessage('guardado')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'error')
    }
  }

  return (
    <>
      <button type="button" onClick={() => save(false)}>Crear</button>
      <button type="button" onClick={() => save(true)}>Reemplazar</button>
      <span role="status">{message}</span>
    </>
  )
}

function WeekClosureProbe() {
  const { activeWeek, closeWeekManually, upsertProductionDay } = useProductionData()
  const [message, setMessage] = useState('')

  const close = () => {
    try {
      closeWeekManually(activeWeek.number)
      setMessage('cerrada')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'error')
    }
  }

  const save = () => {
    try {
      upsertProductionDay(editableDay)
      setMessage('guardado')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'error')
    }
  }

  return (
    <>
      <span data-testid="business-status">{activeWeek.businessStatus}</span>
      <span data-testid="closure-type">{activeWeek.closureType ?? 'NINGUNO'}</span>
      <button type="button" onClick={close}>Cerrar semana</button>
      <button type="button" onClick={save}>Crear jornada</button>
      <span role="status">{message}</span>
    </>
  )
}

function ProcessPersistenceProbe() {
  const { allProductionDays, upsertProductionDay } = useProductionData()
  const [message, setMessage] = useState('')
  const save = (process: 'PACKING' | 'FREEZING') => {
    try {
      upsertProductionDay({
        ...editableDay,
        id:
          process === 'PACKING'
            ? editableDay.id
            : 'production-day-freezing-2026-09-08',
        process,
      })
      setMessage('guardado')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'error')
    }
  }

  return (
    <>
      <button type="button" onClick={() => save('PACKING')}>Guardar Envasado</button>
      <button type="button" onClick={() => save('FREEZING')}>Guardar Congelamiento</button>
      <span data-testid="same-date-count">
        {allProductionDays.filter((day) => day.date === editableDay.date).length}
      </span>
      <span role="status">{message}</span>
    </>
  )
}

function ProcessClosureProbe() {
  const { closeWeekManually, getWeekView } = useProductionData()
  const [, refresh] = useState(0)
  return (
    <>
      <span data-testid="packing-week">{getWeekView(42, 'PACKING').businessStatus}</span>
      <span data-testid="freezing-week">{getWeekView(42, 'FREEZING').businessStatus}</span>
      <button
        type="button"
        onClick={() => {
          closeWeekManually(42, 'PACKING')
          refresh((value) => value + 1)
        }}
      >
        Cerrar Envasado
      </button>
    </>
  )
}

describe('ProductionDataProvider operational week recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('replaces an obsolete invalid week with the current operational week', () => {
    window.localStorage.setItem('trabunda-active-operational-week-v1', '0')

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByText('Semana 42')).toBeInTheDocument()
    expect(screen.getByText('Editable')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('trabunda-active-operational-week-v1'),
    ).toBe('42')
  })

  it('preserves a selected previous week as historical read-only', () => {
    window.localStorage.setItem('trabunda-active-operational-week-v1', '41')

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByText('Semana 41')).toBeInTheDocument()
    expect(screen.getByText('Solo lectura')).toBeInTheDocument()
  })

  it('does not expose a future week stored by an obsolete browser state', () => {
    window.localStorage.setItem('trabunda-active-operational-week-v1', '43')

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByText('Semana 42')).toBeInTheDocument()
    expect(screen.getByText('Editable')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('trabunda-active-operational-week-v1'),
    ).toBe('42')
  })

  it('loads the closed Monday permanently without depending on local storage', () => {
    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByTestId('active-days')).toHaveTextContent('2026-09-07')
    expect(screen.getByTestId('all-day-count')).toHaveTextContent('5')
    expect(screen.getByTestId('monday-origin')).toHaveTextContent('permanente')
    expect(screen.getByTestId('monday-status')).toHaveTextContent('CLOSED')
  })

  it('ignores an obsolete local copy of the permanently saved Monday', () => {
    window.localStorage.setItem(
      'trabunda-production-days-v1',
      JSON.stringify([
        {
          ...MONDAY_WEEK_42_PRODUCTION_DAY,
          status: 'DRAFT',
          declaredFinishedTotalKg100: 1,
        },
      ]),
    )

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByTestId('active-days')).toHaveTextContent('2026-09-07')
    expect(screen.getByTestId('all-day-count')).toHaveTextContent('5')
    expect(screen.getByTestId('monday-origin')).toHaveTextContent('permanente')
    expect(screen.getByTestId('monday-status')).toHaveTextContent('CLOSED')
  })

  it('adds the new current week automatically after an operational rollover', () => {
    vi.setSystemTime(new Date('2026-09-13T23:59:30-05:00'))

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByTestId('available-weeks')).toHaveTextContent('42,41')

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByText('Semana 42')).toBeInTheDocument()
    expect(screen.getByText('Editable')).toBeInTheDocument()
    expect(screen.getByTestId('available-weeks')).toHaveTextContent('43,42,41')
  })

  it('keeps week 42 editable after it becomes a past week', () => {
    vi.setSystemTime(new Date('2026-09-14T12:00:00-05:00'))
    window.localStorage.setItem('trabunda-active-operational-week-v1', '42')

    render(
      <ProductionDataProvider>
        <PersistenceProbe />
      </ProductionDataProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))
    expect(screen.getByRole('status')).toHaveTextContent('guardado')
  })

  it('persists a manual close without creating missing production days', () => {
    vi.setSystemTime(new Date('2026-09-14T12:00:00-05:00'))
    window.localStorage.setItem('trabunda-active-operational-week-v1', '42')

    const firstRender = render(
      <ProductionDataProvider>
        <WeekClosureProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByTestId('business-status')).toHaveTextContent('OPEN')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar semana' }))
    expect(screen.getByRole('status')).toHaveTextContent('cerrada')
    expect(screen.getByTestId('business-status')).toHaveTextContent('CLOSED')
    expect(screen.getByTestId('closure-type')).toHaveTextContent('MANUAL')
    fireEvent.click(screen.getByRole('button', { name: 'Crear jornada' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'La semana está cerrada y es de solo lectura.',
    )
    expect(
      JSON.parse(
        window.localStorage.getItem('trabunda-week-process-closures-v2') ?? '[]',
      ),
    ).toEqual([
      expect.objectContaining({
        weekNumber: 42,
        status: 'CLOSED',
        closureType: 'MANUAL',
      }),
    ])
    expect(window.localStorage.getItem('trabunda-production-days-v2')).toBeNull()

    firstRender.unmount()
    render(
      <ProductionDataProvider>
        <WeekClosureProbe />
      </ProductionDataProvider>,
    )
    expect(screen.getByTestId('business-status')).toHaveTextContent('CLOSED')
    expect(screen.getByTestId('closure-type')).toHaveTextContent('MANUAL')
  })

  it('closes automatically when all seven dates are registered, closed and valid', () => {
    const dates = [
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ]
    window.localStorage.setItem(
      'trabunda-production-days-v1',
      JSON.stringify(
        dates.map((date) => ({
          ...WEDNESDAY_PRODUCTION_DAY,
          id: `production-day-${date}`,
          date,
          displayName: date,
          status: 'CLOSED',
        })),
      ),
    )

    render(
      <ProductionDataProvider>
        <WeekClosureProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByTestId('business-status')).toHaveTextContent('CLOSED')
    expect(screen.getByTestId('closure-type')).toHaveTextContent('AUTOMATIC')
    expect(window.localStorage.getItem('trabunda-week-process-closures-v2')).toBeNull()
  })

  it('does not silently overwrite another journey with the same date', () => {
    render(
      <ProductionDataProvider>
        <PersistenceProbe />
      </ProductionDataProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))
    expect(screen.getByRole('status')).toHaveTextContent('guardado')
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Ya existe una jornada para esta fecha.',
    )
    const stored = JSON.parse(
      window.localStorage.getItem('trabunda-production-days-v2') ?? '[]',
    )
    expect(stored).toHaveLength(1)
  })

  it('rejects replacement of a closed journey', () => {
    window.localStorage.setItem(
      'trabunda-production-days-v1',
      JSON.stringify([{ ...editableDay, status: 'CLOSED' }]),
    )
    render(
      <ProductionDataProvider>
        <PersistenceProbe />
      </ProductionDataProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reemplazar' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Una jornada cerrada es de solo lectura',
    )
  })

  it('allows Packing and Freezing on the same date but not duplicate process/date', () => {
    render(
      <ProductionDataProvider>
        <ProcessPersistenceProbe />
      </ProductionDataProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Guardar Envasado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Congelamiento' }))
    expect(screen.getByTestId('same-date-count')).toHaveTextContent('2')
    expect(
      JSON.parse(
        window.localStorage.getItem('trabunda-production-days-v2') ?? '[]',
      ).map((day: { process: string }) => day.process),
    ).toEqual(['FREEZING', 'PACKING'])

    fireEvent.click(screen.getByRole('button', { name: 'Guardar Congelamiento' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Ya existe una jornada para esta fecha.',
    )
  })

  it('migrates legacy days to explicit Packing records without data loss', () => {
    window.localStorage.setItem(
      'trabunda-production-days-v1',
      JSON.stringify([editableDay]),
    )

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    const migrated = JSON.parse(
      window.localStorage.getItem('trabunda-production-days-v2') ?? '[]',
    )
    expect(migrated).toHaveLength(1)
    expect(migrated[0]).toMatchObject({
      date: editableDay.date,
      process: 'PACKING',
    })
  })

  it('keeps weekly closure independent for each process', () => {
    vi.setSystemTime(new Date('2026-09-14T12:00:00-05:00'))
    render(
      <ProductionDataProvider>
        <ProcessClosureProbe />
      </ProductionDataProvider>,
    )

    expect(screen.getByTestId('packing-week')).toHaveTextContent('OPEN')
    expect(screen.getByTestId('freezing-week')).toHaveTextContent('OPEN')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar Envasado' }))
    expect(screen.getByTestId('packing-week')).toHaveTextContent('CLOSED')
    expect(screen.getByTestId('freezing-week')).toHaveTextContent('OPEN')
  })
})

describe('ProductionDataProvider stored data safety', () => {
  const daysKey = 'trabunda-production-days-v2'
  const quarantineKey = 'trabunda-storage-quarantine-v1'

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00-05:00'))
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function readQuarantine() {
    return JSON.parse(window.localStorage.getItem(quarantineKey) ?? '[]') as {
      sourceKey: string
      reason: string
      payload: unknown
    }[]
  }

  it('keeps a copy of unreadable stored days before the next save overwrites them', () => {
    const corrupted = '[{"id":"production-day-2026-09-08",'
    window.localStorage.setItem(daysKey, corrupted)

    render(
      <ProductionDataProvider>
        <PersistenceProbe />
      </ProductionDataProvider>,
    )

    expect(window.localStorage.getItem(daysKey)).toBe(corrupted)
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))

    expect(screen.getByRole('status')).toHaveTextContent('guardado')
    expect(readQuarantine()).toEqual([
      expect.objectContaining({
        sourceKey: daysKey,
        reason: 'INVALID_JSON',
        payload: corrupted,
      }),
    ])
  })

  it('keeps rejected records and days shadowed by permanent history without duplicating them on reload', () => {
    const invalidRecord = { id: 'sin-estructura' }
    const shadowedMonday = {
      ...MONDAY_WEEK_42_PRODUCTION_DAY,
      displayName: 'Lunes editado localmente',
    }
    window.localStorage.setItem(
      daysKey,
      JSON.stringify([editableDay, invalidRecord, shadowedMonday]),
    )

    const first = render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )
    first.unmount()
    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    const entries = readQuarantine()
    expect(entries.map((entry) => entry.reason).sort()).toEqual([
      'INVALID_RECORD',
      'PERMANENT_DAY_COLLISION',
    ])
    expect(entries.find((e) => e.reason === 'INVALID_RECORD')?.payload).toEqual([
      invalidRecord,
    ])
    expect(
      (
        entries.find((e) => e.reason === 'PERMANENT_DAY_COLLISION')
          ?.payload as { displayName: string }[]
      )[0]?.displayName,
    ).toBe('Lunes editado localmente')
    expect(JSON.parse(window.localStorage.getItem(daysKey) ?? '[]')).toHaveLength(3)
  })

  it('does not create a quarantine when every stored record is valid', () => {
    window.localStorage.setItem(daysKey, JSON.stringify([editableDay]))

    render(
      <ProductionDataProvider>
        <ActiveWeekProbe />
      </ProductionDataProvider>,
    )

    expect(window.localStorage.getItem(quarantineKey)).toBeNull()
  })
})
