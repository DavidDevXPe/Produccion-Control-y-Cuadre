import { CheckCircle2, Gauge, Package, Scale, Snowflake } from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { formatCentiKgValue, formatRatioAsPercent } from '../../../utils/formatters'
import type { calculateWeeklySummary, kg100 } from '../model/calculations'

export interface FreezingMetricCardsProps {
  readonly freezingWeeklyAvailableKg100: ReturnType<typeof kg100>
  readonly freezingWeeklyPhysicalKg100: ReturnType<typeof kg100>
  readonly freezingWeeklyLinkedKg100: ReturnType<typeof kg100>
  readonly freezingWeeklyDifferenceKg100: ReturnType<typeof kg100>
  readonly freezingHasRecords: boolean
  readonly freezingPendingKg100: ReturnType<typeof kg100>
}

export function FreezingMetricCards({
  freezingWeeklyAvailableKg100,
  freezingWeeklyPhysicalKg100,
  freezingWeeklyLinkedKg100,
  freezingWeeklyDifferenceKg100,
  freezingHasRecords,
  freezingPendingKg100,
}: FreezingMetricCardsProps) {
  const traceabilityTone = !freezingHasRecords
    ? 'neutral'
    : freezingWeeklyDifferenceKg100 === 0
      ? 'success'
      : 'danger'
  const traceabilityValue = freezingHasRecords
    ? `${formatCentiKgValue(freezingWeeklyDifferenceKg100)} kg`
    : '—'
  const traceabilityDescription = !freezingHasRecords
    ? 'Sin registros para verificar la diferencia'
    : freezingWeeklyDifferenceKg100 === 0
      ? 'Físico − vinculado · semana conciliada'
      : 'Físico − vinculado · requiere revisión'

  return (
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
        value={traceabilityValue}
        icon={<CheckCircle2 className="size-5" />}
        tone={traceabilityTone}
        description={traceabilityDescription}
      />
      <MetricCard
        label="Pendiente global de congelamiento"
        value={`${formatCentiKgValue(freezingPendingKg100)} kg`}
        icon={<Gauge className="size-5" />}
        tone="brand"
        description="Todas las semanas · saldo aún disponible"
      />
    </>
  )
}

export interface PackingMetricCardsProps {
  readonly weeklySummary: ReturnType<typeof calculateWeeklySummary>
  readonly registeredDaysCount: number
  readonly belowReferenceCount: number
  readonly freezingPendingKg100: ReturnType<typeof kg100>
}

export function PackingMetricCards({
  weeklySummary,
  registeredDaysCount,
  belowReferenceCount,
  freezingPendingKg100,
}: PackingMetricCardsProps) {
  const packingDifferenceKg100 = weeklySummary.differenceKg100
  const performanceValue =
    weeklySummary.performance.percent !== null
      ? formatRatioAsPercent(weeklySummary.performance.ratio)
      : '—'
  const differenceDescription =
    packingDifferenceKg100 === 0
      ? 'Sin merma no justificada'
      : 'Diferencia a conciliar'

  return (
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
        value={performanceValue}
        icon={<Gauge className="size-5" />}
        tone={belowReferenceCount === 0 ? 'success' : 'warning'}
        description="Bajo referencia (<80%)"
      />
      <MetricCard
        label="Diferencia de Cuadre"
        value={`${formatCentiKgValue(packingDifferenceKg100)} kg`}
        icon={<CheckCircle2 className="size-5" />}
        tone={packingDifferenceKg100 === 0 ? 'success' : 'danger'}
        description={differenceDescription}
      />
      <MetricCard
        label="Saldo en Cámara"
        value={`${formatCentiKgValue(freezingPendingKg100)} kg`}
        icon={<Snowflake className="size-5" />}
        tone="brand"
        description="En proceso de congelación"
      />
    </>
  )
}
