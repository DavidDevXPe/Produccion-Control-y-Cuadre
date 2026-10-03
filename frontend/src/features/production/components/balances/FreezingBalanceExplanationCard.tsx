import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg, formatIsoDate } from '../../../../utils/formatters'
import type { Kg100 } from '../../model/types'
import type { FreezingBalanceExplanation } from './balanceTypes'

export interface FreezingBalanceExplanationCardProps {
  freezingTotalAvailableKg100: Kg100
  totalReportedKg100: Kg100
  freezingBalanceExplanation: FreezingBalanceExplanation
  freezingPendingAfterKg100: Kg100
  freezingLinkedThisDayKg100: Kg100
}

export function FreezingBalanceExplanationCard({
  freezingTotalAvailableKg100,
  totalReportedKg100,
  freezingBalanceExplanation,
  freezingPendingAfterKg100,
  freezingLinkedThisDayKg100,
}: FreezingBalanceExplanationCardProps) {
  return (
    <div
      role="region"
      aria-label="Explicación del saldo de Congelamiento"
      className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-ui-line-dark-grid"
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed/60">
        <div className="border-b border-slate-200 px-4 py-4 dark:border-ui-line-dark-grid">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.07em] text-slate-800 dark:text-ui-text-dark-strong">
                ¿De dónde sale el saldo?
              </p>
              <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500 dark:text-ui-text-dark-soft">
                El saldo pendiente no representa necesariamente un error. Parte
                corresponde a producto que comenzó a congelarse y todavía queda
                disponible, y otra parte a producto envasado que aún no tuvo
                movimiento de Congelamiento.
              </p>
            </div>
            <StatusBadge
              tone={
                freezingBalanceExplanation.untracedFrozenKg100 > 0
                  ? 'warning'
                  : 'success'
              }
            >
              {freezingBalanceExplanation.untracedFrozenKg100 > 0
                ? 'CON OBSERVACIÓN'
                : 'EXPLICADO'}
            </StatusBadge>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-3 dark:bg-ui-line-dark-grid">
          <div className="bg-white px-4 py-3 dark:bg-ui-surface-dark">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
              Envasado disponible
            </p>
            <p className="number-tabular mt-1 text-base font-extrabold text-slate-950 dark:text-ui-text-dark-strong">
              {formatCentiKg(freezingTotalAvailableKg100)}
            </p>
          </div>

          <div className="bg-white px-4 py-3 dark:bg-ui-surface-dark">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
              Congelado físicamente
            </p>
            <p className="number-tabular mt-1 text-base font-extrabold text-slate-950 dark:text-ui-text-dark-strong">
              {formatCentiKg(totalReportedKg100)}
            </p>
          </div>

          <div className="bg-white px-4 py-3 dark:bg-ui-surface-dark">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
              Diferencia física
            </p>
            <p className="number-tabular mt-1 text-base font-extrabold text-amber-700 dark:text-amber-300">
              {formatCentiKg(freezingBalanceExplanation.physicalDifferenceKg100)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark">
            <p className="text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
              Cómo se compone el saldo trazable
            </p>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500 dark:text-ui-text-dark-soft">
                  Pendiente en productos que sí tuvieron movimiento
                </dt>
                <dd className="number-tabular font-bold text-amber-700 dark:text-amber-300">
                  {formatCentiKg(freezingBalanceExplanation.pendingInSelectedKg100)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500 dark:text-ui-text-dark-soft">
                  Producto todavía no utilizado
                </dt>
                <dd className="number-tabular font-bold text-amber-700 dark:text-amber-300">
                  {formatCentiKg(freezingBalanceExplanation.untouchedKg100)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2 dark:border-ui-line-dark-grid">
                <dt className="font-bold text-slate-800 dark:text-ui-text-dark-strong">
                  Saldo trazable para jornadas siguientes
                </dt>
                <dd className="number-tabular font-extrabold text-slate-950 dark:text-ui-text-dark-strong">
                  {formatCentiKg(freezingPendingAfterKg100)}
                </dd>
              </div>
            </dl>

            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[0.6875rem] leading-5 text-slate-600 dark:bg-ui-surface-dark-recessed dark:text-ui-text-dark-soft">
              {formatCentiKg(freezingBalanceExplanation.pendingInSelectedKg100)}{' '}
              + {formatCentiKg(freezingBalanceExplanation.untouchedKg100)} ={' '}
              <strong>{formatCentiKg(freezingPendingAfterKg100)}</strong>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark">
            <p className="text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
              Diferencia frente al congelado físico
            </p>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500 dark:text-ui-text-dark-soft">
                  Congelado con origen identificado
                </dt>
                <dd className="number-tabular font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCentiKg(freezingLinkedThisDayKg100)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500 dark:text-ui-text-dark-soft">
                  Congelado sin origen suficiente
                </dt>
                <dd
                  className={`number-tabular font-bold ${
                    freezingBalanceExplanation.untracedFrozenKg100 > 0
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {formatCentiKg(freezingBalanceExplanation.untracedFrozenKg100)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2 dark:border-ui-line-dark-grid">
                <dt className="font-bold text-slate-800 dark:text-ui-text-dark-strong">
                  Diferencia física Envasado vs Congelado
                </dt>
                <dd className="number-tabular font-extrabold text-amber-700 dark:text-amber-300">
                  {formatCentiKg(freezingBalanceExplanation.physicalDifferenceKg100)}
                </dd>
              </div>
            </dl>

            {freezingBalanceExplanation.untracedFrozenKg100 > 0 ? (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[0.6875rem] font-semibold leading-5 text-amber-900 dark:border-ui-amber-border-dark-soft dark:bg-ui-amber-surface-dark dark:text-ui-amber-text-dark-bright">
                Hay producto congelado cuya presentación u origen no alcanza a
                justificarse completamente. La jornada puede cerrarse con
                observación y la diferencia quedará registrada para revisión.
              </div>
            ) : null}
          </div>
        </div>

        {freezingBalanceExplanation.untouchedPositions.length > 0 ? (
          <div className="border-t border-slate-200 px-4 py-3 dark:border-ui-line-dark-grid">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-600 dark:text-ui-text-dark-soft">
              Producto disponible que todavía no fue utilizado
            </p>
            <div className="mt-2 grid gap-2 lg:grid-cols-2">
              {freezingBalanceExplanation.untouchedPositions.map((position) => (
                <div
                  key={`${position.originDayId}-${position.productId}`}
                  className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.6875rem] font-bold text-slate-800 dark:text-ui-text-dark-strong">
                      {position.productName}
                    </p>
                    <p className="mt-0.5 text-[0.625rem] text-slate-400 dark:text-ui-text-soft">
                      Origen {formatIsoDate(position.originDate)}
                    </p>
                  </div>
                  <span className="number-tabular shrink-0 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                    {formatCentiKg(position.pendingKg100)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
