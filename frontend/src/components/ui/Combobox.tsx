import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { ChevronDown, Search } from 'lucide-react'

export interface ComboboxOption {
  value: string
  label: string
  group?: string | undefined
  secondaryText?: string | undefined
}

export interface ComboboxProps {
  options: ComboboxOption[]
  onSelect: (option: ComboboxOption) => void
  label: string
  ariaLabel?: string | undefined
  placeholder?: string | undefined
  disabled?: boolean | undefined
  noResultsText?: string | undefined
  recentValues?: string[] | undefined
  recentSectionTitle?: string | undefined
  searchInputRef?: React.RefObject<HTMLInputElement | null> | undefined
  className?: string | undefined
  inputClassName?: string | undefined
  id?: string | undefined
  autoResetOnSelect?: boolean | undefined
  onActiveOptionChange?: ((option: ComboboxOption | null) => void) | undefined
}

import { groupOptions, normalizeSearch } from './comboboxUtils'
import { ComboboxOptionRow } from './ComboboxOptionRow'

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    options,
    onSelect,
    onActiveOptionChange,
    label,
    ariaLabel,
    placeholder = 'Buscar…',
    disabled = false,
    noResultsText = 'Sin productos coincidentes',
    recentValues = [],
    recentSectionTitle = 'Usados recientemente',
    searchInputRef,
    className = '',
    inputClassName = '',
    id: externalId,
    autoResetOnSelect = true,
  },
  forwardedRef,
) {
  const generatedId = useId()
  const inputId = externalId ?? `combobox-input-${generatedId}`
  const listboxId = `combobox-listbox-${generatedId}`

  const internalInputRef = useRef<HTMLInputElement | null>(null)
  useImperativeHandle(forwardedRef, () => internalInputRef.current as HTMLInputElement)

  useEffect(() => {
    if (searchInputRef) {
      (searchInputRef as React.MutableRefObject<HTMLInputElement | null>).current =
        internalInputRef.current
    }
  }, [searchInputRef])

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const listRef = useRef<HTMLDivElement | null>(null)
  const isSelectingRef = useRef(false)

  const filteredOptions = useMemo(() => {
    const norm = normalizeSearch(query)
    if (!norm) return options
    const words = norm.split(/\s+/).filter(Boolean)
    return options.filter((opt) => {
      const target = normalizeSearch(`${opt.group ?? ''} ${opt.label} ${opt.secondaryText ?? ''}`)
      return words.every((word) => target.includes(word))
    })
  }, [options, query])

  const displayItems = useMemo(() => {
    if (query.trim()) {
      return { recents: [], groups: groupOptions(filteredOptions) }
    }
    const optionMap = new Map(options.map((o) => [o.value, o]))
    const recents = recentValues
      .map((val) => optionMap.get(val))
      .filter((opt): opt is ComboboxOption => Boolean(opt))

    return { recents, groups: groupOptions(filteredOptions) }
  }, [filteredOptions, options, query, recentValues])

  const flatSelectable = useMemo(() => {
    const list: ComboboxOption[] = []
    if (displayItems.recents.length > 0) list.push(...displayItems.recents)
    for (const group of displayItems.groups) list.push(...group.items)
    return list
  }, [displayItems])

  const currentActiveOption = useMemo(() => {
    if (activeIndex >= 0 && flatSelectable[activeIndex]) {
      return flatSelectable[activeIndex]
    }
    if (query.trim() && filteredOptions.length > 0) {
      return filteredOptions[0] ?? null
    }
    return null
  }, [activeIndex, filteredOptions, flatSelectable, query])

  useEffect(() => {
    onActiveOptionChange?.(currentActiveOption)
  }, [currentActiveOption, onActiveOptionChange])

  const handleSelectOption = useCallback(
    (option: ComboboxOption) => {
      isSelectingRef.current = true
      onSelect(option)
      if (autoResetOnSelect) setQuery('')
      setIsOpen(false)
      setActiveIndex(-1)
      if (document.activeElement !== internalInputRef.current) {
        internalInputRef.current?.focus()
      }
      setTimeout(() => {
        isSelectingRef.current = false
      }, 0)
    },
    [autoResetOnSelect, onSelect],
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setActiveIndex(flatSelectable.length > 0 ? 0 : -1)
      } else if (flatSelectable.length > 0) {
        setActiveIndex((prev) => (prev < 0 ? 0 : prev + 1 >= flatSelectable.length ? 0 : prev + 1))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setActiveIndex(flatSelectable.length > 0 ? flatSelectable.length - 1 : -1)
      } else if (flatSelectable.length > 0) {
        setActiveIndex((prev) => (prev <= 0 ? flatSelectable.length - 1 : prev - 1))
      }
    } else if (e.key === 'Enter') {
      if (isOpen && activeIndex >= 0 && activeIndex < flatSelectable.length) {
        e.preventDefault()
        const selected = flatSelectable[activeIndex]
        if (selected) handleSelectOption(selected)
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`)
      if (activeEl && typeof (activeEl as HTMLElement).scrollIntoView === 'function') {
        (activeEl as HTMLElement).scrollIntoView({ block: 'nearest' })
      }
    }
  }, [activeIndex])

  const activeOption = activeIndex >= 0 ? flatSelectable[activeIndex] : undefined
  const activeDescendantId = activeOption ? `${listboxId}-opt-${activeIndex}` : undefined

  let optionIndexCounter = 0

  return (
    <div className={`relative w-full ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          ref={internalInputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId}
          aria-label={ariaLabel ?? label}
          placeholder={placeholder}
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setActiveIndex(0)
          }}
          onFocus={() => {
            if (!isSelectingRef.current) setIsOpen(true)
          }}
          onBlur={(e) => {
            if (!e.currentTarget.parentElement?.parentElement?.contains(e.relatedTarget as Node)) {
              setIsOpen(false)
            }
          }}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-lg border border-slate-400 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-ui-line-dark dark:bg-ui-surface-dark-deep dark:text-ui-text-dark-strong dark:placeholder:text-ui-text-dark-soft [color-scheme:light] dark:[color-scheme:dark] ${inputClassName}`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true)
              internalInputRef.current?.focus()
            } else {
              setIsOpen(false)
            }
          }}
          className="absolute right-2 text-slate-500 hover:text-slate-700 dark:text-ui-text-dark-soft dark:hover:text-ui-text-dark-strong"
          aria-label="Abrir opciones"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-300 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-ui-line-dark dark:bg-ui-surface-dark-deep dark:ring-white/10 [color-scheme:light] dark:[color-scheme:dark]"
        >
          {flatSelectable.length === 0 ? (
            <div className="px-3 py-2 text-center text-xs text-slate-600 dark:text-ui-text-dark-soft">
              {noResultsText}
            </div>
          ) : (
            <>
              {displayItems.recents.length > 0 && (
                <div className="border-b border-slate-200 pb-1 dark:border-ui-line-dark-grid">
                  <div className="px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-brand-800 dark:text-ui-text-dark-brand">
                    {recentSectionTitle}
                  </div>
                  {displayItems.recents.map((opt) => {
                    const idx = optionIndexCounter++
                    return (
                      <ComboboxOptionRow
                        key={`recent-${opt.value}`}
                        id={`${listboxId}-opt-${idx}`}
                        opt={opt}
                        index={idx}
                        isSelected={activeIndex === idx}
                        onSelect={handleSelectOption}
                      />
                    )
                  })}
                </div>
              )}

              {displayItems.groups.map((group) => (
                <div key={`group-${group.name}`} className="py-1">
                  {group.name && (
                    <div className="px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-brand-900 dark:text-ui-accent-cyan">
                      {group.name}
                    </div>
                  )}
                  {group.items.map((opt) => {
                    const idx = optionIndexCounter++
                    return (
                      <ComboboxOptionRow
                        key={opt.value}
                        id={`${listboxId}-opt-${idx}`}
                        opt={opt}
                        index={idx}
                        isSelected={activeIndex === idx}
                        onSelect={handleSelectOption}
                      />
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
})
