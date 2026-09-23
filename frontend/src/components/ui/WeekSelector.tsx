import {
  CalendarDays,
  Check,
  ChevronDown,
  LockKeyhole,
  Search,
} from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  filterWeekOptions,
  groupWeeksByYear,
  WEEK_SELECTOR_SEARCH_THRESHOLD,
} from './weekSelectorUtils'

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

interface WeekSelectorProps {
  options: readonly WeekSelectorOption[]
  selectedWeekNumber: number
  onChange: (weekNumber: number) => void
  compact?: boolean
  className?: string
}

export function WeekSelector({
  options,
  selectedWeekNumber,
  onChange,
  compact = false,
  className = '',
}: WeekSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef(new Map<number, HTMLButtonElement>())
  const shouldShowSearch = options.length > WEEK_SELECTOR_SEARCH_THRESHOLD
  const hasMultipleYears = useMemo(
    () => new Set(options.map((option) => option.year)).size > 1,
    [options],
  )
  const currentOption = useMemo(
    () => options.find((option) => option.isCurrent),
    [options],
  )
  const groupedOptions = useMemo(
    () => groupWeeksByYear(filterWeekOptions(options, searchQuery)),
    [options, searchQuery],
  )
  const visibleOptions = useMemo(
    () => groupedOptions.flatMap((group) => group.options),
    [groupedOptions],
  )
  const showCurrentWeekAction =
    shouldShowSearch &&
    currentOption !== undefined &&
    currentOption.number !== selectedWeekNumber

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false)
    setSearchQuery('')
    if (restoreFocus) triggerRef.current?.focus()
  }

  const selectWeek = (option: WeekSelectorOption) => {
    if (option.disabled) return
    onChange(option.number)
    closeMenu(true)
  }

  const focusRelativeOption = (
    currentWeekNumber: number,
    direction: 1 | -1,
  ) => {
    const enabledOptions = visibleOptions.filter((option) => !option.disabled)
    const currentIndex = enabledOptions.findIndex(
      (option) => option.number === currentWeekNumber,
    )
    const nextIndex =
      (currentIndex + direction + enabledOptions.length) % enabledOptions.length
    const nextOption = enabledOptions[nextIndex]
    if (nextOption) optionRefs.current.get(nextOption.number)?.focus()
  }

  useEffect(() => {
    if (!isOpen) return

    const animationFrame = window.requestAnimationFrame(() => {
      const focusTarget =
        options.find(
          (option) =>
            option.number === selectedWeekNumber && !option.disabled,
        ) ?? options.find((option) => !option.disabled)
      
      if (focusTarget) {
        const target = optionRefs.current.get(focusTarget.number)
      
        target?.scrollIntoView?.({ block: 'nearest' })
      
        // Si el usuario ya empezó a usar el buscador,
        // no debemos quitarle el foco.
        if (document.activeElement !== searchInputRef.current) {
          target?.focus({ preventScroll: true })
        }
      }
    })

    const handleOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) closeMenu()
    }

    document.addEventListener('pointerdown', handleOutsidePointer)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      document.removeEventListener('pointerdown', handleOutsidePointer)
    }
  }, [isOpen, options, selectedWeekNumber])

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex h-8 items-center justify-between gap-2 rounded-lg border border-ui-line bg-white px-2.5 text-xs font-bold text-ui-text shadow-sm transition-colors duration-150 hover:bg-ui-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-brand focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-ui-line-dark dark:bg-ui-surface-dark dark:text-ui-text-dark-strong dark:hover:bg-ui-surface-dark-hover-strong dark:focus-visible:ring-offset-ui-surface-dark ${compact ? 'min-w-[4.5rem] sm:min-w-[6.5rem]' : 'min-w-[6.5rem]'}`}
        aria-label={`Seleccionar semana operativa. Semana ${selectedWeekNumber}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          if (isOpen) closeMenu()
          else setIsOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setIsOpen(true)
          } else if (event.key === 'Escape') {
            closeMenu()
          }
        }}
      >
        {compact ? (
          <>
            <span className="sm:hidden">S. {selectedWeekNumber}</span>
            <span className="hidden sm:inline">Semana {selectedWeekNumber}</span>
          </>
        ) : (
          <span>Semana {selectedWeekNumber}</span>
        )}
        <ChevronDown
          className={`size-3.5 shrink-0 text-ui-text-muted transition-transform duration-150 dark:text-ui-text-dark-strong ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 flex max-h-[min(60vh,360px)] w-[min(16rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[0.625rem] border border-ui-line bg-white text-left text-ui-text shadow-[0_12px_28px_rgb(11_34_51/0.12)] dark:border-ui-line-dark dark:bg-ui-surface-dark-deep dark:text-ui-text-dark-strong dark:shadow-[0_12px_30px_rgb(0_0_0/0.28)]"
        >
          {shouldShowSearch || showCurrentWeekAction ? (
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
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault()
                        closeMenu(true)
                      } else if (event.key === 'ArrowDown') {
                        event.preventDefault()
                        const firstOption = visibleOptions.find(
                          (option) => !option.disabled,
                        )
                        if (firstOption) {
                          optionRefs.current.get(firstOption.number)?.focus()
                        }
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
                  onClick={() => selectWeek(currentOption)}
                >
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Ir a semana actual
                </button>
              ) : null}
            </div>
          ) : null}

          <div
            id={listboxId}
            role="listbox"
            aria-label="Semanas operativas disponibles"
            className="week-selector-scrollbar min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto p-1.5"
          >
            {groupedOptions.map((group) => (
              <div
                key={group.year}
                role="group"
                aria-label={`Semanas de ${group.year}`}
                className="space-y-1"
              >
                {hasMultipleYears ? (
                  <p
                    className="border-b border-ui-line px-3 py-1.5 text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-ui-text-soft dark:border-ui-line-dark/50"
                    aria-hidden="true"
                  >
                    {group.year}
                  </p>
                ) : null}
                {group.options.map((option) => {
                  const isSelected = option.number === selectedWeekNumber

                  return (
                    <button
                      key={option.number}
                      ref={(element) => {
                        if (element) {
                          optionRefs.current.set(option.number, element)
                        } else {
                          optionRefs.current.delete(option.number)
                        }
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      disabled={option.disabled}
                      className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-3 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ui-brand ${
                        isSelected
                          ? 'bg-ui-surface-accent text-ui-text dark:bg-ui-surface-dark-accent dark:text-ui-text-dark-strong'
                          : 'text-ui-text hover:bg-ui-surface-hover dark:text-ui-text-dark-strong dark:hover:bg-ui-surface-dark-hover-strong'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                      onClick={() => selectWeek(option)}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'ArrowDown' ||
                          event.key === 'ArrowUp'
                        ) {
                          event.preventDefault()
                          focusRelativeOption(
                            option.number,
                            event.key === 'ArrowDown' ? 1 : -1,
                          )
                        } else if (
                          event.key === 'Home' ||
                          event.key === 'End'
                        ) {
                          event.preventDefault()
                          const enabledOptions = visibleOptions.filter(
                            (item) => !item.disabled,
                          )
                          const target =
                            event.key === 'Home'
                              ? enabledOptions[0]
                              : enabledOptions.at(-1)
                          if (target) {
                            optionRefs.current.get(target.number)?.focus()
                          }
                        } else if (
                          event.key === 'Enter' ||
                          event.key === ' '
                        ) {
                          event.preventDefault()
                          selectWeek(option)
                        } else if (event.key === 'Escape') {
                          event.preventDefault()
                          closeMenu(true)
                        } else if (event.key === 'Tab') {
                          closeMenu()
                        }
                      }}
                    >
                <span
                  className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${
                    isSelected
                      ? 'border-ui-brand bg-ui-brand text-ui-text-on-brand'
                      : 'border-ui-line text-transparent dark:border-ui-line-dark'
                  }`}
                  aria-hidden="true"
                >
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold">Semana {option.number}</span>
                    {option.isCurrent ? (
                      <span className="whitespace-nowrap text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-ui-brand-text dark:text-ui-text-soft">
                        Actual
                      </span>
                    ) : option.isFuture ? (
                      <span className="whitespace-nowrap text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-ui-text-soft">
                        Próxima
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`number-tabular mt-1 block text-[0.625rem] font-semibold tracking-[0.04em] text-ui-text-subtle ${isSelected ? 'dark:text-ui-text-dark-soft' : 'dark:text-ui-text-soft'}`}
                  >
                    {option.periodLabel}
                  </span>
                  {option.isClosed ? (
                    <span
                      className={`mt-1.5 flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-ui-text-subtle ${isSelected ? 'dark:text-ui-text-dark-soft' : 'dark:text-ui-text-soft'}`}
                    >
                      <LockKeyhole className="size-2.5" aria-hidden="true" />
                      Cerrada · Solo lectura
                    </span>
                  ) : option.hasRecords === false ? (
                    <span
                      className={`mt-1.5 block text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-ui-text-soft ${isSelected ? 'dark:text-ui-text-dark-soft' : 'dark:text-ui-text-soft'}`}
                    >
                      Sin registros
                    </span>
                  ) : option.businessStatus === 'OPEN' ? (
                    <span
                      className={`mt-1.5 block text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-ui-brand-text ${isSelected ? 'dark:text-ui-text-dark-soft' : 'dark:text-ui-text-soft'}`}
                    >
                      Abierta · {option.recordCount ?? 0} de 7 registros
                    </span>
                  ) : option.isReadOnly ? (
                    <span
                      className={`mt-1.5 block text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-ui-text-subtle ${isSelected ? 'dark:text-ui-text-dark-soft' : 'dark:text-ui-text-soft'}`}
                    >
                      Solo lectura
                    </span>
                  ) : null}
                </span>
                    </button>
                  )
                })}
              </div>
            ))}
            {groupedOptions.length === 0 ? (
              <p
                role="status"
                className="px-3 py-6 text-center text-xs font-semibold text-ui-text-soft"
              >
                No se encontraron semanas
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default WeekSelector
