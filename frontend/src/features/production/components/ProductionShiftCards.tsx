import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatCentiKgValue } from '../../../utils/formatters'
import { kg100 } from '../model/calculations'
import type { ShiftCalculation } from '../model/types'

export interface ProductionShiftCardsProps {
  readonly dayShift: ShiftCalculation
  readonly nightShift: ShiftCalculation
  readonly dayHasReportData: boolean
  readonly nightHasReportData: boolean
  readonly className?: string
}

export function ProductionShiftCards({
  dayShift,
  nightShift,
  dayHasReportData,
  nightHasReportData,
  className = '',
}: ProductionShiftCardsProps) {
  const shifts = [
    {
      label: 'Día',
      shift: dayShift,
      hasShiftData: dayHasReportData,
      schedule: '(07:00 – 19:00)',
      dotColor: 'bg-amber-400',
    },
    {
      label: 'Noche',
      shift: nightShift,
      hasShiftData: nightHasReportData,
      schedule: '(19:00 – 07:00)',
      dotColor: 'bg-sky-500 dark:bg-sky-400',
    },
  ] as const

  return (
    <div
      className={`grid gap-3 border-b border-slate-200 bg-slate-50/55 p-4 sm:grid-cols-2 sm:p-5 ${className}`.trim()}
    >
      {shifts.map(({ label, shift, hasShiftData, schedule, dotColor }) => {
        const isSquared = shift.detailDifferenceKg100 === 0
        const isExceeded = shift.detailDifferenceKg100 < 0
        const hasReport = hasShiftData && shift.declaredReportedKg100 > 0

        const progressPercent = hasReport
          ? (shift.reportedKg100 / shift.declaredReportedKg100) * 100
          : 0
        const clampedPercent = Math.min(100, Math.max(0, progressPercent))

        const rightText = isSquared
          ? 'Cuadrado'
          : isExceeded
            ? `Excede ${formatCentiKg(kg100(-shift.detailDifferenceKg100))}`
            : `Faltan ${formatCentiKg(shift.detailDifferenceKg100)} por registrar en Turno ${label}.`

        return (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-200 dark:bg-slate-100/60 dark:shadow-none"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block size-2 rounded-full shadow-xs ${dotColor}`}
                  aria-hidden="true"
                />
                <h3 className="text-sm font-bold text-slate-950 dark:text-ui-text-dark-strong">
                  Turno {label}
                </h3>
                <span className="text-xs font-normal text-slate-500 dark:text-ui-text-dark-soft">
                  {schedule}
                </span>
              </div>
              <StatusBadge
                tone={hasShiftData && isSquared ? 'success' : 'warning'}
              >
                {hasShiftData && isSquared ? 'CONCILIADO' : 'PENDIENTE'}
              </StatusBadge>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-slate-100 py-3 text-xs dark:border-slate-200">
              <div>
                <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-slate-500 dark:text-ui-text-dark-soft">
                  Reporte supervisor
                </dt>
                <dd className="number-tabular mt-1 text-base sm:text-lg font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
                  {hasShiftData ? (
                    <>
                      <span>{formatCentiKgValue(shift.declaredReportedKg100)}</span>
                      <span className="ml-1 text-[0.6875rem] font-normal text-slate-400 dark:text-ui-text-subtle">
                        kg
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-slate-500 dark:text-ui-text-dark-soft">
                  Productos registrados
                </dt>
                <dd className="number-tabular mt-1 text-base sm:text-lg font-extrabold text-brand-600 dark:text-sky-400">
                  {hasShiftData ? (
                    <>
                      <span>{formatCentiKgValue(shift.reportedKg100)}</span>
                      <span className="ml-1 text-[0.6875rem] font-normal text-slate-400 dark:text-ui-text-subtle">
                        kg
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-slate-500 dark:text-ui-text-dark-soft">
                  Diferencia
                </dt>
                <dd
                  className={`number-tabular mt-1 text-base sm:text-lg font-extrabold ${
                    !hasShiftData
                      ? 'text-slate-400 dark:text-ui-text-subtle'
                      : isSquared
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isExceeded
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {hasShiftData ? (
                    <>
                      <span>
                        {isExceeded
                          ? `- ${formatCentiKgValue(-shift.detailDifferenceKg100)}`
                          : formatCentiKgValue(shift.detailDifferenceKg100)}
                      </span>
                      <span className="ml-1 text-[0.6875rem] font-normal text-slate-400 dark:text-ui-text-subtle">
                        kg
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>

            {!hasShiftData || shift.declaredReportedKg100 === 0 ? (
              <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-ui-text-dark-soft">
                Completa el reporte del Turno {label}.
              </p>
            ) : (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="text-slate-600 dark:text-ui-text-dark">
                    Avance de registro:{' '}
                    <span className="number-tabular font-bold text-slate-900 dark:text-ui-text-dark-strong">
                      {progressPercent.toFixed(1)}%
                    </span>
                  </span>
                  <span
                    className={`number-tabular font-semibold ${
                      isSquared
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isExceeded
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {rightText}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={Math.round(clampedPercent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Avance de registro Turno ${label}`}
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-50 dark:ring-1 dark:ring-slate-200/50"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isSquared
                        ? 'bg-emerald-500'
                        : isExceeded
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-r from-sky-500 to-amber-500 dark:from-sky-500 dark:to-amber-400'
                    }`}
                    style={{ width: `${clampedPercent}%` }}
                  />
                </div>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

