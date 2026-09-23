import { useRef, type KeyboardEvent, type ReactNode } from 'react'

export interface SegmentedTabOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  /** Classes of the selected state; defaults to the brand color. */
  selectedClassName?: string
}

interface SegmentedTabsProps<T extends string> {
  /** Accessible name of the tab list. */
  label: string
  /** Visible caption shown above the control. */
  caption: string
  options: readonly SegmentedTabOption<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  /**
   * Base id. When given, every tab gets `${id}-${value}` and points to
   * `${id}-panel` (`aria-controls`), so the page can render a matching
   * `role="tabpanel"`.
   */
  id?: string
}

const defaultSelectedClassName = 'bg-brand-700 text-white shadow-sm'

/**
 * Segmented control that switches what a page shows. Implements the tabs
 * keyboard pattern: one tab stop, arrows/Home/End move and activate.
 */
export function SegmentedTabs<T extends string>({
  label,
  caption,
  options,
  value,
  onChange,
  disabled = false,
  id,
}: SegmentedTabsProps<T>) {
  const tabRefs = useRef(new Map<T, HTMLButtonElement>())

  const moveTo = (index: number) => {
    const target = options[(index + options.length) % options.length]
    if (!target) return
    onChange(target.value)
    tabRefs.current.get(target.value)?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const current = options.findIndex((option) => option.value === value)

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        moveTo(current + 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        moveTo(current - 1)
        break
      case 'Home':
        event.preventDefault()
        moveTo(0)
        break
      case 'End':
        event.preventDefault()
        moveTo(options.length - 1)
        break
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        {caption}
      </p>
      <div
        className="inline-flex max-w-full rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        {options.map((option) => {
          const selected = option.value === value

          return (
            <button
              key={option.value}
              ref={(element) => {
                if (element) tabRefs.current.set(option.value, element)
                else tabRefs.current.delete(option.value)
              }}
              type="button"
              role="tab"
              id={id ? `${id}-${option.value}` : undefined}
              aria-controls={id ? `${id}-panel` : undefined}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? (option.selectedClassName ?? defaultSelectedClassName)
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
