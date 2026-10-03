import { Moon, Scale, Snowflake, Sun } from 'lucide-react'
import { MetricCard } from '../../../../components/ui/MetricCard'
import { formatCentiKg } from '../../../../utils/formatters'
import type { Kg100 } from '../../model/types'

export interface FreezingKpiGridProps {
  readonly dayShiftDay: Kg100
  readonly dayShiftNight: Kg100
  readonly physicalKg100: Kg100
  readonly differenceKg100: Kg100
}

export function FreezingKpiGrid({
  dayShiftDay,
  dayShiftNight,
  physicalKg100,
  differenceKg100,
}: FreezingKpiGridProps) {
  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Indicadores de Congelamiento"
    >
      <MetricCard
        label="Reporte Día"
        value={formatCentiKg(dayShiftDay)}
        icon={<Sun className="size-5" />}
      />
      <MetricCard
        label="Reporte Noche"
        value={formatCentiKg(dayShiftNight)}
        icon={<Moon className="size-5" />}
      />
      <MetricCard
        label="Congelado físicamente"
        value={formatCentiKg(physicalKg100)}
        icon={<Snowflake className="size-5" />}
        tone="brand"
      />
      <MetricCard
        label="Diferencia"
        value={formatCentiKg(differenceKg100)}
        icon={<Scale className="size-5" />}
        tone={differenceKg100 === 0 ? 'success' : 'danger'}
      />
    </section>
  )
}
