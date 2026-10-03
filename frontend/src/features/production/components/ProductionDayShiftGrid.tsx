import { Boxes, Moon, Sun, Waves } from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { formatCentiKg } from '../../../utils/formatters'
import type { ProductionDayCalculation } from '../model/types'

interface ProductionDayShiftGridProps {
  calculation: ProductionDayCalculation
}

export function ProductionDayShiftGrid({
  calculation,
}: ProductionDayShiftGridProps) {
  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Producción por turno"
    >
      <MetricCard
        label="Producción Día"
        value={formatCentiKg(calculation.productiveDayKg100)}
        icon={<Sun className="size-5" />}
      />
      <MetricCard
        label="Producción Noche"
        value={formatCentiKg(calculation.productiveNightKg100)}
        icon={<Moon className="size-5" />}
      />
      <MetricCard
        label="Saldo anterior procesado"
        value={formatCentiKg(calculation.processedPreviousBalanceKg100)}
        icon={<Boxes className="size-5" />}
      />
      <MetricCard
        label="Tratamiento"
        value={formatCentiKg(calculation.treatmentKg100)}
        icon={<Waves className="size-5" />}
      />
    </section>
  )
}

