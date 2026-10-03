import { Gauge, PackageCheck, Scale, Waves } from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatRatioAsPercent } from '../../../utils/formatters'
import type { WeeklySummary } from '../model/types'
import type { yieldVisualStyles, YieldStatus } from '../presentation/yieldStatus'

interface WeeklySummaryMetricsGridProps {
  summary: WeeklySummary
  isValid: boolean
  weeklyYieldStatus?: YieldStatus | undefined
  weeklyYieldStyles?:
    | (typeof yieldVisualStyles)[keyof typeof yieldVisualStyles]
    | undefined
}

export function WeeklySummaryMetricsGrid({
  summary,
  isValid,
  weeklyYieldStatus,
  weeklyYieldStyles,
}: WeeklySummaryMetricsGridProps) {
  const differenceTone =
    summary.differenceKg100 !== 0
      ? ('danger' as const)
      : isValid
        ? ('success' as const)
        : ('neutral' as const)

  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Indicadores semanales"
    >
      <MetricCard
        label="Materia prima semanal"
        value={formatCentiKg(summary.rawMaterialKg100)}
        icon={<Waves className="size-5" />}
      />
      <MetricCard
        label="Producto terminado"
        value={formatCentiKg(summary.detailFinishedKg100)}
        icon={<PackageCheck className="size-5" />}
        tone="brand"
      />
      <MetricCard
        label="Diferencia semanal"
        value={formatCentiKg(summary.differenceKg100)}
        icon={<Scale className="size-5" />}
        tone={differenceTone}
      />
      <MetricCard
        label="Aprovechamiento acumulado"
        value={formatRatioAsPercent(summary.performance.ratio)}
        icon={<Gauge className="size-5" />}
        {...(weeklyYieldStyles?.metricTone
          ? { tone: weeklyYieldStyles.metricTone }
          : {})}
        {...(weeklyYieldStyles?.textClass
          ? { valueClassName: weeklyYieldStyles.textClass }
          : {})}
        description={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Referencia operativa: 80%</span>
            {weeklyYieldStatus && weeklyYieldStyles ? (
              <StatusBadge tone={weeklyYieldStyles.badgeTone}>
                {weeklyYieldStatus.label}
              </StatusBadge>
            ) : null}
          </div>
        }
      />
    </section>
  )
}
