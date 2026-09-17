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
        className={`inline-flex h-8 items-center justify-between gap-2 rounded-lg border border-[#d6e2ea] bg-white px-2.5 text-xs font-bold text-[#0b2233] shadow-sm transition-colors duration-150 hover:bg-[#edf5f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#169fd0] focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-[#2b5268] dark:bg-[#0d2534] dark:text-[#f3f8fb] dark:hover:bg-[#123247] dark:focus-visible:ring-offset-[#0d2534] ${compact ? 'min-w-[4.5rem] sm:min-w-[6.5rem]' : 'min-w-[6.5rem]'}`}
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
          className={`size-3.5 shrink-0 text-[#4c6a7d] transition-transform duration-150 dark:text-[#f3f8fb] ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 flex max-h-[min(60vh,360px)] w-[min(16rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[0.625rem] border border-[#d6e2ea] bg-white text-left text-[#0b2233] shadow-[0_12px_28px_rgb(11_34_51/0.12)] dark:border-[#2b5268] dark:bg-[#0a1a27] dark:text-[#f3f8fb] dark:shadow-[0_12px_30px_rgb(0_0_0/0.28)]"
        >
          {shouldShowSearch || showCurrentWeekAction ? (
            <div className="shrink-0 space-y-1.5 border-b border-[#d6e2ea] p-2 dark:border-[#2b5268]/70">
              {shouldShowSearch ? (
                <label className="relative block">
                  <span className="sr-only">Buscar semana</span>
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#7f9bad]"
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
                    className="h-8 w-full rounded-md border border-[#d6e2ea] bg-[#f8fbfc] pl-8 pr-2.5 text-xs font-semibold text-[#0b2233] outline-none placeholder:text-[#7f9bad] focus:border-[#169fd0] focus:ring-1 focus:ring-[#169fd0] dark:border-[#2b5268] dark:bg-[#0d2534] dark:text-[#f3f8fb]"
                  />
                </label>
              ) : null}
              {showCurrentWeekAction && currentOption ? (
                <button
                  type="button"
                  className="inline-flex h-7 w-full items-center gap-1.5 rounded-md px-2 text-[0.625rem] font-bold text-[#4c6a7d] transition-colors hover:bg-[#edf5f8] hover:text-[#0b2233] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#169fd0] dark:text-[#a5bed0] dark:hover:bg-[#123247] dark:hover:text-[#f3f8fb]"
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
                    className="border-b border-[#d6e2ea] px-3 py-1.5 text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-[#7f9bad] dark:border-[#2b5268]/50"
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
                      className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-3 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#169fd0] ${
                        isSelected
                          ? 'bg-[#ddf2f8] text-[#0b2233] dark:bg-[#153b50] dark:text-[#f3f8fb]'
                          : 'text-[#0b2233] hover:bg-[#edf5f8] dark:text-[#f3f8fb] dark:hover:bg-[#123247]'
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
                      ? 'border-[#169fd0] bg-[#169fd0] text-[#07111d]'
                      : 'border-[#d6e2ea] text-transparent dark:border-[#2b5268]'
                  }`}
                  aria-hidden="true"
                >
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold">Semana {option.number}</span>
                    {option.isCurrent ? (
                      <span className="whitespace-nowrap text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-[#168bb4] dark:text-[#7f9bad]">
                        Actual
                      </span>
                    ) : option.isFuture ? (
                      <span className="whitespace-nowrap text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-[#7f9bad]">
                        Próxima
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`number-tabular mt-1 block text-[0.625rem] font-semibold tracking-[0.04em] text-[#6f8796] ${isSelected ? 'dark:text-[#a5bed0]' : 'dark:text-[#7f9bad]'}`}
                  >
                    {option.periodLabel}
                  </span>
                  {option.isClosed ? (
                    <span
                      className={`mt-1.5 flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-[#6f8796] ${isSelected ? 'dark:text-[#a5bed0]' : 'dark:text-[#7f9bad]'}`}
                    >
                      <LockKeyhole className="size-2.5" aria-hidden="true" />
                      Cerrada · Solo lectura
                    </span>
                  ) : option.hasRecords === false ? (
                    <span
                      className={`mt-1.5 block text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-[#7f9bad] ${isSelected ? 'dark:text-[#a5bed0]' : 'dark:text-[#7f9bad]'}`}
                    >
                      Sin registros
                    </span>
                  ) : option.businessStatus === 'OPEN' ? (
                    <span
                      className={`mt-1.5 block text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-[#168bb4] ${isSelected ? 'dark:text-[#a5bed0]' : 'dark:text-[#7f9bad]'}`}
                    >
                      Abierta · {option.recordCount ?? 0} de 7 registros
                    </span>
                  ) : option.isReadOnly ? (
                    <span
                      className={`mt-1.5 block text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-[#6f8796] ${isSelected ? 'dark:text-[#a5bed0]' : 'dark:text-[#7f9bad]'}`}
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
                className="px-3 py-6 text-center text-xs font-semibold text-[#7f9bad]"
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
