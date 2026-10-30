import { Snowflake, Waves } from 'lucide-react'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import { kg100 } from '../model/calculations'

export interface FreezingProductTotal {
  readonly familyName: string
  readonly productName: string
  readonly dayKg100: number
  readonly nightKg100: number
}

export interface FreezingSummaryMetricsProps {
  readonly weeklyAvailableKg100: number
  readonly physicalKg100: number
  readonly linkedKg100: number
  readonly differenceKg100: number
  readonly pendingKg100: number
  readonly hasFreezingRecords: boolean
}

function getTraceabilityTone(
  hasFreezingRecords: boolean,
  differenceKg100: number,
) {
  if (!hasFreezingRecords) return 'neutral' as const
  return differenceKg100 === 0 ? ('success' as const) : ('danger' as const)
}

function getTraceabilityDescription(
  hasFreezingRecords: boolean,
  differenceKg100: number,
) {
  if (!hasFreezingRecords) {
    return 'Sin registros para verificar la diferencia'
  }
  return differenceKg100 === 0
    ? 'Físico − vinculado · semana conciliada'
    : 'Físico − vinculado · requiere revisión'
}

export function FreezingSummaryMetrics({
  weeklyAvailableKg100,
  physicalKg100,
  linkedKg100,
  differenceKg100,
  pendingKg100,
  hasFreezingRecords,
}: FreezingSummaryMetricsProps) {
  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Indicadores de Congelamiento"
    >
      <MetricCard
        label="Disponible de Envasado"
        value={formatCentiKg(weeklyAvailableKg100)}
        icon={<Snowflake className="size-5" />}
        tone="brand"
        description="Semana seleccionada · pendiente real"
      />
      <MetricCard
        label="Congelado físicamente"
        value={formatCentiKg(physicalKg100)}
        icon={<Snowflake className="size-5" />}
        tone="success"
        description={
          hasFreezingRecords
            ? 'Reportes físicos de la semana'
            : 'Sin registros de congelamiento esta semana'
        }
      />
      <MetricCard
        label="Vinculado por trazabilidad"
        value={formatCentiKg(linkedKg100)}
        icon={<Waves className="size-5" />}
        tone="success"
        description="Consumos FIFO realizados esta semana"
      />
      <MetricCard
        label="Diferencia de trazabilidad semanal"
        value={hasFreezingRecords ? formatCentiKg(differenceKg100) : '—'}
        icon={<Waves className="size-5" />}
        tone={getTraceabilityTone(hasFreezingRecords, differenceKg100)}
        description={getTraceabilityDescription(
          hasFreezingRecords,
          differenceKg100,
        )}
      />
      <MetricCard
        label="Pendiente global de congelamiento"
        value={formatCentiKg(pendingKg100)}
        icon={<Waves className="size-5" />}
        tone="warning"
        description="Todas las semanas"
      />
    </section>
  )
}

export interface FreezingComparisonSectionProps {
  readonly physicalKg100: number
  readonly linkedKg100: number
  readonly differenceKg100: number
  readonly hasFreezingRecords: boolean
}

export function FreezingComparisonSection({
  physicalKg100,
  linkedKg100,
  differenceKg100,
  hasFreezingRecords,
}: FreezingComparisonSectionProps) {
  const statusLabel = !hasFreezingRecords
    ? 'SIN REGISTROS'
    : differenceKg100 === 0
      ? 'CUADRADO'
      : 'REVISAR'

  return (
    <SectionCard
      title="Cuadre de Congelamiento"
      description="El total físico debe estar completamente vinculado con disponibilidad originada en Envasado."
      action={
        <StatusBadge tone={getTraceabilityTone(hasFreezingRecords, differenceKg100)}>
          {statusLabel}
        </StatusBadge>
      }
    >
      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
        <MetricCard
          label="Congelado físicamente"
          value={formatCentiKg(physicalKg100)}
        />
        <MetricCard
          label="Congelado atribuible"
          value={formatCentiKg(linkedKg100)}
        />
        <MetricCard
          label="Diferencia"
          value={hasFreezingRecords ? formatCentiKg(differenceKg100) : '—'}
          tone={getTraceabilityTone(hasFreezingRecords, differenceKg100)}
          description={
            hasFreezingRecords
              ? undefined
              : 'Sin registros para verificar la diferencia'
          }
        />
      </div>
    </SectionCard>
  )
}

export function FreezingProductTotalsSection({
  productTotals,
}: {
  readonly productTotals: ReadonlyMap<string, FreezingProductTotal>
}) {
  return (
    <SectionCard
      title="Congelado por producto"
      description="Consolidado físico por producto y turno."
    >
      {productTotals.size === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          Sin registros de congelamiento esta semana.
        </p>
      ) : (
        <DataTableScroll label="Congelado semanal por producto">
          <table className="erp-table w-full min-w-[48rem] table-fixed border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
                <th className="w-[52%] px-4 py-2.5 text-left">
                  Familia / producto
                </th>
                <th className="w-[16%] px-3 py-2.5 text-center">Día</th>
                <th className="w-[16%] px-3 py-2.5 text-center">Noche</th>
                <th className="w-[16%] px-3 py-2.5 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...productTotals.entries()].map(([productId, product]) => (
                <tr key={productId} className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left">
                    <span className="block text-[0.625rem] font-bold uppercase text-sky-700">
                      {product.familyName}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-800">
                      {product.productName}
                    </span>
                  </th>
                  <td className="number-tabular px-3 py-3 text-center text-xs">
                    {formatCentiKg(kg100(product.dayKg100))}
                  </td>
                  <td className="number-tabular px-3 py-3 text-center text-xs">
                    {formatCentiKg(kg100(product.nightKg100))}
                  </td>
                  <td className="number-tabular px-3 py-3 text-center text-xs font-bold">
                    {formatCentiKg(kg100(product.dayKg100 + product.nightKg100))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableScroll>
      )}
    </SectionCard>
  )
}
