import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  PackageCheck,
  Scale,
  Snowflake,
} from 'lucide-react'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import { calculateFreezingComparison, type FreezingComparisonRow } from '../model/freezing'
import type { ProductionDay, WeeklySummaryPeriod } from '../model/types'
import { describeFreezingReviewReasons } from '../presentation/freezingComparisonReasons'

interface ProductionComparisonViewProps {
  weekNumber: number
  period: WeeklySummaryPeriod
  productionDays: readonly ProductionDay[]
  packingClosed: boolean
  freezingClosed: boolean
  selector: React.ReactNode
}

function ComparisonTable({
  title,
  rows,
}: {
  title: string
  rows: readonly FreezingComparisonRow[]
}) {
  return (
    <SectionCard title={title} description="Envasado = Congelado atribuible + Pendiente + Diferencia no explicada.">
      <DataTableScroll label={title}>
        <table className="erp-table w-full min-w-[56rem] table-fixed border-collapse">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
              <th className="w-[42%] px-4 py-2.5 text-left">{title.includes('familia') ? 'Familia' : 'Producto'}</th>
              <th className="px-3 py-2.5 text-center">Envasado</th>
              <th className="px-3 py-2.5 text-center">Congelado</th>
              <th className="px-3 py-2.5 text-center">Pendiente</th>
              <th className="px-3 py-2.5 text-center">Diferencia</th>
              <th className="px-3 py-2.5 text-center">Exceso vinculado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-800">{row.label}</th>
                <td className="number-tabular px-3 py-3 text-center text-xs">{formatCentiKg(row.packedKg100)}</td>
                <td className="number-tabular px-3 py-3 text-center text-xs">{formatCentiKg(row.frozenKg100)}</td>
                <td className="number-tabular px-3 py-3 text-center text-xs font-semibold text-amber-700">{formatCentiKg(row.pendingKg100)}</td>
                <td className={`number-tabular px-3 py-3 text-center text-xs font-bold ${row.unexplainedDifferenceKg100 === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCentiKg(row.unexplainedDifferenceKg100)}</td>
                <td className={`number-tabular px-3 py-3 text-center text-xs font-bold ${row.linkageExcessKg100 === 0 ? 'text-slate-500' : 'text-rose-700'}`}>{formatCentiKg(row.linkageExcessKg100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableScroll>
    </SectionCard>
  )
}

export function ProductionComparisonView({
  weekNumber,
  period,
  productionDays,
  packingClosed,
  freezingClosed,
  selector,
}: ProductionComparisonViewProps) {
  const comparison = calculateFreezingComparison(productionDays, period)
  const reviewReasons = describeFreezingReviewReasons(comparison)
  const cycleClosed =
    packingClosed && freezingClosed && comparison.status === 'BALANCED'

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reportes · Ciclo productivo"
        title="Envasado vs Congelamiento"
        description={`Semana ${weekNumber} · Comparación por origen productivo, no solamente por fecha física.`}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone={packingClosed ? 'success' : 'info'}>
              ENVASADO {packingClosed ? 'CERRADO' : 'ABIERTO'}
            </StatusBadge>
            <StatusBadge tone={freezingClosed ? 'success' : 'info'}>
              CONGELAMIENTO {freezingClosed ? 'CERRADO' : 'ABIERTO'}
            </StatusBadge>
            <StatusBadge tone={comparison.status === 'BALANCED' ? 'success' : 'danger'}>
              {cycleClosed
                ? 'CICLO CERRADO'
                : comparison.status === 'BALANCED'
                  ? 'CONCILIADO'
                  : 'REVISAR'}
            </StatusBadge>
          </div>
        }
      />
      {selector}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Comparativo entre procesos">
        <MetricCard label="Envasado semanal" value={formatCentiKg(comparison.packedKg100)} icon={<PackageCheck className="size-5" />} tone="brand" />
        <MetricCard label="Congelado atribuible" value={formatCentiKg(comparison.frozenKg100)} icon={<Snowflake className="size-5" />} />
        <MetricCard label="Pendiente de congelar" value={formatCentiKg(comparison.pendingKg100)} icon={<Scale className="size-5" />} tone="warning" />
        <MetricCard label="Diferencia no explicada" value={formatCentiKg(comparison.unexplainedDifferenceKg100)} icon={<CheckCircle2 className="size-5" />} tone={comparison.unexplainedDifferenceKg100 === 0 ? 'success' : 'danger'} />
      </section>
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Conciliación física de Congelamiento">
        <MetricCard label="Congelado físico reportado" value={formatCentiKg(comparison.physicalReportedKg100)} description="Reportes Día/Noche de Congelamiento" icon={<Snowflake className="size-5" />} />
        <MetricCard label="Vinculado a Envasado" value={formatCentiKg(comparison.linkedKg100)} description="Producto congelado con origen trazable" icon={<Link2 className="size-5" />} />
        <MetricCard label="Exceso de vinculación" value={formatCentiKg(comparison.linkageExcessKg100)} description="Vinculado por encima de lo reportado" icon={<AlertTriangle className="size-5" />} tone={comparison.linkageExcessKg100 > 0 ? 'danger' : 'success'} />
      </section>
      {reviewReasons.length > 0 ? (
        <section
          aria-label="Motivos de revisión del comparativo"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900"
        >
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <AlertTriangle className="size-4" aria-hidden="true" />
            El comparativo requiere revisión
          </h2>
          <ul className="mt-2 space-y-1.5 text-xs leading-5">
            {reviewReasons.map(({ reason, title, message }) => (
              <li key={reason}>
                <strong>{title}:</strong> {message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ComparisonTable title="Comparativo por familia" rows={comparison.byFamily} />
      <ComparisonTable title="Comparativo por producto" rows={comparison.byProduct} />
    </div>
  )
}
