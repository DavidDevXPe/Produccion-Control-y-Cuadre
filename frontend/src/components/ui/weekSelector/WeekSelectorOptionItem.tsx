import { Check, LockKeyhole } from 'lucide-react'
import type { WeekSelectorOption } from './weekSelectorTypes'

export interface WeekSelectorOptionItemProps {
  readonly option: WeekSelectorOption
  readonly isSelected: boolean
  readonly onSelect: (option: WeekSelectorOption) => void
  readonly onFocusRelative: (direction: 1 | -1) => void
  readonly onFocusEdge: (edge: 'first' | 'last') => void
  readonly onClose: (restoreFocus?: boolean) => void
  readonly onSetRef: (element: HTMLButtonElement | null) => void
}

export function WeekSelectorOptionItem({
  option,
  isSelected,
  onSelect,
  onFocusRelative,
  onFocusEdge,
  onClose,
  onSetRef,
}: WeekSelectorOptionItemProps) {
  return (
    <button
      ref={onSetRef}
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
      onClick={() => onSelect(option)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          onFocusRelative(event.key === 'ArrowDown' ? 1 : -1)
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault()
          onFocusEdge(event.key === 'Home' ? 'first' : 'last')
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(option)
        } else if (event.key === 'Escape') {
          event.preventDefault()
          onClose(true)
        } else if (event.key === 'Tab') {
          onClose()
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
}

