import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  WeekSelectorOptionItem,
} from './weekSelector/WeekSelectorOptionItem'
import {
  WeekSelectorSearchHeader,
} from './weekSelector/WeekSelectorSearchHeader'
import {
  WeekSelectorTrigger,
} from './weekSelector/WeekSelectorTrigger'
import type {
  WeekSelectorOption,
  WeekSelectorProps,
} from './weekSelector/weekSelectorTypes'
import {
  filterWeekOptions,
  groupWeeksByYear,
  WEEK_SELECTOR_SEARCH_THRESHOLD,
} from './weekSelectorUtils'

export type { WeekSelectorOption, WeekSelectorProps }

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

  const focusEdgeOption = (edge: 'first' | 'last') => {
    const enabledOptions = visibleOptions.filter((item) => !item.disabled)
    const target = edge === 'first' ? enabledOptions[0] : enabledOptions.at(-1)
    if (target) {
      optionRefs.current.get(target.number)?.focus()
    }
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
      <WeekSelectorTrigger
        selectedWeekNumber={selectedWeekNumber}
        compact={compact}
        isOpen={isOpen}
        listboxId={listboxId}
        triggerRef={triggerRef}
        onToggle={() => {
          if (isOpen) closeMenu()
          else setIsOpen(true)
        }}
        onOpen={() => setIsOpen(true)}
        onClose={closeMenu}
      />

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 flex max-h-[min(60vh,360px)] w-[min(16rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[0.625rem] border border-ui-line bg-white text-left text-ui-text shadow-[0_12px_28px_rgb(11_34_51/0.12)] dark:border-ui-line-dark dark:bg-ui-surface-dark-deep dark:text-ui-text-dark-strong dark:shadow-[0_12px_30px_rgb(0_0_0/0.28)]"
        >
          <WeekSelectorSearchHeader
            shouldShowSearch={shouldShowSearch}
            showCurrentWeekAction={showCurrentWeekAction}
            currentOption={currentOption}
            searchQuery={searchQuery}
            searchInputRef={searchInputRef}
            onSearchChange={setSearchQuery}
            onClose={closeMenu}
            onFocusFirstOption={() => {
              const firstOption = visibleOptions.find((option) => !option.disabled)
              if (firstOption) {
                optionRefs.current.get(firstOption.number)?.focus()
              }
            }}
            onSelectWeek={selectWeek}
          />

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
                {group.options.map((option) => (
                  <WeekSelectorOptionItem
                    key={option.number}
                    option={option}
                    isSelected={option.number === selectedWeekNumber}
                    onSelect={selectWeek}
                    onFocusRelative={(direction) =>
                      focusRelativeOption(option.number, direction)
                    }
                    onFocusEdge={focusEdgeOption}
                    onClose={closeMenu}
                    onSetRef={(element) => {
                      if (element) {
                        optionRefs.current.set(option.number, element)
                      } else {
                        optionRefs.current.delete(option.number)
                      }
                    }}
                  />
                ))}
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

