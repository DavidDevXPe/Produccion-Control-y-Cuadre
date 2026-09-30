import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Combobox, type ComboboxOption } from '../../../components/ui/Combobox'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { useRecentProducts } from '../hooks/useRecentProducts'

export interface ProductPickerMeta {
  group?: string | undefined
  secondaryText?: string | undefined
}

export interface ProductPickerProps<T> {
  items: T[]
  getItemId: (item: T) => string
  getItemLabel: (item: T) => string
  getItemMeta?: ((item: T) => ProductPickerMeta) | undefined
  onAdd: (item: T) => void
  label?: string | undefined
  ariaLabel?: string | undefined
  placeholder?: string | undefined
  buttonLabel?: string | undefined
  buttonClassName?: string | undefined
  disabled?: boolean | undefined
  scopeKey?: string | undefined
  searchInputRef?: React.RefObject<HTMLInputElement | null> | undefined
  noResultsText?: string | undefined
  extraSlot?: React.ReactNode | undefined
  className?: string | undefined
}

export function ProductPicker<T>({
  items,
  getItemId,
  getItemLabel,
  getItemMeta,
  onAdd,
  label = 'Buscar producto',
  ariaLabel,
  placeholder,
  buttonLabel = 'Agregar',
  buttonClassName,
  disabled = false,
  scopeKey,
  searchInputRef,
  noResultsText,
  extraSlot,
  className = '',
}: ProductPickerProps<T>) {
  const { recentIds, addRecent } = useRecentProducts(scopeKey ?? 'global')
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [isStuck, setIsStuck] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsStuck(!entry.isIntersecting)
        }
      },
      { threshold: [0, 1] },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const itemsMap = useMemo(() => {
    const map = new Map<string, T>()
    for (const item of items) {
      map.set(getItemId(item), item)
    }
    return map
  }, [items, getItemId])

  const options: ComboboxOption[] = useMemo(() => {
    return items.map((item) => {
      const id = getItemId(item)
      const labelText = getItemLabel(item)
      const meta = getItemMeta ? getItemMeta(item) : undefined
      return {
        value: id,
        label: labelText,
        group: meta?.group,
        secondaryText: meta?.secondaryText,
      }
    })
  }, [items, getItemId, getItemLabel, getItemMeta])

  const handleSelectOption = useCallback(
    (option: ComboboxOption) => {
      const found = itemsMap.get(option.value)
      if (found) {
        setSelectedItem(found)
        onAdd(found)
        if (scopeKey) {
          addRecent(option.value)
        }
      }
    },
    [addRecent, itemsMap, onAdd, scopeKey],
  )

  const handleButtonClick = () => {
    if (disabled) return
    const target = selectedItem ?? items[0]
    if (target) {
      onAdd(target)
      if (scopeKey) {
        addRecent(getItemId(target))
      }
    }
  }

  return (
    <>
      <div ref={sentinelRef} className="pointer-events-none -mt-px h-px w-full" aria-hidden="true" />
      <div
        className={`sm:sticky sm:top-14 xl:top-0 z-[25] flex flex-col gap-3 border-b border-slate-300 bg-slate-50/95 p-4 transition-[box-shadow,background-color] sm:flex-row sm:items-center sm:p-5 sm:py-3.5 dark:border-ui-line-dark-soft dark:bg-ui-surface-dark-recessed/95 ${
          isStuck
            ? 'shadow-[0_6px_14px_-4px_rgb(15_23_42/0.18)] dark:shadow-[0_8px_18px_-4px_rgba(0,0,0,0.6)]'
            : 'shadow-none'
        } ${className}`}
      >
      <div className="min-w-0 flex-1">
        <Combobox
          options={options}
          onSelect={handleSelectOption}
          label={label}
          ariaLabel={ariaLabel}
          placeholder={placeholder}
          disabled={disabled}
          noResultsText={noResultsText}
          recentValues={scopeKey ? recentIds : []}
          recentSectionTitle="Usados recientemente"
          searchInputRef={searchInputRef}
        />
      </div>

      {extraSlot}

      <button
        type="button"
        disabled={disabled}
        onClick={handleButtonClick}
        className={
          buttonClassName ??
          buttonStyles('secondary')
        }
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {buttonLabel}
      </button>
    </div>
    </>
  )
}
