import { useRef, useState } from 'react'
import { formatQuantityWithThousands, sanitizeQuantityValue } from './quantityInputUtils'

export interface QuantityInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  readOnly?: boolean
  disabled?: boolean
  className?: string
  name?: string
  id?: string
  'data-testid'?: string
  'data-grid-id'?: string
  'data-grid-row'?: number
  'data-grid-col'?: number
  [key: `data-${string}`]: string | number | boolean | undefined
}

export function QuantityInput({
  label,
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  readOnly = false,
  disabled = false,
  className = '',
  name,
  id,
  'data-testid': testId,
  ...rest
}: QuantityInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const clearedZeroOnFocus = useRef(false)

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    const target = event.currentTarget
    if (!readOnly && !disabled) {
      if (
        value.trim() !== '' &&
        Number(value.replace(',', '.')) === 0
      ) {
        clearedZeroOnFocus.current = true
        onChange('')
      } else {
        clearedZeroOnFocus.current = false
      }
      // Selecciona todo el contenido al recibir foco para sobrescritura inmediata
      target.select()
      requestAnimationFrame(() => {
        target.select()
      })
    } else {
      clearedZeroOnFocus.current = false
    }
    onFocus?.(event)
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    if (clearedZeroOnFocus.current && value.trim() === '') {
      onChange('0')
    }
    clearedZeroOnFocus.current = false
    onBlur?.(event)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeQuantityValue(event.target.value)
    if (sanitized !== null) {
      onChange(sanitized)
    }
  }

  const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
    // Previene cambiar valores por desplazamiento accidental del ratón
    event.currentTarget.blur()
  }

  const displayValue =
    !readOnly && !disabled && isFocused ? value : formatQuantityWithThousands(value)

  return (
    <label className={`block ${className}`}>
      {label ? (
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
          {label}
        </span>
      ) : null}
      <span className="relative block">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={displayValue}
          readOnly={readOnly}
          disabled={disabled}
          name={name}
          id={id}
          data-testid={testId}
          data-quantity-input="true"
          {...rest}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          onWheel={handleWheel}
          onKeyDown={onKeyDown}
          className="number-tabular h-10 w-full rounded-lg border border-slate-400 bg-white px-3 pr-9 text-right text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 read-only:cursor-default read-only:bg-slate-100 read-only:text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-ui-line-dark dark:bg-ui-surface-dark-deep dark:text-ui-text-dark-strong dark:read-only:bg-ui-surface-dark-compact dark:read-only:text-ui-text-dark-soft dark:disabled:bg-ui-surface-dark-recessed dark:disabled:text-ui-text-subtle"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.6875rem] font-bold text-slate-600 dark:text-ui-text-dark-soft">
          kg
        </span>
      </span>
    </label>
  )
}

