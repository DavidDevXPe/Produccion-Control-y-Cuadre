import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCentiKg, formatIsoDateCompact } from '../../../../utils/formatters'
import type { ProductReconciliation } from '../../model/types'
import {
  type BalanceProductPosition,
  zeroKg100,
} from './balancePanelTypes'

export interface BalancePanelProductRowProps {
  readonly product: ProductReconciliation
  readonly position: BalanceProductPosition
  readonly originDate: string
}

export function BalancePanelProductRow({
  product,
  position,
  originDate,
}: BalancePanelProductRowProps) {
  return (
    <tr
      key={product.productId}
      className="border-t border-slate-100 hover:bg-slate-50/75"
    >
      <th scope="row" className="max-w-xl px-4 py-2.5 pl-10 sm:px-5 sm:pl-11">
        <Link
          to={`/jornadas/${originDate}?process=PACKING`}
          className="line-clamp-2 text-xs font-medium leading-4 text-slate-700 underline-offset-2 hover:text-brand-800 hover:underline"
          title={`Ver jornada de origen del ${formatIsoDateCompact(originDate)}`}
        >
          {product.productName}
        </Link>
        <span className="mt-1 block text-[0.625rem] font-semibold uppercase tracking-[0.05em] text-slate-400">
          Origen Envasado {formatIsoDateCompact(originDate)}
        </span>
      </th>
      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs font-medium text-slate-600">
        {formatCentiKg(product.newClosingBalanceKg100)}
      </td>
      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs text-slate-500">
        {formatCentiKg(position.processedDayKg100)}
      </td>
      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs text-slate-500">
        {formatCentiKg(position.processedNightKg100)}
      </td>
      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs font-semibold text-brand-900">
        <span className="inline-flex w-full items-center justify-center gap-1.5">
          <ArrowRight className="size-3.5 text-brand-600" aria-hidden="true" />
          {formatCentiKg(position.pendingKg100)}
        </span>
        {(position.excessKg100 ?? zeroKg100) > 0 ? (
          <span className="mt-0.5 flex w-full items-center justify-center gap-1 text-[0.6875rem] font-bold text-rose-700">
            <AlertTriangle className="size-3" aria-hidden="true" />
            Exceso {formatCentiKg(position.excessKg100 ?? zeroKg100)}
          </span>
        ) : null}
      </td>
    </tr>
  )
}

