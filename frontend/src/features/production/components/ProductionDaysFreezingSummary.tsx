import { formatCentiKgValue } from '../../../utils/formatters'
import type { kg100 } from '../model/calculations'

export interface ProductionDaysFreezingSummaryProps {
  frozenPhysicalKg100: ReturnType<typeof kg100>
  freezingLinkedKg100: ReturnType<typeof kg100>
  freezingDifferenceKg100: ReturnType<typeof kg100>
  freezingPendingKg100: ReturnType<typeof kg100>
}

export function ProductionDaysFreezingSummary({
  frozenPhysicalKg100,
  freezingLinkedKg100,
  freezingDifferenceKg100,
  freezingPendingKg100,
}: ProductionDaysFreezingSummaryProps) {
  return (
    <section
      aria-labelledby="freezing-summary-title"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel"
    >
      <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-3.5">
        <h2
          id="freezing-summary-title"
          className="text-sm font-bold text-slate-950"
        >
          Resumen de congelamiento
        </h2>
        <p className="text-xs leading-5 text-slate-500">
          Estado físico y trazable de lo congelado en la semana seleccionada.
        </p>
      </div>

      <dl className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        <div className="px-5 py-3.5 text-center">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            Congelado esta semana
          </dt>
          <dd className="number-tabular mt-1.5 text-xl font-extrabold text-slate-950">
            {formatCentiKgValue(frozenPhysicalKg100)}
            <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
          </dd>
        </div>

        <div className="px-5 py-3.5 text-center">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            Vinculado
          </dt>
          <dd className="number-tabular mt-1.5 text-xl font-extrabold text-slate-950">
            {formatCentiKgValue(freezingLinkedKg100)}
            <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
          </dd>
        </div>

        <div className="px-5 py-3.5 text-center">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            Dif. trazabilidad
          </dt>
          <dd
            className={`number-tabular mt-1.5 text-xl font-extrabold ${
              freezingDifferenceKg100 === 0
                ? 'text-emerald-700'
                : freezingDifferenceKg100 > 0
                  ? 'text-amber-700'
                  : 'text-rose-700'
            }`}
          >
            {formatCentiKgValue(freezingDifferenceKg100)}
            <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
          </dd>
          {freezingDifferenceKg100 < 0 ? (
            <p className="mt-1 text-[0.625rem] font-semibold text-rose-700">
              Vinculado por encima de lo reportado
            </p>
          ) : null}
        </div>

        <div className="px-5 py-3.5 text-center">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            Pendiente trazable acumulado
          </dt>
          <dd className="number-tabular mt-1.5 text-xl font-extrabold text-brand-800">
            {formatCentiKgValue(freezingPendingKg100)}
            <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
          </dd>
          <p className="mt-1 text-[0.625rem] text-slate-500">
            Disponible pendiente al cierre del período
          </p>
        </div>
      </dl>
    </section>
  )
}

