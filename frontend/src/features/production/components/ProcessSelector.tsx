import { PackageCheck, Snowflake } from 'lucide-react'
import {
  SegmentedTabs,
  type SegmentedTabOption,
} from '../../../components/ui/SegmentedTabs'
import type { ProductionProcess } from '../model/types'

export type ProductionView = ProductionProcess | 'COMPARISON'

interface ProcessSelectorProps {
  value: ProductionView
  onChange: (value: ProductionView) => void
  includeComparison?: boolean
  disabled?: boolean
}

const iconClass = 'size-3.5'

const processOptions: readonly SegmentedTabOption<ProductionView>[] = [
  {
    value: 'PACKING',
    label: 'Envasado',
    icon: <PackageCheck className={iconClass} aria-hidden="true" />,
  },
  {
    value: 'FREEZING',
    label: 'Congelamiento',
    icon: <Snowflake className={iconClass} aria-hidden="true" />,
    selectedClassName: 'bg-sky-700 text-white shadow-sm',
  },
]

const comparisonOption: SegmentedTabOption<ProductionView> = {
  value: 'COMPARISON',
  label: 'Comparativo',
  icon: <PackageCheck className={iconClass} aria-hidden="true" />,
}

export function ProcessSelector({
  value,
  onChange,
  includeComparison = false,
  disabled = false,
}: ProcessSelectorProps) {
  return (
    <SegmentedTabs
      caption="Proceso"
      label="Proceso operativo"
      options={
        includeComparison ? [...processOptions, comparisonOption] : processOptions
      }
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  )
}
