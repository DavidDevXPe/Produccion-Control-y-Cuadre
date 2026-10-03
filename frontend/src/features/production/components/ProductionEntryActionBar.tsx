import { AlertTriangle, CheckCircle2, Save } from 'lucide-react'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { formatCentiKg } from '../../../utils/formatters'
import { kg100 } from '../model/calculations'
import type { Kg100 } from '../model/types'

export interface ShiftSummaryData {
  reportedKg100: Kg100
  declaredReportedKg100: Kg100
  detailDifferenceKg100: Kg100
}

export interface ProductionEntryActionBarProps {
  canClose: boolean
  footerStatus: {
    title: string
    description: string
  }
  pendingClosureReasons: readonly string[]
  dayShift: ShiftSummaryData
  nightShift: ShiftSummaryData
  dayHasReportData: boolean
  nightHasReportData: boolean
  onSaveDraft: () => void
  onCloseDay: () => void
}

export function ProductionEntryActionBar({
  canClose,
  footerStatus,
  pendingClosureReasons,
  dayShift,
  nightShift,
  dayHasReportData,
  nightHasReportData,
  onSaveDraft,
  onCloseDay,
}: ProductionEntryActionBarProps) {
  const shifts = [
    { label: 'Día' as const, shift: dayShift, hasData: dayHasReportData },
    { label: 'Noche' as const, shift: nightShift, hasData: nightHasReportData },
  ]

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 py-2.5 sm:py-3 shadow-[0_-8px_30px_rgb(15_23_42/0.08)] backdrop-blur dark:border-ui-line-dark dark:bg-ui-surface-dark-deep xl:left-64 xl:h-[var(--sidebar-footer-height)] xl:py-0">
      <div className="mx-auto flex w-full max-w-[92.5rem] flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 lg:px-6 xl:h-full xl:px-7 2xl:px-8">
        <div
          className="flex items-center gap-2.5 min-w-0"
          role="status"
          aria-live="polite"
        >
          {canClose ? (
            <CheckCircle2
              className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          ) : (
            <AlertTriangle
              className="size-5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
                {footerStatus.title}
              </p>
              <div
                className="inline-flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Resumen de cuadre por turno"
              >
                {shifts.map(({ label, shift, hasData }) => {
                  const isReconciled =
                    hasData && shift.detailDifferenceKg100 === 0
                  const registeredText = formatCentiKg(shift.reportedKg100)
                  const reportedText = hasData
                    ? formatCentiKg(shift.declaredReportedKg100)
                    : '—'
                  const diff = shift.detailDifferenceKg100
                  const diffText = hasData ? formatCentiKg(diff) : '—'

                  return (
                    <div
                      key={label}
                      data-testid={`sticky-shift-chip-${label.toLowerCase()}`}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-medium transition-colors ${
                        isReconciled
                          ? 'border-emerald-200/90 bg-emerald-50/50 text-slate-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'border-slate-300/80 bg-white text-slate-800 shadow-2xs dark:border-ui-line-navy dark:bg-ui-surface-dark-compact dark:text-ui-text-dark-pale'
                      }`}
                      title={`Turno ${label}: Registrado ${registeredText} / Reporte ${reportedText} · Diferencia ${diffText}`}
                    >
                      <span
                        className={`inline-block size-1.5 rounded-full ${
                          isReconciled ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="font-bold text-slate-900 dark:text-ui-text-dark-strong">
                        Turno {label}:
                      </span>
                      <span className="number-tabular">
                        {registeredText} / {reportedText}
                      </span>
                      <span
                        className="text-slate-300 dark:text-ui-text-subtle"
                        aria-hidden="true"
                      >
                        ·
                      </span>
                      <span className="text-slate-500 dark:text-ui-text-dark-soft">
                        Dif.
                      </span>
                      <span
                        className={`number-tabular font-bold ${
                          isReconciled
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {diffText}
                      </span>
                      {hasData && diff !== 0 ? (
                        <span className="sr-only">
                          {`Turno ${label}: ${
                            diff > 0
                              ? `faltan ${formatCentiKg(diff)}`
                              : `excede ${formatCentiKg(kg100(-diff))}`
                          }`}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
              {pendingClosureReasons.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('pendientes-para-cerrar')
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    el?.focus()
                  }}
                  className="text-xs font-bold text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  Ver pendientes ({pendingClosureReasons.length})
                </button>
              ) : null}
            </div>
            <p className="text-[0.6875rem] text-slate-500 dark:text-ui-text-dark-soft">
              {footerStatus.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSaveDraft}
            className={`${buttonStyles('secondary')} flex-1 sm:flex-none whitespace-nowrap`}
          >
            <Save className="size-4 shrink-0" aria-hidden="true" />
            Guardar borrador
          </button>
          <button
            type="button"
            disabled={!canClose}
            onClick={onCloseDay}
            className={`${buttonStyles('primary')} flex-1 sm:flex-none whitespace-nowrap`}
          >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            Cerrar jornada
          </button>
        </div>
      </div>
    </div>
  )
}
