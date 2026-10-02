import type { ComboboxOption } from './Combobox'

export interface ComboboxOptionRowProps {
  id: string
  opt: ComboboxOption
  index: number
  isSelected: boolean
  onSelect: (option: ComboboxOption) => void
}

export function ComboboxOptionRow({
  id,
  opt,
  index,
  isSelected,
  onSelect,
}: ComboboxOptionRowProps) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={isSelected}
      data-index={index}
      onClick={() => onSelect(opt)}
      className={`flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm transition-colors ${
        isSelected
          ? 'bg-brand-100 text-brand-950 font-bold dark:bg-ui-surface-dark-accent dark:text-ui-text-dark-strong'
          : 'text-slate-900 hover:bg-slate-100 dark:text-ui-text-dark-strong dark:hover:bg-ui-surface-dark'
      }`}
    >
      <span className="font-medium">{opt.label}</span>
      {opt.secondaryText && (
        <span className="text-xs text-slate-600 dark:text-ui-text-dark-soft">{opt.secondaryText}</span>
      )}
    </div>
  )
}
