import { CalendarDays, Search } from 'lucide-react'
import type React from 'react'
import type { WeekSelectorOption } from './weekSelectorTypes'

export interface WeekSelectorSearchHeaderProps {
  readonly shouldShowSearch: boolean
  readonly showCurrentWeekAction: boolean
  readonly currentOption: WeekSelectorOption | undefined
  readonly searchQuery: string
  readonly searchInputRef: React.RefObject<HTMLInputElement | null>
  readonly onSearchChange: (value: string) => void
  readonly onClose: (restoreFocus?: boolean) => void
  readonly onFocusFirstOption: () => void
  readonly onSelectWeek: (option: WeekSelectorOption) => void
}

export function WeekSelectorSearchHeader({
  shouldShowSearch,
  showCurrentWeekAction,
  currentOption,
  searchQuery,
  searchInputRef,
  onSearchChange,
  onClose,
  onFocusFirstOption,
  onSelectWeek,
}: WeekSelectorSearchHeaderProps) {
  if (!shouldShowSearch && !showCurrentWeekAction) return null

  return (
    <div className="shrink-0 space-y-1.5 border-b border-ui-line p-2 dark:border-ui-line-dark/70">
      {shouldShowSearch ? (
        <label className="relative block">
          <span className="sr-only">Buscar semana</span>
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ui-text-soft"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                onClose(true)
              } else if (event.key === 'ArrowDown') {
                event.preventDefault()
                onFocusFirstOption()
              }
            }}
            placeholder="Buscar semana..."
            className="h-8 w-full rounded-md border border-ui-line bg-ui-surface-subtle pl-8 pr-2.5 text-xs font-semibold text-ui-text outline-none placeholder:text-ui-text-soft focus:border-ui-brand focus:ring-1 focus:ring-ui-brand dark:border-ui-line-dark dark:bg-ui-surface-dark dark:text-ui-text-dark-strong"
          />
        </label>
      ) : null}
      {showCurrentWeekAction && currentOption ? (
        <button
          type="button"
          className="inline-flex h-7 w-full items-center gap-1.5 rounded-md px-2 text-[0.625rem] font-bold text-ui-text-muted transition-colors hover:bg-ui-surface-hover hover:text-ui-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ui-brand dark:text-ui-text-dark-soft dark:hover:bg-ui-surface-dark-hover-strong dark:hover:text-ui-text-dark-strong"
          onClick={() => onSelectWeek(currentOption)}
        >
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Ir a semana actual
        </button>
      ) : null}
    </div>
  )
}

