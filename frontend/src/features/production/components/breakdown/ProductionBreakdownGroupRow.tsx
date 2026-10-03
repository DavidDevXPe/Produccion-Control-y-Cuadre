import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatCentiKg } from '../../../../utils/formatters'
import type { ProductReconciliation } from '../../model/types'
import {
  type ProductGroup,
  formatTunnelMovement,
  sumField,
} from './breakdownTypes'

export interface ProductionBreakdownGroupRowProps {
  readonly group: ProductGroup
  readonly isExpanded: boolean
  readonly showTunnel: boolean
  readonly onToggleFamily: (familyId: string) => void
}

export function ProductionBreakdownGroupRow({
  group,
  isExpanded,
  showTunnel,
  onToggleFamily,
}: ProductionBreakdownGroupRowProps) {
  const subtotal = (selector: (product: ProductReconciliation) => number) =>
    formatCentiKg(sumField(group.products, selector))

  const tunnelSubtotal = (selector: (product: ProductReconciliation) => number) =>
    formatTunnelMovement(sumField(group.products, selector))

  const groupDifferenceKg100 = sumField(
    group.products,
    (product) => product.differenceKg100,
  )

  return (
    <tr className="bg-brand-50/65">
      <th
        scope="rowgroup"
        className="sticky-family-divider bg-brand-50 px-4 py-2.5 lg:sticky lg:left-0 lg:z-20"
      >
        <button
          type="button"
          onClick={() => onToggleFamily(group.familyId)}
          className="flex max-w-lg items-center gap-2 text-left text-xs font-bold text-brand-950 hover:text-brand-700"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
          )}
          {group.familyName}
          <span className="rounded-full bg-white px-2 py-0.5 text-[0.6875rem] text-slate-500 ring-1 ring-slate-200">
            {group.products.length}
          </span>
        </button>
      </th>
      <td className="number-tabular border-l border-brand-100 px-3 py-3 text-right text-xs font-bold text-slate-700">
        {subtotal((product) => product.day.reportedKg100)}
      </td>
      <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
        {subtotal((product) => product.day.previousBalanceProcessedKg100)}
      </td>
      <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
        {subtotal((product) => product.day.ownProductionKg100)}
      </td>
      <td className="number-tabular border-l border-brand-100 px-3 py-3 text-right text-xs font-bold text-slate-700">
        {subtotal((product) => product.night.reportedKg100)}
      </td>
      <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
        {subtotal((product) => product.night.previousBalanceProcessedKg100)}
      </td>
      <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
        {subtotal((product) => product.night.ownProductionKg100)}
      </td>
      {showTunnel ? (
        <>
          <td className="number-tabular border-l-2 border-violet-100 px-3 py-3 text-right text-xs font-bold text-slate-700">
            {tunnelSubtotal((product) => product.tunnel.DAY.ownProductionKg100)}
          </td>
          <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
            {tunnelSubtotal((product) => product.tunnel.NIGHT.ownProductionKg100)}
          </td>
        </>
      ) : null}
      <td className="number-tabular border-l border-brand-100 px-3 py-3 text-right text-xs font-bold text-slate-700">
        {subtotal(
          (product) =>
            product.day.adjustmentKg100 + product.night.adjustmentKg100,
        )}
      </td>
      <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
        {subtotal((product) => product.treatmentKg100)}
      </td>
      <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-700">
        {subtotal((product) => product.newClosingBalanceKg100)}
      </td>
      <td className="number-tabular px-3 py-3 text-right text-xs font-extrabold text-slate-950">
        {subtotal((product) => product.declaredFinishedKg100)}
      </td>
      <td
        className={`number-tabular px-5 py-3 text-right text-xs font-bold sm:px-6 ${
          groupDifferenceKg100 === 0 ? 'text-emerald-700' : 'text-rose-700'
        }`}
      >
        {formatCentiKg(groupDifferenceKg100)}
      </td>
    </tr>
  )
}
