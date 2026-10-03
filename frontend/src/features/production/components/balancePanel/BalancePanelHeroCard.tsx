import { AlertTriangle, Boxes, Clock3 } from 'lucide-react'
import { formatCentiKg, formatIsoDate } from '../../../../utils/formatters'
import type { Kg100 } from '../../model/types'
import { balanceTimelineHelp } from './balancePanelTypes'

export interface BalancePanelHeroCardProps {
  readonly isOutstandingView: boolean
  readonly originDate: string
  readonly total: Kg100
  readonly totalExcess: Kg100
  readonly balanceStatusLabel: string
}

export function BalancePanelHeroCard({
  isOutstandingView,
  originDate,
  total,
  totalExcess,
  balanceStatusLabel,
}: BalancePanelHeroCardProps) {
  return (
    <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-brand-100 text-brand-800">
            <Boxes className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-slate-500">
              {isOutstandingView ? 'Pendiente desde' : 'Saldo generado al cierre ·'}{' '}
              {formatIsoDate(originDate)}
            </p>
            <p className="number-tabular mt-1 whitespace-nowrap text-[1.75rem] font-bold leading-none text-slate-950">
              {formatCentiKg(total)}
            </p>
          </div>
        </div>
        {totalExcess > 0 ? (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800"
          >
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {formatCentiKg(totalExcess)} consumidos por encima de lo generado
          </div>
        ) : null}
        <div
          className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
          title={isOutstandingView ? undefined : balanceTimelineHelp}
          aria-label={
            isOutstandingView
              ? undefined
              : `${balanceStatusLabel}. ${balanceTimelineHelp}`
          }
        >
          <Clock3 className="size-4 text-brand-600" aria-hidden="true" />
          {balanceStatusLabel}
        </div>
      </div>
    </div>
  )
}

