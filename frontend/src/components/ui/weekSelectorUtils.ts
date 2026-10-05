import type { WeekSelectorOption } from './weekSelector/weekSelectorTypes'

export const WEEK_SELECTOR_SEARCH_THRESHOLD = 12

export interface WeekSelectorGroup {
  year: number
  options: readonly WeekSelectorOption[]
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleUpperCase('es-PE')
    .trim()
}

export function filterWeekOptions(
  options: readonly WeekSelectorOption[],
  query: string,
): readonly WeekSelectorOption[] {
  const searchTerms = normalizeSearchValue(query).split(/\s+/).filter(Boolean)
  if (searchTerms.length === 0) return options

  return options.filter((option) => {
    const searchableValue = normalizeSearchValue(
      `${option.number} ${option.year} ${option.periodLabel} ${option.startDate} ${option.endDate}`,
    )
    return searchTerms.every((term) => searchableValue.includes(term))
  })
}

export function groupWeeksByYear(
  options: readonly WeekSelectorOption[],
): readonly WeekSelectorGroup[] {
  const sortedOptions = [...options].sort(
    (first, second) =>
      second.year - first.year ||
      second.startDate.localeCompare(first.startDate) ||
      second.number - first.number,
  )
  const groups = new Map<number, WeekSelectorOption[]>()

  sortedOptions.forEach((option) => {
    const yearOptions = groups.get(option.year) ?? []
    yearOptions.push(option)
    groups.set(option.year, yearOptions)
  })

  return [...groups.entries()].map(([year, yearOptions]) => ({
    year,
    options: yearOptions,
  }))
}
