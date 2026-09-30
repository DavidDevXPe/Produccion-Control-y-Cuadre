import { useRef } from 'react'

export interface QuantityInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  disabled?: boolean
  className?: string
}

export function QuantityInput({
  label,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  className = '',
}: QuantityInputProps) {
  const clearedZeroOnFocus = useRef(false)

  return (
    <label className={`block ${className}`}>
      {label ? (
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
          {label}
        </span>
      ) : null}
      <span className="relative block">
        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          onFocus={() => {
            if (
              !readOnly &&
              !disabled &&
              value.trim() !== '' &&
              Number(value.replace(',', '.')) === 0
            ) {
              clearedZeroOnFocus.current = true
              onChange('')
            } else {
              clearedZeroOnFocus.current = false
            }
          }}
          onBlur={() => {
            if (clearedZeroOnFocus.current && value.trim() === '') {
              onChange('0')
            }
            clearedZeroOnFocus.current = false
          }}
          onChange={(event) => onChange(event.target.value)}
          className="number-tabular h-10 w-full rounded-lg border border-slate-400 bg-white px-3 pr-9 text-right text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 read-only:cursor-default read-only:bg-slate-100 read-only:text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-ui-line-dark dark:bg-ui-surface-dark-deep dark:text-ui-text-dark-strong dark:read-only:bg-ui-surface-dark-compact dark:read-only:text-ui-text-dark-soft dark:disabled:bg-ui-surface-dark-recessed dark:disabled:text-ui-text-subtle"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.6875rem] font-bold text-slate-600 dark:text-ui-text-dark-soft">
          kg
        </span>
      </span>
    </label>
  )
}
