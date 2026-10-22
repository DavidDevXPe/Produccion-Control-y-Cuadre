import { lazy, Suspense, useMemo } from 'react'
import { SectionCard } from '../../../components/ui/SectionCard'
import {
  SegmentedTabs,
  type SegmentedTabOption,
} from '../../../components/ui/SegmentedTabs'
import { StatusBadge, type StatusBadgeTone } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import { kg100 } from '../model/calculations'
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

const seriesSummaryMeta: readonly {
  series: Exclude<WeeklyProductionSeries, 'ALL'>
  label: string
  dotClass: string
  selectValue: (point: WeeklyProductionDataPoint) => number
}[] = [
  {
    series: 'DAY',
    label: 'Día',
    dotClass: 'bg-[var(--color-production-day)]',
    selectValue: (point) => point.dayKg100,
  },
  {
    series: 'NIGHT',
    label: 'Noche',
    dotClass: 'bg-[var(--color-production-night)]',
    selectValue: (point) => point.nightKg100,
  },
  {
    series: 'TREATMENT',
    label: 'Tratamiento',
    dotClass: 'bg-[var(--color-production-treatment)]',
    selectValue: (point) => point.treatmentKg100,
  },
  {
    series: 'BALANCE',
    label: 'Saldo',
    dotClass: 'bg-[var(--color-production-balance)]',
    selectValue: (point) => point.balanceKg100,
  },
]

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
  const seriesBreakdown = useMemo(() => {
    const totals = seriesSummaryMeta.map((meta) => {
      const rawTotal = weeklyProductionData.reduce(
        (sum, point) => sum + meta.selectValue(point),
        0,
      )
      return {
        ...meta,
        totalKg100: kg100(rawTotal),
      }
    })

    const finishedTotalRaw = totals.reduce(
      (sum, item) => sum + item.totalKg100,
      0,
    )
    const finishedTotalKg100 = kg100(finishedTotalRaw)

    return {
      finishedTotalKg100,
      items: totals.map((item) => {
        const sharePercent =
          finishedTotalRaw > 0 ? (item.totalKg100 / finishedTotalRaw) * 100 : 0
        return {
          ...item,
          sharePercent,
        }
      }),
    }
  }, [weeklyProductionData])

  return (
    <SectionCard
      title="Evolución semanal de Envasado"
      description="Día, Noche, Tratamiento y Saldo por jornada registrada."
      action={
        <StatusBadge tone={weekBadge.tone} truncateText={false}>
          {weekBadge.label}
        </StatusBadge>
      }
      className="flex flex-col xl:grow xl:shrink-0"
      contentClassName="flex flex-1 flex-col p-4"
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

      <div className="flex flex-1 flex-col justify-center">
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
      </div>

      <div className="mt-auto border-t border-slate-100 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2 text-[0.6875rem]">
          <span className="font-semibold uppercase tracking-[0.08em] text-slate-500">
            Acumulado semanal por serie
          </span>
          <span className="number-tabular font-semibold text-slate-600">
            Total terminado: {formatCentiKg(seriesBreakdown.finishedTotalKg100)}
          </span>
        </div>

        <div
          role="group"
          aria-label="Acumulado semanal por serie"
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
        >
          {seriesBreakdown.items.map((item) => {
            const isSelected = chartSeries === item.series
            const barWidthPercent =
              item.totalKg100 > 0
                ? Math.min(100, Math.max(item.sharePercent, 4))
                : 0

            return (
              <button
                key={item.series}
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  onChangeChartSeries(isSelected ? 'ALL' : item.series)
                }
                className={`flex flex-col justify-between rounded-lg border p-2.5 text-left transition ${
                  isSelected
                    ? 'border-brand-400 bg-brand-50/70 ring-1 ring-brand-400/50'
                    : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${item.dotClass}`}
                      aria-hidden="true"
                    />
                    <span className="truncate text-xs font-semibold text-slate-700">
                      {item.label}
                    </span>
                  </span>
                  <span className="number-tabular shrink-0 rounded bg-slate-200/70 px-1.5 py-0.5 text-[0.6875rem] font-bold text-slate-700">
                    {item.sharePercent.toFixed(1)}%
                  </span>
                </div>

                <p className="number-tabular mt-2 text-sm font-bold text-slate-900">
                  {formatCentiKg(item.totalKg100)}
                </p>

                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full rounded-full ${item.dotClass}`}
                    style={{ width: `${barWidthPercent}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>

        <p className="mt-2.5 border-t border-slate-100 pt-2 text-[0.6875rem] leading-5 text-slate-500">
          Se muestran únicamente jornadas reales registradas en la semana.
          {chartSeries === 'ALL'
            ? ' La línea Total es el producto terminado de cada jornada.'
            : ` La línea sigue la serie ${chartSeriesLabels[chartSeries]}.`}
        </p>
      </div>
    </SectionCard>
  )
}
