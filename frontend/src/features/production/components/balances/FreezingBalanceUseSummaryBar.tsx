import { AlertTriangle, ChevronDown } from 'lucide-react'
import { formatCentiKg } from '../../../../utils/formatters'
import type { FreezingBalanceUseSummary } from './balanceTypes'

export interface FreezingBalanceUseSummaryBarProps {
  readonly summary: FreezingBalanceUseSummary
  readonly isOpen: boolean
  readonly onToggle: () => void
}

export function FreezingBalanceUseSummaryBar({
  summary,
  isOpen,
  onToggle,
}: FreezingBalanceUseSummaryBarProps) {
  return (
    <div className="border-b border-slate-200 bg-slate-50/55 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed/45">
      <dl className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4 dark:bg-ui-line-dark-grid">
        <div className="bg-white px-4 py-3 text-center dark:bg-ui-surface-dark">
          <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
            Orígenes vinculados
          </dt>
          <dd className="mt-1 text-base font-extrabold text-slate-950 dark:text-ui-text-dark-strong">
            {summary.originCount}
          </dd>
        </div>

        <div className="bg-white px-4 py-3 text-center dark:bg-ui-surface-dark">
          <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
            Disponible vinculado
          </dt>
          <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-extrabold text-slate-950 dark:text-ui-text-dark-strong">
            {formatCentiKg(summary.availableKg100)}
          </dd>
        </div>

        <div className="bg-white px-4 py-3 text-center dark:bg-ui-surface-dark">
          <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
            Total utilizado
          </dt>
          <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-extrabold text-sky-700 dark:text-sky-300">
            {formatCentiKg(summary.usedKg100)}
          </dd>
        </div>

        <div className="bg-white px-4 py-3 text-center dark:bg-ui-surface-dark">
          <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
            Saldo restante
          </dt>
          <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-extrabold text-amber-700 dark:text-amber-300">
            {formatCentiKg(summary.remainingKg100)}
          </dd>
        </div>
      </dl>

      <div className="px-4 py-3 sm:px-5">
        {summary.reviewCount > 0 ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/[0.08] dark:text-amber-200"
          >
            <AlertTriangle
              className="size-4 shrink-0"
              aria-hidden="true"
            />
            El detalle permanece abierto porque {summary.reviewCount}{' '}
            {summary.reviewCount === 1 ? 'origen requiere' : 'orígenes requieren'} revisión.
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className="flex w-full items-center justify-between gap-4 rounded-lg px-2 py-2 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:hover:bg-ui-surface-dark"
          >
            <span className="min-w-0">
              <span className="block text-xs font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
                Detalle de orígenes vinculados
              </span>
              <span className="mt-0.5 block text-[0.6875rem] leading-5 text-slate-500 dark:text-ui-text-dark-soft">
                Revisa el consumo Día/Noche y el saldo restante de cada jornada origen.
              </span>
            </span>

            <span className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-brand-700 dark:text-sky-300">
              {isOpen ? 'Ocultar detalle' : 'Ver detalle'}
              <ChevronDown
                className={`size-4 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
