import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  WeekSelector,
  type WeekSelectorOption,
} from './WeekSelector'
import {
  groupWeeksByYear,
  WEEK_SELECTOR_SEARCH_THRESHOLD,
} from './weekSelectorUtils'

const options: readonly WeekSelectorOption[] = [
  {
    number: 41,
    year: 2026,
    startDate: '2026-08-31',
    endDate: '2026-09-06',
    periodLabel: '31 AGO — 06 SEP',
    isClosed: true,
    businessStatus: 'CLOSED',
    isReadOnly: true,
    hasRecords: true,
  },
  {
    number: 42,
    year: 2026,
    startDate: '2026-09-07',
    endDate: '2026-09-13',
    periodLabel: '07 SEP — 13 SEP',
    isCurrent: true,
    businessStatus: 'OPEN',
    hasRecords: false,
    recordCount: 0,
  },
]

function addUtcDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function buildWeekOptions(count: number): readonly WeekSelectorOption[] {
  return Array.from({ length: count }, (_, index) => {
    const startDate = addUtcDays('2027-04-05', index * -7)
    return {
      number: 100 - index,
      year: Number(startDate.slice(0, 4)),
      startDate,
      endDate: addUtcDays(startDate, 6),
      periodLabel: `${startDate} — ${addUtcDays(startDate, 6)}`,
      isCurrent: index === 0,
      isClosed: index > 0,
      isReadOnly: index > 0,
      hasRecords: index % 2 === 0,
    }
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('WeekSelector', () => {
  it('opens, identifies the selected week and selects another option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <WeekSelector
        options={options}
        selectedWeekNumber={41}
        onChange={onChange}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Seleccionar semana operativa. Semana 41' }),
    )

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    const selectedHistoricalWeek = screen.getByRole('option', { name: /Semana 41/ })
    const currentWeek = screen.getByRole('option', { name: /Semana 42/ })
    expect(selectedHistoricalWeek).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(selectedHistoricalWeek).getByText('Cerrada · Solo lectura')).toBeInTheDocument()
    expect(within(currentWeek).getByText('Actual')).toBeInTheDocument()
    expect(within(currentWeek).getByText('Sin registros')).toBeInTheDocument()
    expect(screen.getByText('07 SEP — 13 SEP')).toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: /Semana 42/ }))

    expect(onChange).toHaveBeenCalledWith(42)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows the current state without an empty label when records exist', async () => {
    const user = userEvent.setup()
    render(
      <WeekSelector
        options={options.map((option) =>
          option.number === 42
            ? { ...option, hasRecords: true, recordCount: 1 }
            : option,
        )}
        selectedWeekNumber={42}
        onChange={() => undefined}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Seleccionar semana operativa. Semana 42' }),
    )
    const currentWeek = screen.getByRole('option', { name: /Semana 42/ })

    expect(within(currentWeek).getByText('Actual')).toBeInTheDocument()
    expect(within(currentWeek).getByText('Abierta · 1 de 7 registros')).toBeInTheDocument()
    expect(within(currentWeek).queryByText('Sin registros')).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox', { name: 'Buscar semana' })).not.toBeInTheDocument()
  })

  it('shows a past open week without a lock or read-only label', async () => {
    const user = userEvent.setup()
    const pastOpen: WeekSelectorOption = {
      number: 42,
      year: 2026,
      startDate: '2026-09-07',
      endDate: '2026-09-13',
      periodLabel: '07 SEP — 13 SEP',
      businessStatus: 'OPEN',
      isPast: true,
      hasRecords: true,
      recordCount: 1,
    }

    render(
      <WeekSelector
        options={[pastOpen]}
        selectedWeekNumber={42}
        onChange={() => undefined}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: 'Seleccionar semana operativa. Semana 42' }),
    )
    const week = screen.getByRole('option', { name: /Semana 42/ })

    expect(within(week).getByText('Abierta · 1 de 7 registros')).toBeInTheDocument()
    expect(within(week).queryByText(/Solo lectura/)).not.toBeInTheDocument()
  })

  it('closes when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <WeekSelector
        options={options}
        selectedWeekNumber={41}
        onChange={() => undefined}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Seleccionar semana operativa. Semana 41' }),
    )
    fireEvent.pointerDown(document.body)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('supports arrow navigation, Enter selection and Escape closing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <WeekSelector
        options={options}
        selectedWeekNumber={41}
        onChange={onChange}
      />,
    )
    const trigger = screen.getByRole('button', {
      name: 'Seleccionar semana operativa. Semana 41',
    })

    trigger.focus()
    await user.keyboard('{ArrowDown}')
    const selectedOption = screen.getByRole('option', { name: /Semana 41/ })
    await waitFor(() => expect(selectedOption).toHaveFocus())

    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith(42)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await user.click(trigger)
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Semana 41/ })).toHaveFocus(),
    )
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('keeps disabled weeks in the dark menu without allowing selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const disabledOptions: readonly WeekSelectorOption[] = [
      ...options,
      {
        number: 43,
        year: 2026,
        startDate: '2026-09-14',
        endDate: '2026-09-20',
        periodLabel: '14 SEP — 20 SEP',
        isFuture: true,
        isReadOnly: true,
        hasRecords: false,
        disabled: true,
      },
    ]
    render(
      <WeekSelector
        options={disabledOptions}
        selectedWeekNumber={41}
        onChange={onChange}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Seleccionar semana operativa. Semana 41' }),
    )
    const disabledOption = screen.getByRole('option', { name: /Semana 43/ })

    expect(disabledOption).toBeDisabled()
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true')
    await user.click(disabledOption)
    expect(onChange).not.toHaveBeenCalled()
  })

  it.each([2, 8, 15, 52, 84])(
    'orders and groups %i weeks from newest to oldest',
    (totalWeeks) => {
      const scalableOptions = [...buildWeekOptions(totalWeeks)].reverse()
      const groups = groupWeeksByYear(scalableOptions)
      const orderedOptions = groups.flatMap((group) => group.options)

      expect(orderedOptions).toHaveLength(totalWeeks)
      expect(orderedOptions[0]?.startDate).toBe('2027-04-05')
      expect(
        orderedOptions.every(
          (option, index) =>
            index === 0 ||
            orderedOptions[index - 1]!.startDate >= option.startDate,
        ),
      ).toBe(true)
      expect(
        groups.every(
          (group, index) => index === 0 || groups[index - 1]!.year > group.year,
        ),
      ).toBe(true)
    },
  )

  it('adds internal scroll, year groups and search only above the progressive threshold', async () => {
    const user = userEvent.setup()
    const scalableOptions = buildWeekOptions(WEEK_SELECTOR_SEARCH_THRESHOLD + 3)
    render(
      <WeekSelector
        options={scalableOptions}
        selectedWeekNumber={scalableOptions[0]!.number}
        onChange={() => undefined}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name: `Seleccionar semana operativa. Semana ${scalableOptions[0]!.number}`,
      }),
    )

    expect(screen.getByRole('searchbox', { name: 'Buscar semana' })).toBeInTheDocument()
    expect(screen.getByRole('listbox')).toHaveClass('week-selector-scrollbar')
    expect(screen.getByRole('group', { name: 'Semanas de 2027' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Semanas de 2026' })).toBeInTheDocument()
  })

  it('filters in memory by week number, year and period text', async () => {
    const user = userEvent.setup()
    const scalableOptions = [
      ...options,
      ...buildWeekOptions(WEEK_SELECTOR_SEARCH_THRESHOLD + 1),
    ]
    render(
      <WeekSelector
        options={scalableOptions}
        selectedWeekNumber={42}
        onChange={() => undefined}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Seleccionar semana operativa. Semana 42' }),
    )
    const searchbox = screen.getByRole('searchbox', { name: 'Buscar semana' })

    await user.type(searchbox, '41')

    expect(
      screen.getByRole('option', { name: /Semana 41/ }),
    ).toBeInTheDocument()
    
    await waitFor(() => {
      expect(
        screen.queryByRole('option', { name: /Semana 42/ }),
      ).not.toBeInTheDocument()
    })

    await user.clear(searchbox)
    await user.type(searchbox, '31 AGO')
    expect(screen.getByRole('option', { name: /Semana 41/ })).toBeInTheDocument()

    await user.clear(searchbox)
    await user.type(searchbox, '2026')
    expect(screen.getByRole('group', { name: 'Semanas de 2026' })).toBeInTheDocument()

    await user.clear(searchbox)
    await user.type(searchbox, 'sin coincidencias')
    expect(screen.getByText('No se encontraron semanas')).toBeInTheDocument()
  })

  it('returns to the current week from a historical selection and closes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const scalableOptions = buildWeekOptions(WEEK_SELECTOR_SEARCH_THRESHOLD + 3)
    const selectedWeek = scalableOptions.at(-1)!
    render(
      <WeekSelector
        options={scalableOptions}
        selectedWeekNumber={selectedWeek.number}
        onChange={onChange}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name: `Seleccionar semana operativa. Semana ${selectedWeek.number}`,
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Ir a semana actual' }))

    expect(onChange).toHaveBeenCalledWith(scalableOptions[0]!.number)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('scrolls the selected historical option into view when opening', async () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    const user = userEvent.setup()
    const scalableOptions = buildWeekOptions(84)
    const selectedWeek = scalableOptions.at(-1)!
    render(
      <WeekSelector
        options={scalableOptions}
        selectedWeekNumber={selectedWeek.number}
        onChange={() => undefined}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name: `Seleccionar semana operativa. Semana ${selectedWeek.number}`,
      }),
    )

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' }))
    expect(screen.getByRole('option', { name: new RegExp(`Semana ${selectedWeek.number}`) })).toHaveFocus()
  })
})
