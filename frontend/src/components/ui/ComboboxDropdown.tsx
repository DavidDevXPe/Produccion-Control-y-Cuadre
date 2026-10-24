import type { CSSProperties, RefObject } from 'react'
import { ComboboxOptionRow } from './ComboboxOptionRow'
import type { ComboboxOption } from './Combobox'

interface ComboboxGroup {
  name: string
  items: ComboboxOption[]
}

interface ComboboxDropdownProps {
  listRef: RefObject<HTMLDivElement | null>
  listboxId: string
  listboxStyle: CSSProperties
  noResultsText: string
  onCreateFromQuery?: ((query: string) => void) | undefined
  query: string
  displayItems: {
    recents: ComboboxOption[]
    groups: ComboboxGroup[]
  }
  flatSelectable: ComboboxOption[]
  activeIndex: number
  onSelect: (option: ComboboxOption) => void
  recentSectionTitle: string
}

export function ComboboxDropdown({
  listRef,
  listboxId,
  listboxStyle,
  noResultsText,
  onCreateFromQuery,
  query,
  displayItems,
  flatSelectable,
  activeIndex,
  onSelect,
  recentSectionTitle,
}: ComboboxDropdownProps) {
  let optionIndexCounter = 0

  return (
    <div
      ref={listRef}
      id={listboxId}
      role="listbox"
      tabIndex={-1}
      onMouseDown={(event) => event.preventDefault()}
      style={listboxStyle}
      className="z-[1000] max-h-60 overflow-auto rounded-lg border border-slate-300 bg-white py-1 shadow-lg ring-1 ring-black/5 scrollbar-subtle dark:border-ui-line-dark dark:bg-ui-surface-dark-deep dark:ring-white/10 [color-scheme:light] dark:[color-scheme:dark]"
    >
      {flatSelectable.length === 0 ? (
        <>
          <div className="px-3 py-2 text-center text-xs text-slate-600 dark:text-ui-text-dark-soft">{noResultsText}</div>
          {onCreateFromQuery && query.trim() ? (
            <button
              type="button"
              className="w-full border-t border-slate-200 px-3 py-2 text-left text-xs font-bold text-brand-700 hover:bg-slate-50 dark:border-ui-line-dark-grid dark:text-ui-accent-cyan dark:hover:bg-ui-surface-dark"
              onClick={() => onCreateFromQuery(query.trim())}
            >
              + Crear producto “{query.trim()}”
            </button>
          ) : null}
        </>
      ) : (
        <>
          {displayItems.recents.length > 0 && (
            <div className="border-b border-slate-200 pb-1 dark:border-ui-line-dark-grid">
              <div className="px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-brand-800 dark:text-ui-text-dark-brand">
                {recentSectionTitle}
              </div>
              {displayItems.recents.map((option) => {
                const index = optionIndexCounter++
                return (
                  <ComboboxOptionRow
                    key={`recent-${option.value}`}
                    id={`${listboxId}-opt-${index}`}
                    opt={option}
                    index={index}
                    isSelected={activeIndex === index}
                    onSelect={onSelect}
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
              {group.items.map((option) => {
                const index = optionIndexCounter++
                return (
                  <ComboboxOptionRow
                    key={option.value}
                    id={`${listboxId}-opt-${index}`}
                    opt={option}
                    index={index}
                    isSelected={activeIndex === index}
                    onSelect={onSelect}
                  />
                )
              })}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
