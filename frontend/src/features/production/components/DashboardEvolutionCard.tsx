import { lazy, Suspense } from 'react'
import { SectionCard } from '../../../components/ui/SectionCard'
import {
  SegmentedTabs,
  type SegmentedTabOption,
} from '../../../components/ui/SegmentedTabs'
import { StatusBadge, type StatusBadgeTone } from '../../../components/ui/StatusBadge'
import type { WeeklyProductionSeries } from './WeeklyProductionChart'
import type { WeeklyProductionDataPoint } from '../hooks/useDashboardData'

const WeeklyProductionChart = lazy(
  () => import('./WeeklyProductionChart'),
)

const chartSeriesOptions: readonly SegmentedTabOption<WeeklyProductionSeries>[] = [
  { value: 'ALL', label: 'Total' },
  { value: 'DAY', label: 'Día' },
  { value: 'NIGHT', label: 'Noche' },
  { value: 'TREATMENT', label: 'Tratamiento' },
  { value: 'BALANCE', label: 'Saldo' },
]

const chartLegend = [
  ['Día', 'bg-[var(--color-production-day)]'],
  ['Noche', 'bg-[var(--color-production-night)]'],
  ['Tratamiento', 'bg-[var(--color-production-treatment)]'],
  ['Saldo', 'bg-[var(--color-production-balance)]'],
] as const

const chartSeriesLabels: Record<WeeklyProductionSeries, string> = {
  ALL: 'Total',
  DAY: 'Día',
  NIGHT: 'Noche',
  TREATMENT: 'Tratamiento',
  BALANCE: 'Saldo',
}

export interface DashboardEvolutionCardProps {
  weeklyProductionData: WeeklyProductionDataPoint[]
  chartSeries: WeeklyProductionSeries
  onChangeChartSeries: (series: WeeklyProductionSeries) => void
  weekBadge: { tone: StatusBadgeTone; label: string }
}

export function DashboardEvolutionCard({
  weeklyProductionData,
  chartSeries,
  onChangeChartSeries,
  weekBadge,
}: DashboardEvolutionCardProps) {
  return (
    <SectionCard
      title="Evolución semanal de Envasado"
      description="Día, Noche, Tratamiento y Saldo por jornada registrada."
      action={
        <StatusBadge tone={weekBadge.tone} truncateText={false}>
          {weekBadge.label}
        </StatusBadge>
      }
      contentClassName="p-4"
    >
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <SegmentedTabs
          caption="Serie"
          label="Serie del gráfico semanal"
          options={chartSeriesOptions}
          value={chartSeries}
          onChange={onChangeChartSeries}
        />
        <ul
          aria-label="Leyenda del gráfico"
          className="flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] font-medium text-slate-600"
        >
          {chartLegend.map(([label, color]) => (
            <li key={label} className="inline-flex items-center gap-1.5">
              <span
                className={`size-2.5 rounded-full ${color}`}
                aria-hidden="true"
              />
              {label}
            </li>
          ))}
          <li className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full bg-[var(--color-production-total)]"
              aria-hidden="true"
            />
            Línea: {chartSeriesLabels[chartSeries]}
          </li>
        </ul>
      </div>

      {weeklyProductionData.length > 0 ? (
        <Suspense
          fallback={
            <div
              className="grid h-[14.5rem] place-items-center text-xs text-slate-500"
              role="status"
            >
              Preparando gráfico semanal…
            </div>
          }
        >
          <WeeklyProductionChart
            data={weeklyProductionData}
            series={chartSeries}
          />
        </Suspense>
      ) : (
        <div className="grid h-[14.5rem] place-items-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
          Sin jornadas de Envasado para graficar.
        </div>
      )}

      <p className="mt-2 border-t border-slate-100 pt-2 text-[0.6875rem] leading-5 text-slate-500">
        Se muestran únicamente jornadas reales registradas en la semana.
        {chartSeries === 'ALL'
          ? ' La línea Total es el producto terminado de cada jornada.'
          : ` La línea sigue la serie ${chartSeriesLabels[chartSeries]}.`}
      </p>
    </SectionCard>
  )
}

