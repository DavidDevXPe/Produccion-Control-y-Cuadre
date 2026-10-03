import { formatCentiKg } from '../../../../utils/formatters'
import type { Kg100 } from '../../model/types'

export interface FreezingMetricsSummaryProps {
  freezingPreviousOriginsAvailableKg100: Kg100
  freezingCurrentOriginAvailableKg100: Kg100
  freezingTotalAvailableKg100: Kg100
  totalReportedKg100: Kg100
  freezingLinkedThisDayKg100: Kg100
  freezingPendingAfterKg100: Kg100
}

export function FreezingMetricsSummary({
  freezingPreviousOriginsAvailableKg100,
  freezingCurrentOriginAvailableKg100,
  freezingTotalAvailableKg100,
  totalReportedKg100,
  freezingLinkedThisDayKg100,
  freezingPendingAfterKg100,
}: FreezingMetricsSummaryProps) {
  return (
    <dl className="grid gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-6">
      {[
        ['Saldo jornadas anteriores', freezingPreviousOriginsAvailableKg100],
        ['Jornada actual de Envasado', freezingCurrentOriginAvailableKg100],
        ['Total disponible trazable', freezingTotalAvailableKg100],
        ['Congelado reportado', totalReportedKg100],
        ['Vinculado a origen', freezingLinkedThisDayKg100],
        ['Pendiente por congelar', freezingPendingAfterKg100],
      ].map(([label, value]) => (
        <div key={String(label)} className="bg-white px-4 py-3 text-center">
          <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            {String(label)}
          </dt>
          <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-extrabold text-slate-950">
            {formatCentiKg(value as Kg100)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
