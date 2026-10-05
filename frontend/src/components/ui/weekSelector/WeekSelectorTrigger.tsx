import { ChevronDown } from 'lucide-react'
import type React from 'react'

export interface WeekSelectorTriggerProps {
  readonly selectedWeekNumber: number
  readonly compact: boolean
  readonly isOpen: boolean
  readonly listboxId: string
  readonly triggerRef: React.RefObject<HTMLButtonElement | null>
  readonly onToggle: () => void
  readonly onOpen: () => void
  readonly onClose: () => void
}

export function WeekSelectorTrigger({
  selectedWeekNumber,
  compact,
  isOpen,
  listboxId,
  triggerRef,
  onToggle,
  onOpen,
  onClose,
}: WeekSelectorTriggerProps) {
  return (
    <button
      ref={triggerRef}
      type="button"
      className={`inline-flex h-8 items-center justify-between gap-2 rounded-lg border border-ui-line bg-white px-2.5 text-xs font-bold text-ui-text shadow-sm transition-colors duration-150 hover:bg-ui-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-brand focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:border-ui-line-dark dark:bg-ui-surface-dark dark:text-ui-text-dark-strong dark:hover:bg-ui-surface-dark-hover-strong dark:focus-visible:ring-offset-ui-surface-dark ${compact ? 'min-w-[4.5rem] sm:min-w-[6.5rem]' : 'min-w-[6.5rem]'}`}
      aria-label={`Seleccionar semana operativa. Semana ${selectedWeekNumber}`}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-controls={listboxId}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' ||
          event.key === ' ' ||
          event.key === 'ArrowDown' ||
          event.key === 'ArrowUp'
        ) {
          event.preventDefault()
          onOpen()
        } else if (event.key === 'Escape') {
          onClose()
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
  )
}

