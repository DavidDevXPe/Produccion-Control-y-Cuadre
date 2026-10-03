import { formatCentiKg } from '../../../../utils/formatters'
import type { Kg100, ProductReconciliation } from '../../model/types'
import { formatTunnelMovement } from './breakdownTypes'

export interface ProductionBreakdownProductRowProps {
  readonly product: ProductReconciliation
  readonly showTunnel: boolean
}

export function ProductionBreakdownProductRow({
  product,
  showTunnel,
}: ProductionBreakdownProductRowProps) {
  return (
    <tr className="group border-t border-slate-100 hover:bg-slate-50/80">
      <th
        scope="row"
        className="sticky-row-divider max-w-xl bg-white px-4 py-2.5 pl-10 text-xs font-medium leading-4 text-slate-700 group-hover:bg-slate-50 lg:sticky lg:left-0 lg:z-10"
      >
        <span className="line-clamp-2" title={product.productName}>
          {product.productName}
        </span>
      </th>
      <td className="number-tabular whitespace-nowrap border-l-2 border-brand-100 px-2.5 py-2.5 text-right text-xs text-slate-600">
        {formatCentiKg(product.day.reportedKg100)}
      </td>
      <td className="number-tabular whitespace-nowrap px-2.5 py-2.5 text-right text-xs text-slate-600">
        {formatCentiKg(product.day.previousBalanceProcessedKg100)}
      </td>
      <td className="number-tabular whitespace-nowrap px-2.5 py-2.5 text-right text-xs text-slate-600">
        {formatCentiKg(product.day.ownProductionKg100)}
      </td>
      <td className="number-tabular whitespace-nowrap border-l-2 border-slate-200 px-2.5 py-2.5 text-right text-xs text-slate-600">
        {formatCentiKg(product.night.reportedKg100)}
      </td>
      <td className="number-tabular whitespace-nowrap px-2.5 py-2.5 text-right text-xs text-slate-600">
        {formatCentiKg(product.night.previousBalanceProcessedKg100)}
      </td>
      <td className="number-tabular whitespace-nowrap px-2.5 py-2.5 text-right text-xs text-slate-600">
        {formatCentiKg(product.night.ownProductionKg100)}
      </td>
      {showTunnel ? (
        <>
          <td className="number-tabular whitespace-nowrap border-l-2 border-violet-100 px-2.5 py-2.5 text-right text-xs text-slate-600">
            {formatTunnelMovement(product.tunnel.DAY.ownProductionKg100)}
          </td>
          <td className="number-tabular whitespace-nowrap px-2.5 py-2.5 text-right text-xs text-slate-600">
            {formatTunnelMovement(product.tunnel.NIGHT.ownProductionKg100)}
          </td>
        </>
      ) : null}
      <td className="number-tabular whitespace-nowrap border-l-2 border-brand-100 px-2.5 py-2.5 text-right text-xs text-slate-600">
        {formatCentiKg(
          (product.day.adjustmentKg100 +
            product.night.adjustmentKg100) as Kg100,
        )}
      </td>
      <td className="number-tabular whitespace-nowrap px-2.5 py-2.5 text-right text-xs text-slate-600">
        {formatCentiKg(product.treatmentKg100)}
      </td>
      <td className="number-tabular whitespace-nowrap px-2.5 py-2.5 text-right text-xs text-slate-600">
        {formatCentiKg(product.newClosingBalanceKg100)}
      </td>
      <td className="number-tabular whitespace-nowrap px-2.5 py-2.5 text-right text-xs font-semibold text-slate-900">
        {formatCentiKg(product.declaredFinishedKg100)}
      </td>
      <td
        className={`number-tabular whitespace-nowrap bg-emerald-50/25 px-4 py-2.5 text-right text-xs font-bold ${
          product.differenceKg100 === 0 ? 'text-emerald-700' : 'text-rose-700'
        }`}
      >
        {formatCentiKg(product.differenceKg100)}
      </td>
    </tr>
  )
}
