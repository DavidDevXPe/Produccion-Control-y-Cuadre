import { CheckCircle2, Gauge, Package, Scale, Snowflake } from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { formatCentiKgValue, formatRatioAsPercent } from '../../../utils/formatters'
import type { calculateWeeklySummary, kg100 } from '../model/calculations'

export interface ProductionDaysMetricsGridProps {
  isFreezing: boolean
  frozenPhysicalKg100: ReturnType<typeof kg100>
  freezingLinkedKg100: ReturnType<typeof kg100>
  freezingDifferenceKg100: ReturnType<typeof kg100>
  freezingPendingKg100: ReturnType<typeof kg100>
  weeklySummary: ReturnType<typeof calculateWeeklySummary>
  registeredDaysCount: number
  belowReferenceCount: number
}

export function ProductionDaysMetricsGrid({
  isFreezing,
  frozenPhysicalKg100,
  freezingLinkedKg100,
  freezingDifferenceKg100,
  freezingPendingKg100,
  weeklySummary,
  registeredDaysCount,
  belowReferenceCount,
}: ProductionDaysMetricsGridProps) {
  const diffKg100 = isFreezing ? freezingDifferenceKg100 : weeklySummary.differenceKg100

  return (
    <section
      className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      aria-label="Resumen de jornadas"
    >
      <MetricCard
        label="Materia Prima Ingresada"
        value={`${formatCentiKgValue(
          isFreezing ? frozenPhysicalKg100 : weeklySummary.rawMaterialKg100,
        )} kg`}
        icon={<Scale className="size-5" />}
        tone="brand"
        description={`${registeredDaysCount} de 7 días de la semana`}
      />

      <MetricCard
        label="Producto Terminado"
        value={`${formatCentiKgValue(
          isFreezing ? freezingLinkedKg100 : weeklySummary.declaredFinishedKg100,
        )} kg`}
        icon={<Package className="size-5" />}
        tone="success"
        description="● Cajas palletizadas"
      />

      <MetricCard
        label="Rendimiento Global"
        value={
          !isFreezing && weeklySummary.performance.percent !== null
            ? `${formatRatioAsPercent(weeklySummary.performance.ratio)}`
            : '—'
        }
        icon={<Gauge className="size-5" />}
        tone={belowReferenceCount === 0 ? 'success' : 'warning'}
        description="Bajo referencia (<80%)"
      />

      <MetricCard
        label="Diferencia de Cuadre"
        value={`${formatCentiKgValue(diffKg100)} kg`}
        icon={<CheckCircle2 className="size-5" />}
        tone={diffKg100 === 0 ? 'success' : 'danger'}
        description={
          diffKg100 === 0
            ? '✔ Sin merma no justificada'
            : 'Diferencia a conciliar'
        }
      />

      <MetricCard
        label={isFreezing ? 'Dif. trazabilidad' : 'Saldo en Cámara'}
        value={`${formatCentiKgValue(freezingPendingKg100)} kg`}
        icon={<Snowflake className="size-5" />}
        tone="brand"
        description="En proceso de congelación"
      />
    </section>
  )
}

