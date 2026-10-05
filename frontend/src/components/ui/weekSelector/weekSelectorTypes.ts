export interface WeekSelectorOption {
  number: number
  year: number
  startDate: string
  endDate: string
  periodLabel: string
  isCurrent?: boolean | undefined
  isPast?: boolean | undefined
  isClosed?: boolean | undefined
  businessStatus?: 'OPEN' | 'CLOSED' | undefined
  isFuture?: boolean | undefined
  isReadOnly?: boolean | undefined
  hasRecords?: boolean | undefined
  recordCount?: number | undefined
  disabled?: boolean | undefined
}

export interface WeekSelectorProps {
  options: readonly WeekSelectorOption[]
  selectedWeekNumber: number
  onChange: (weekNumber: number) => void
  compact?: boolean
  className?: string
}

