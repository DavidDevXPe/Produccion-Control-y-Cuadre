import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SectionCard } from '../../../components/ui/SectionCard'
import type { PerformanceRecord } from '../model/types'

interface PerformanceChartsProps {
  records: readonly PerformanceRecord[]
}

interface ChartRow {
  date: string
  dayProductivity: number | null
  nightProductivity: number | null
  dayKgPerHour: number | null
  nightKgPerHour: number | null
}

function buildChartRows(records: readonly PerformanceRecord[]): readonly ChartRow[] {
  const dates = [...new Set(records.map((record) => record.date))].sort()
  return dates.map((date) => {
    const day = records.find(
      (record) => record.date === date && record.shift === 'DAY',
    )
    const night = records.find(
      (record) => record.date === date && record.shift === 'NIGHT',
    )
    return {
      date: date.slice(5).split('-').reverse().join('/'),
      dayProductivity: day?.kgPerWorkerHour ?? null,
      nightProductivity: night?.kgPerWorkerHour ?? null,
      dayKgPerHour: day?.kgPerHour ?? null,
      nightKgPerHour: night?.kgPerHour ?? null,
    }
  })
}

function OperationalLineChart({
  title,
  description,
  data,
  dayKey,
  nightKey,
  referenceValue,
  referenceLabel,
}: {
  title: string
  description: string
  data: readonly ChartRow[]
  dayKey: 'dayProductivity' | 'dayKgPerHour'
  nightKey: 'nightProductivity' | 'nightKgPerHour'
  referenceValue?: number
  referenceLabel?: string
}) {
  return (
    <SectionCard title={title} description={description} contentClassName="p-3 sm:p-4">
      <div className="h-64 w-full" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 18, bottom: 4, left: 6 }}>
            <CartesianGrid stroke="var(--color-production-grid)" strokeDasharray="3 3" opacity={0.35} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#7f9bad" />
            <YAxis tick={{ fontSize: 11 }} stroke="#7f9bad" width={64} />
            <Tooltip
              formatter={(value) =>
                typeof value === 'number'
                  ? value.toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '—'
              }
              contentStyle={{
                background: '#0a1a27',
                border: '1px solid #2b5268',
                borderRadius: '0.625rem',
                color: '#f3f8fb',
                fontSize: '0.75rem',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            {referenceValue ? (
              <ReferenceLine
                y={referenceValue}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: referenceLabel ?? 'Benchmark',
                  fill: '#10b981',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            ) : null}
            <Line type="monotone" dataKey={dayKey} name="Día" stroke="#20a6d2" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
            <Line type="monotone" dataKey={nightKey} name="Noche" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  )
}

export function PerformanceCharts({ records }: PerformanceChartsProps) {
  const complete = records.filter((record) => record.isComplete)
  if (complete.length === 0) {
    return (
      <SectionCard contentClassName="p-6 text-center">
        <p className="text-sm font-bold text-slate-950">Sin información para graficar</p>
        <p className="mt-1 text-xs text-slate-500">Completa al menos un turno para activar la evolución semanal.</p>
      </SectionCard>
    )
  }
  const data = buildChartRows(complete)

  return (
    <section className="grid gap-5 xl:grid-cols-2" aria-label="Gráficos de rendimiento">
      <OperationalLineChart
        title="Kg/persona-h por día"
        description="Productividad agregada de cada turno; no usa promedios simples."
        data={data}
        dayKey="dayProductivity"
        nightKey="nightProductivity"
      />
      <OperationalLineChart
        title="Kg/h por día"
        description="Ritmo físico registrado por jornada y turno."
        data={data}
        dayKey="dayKgPerHour"
        nightKey="nightKgPerHour"
      />
    </section>
  )
}
