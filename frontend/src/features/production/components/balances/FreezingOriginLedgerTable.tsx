import { useMemo } from 'react'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg, formatIsoDate } from '../../../../utils/formatters'
import type { FreezingOriginLedgerRow } from '../../capture/freezingOriginLedger'

export interface FreezingOriginLedgerTableProps {
  readonly freezingOriginLedger: readonly FreezingOriginLedgerRow[]
  readonly prevProcessName?: string
  readonly currentProcessName?: string
}

export function FreezingOriginLedgerTable({
  freezingOriginLedger,
  prevProcessName = 'Envasado',
  currentProcessName = 'Congelamiento',
}: FreezingOriginLedgerTableProps) {
  const currentPastAction =
    currentProcessName === 'Videojet'
      ? 'rotulado'
      : currentProcessName === 'Paletizado'
        ? 'paletizado'
        : 'congelado'

  const freezingOriginLedgerSummary = useMemo(() => {
    const pendingOrigins = freezingOriginLedger.filter(
      (row) => row.pendingKg100 > 0,
    ).length
    const completeOrigins = freezingOriginLedger.filter(
      (row) => row.status === 'COMPLETE',
    ).length
    const excessOrigins = freezingOriginLedger.filter(
      (row) => row.excessKg100 > 0,
    ).length

    return {
      totalOrigins: freezingOriginLedger.length,
      pendingOrigins,
      completeOrigins,
      excessOrigins,
    }
  }, [freezingOriginLedger])

  const generatedHeader =
    currentProcessName === 'Congelamiento'
      ? 'Generado para congelar'
      : `Generado en ${prevProcessName}`

  const accumulatedHeader =
    currentProcessName === 'Congelamiento'
      ? 'Congelado acumulado'
      : `${currentProcessName} acumulado`

  const currentShiftHeader =
    currentProcessName === 'Congelamiento'
      ? 'Congelado en esta jornada'
      : `${currentProcessName} en esta jornada`

  if (freezingOriginLedger.length === 0) {
    return null
  }

  return (
    <div
      role="region"
      aria-label={`Cuenta corriente por jornada origen de ${prevProcessName}`}
      className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-ui-line-dark-grid"
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-ui-line-dark-grid">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-start sm:justify-between dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed/60">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-800 dark:text-ui-text-dark-strong">
              Cuenta corriente por jornada origen
            </p>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-ui-text-dark-soft">
              Cada jornada de {prevProcessName} conserva sus kilos pendientes hasta que
              todo el producto generado quede {currentPastAction} al 100%.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="neutral">
              {freezingOriginLedgerSummary.totalOrigins} JORNADAS
            </StatusBadge>
            {freezingOriginLedgerSummary.pendingOrigins > 0 ? (
              <StatusBadge tone="warning">
                {freezingOriginLedgerSummary.pendingOrigins} CON SALDO
              </StatusBadge>
            ) : null}
            {freezingOriginLedgerSummary.excessOrigins > 0 ? (
              <StatusBadge tone="danger">
                {freezingOriginLedgerSummary.excessOrigins} CON EXCESO
              </StatusBadge>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[70rem] border-collapse text-left"
            aria-label={`Saldo de ${currentProcessName} por jornada origen`}
          >
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-100 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-800 dark:border-ui-line-dark dark:bg-ui-surface-dark-compact dark:text-ui-text-dark-strong">
                <th className="px-4 py-3">Jornada origen</th>
                <th className="px-3 py-3 text-center">Productos</th>
                <th className="px-3 py-3 text-right">{generatedHeader}</th>
                <th className="px-3 py-3 text-right">{accumulatedHeader}</th>
                <th className="px-3 py-3 text-right">{currentShiftHeader}</th>
                <th className="px-3 py-3 text-right">Pendiente</th>
                <th className="px-3 py-3 text-right">Avance</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {freezingOriginLedger.map((row) => (
                <tr
                  key={row.originDayId}
                  className="border-b border-slate-100 bg-white last:border-b-0 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark"
                >
                  <th className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
                      {formatIsoDate(row.originDate)}
                    </p>
                    <p className="mt-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.05em] text-slate-400 dark:text-ui-text-soft">
                      {prevProcessName}
                    </p>
                  </th>
                  <td className="number-tabular px-3 py-3 text-center text-xs font-bold text-slate-700 dark:text-ui-text-dark-pale">
                    {row.productCount}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
                    {formatCentiKg(row.generatedKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
                    {formatCentiKg(row.frozenAccumulatedKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-xs text-brand-700 dark:text-sky-300">
                    {formatCentiKg(row.frozenCurrentKg100)}
                  </td>
                  <td
                    className={`number-tabular px-3 py-3 text-right text-xs font-bold ${
                      row.excessKg100 > 0
                        ? 'text-rose-700 dark:text-rose-300'
                        : row.pendingKg100 > 0
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {row.excessKg100 > 0
                      ? `Exceso ${formatCentiKg(row.excessKg100)}`
                      : formatCentiKg(row.pendingKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-xs font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
                    {row.completionPercent.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge
                      tone={
                        row.status === 'EXCESS'
                          ? 'danger'
                          : row.status === 'COMPLETE'
                            ? 'success'
                            : 'warning'
                      }
                    >
                      {row.status === 'EXCESS'
                        ? 'REVISAR EXCESO'
                        : row.status === 'COMPLETE'
                          ? `${currentPastAction.toUpperCase()} 100%`
                          : 'PENDIENTE'}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
