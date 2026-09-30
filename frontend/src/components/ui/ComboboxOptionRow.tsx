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
      className={`flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm ${
        isSelected
          ? 'bg-brand-50 text-brand-900 dark:bg-brand-900/30 dark:text-brand-100'
          : 'text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-surface'
      }`}
    >
      <span className="font-medium">{opt.label}</span>
      {opt.secondaryText && (
        <span className="text-xs text-slate-400 dark:text-slate-400">{opt.secondaryText}</span>
      )}
    </div>
  )
}
