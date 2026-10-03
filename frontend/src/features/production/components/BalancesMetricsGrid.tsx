import { AlertTriangle, Boxes, CalendarClock, Layers3 } from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { formatCentiKg } from '../../../utils/formatters'
import type { Kg100 } from '../model/types'

export interface BalancesMetricsGridProps {
  isFreezing: boolean
  totalPendingKg100: Kg100
  pendingProductCount: number
  originCount: number
  totalExcessKg100: Kg100
}

export function BalancesMetricsGrid({
  isFreezing,
  totalPendingKg100,
  pendingProductCount,
  originCount,
  totalExcessKg100,
}: BalancesMetricsGridProps) {
  return (
    <section
      className={`grid gap-3 ${
        totalExcessKg100 > 0 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'
      }`}
      aria-label="Resumen de saldos"
    >
      <MetricCard
        label={isFreezing ? 'Pendiente de congelar' : 'Saldo total pendiente'}
        value={formatCentiKg(totalPendingKg100)}
        icon={<Boxes className="size-5" />}
        tone="brand"
      />
      <MetricCard
        label="Productos pendientes"
        value={pendingProductCount}
        icon={<Layers3 className="size-5" />}
      />
      <MetricCard
        label="Jornadas de origen"
        value={originCount}
        icon={<CalendarClock className="size-5" />}
      />
      {totalExcessKg100 > 0 ? (
        <MetricCard
          label="Consumido en exceso"
          value={formatCentiKg(totalExcessKg100)}
          description="Por encima de lo que generó su origen"
          icon={<AlertTriangle className="size-5" />}
          tone="danger"
        />
      ) : null}
    </section>
  )
}
