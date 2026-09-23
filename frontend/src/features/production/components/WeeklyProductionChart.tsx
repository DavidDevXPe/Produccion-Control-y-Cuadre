import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { formatCentiKg } from '../../../utils/formatters'
import { getWeeklyChartLineKg100 } from './weeklyChartLine'

export interface WeeklyProductionChartDatum {
  readonly id: string
  readonly label: string
  readonly dateLabel: string
  readonly dayKg100: number
  readonly nightKg100: number
  readonly treatmentKg100: number
  readonly balanceKg100: number
}

export type WeeklyProductionSeries =
  | 'ALL'
  | 'DAY'
  | 'NIGHT'
  | 'TREATMENT'
  | 'BALANCE'

interface WeeklyProductionChartProps {
  data: readonly WeeklyProductionChartDatum[]
  /** Series shown as bars. The finished-product total line is always shown. */
  series?: WeeklyProductionSeries
}

const seriesBars: readonly {
  series: Exclude<WeeklyProductionSeries, 'ALL'>
  dataKey: keyof WeeklyProductionChartDatum
  name: string
  fill: string
}[] = [
  { series: 'DAY', dataKey: 'dayKg100', name: 'Día', fill: 'var(--color-production-day)' },
  { series: 'NIGHT', dataKey: 'nightKg100', name: 'Noche', fill: 'var(--color-production-night)' },
  { series: 'TREATMENT', dataKey: 'treatmentKg100', name: 'Tratamiento', fill: 'var(--color-production-treatment)' },
  { series: 'BALANCE', dataKey: 'balanceKg100', name: 'Saldo', fill: 'var(--color-production-balance)' },
]

function calculateFinishedTotalKg100(
  datum: WeeklyProductionChartDatum,
): number {
  return (
    datum.dayKg100 +
    datum.nightKg100 +
    datum.treatmentKg100 +
    datum.balanceKg100
  )
}

function formatAxisKg(valueKg100: number): string {
  const valueKg = valueKg100 / 100
  if (valueKg === 0) return '0'
  if (Math.abs(valueKg) >= 1_000) return `${Math.round(valueKg / 1_000)}k`
  return String(Math.round(valueKg))
}

const axisStepKg100 = 15_000_000

/** Nice step (1, 2, 2.5 or 5 × 10ⁿ kg) so a single small series keeps its scale. */
function niceStepKg100(maximumKg100: number): number {
  const rawStepKg = Math.max(maximumKg100 / 100 / 4, 1)
  const magnitude = 10 ** Math.floor(Math.log10(rawStepKg))
  const step =
    [1, 2, 2.5, 5, 10].find((factor) => factor * magnitude >= rawStepKg) ?? 10
  return Math.round(step * magnitude * 100)
}

function getAxisScale(maximumValueKg100: number, stepKg100: number) {
  const maximumKg100 = Math.max(
    stepKg100 * 4,
    Math.ceil(maximumValueKg100 / stepKg100) * stepKg100,
  )

  return {
    maximumKg100,
    ticks: Array.from(
      { length: Math.round(maximumKg100 / stepKg100) + 1 },
      (_, index) => index * stepKg100,
    ),
  }
}

export function ProductionTooltip({
  active,
  label,
  payload,
}: TooltipContentProps) {
  if (!active || payload.length === 0) return null

  const datum = payload[0]?.payload as WeeklyProductionChartDatum | undefined
  if (!datum) return null

  const finishedTotalKg100 = calculateFinishedTotalKg100(datum)

  const rows = [
    { label: 'Día', value: datum.dayKg100, color: 'var(--color-production-day)' },
    { label: 'Noche', value: datum.nightKg100, color: 'var(--color-production-night)' },
    { label: 'Tratamiento', value: datum.treatmentKg100, color: 'var(--color-production-treatment)' },
    { label: 'Saldo', value: datum.balanceKg100, color: 'var(--color-production-balance)' },
  ] as const

  return (
    <div className="min-w-52 max-w-[calc(100vw-2rem)] rounded-[0.625rem] border border-[var(--color-production-tooltip-border)] bg-[var(--color-production-tooltip)] px-3.5 py-3 text-[#f3f8fb] shadow-[0_8px_24px_rgb(0_0_0/0.22)]">
      <p className="text-xs font-bold uppercase text-[#eef4f8]">
        {label} <span className="number-tabular text-[#7f9bad]">· {datum.dateLabel}</span>
      </p>
      <dl className="mt-3 space-y-2">
        {rows.map((entry) => (
          <div
            key={entry.label}
            className="flex items-center justify-between gap-5 text-[0.6875rem]"
          >
            <dt className="flex items-center gap-2 text-[#7f9bad]">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              {entry.label}
            </dt>
            <dd className="number-tabular whitespace-nowrap font-semibold text-[#f3f8fb]">
              {formatCentiKg(entry.value)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-end justify-between gap-5 border-t border-[var(--color-production-tooltip-border)] pt-2.5">
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#7f9bad]">
          Producto terminado
        </span>
        <span className="number-tabular whitespace-nowrap text-sm font-bold text-[#f3f8fb]">
          {formatCentiKg(finishedTotalKg100)}
        </span>
      </div>
    </div>
  )
}

export function WeeklyProductionChart({
  data,
  series = 'ALL',
}: WeeklyProductionChartProps) {
  const visibleBars = seriesBars.filter(
    (bar) => series === 'ALL' || bar.series === series,
  )
  // The line follows the selection: finished-product total for "Total",
  // otherwise the value of the selected series.
  const selectedBar = series === 'ALL' ? null : visibleBars[0] ?? null
  const chartData = data.map((datum) => ({
    ...datum,
    lineKg100: getWeeklyChartLineKg100(datum, series),
  }))
  const maximumValueKg100 = Math.max(0, ...chartData.map((datum) => datum.lineKg100))
  const axisScale =
    series === 'ALL'
      ? getAxisScale(maximumValueKg100, axisStepKg100)
      : getAxisScale(maximumValueKg100, niceStepKg100(maximumValueKg100))
  const chartLabel = data
    .map(
      (entry) =>
        `${entry.label}, ${entry.dateLabel}: Día ${formatCentiKg(entry.dayKg100)}, Noche ${formatCentiKg(entry.nightKg100)}, Tratamiento ${formatCentiKg(entry.treatmentKg100)}, Saldo ${formatCentiKg(entry.balanceKg100)} y Producto terminado ${formatCentiKg(calculateFinishedTotalKg100(entry))}`,
    )
    .join('. ')

  return (
    <div
      className="h-[13.5rem] min-w-0 w-full sm:h-[14.5rem]"
      role="img"
      aria-label={`Producción semanal apilada. ${chartLabel}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          barCategoryGap="42%"
          accessibilityLayer
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--color-production-grid)"
            strokeOpacity={0.6}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-slate-500)', fontSize: 11, fontWeight: 600 }}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-slate-500)', fontSize: 10 }}
            tickFormatter={formatAxisKg}
            domain={[0, axisScale.maximumKg100]}
            ticks={axisScale.ticks}
            width={48}
          />
          <Tooltip
            content={ProductionTooltip}
            cursor={{ fill: '#123247', fillOpacity: 0.38 }}
            isAnimationActive={false}
            shared
          />
          {visibleBars.map((bar, index) => (
            <Bar
              key={bar.series}
              dataKey={bar.dataKey}
              name={bar.name}
              stackId="production"
              fill={bar.fill}
              maxBarSize={58}
              radius={index === visibleBars.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
            />
          ))}
          <Line
            type="monotone"
            dataKey="lineKg100"
            name={selectedBar ? selectedBar.name : 'Total'}
            stroke="var(--color-production-total)"
            strokeWidth={2}
            dot={{ r: 3.5, fill: 'var(--color-production-total)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WeeklyProductionChart
