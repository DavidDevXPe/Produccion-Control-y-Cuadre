import { CheckCircle2, Gauge, Package, Scale, Snowflake } from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { formatCentiKgValue, formatRatioAsPercent } from '../../../utils/formatters'
import type { calculateWeeklySummary, kg100 } from '../model/calculations'

export interface ProductionDaysMetricsGridProps {
  isFreezing: boolean
  freezingWeeklyAvailableKg100: ReturnType<typeof kg100>
  freezingWeeklyPhysicalKg100: ReturnType<typeof kg100>
  freezingWeeklyLinkedKg100: ReturnType<typeof kg100>
  freezingWeeklyDifferenceKg100: ReturnType<typeof kg100>
  freezingHasRecords: boolean
  freezingPendingKg100: ReturnType<typeof kg100>
  weeklySummary: ReturnType<typeof calculateWeeklySummary>
  registeredDaysCount: number
  belowReferenceCount: number
}

export function ProductionDaysMetricsGrid({
  isFreezing,
  freezingWeeklyAvailableKg100,
  freezingWeeklyPhysicalKg100,
  freezingWeeklyLinkedKg100,
  freezingWeeklyDifferenceKg100,
  freezingHasRecords,
  freezingPendingKg100,
  weeklySummary,
  registeredDaysCount,
  belowReferenceCount,
}: ProductionDaysMetricsGridProps) {
  const packingDifferenceKg100 = weeklySummary.differenceKg100

  return (
    <section
      className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      aria-label="Resumen de jornadas"
    >
      {isFreezing ? (
        <>
          <MetricCard
            label="Disponible de Envasado"
            value={`${formatCentiKgValue(freezingWeeklyAvailableKg100)} kg`}
            icon={<Scale className="size-5" />}
            tone="brand"
            description="Semana seleccionada · pendiente real"
          />
          <MetricCard
            label="Congelado físicamente"
            value={`${formatCentiKgValue(freezingWeeklyPhysicalKg100)} kg`}
            icon={<Snowflake className="size-5" />}
            tone="success"
            description={
              freezingHasRecords
                ? 'Reportes físicos de la semana'
                : 'Sin registros de congelamiento esta semana'
            }
          />
          <MetricCard
            label="Vinculado por trazabilidad"
            value={`${formatCentiKgValue(freezingWeeklyLinkedKg100)} kg`}
            icon={<Package className="size-5" />}
            tone="success"
            description="Consumos FIFO realizados esta semana"
          />
          <MetricCard
            label="Diferencia de trazabilidad semanal"
            value={
              freezingHasRecords
                ? `${formatCentiKgValue(freezingWeeklyDifferenceKg100)} kg`
                : '—'
            }
            icon={<CheckCircle2 className="size-5" />}
            tone={
              !freezingHasRecords
                ? 'neutral'
                : freezingWeeklyDifferenceKg100 === 0
                  ? 'success'
                  : 'danger'
            }
            description={
              freezingHasRecords
                ? freezingWeeklyDifferenceKg100 === 0
                  ? 'Físico − vinculado · semana conciliada'
                  : 'Físico − vinculado · requiere revisión'
                : 'Sin registros para verificar la diferencia'
            }
          />
          <MetricCard
            label="Pendiente global de congelamiento"
            value={`${formatCentiKgValue(freezingPendingKg100)} kg`}
            icon={<Gauge className="size-5" />}
            tone="brand"
            description="Todas las semanas · saldo aún disponible"
          />
        </>
      ) : (
        <>
          <MetricCard
            label="Materia Prima Ingresada"
            value={`${formatCentiKgValue(weeklySummary.rawMaterialKg100)} kg`}
            icon={<Scale className="size-5" />}
            tone="brand"
            description={`${registeredDaysCount} de 7 días de la semana`}
          />
          <MetricCard
            label="Producto Terminado"
            value={`${formatCentiKgValue(weeklySummary.declaredFinishedKg100)} kg`}
            icon={<Package className="size-5" />}
            tone="success"
            description="Cajas palletizadas"
          />
          <MetricCard
            label="Rendimiento Global"
            value={
              weeklySummary.performance.percent !== null
                ? `${formatRatioAsPercent(weeklySummary.performance.ratio)}`
                : '—'
            }
            icon={<Gauge className="size-5" />}
            tone={belowReferenceCount === 0 ? 'success' : 'warning'}
            description="Bajo referencia (<80%)"
          />
          <MetricCard
            label="Diferencia de Cuadre"
            value={`${formatCentiKgValue(packingDifferenceKg100)} kg`}
            icon={<CheckCircle2 className="size-5" />}
            tone={packingDifferenceKg100 === 0 ? 'success' : 'danger'}
            description={
              packingDifferenceKg100 === 0
                ? 'Sin merma no justificada'
                : 'Diferencia a conciliar'
            }
          />
          <MetricCard
            label="Saldo en Cámara"
            value={`${formatCentiKgValue(freezingPendingKg100)} kg`}
            icon={<Snowflake className="size-5" />}
            tone="brand"
            description="En proceso de congelación"
          />
        </>
      )}
    </section>
  )
}
