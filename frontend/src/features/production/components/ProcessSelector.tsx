import { Layers, PackageCheck, QrCode, Scale, Snowflake } from 'lucide-react'
import {
  SegmentedTabs,
  type SegmentedTabOption,
} from '../../../components/ui/SegmentedTabs'
import type { ProductionProcess } from '../model/types'

export type ProductionView = ProductionProcess | 'COMPARISON'

interface ProcessSelectorProps<T extends ProductionView = ProductionView> {
  value: T
  onChange: (value: T) => void
  includeComparison?: boolean
  disabled?: boolean
}

const iconClass = 'size-3.5'

const processOptions: readonly SegmentedTabOption<ProductionProcess>[] = [
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
  {
    value: 'VIDEOJET',
    label: 'Videojet',
    icon: <QrCode className={iconClass} aria-hidden="true" />,
    selectedClassName: 'bg-indigo-700 text-white shadow-sm',
  },
  {
    value: 'PALLETIZING',
    label: 'Paletizado',
    icon: <Layers className={iconClass} aria-hidden="true" />,
    selectedClassName: 'bg-emerald-700 text-white shadow-sm',
  },
]

const comparisonOption: SegmentedTabOption<ProductionView> = {
  value: 'COMPARISON',
  label: 'Comparativo',
  icon: <Scale className={iconClass} aria-hidden="true" />,
  selectedClassName: 'bg-brand-700 text-white shadow-sm',
}

export function ProcessSelector<T extends ProductionView = ProductionView>({
  value,
  onChange,
  includeComparison = false,
  disabled = false,
}: ProcessSelectorProps<T>) {
  const options = [
    ...processOptions,
    ...(includeComparison ? [comparisonOption] : []),
  ] as unknown as readonly SegmentedTabOption<T>[]

  return (
    <SegmentedTabs
      caption="Proceso"
      label="Proceso operativo"
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  )
}
