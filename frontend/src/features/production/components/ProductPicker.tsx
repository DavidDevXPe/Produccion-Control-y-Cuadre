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
  items: readonly T[]
  getItemId: (item: T) => string
  getItemRecentId?: ((item: T) => string) | undefined
  getItemLabel: (item: T) => string
  getItemMeta?: ((item: T) => ProductPickerMeta) | undefined
  onAdd: (item: T) => void
  label?: string | undefined
  ariaLabel?: string | undefined
  placeholder?: string | undefined
  buttonLabel?: string | undefined
  compactButtonLabel?: string | undefined
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
  getItemRecentId,
  getItemLabel,
  getItemMeta,
  onAdd,
  label = 'Buscar producto',
  ariaLabel,
  placeholder,
  buttonLabel = 'Agregar',
  compactButtonLabel,
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

  const recentOptionValues = useMemo(() => {
    if (!scopeKey || recentIds.length === 0) return []

    const optionByRecentId = new Map<string, string>()
    const recentIdByOption = new Map<string, string>()
    for (const item of items) {
      const optionValue = getItemId(item)
      const recentId = getItemRecentId?.(item) ?? getItemId(item)
      if (!optionByRecentId.has(recentId)) {
        optionByRecentId.set(recentId, optionValue)
      }
      optionByRecentId.set(optionValue, optionValue)
      recentIdByOption.set(optionValue, recentId)
    }

    const addedRecentIds = new Set<string>()
    return recentIds.flatMap((recentId) => {
      const optionValue = optionByRecentId.get(recentId)
      if (!optionValue) return []
      const canonicalRecentId = recentIdByOption.get(optionValue) ?? recentId
      if (addedRecentIds.has(canonicalRecentId)) return []
      addedRecentIds.add(canonicalRecentId)
      return [optionValue]
    })
  }, [getItemId, getItemRecentId, items, recentIds, scopeKey])

  const handleActiveOptionChange = useCallback(
    (option: ComboboxOption | null) => {
      if (option) {
        const found = itemsMap.get(option.value)
        setSelectedItem(found ?? null)
      } else {
        setSelectedItem(null)
      }
    },
    [itemsMap],
  )

  const handleSelectOption = useCallback(
    (option: ComboboxOption) => {
      const found = itemsMap.get(option.value)
      if (found) {
        onAdd(found)
        setSelectedItem(null)
        if (scopeKey) {
          addRecent(getItemRecentId?.(found) ?? option.value, option.value)
        }
      }
    },
    [addRecent, getItemRecentId, itemsMap, onAdd, scopeKey],
  )

  const handleButtonClick = () => {
    if (disabled || !selectedItem) return
    onAdd(selectedItem)
    if (scopeKey) {
      addRecent(
        getItemRecentId?.(selectedItem) ?? getItemId(selectedItem),
        getItemId(selectedItem),
      )
    }
    setSelectedItem(null)
  }

  const isButtonDisabled = disabled || selectedItem === null

  return (
    <>
      <div ref={sentinelRef} className="pointer-events-none -mt-px h-px w-full" aria-hidden="true" />
      <div
        className={`sm:sticky sm:top-14 xl:top-0 z-[25] flex flex-col gap-3 border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm p-4 transition-[box-shadow,background-color] sm:flex-row sm:items-center sm:p-5 sm:py-3.5 dark:border-slate-200 dark:bg-ui-picker-bg/95 ${
          isStuck
            ? 'shadow-[0_6px_14px_-4px_rgb(15_23_42/0.18)] dark:shadow-[0_8px_18px_-4px_rgba(0,0,0,0.6)]'
            : 'shadow-none'
        } ${className}`}
      >
      <div className="min-w-0 flex-1">
        <Combobox
          options={options}
          onSelect={handleSelectOption}
          onActiveOptionChange={handleActiveOptionChange}
          label={label}
          ariaLabel={ariaLabel}
          placeholder={placeholder}
          disabled={disabled}
          noResultsText={noResultsText}
          recentValues={recentOptionValues}
          recentSectionTitle="Usados recientemente"
          searchInputRef={searchInputRef}
        />
      </div>

      {extraSlot}

      <button
        type="button"
        aria-label={buttonLabel}
        disabled={isButtonDisabled}
        onClick={handleButtonClick}
        title={
          isButtonDisabled && !disabled
            ? 'Selecciona un producto del catálogo para agregarlo'
            : undefined
        }
        className={
          buttonClassName ??
          buttonStyles('primary')
        }
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{buttonLabel}</span>
        <span className="sm:hidden">{compactButtonLabel ?? (buttonLabel.startsWith('Agregar') ? 'Agregar' : buttonLabel)}</span>
      </button>
    </div>
    </>
  )
}
