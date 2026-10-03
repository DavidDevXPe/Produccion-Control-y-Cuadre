import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatCentiKg } from '../../../../utils/formatters'
import type { ProductReconciliation } from '../../model/types'
import {
  type BalanceFamilyGroup,
  type BalanceProductPosition,
  sumBalances,
} from './balancePanelTypes'

export interface BalancePanelGroupRowProps {
  readonly group: BalanceFamilyGroup
  readonly isExpanded: boolean
  readonly onToggleFamily: (familyId: string) => void
  readonly positionFor: (product: ProductReconciliation) => BalanceProductPosition
}

export function BalancePanelGroupRow({
  group,
  isExpanded,
  onToggleFamily,
  positionFor,
}: BalancePanelGroupRowProps) {
  const generatedTotal = sumBalances(
    group.products,
    (product) => product.newClosingBalanceKg100,
  )
  const pendingTotal = sumBalances(
    group.products,
    (product) => positionFor(product).pendingKg100,
  )

  return (
    <tr className="bg-brand-50/65">
      <th scope="rowgroup" className="px-4 py-2.5 sm:px-5">
        <button
          type="button"
          className="flex max-w-xl items-center gap-2 text-left text-xs font-bold text-brand-950 hover:text-brand-700"
          aria-expanded={isExpanded}
          onClick={() => onToggleFamily(group.familyId)}
        >
          {isExpanded ? (
            <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
          )}
          <span>{group.familyName}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[0.625rem] font-semibold text-slate-500 ring-1 ring-slate-200">
            {group.products.length}
          </span>
        </button>
      </th>
      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs font-semibold text-slate-700">
        {formatCentiKg(generatedTotal)}
      </td>
      <td colSpan={2} />
      <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs font-bold text-brand-900">
        <span className="inline-flex w-full items-baseline justify-center gap-2">
          <span className="text-[0.5625rem] font-semibold uppercase tracking-[0.08em] text-brand-700">
            Total
          </span>
          {formatCentiKg(pendingTotal)}
        </span>
      </td>
    </tr>
  )
}

