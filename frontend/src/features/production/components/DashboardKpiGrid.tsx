import {
  AlertTriangle,
  Boxes,
  PackageCheck,
  Snowflake,
  TrendingUp,
} from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { formatCentiKgValue } from '../../../utils/formatters'
import type { kg100 } from '../model/calculations'

const COVERAGE_DAYS = 7

function percentOf(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0
}

export interface DashboardKpiGridProps {
  packedWeekKg100: ReturnType<typeof kg100>
  frozenWeekKg100: ReturnType<typeof kg100>
  pendingTraceableKg100: ReturnType<typeof kg100>
  totalAvailableKg100: ReturnType<typeof kg100>
  packingDaysCount: number
  freezingDaysCount: number
  pendingBalancesByFamilyCount: number
  observedJourneyCount: number
  notBalancedJourneyCount: number
  reviewJourneyCount: number
  registeredJourneyCount: number
  weeklyYieldPercent: number | null
  weeklyYieldDelta: number | null
}

export function DashboardKpiGrid({
  packedWeekKg100,
  frozenWeekKg100,
  pendingTraceableKg100,
  totalAvailableKg100,
  packingDaysCount,
  freezingDaysCount,
  pendingBalancesByFamilyCount,
  observedJourneyCount,
  notBalancedJourneyCount,
  reviewJourneyCount,
  registeredJourneyCount,
  weeklyYieldPercent,
  weeklyYieldDelta,
}: DashboardKpiGridProps) {
  return (
    <section
      aria-label="Indicadores principales de la semana"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
    >
      <MetricCard
        variant="kpi"
        label="Envasado de la semana"
        value={formatCentiKgValue(packedWeekKg100)}
        unit="kg"
        icon={<PackageCheck className="size-6" />}
        tone="brand"
        description={`${packingDaysCount}/${COVERAGE_DAYS} jornadas de Envasado`}
        progress={{
          percent: percentOf(packingDaysCount, COVERAGE_DAYS),
          label: 'Jornadas de Envasado registradas en la semana',
        }}
      />

      <MetricCard
        variant="kpi"
        label="Congelado de la semana"
        value={formatCentiKgValue(frozenWeekKg100)}
        unit="kg"
        icon={<Snowflake className="size-6" />}
        tone="brand"
        description={`${freezingDaysCount}/${COVERAGE_DAYS} jornadas de Congelamiento`}
        progress={{
          percent: percentOf(freezingDaysCount, COVERAGE_DAYS),
          label: 'Jornadas de Congelamiento registradas en la semana',
        }}
      />

      <MetricCard
        variant="kpi"
        label="Saldo pendiente trazable"
        value={formatCentiKgValue(pendingTraceableKg100)}
        unit="kg"
        icon={<Boxes className="size-6" />}
        tone="success"
        description={
          pendingTraceableKg100 > 0
            ? `${pendingBalancesByFamilyCount} familias con pendiente`
            : 'Sin saldo trazable pendiente'
        }
        progress={{
          percent: percentOf(pendingTraceableKg100, totalAvailableKg100),
          label: 'Parte del disponible de Envasado de la semana que aún falta congelar',
        }}
      />

      <MetricCard
        variant="kpi"
        label="Jornadas con observación"
        value={observedJourneyCount}
        icon={<AlertTriangle className="size-6" />}
        tone={
          notBalancedJourneyCount > 0
            ? 'danger'
            : observedJourneyCount > 0
              ? 'warning'
              : 'success'
        }
        description={`${notBalancedJourneyCount} sin cuadrar · ${observedJourneyCount} con nota`}
        progress={{
          percent: percentOf(
            observedJourneyCount + reviewJourneyCount,
            registeredJourneyCount,
          ),
          label: 'Jornadas de la semana con observación o sin cuadrar',
        }}
      />

      <MetricCard
        variant="kpi"
        label="Rendimiento semanal"
        value={
          weeklyYieldPercent === null
            ? '—'
            : `${weeklyYieldPercent.toFixed(1)}%`
        }
        icon={<TrendingUp className="size-6" />}
        tone="violet"
        description={
          weeklyYieldDelta === null ? (
            'Referencia de aprovechamiento: 80%'
          ) : (
            <span
              className={
                weeklyYieldDelta >= 0
                  ? 'font-semibold text-emerald-700 dark:text-emerald-300'
                  : 'font-semibold text-rose-700 dark:text-rose-300'
              }
            >
              {weeklyYieldDelta >= 0 ? '▲ +' : '▼ '}
              {weeklyYieldDelta.toFixed(1)} pp vs. semana anterior
            </span>
          )
        }
        {...(weeklyYieldPercent === null
          ? {}
          : {
              progress: {
                percent: weeklyYieldPercent,
                label: 'Aprovechamiento general de Envasado de la semana',
              },
            })}
      />
    </section>
  )
}

