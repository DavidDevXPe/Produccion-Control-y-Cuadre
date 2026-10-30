import { formatCentiKgValue } from '../../../utils/formatters'
import type { kg100 } from '../model/calculations'

export interface ProductionDaysFreezingSummaryProps {
  freezingWeeklyAvailableKg100: ReturnType<typeof kg100>
  freezingWeeklyPhysicalKg100: ReturnType<typeof kg100>
  freezingWeeklyLinkedKg100: ReturnType<typeof kg100>
  freezingWeeklyDifferenceKg100: ReturnType<typeof kg100>
  freezingHasRecords: boolean
  freezingPendingKg100: ReturnType<typeof kg100>
}

export function ProductionDaysFreezingSummary({
  freezingWeeklyAvailableKg100,
  freezingWeeklyPhysicalKg100,
  freezingWeeklyLinkedKg100,
  freezingWeeklyDifferenceKg100,
  freezingHasRecords,
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
          Indicadores semanales y pendiente global de trazabilidad.
        </p>
      </div>

      <dl className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        <div className="px-5 py-3.5 text-center">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            Disponible de Envasado
          </dt>
          <dd className="number-tabular mt-1.5 text-xl font-extrabold text-slate-950">
            {formatCentiKgValue(freezingWeeklyAvailableKg100)}
            <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
          </dd>
          <p className="mt-1 text-[0.625rem] text-slate-500">
            Semana seleccionada · pendiente real
          </p>
        </div>

        <div className="px-5 py-3.5 text-center">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            Congelado físicamente
          </dt>
          <dd className="number-tabular mt-1.5 text-xl font-extrabold text-slate-950">
            {formatCentiKgValue(freezingWeeklyPhysicalKg100)}
            <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
          </dd>
          <p className="mt-1 text-[0.625rem] text-slate-500">
            Esta semana
          </p>
        </div>

        <div className="px-5 py-3.5 text-center">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            Vinculado por trazabilidad
          </dt>
          <dd className="number-tabular mt-1.5 text-xl font-extrabold text-slate-950">
            {formatCentiKgValue(freezingWeeklyLinkedKg100)}
            <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
          </dd>
          <p className="mt-1 text-[0.625rem] text-slate-500">
            Consumos FIFO de esta semana
          </p>
        </div>

        <div className="px-5 py-3.5 text-center">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            Diferencia de trazabilidad semanal
          </dt>
          <dd
            className={`number-tabular mt-1.5 text-xl font-extrabold ${
              !freezingHasRecords
                ? 'text-slate-500'
                : freezingWeeklyDifferenceKg100 === 0
                  ? 'text-emerald-700'
                  : freezingWeeklyDifferenceKg100 > 0
                    ? 'text-amber-700'
                    : 'text-rose-700'
            }`}
          >
            {freezingHasRecords
              ? formatCentiKgValue(freezingWeeklyDifferenceKg100)
              : '—'}
            {freezingHasRecords ? (
              <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
            ) : null}
          </dd>
          <p
            className={`mt-1 text-[0.625rem] ${
              freezingHasRecords && freezingWeeklyDifferenceKg100 < 0
                ? 'font-semibold text-rose-700'
                : 'text-slate-500'
            }`}
          >
            {!freezingHasRecords
              ? 'Sin registros para verificar'
              : freezingWeeklyDifferenceKg100 < 0
                ? 'Vinculado por encima de lo reportado'
                : 'Físico − vinculado'}
          </p>
        </div>

        <div className="bg-slate-50 px-5 py-3.5 text-center">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            Pendiente global de congelamiento
          </dt>
          <dd className="number-tabular mt-1.5 text-xl font-extrabold text-brand-800">
            {formatCentiKgValue(freezingPendingKg100)}
            <span className="ml-1 text-xs font-semibold text-slate-500">kg</span>
          </dd>
          <p className="mt-1 text-[0.625rem] text-slate-500">
            Todas las semanas
          </p>
        </div>
      </dl>
    </section>
  )
}
