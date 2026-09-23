import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  ChevronDown,
  ChevronRight,
  Clock3,
} from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import type { Kg100, ProductReconciliation } from '../model/types'

export interface BalanceProductPosition {
  readonly productId: string
  readonly processedDayKg100: Kg100
  readonly processedNightKg100: Kg100
  readonly pendingKg100: Kg100
  /** Consumed above what the origin generated; shown, never netted away. */
  readonly excessKg100?: Kg100
}

interface BalancePanelProps {
  products: readonly ProductReconciliation[]
  originDate: string
  positions?: readonly BalanceProductPosition[]
  view?: 'closing' | 'outstanding'
}

interface BalanceFamilyGroup {
  readonly familyId: string
  readonly familyName: string
  readonly products: readonly ProductReconciliation[]
}

const zeroKg100 = 0 as Kg100
const balanceTimelineHelp =
  'El saldo mostrado corresponde al cierre de esta jornada. Los consumos posteriores permiten conocer cuánto permanece pendiente actualmente.'

function currentMvpPosition(product: ProductReconciliation): BalanceProductPosition {
  return {
    productId: product.productId,
    processedDayKg100: zeroKg100,
    processedNightKg100: zeroKg100,
    pendingKg100: product.newClosingBalanceKg100,
  }
}

function sumBalances(
  products: readonly ProductReconciliation[],
  selector: (product: ProductReconciliation) => number,
): Kg100 {
  return products.reduce((sum, product) => sum + selector(product), 0) as Kg100
}

export function BalancePanel({
  products,
  originDate,
  positions,
  view = 'closing',
}: BalancePanelProps) {
  const positionsByProduct = useMemo(
    () => new Map(positions?.map((position) => [position.productId, position] as const)),
    [positions],
  )
  const balances = useMemo(
    () =>
      products.filter((product) => {
        if (product.newClosingBalanceKg100 <= 0) return false
        if (view === 'closing') return true

        const position = positionsByProduct.get(product.productId)

        return (
          (position?.pendingKg100 ?? zeroKg100) > 0 ||
          (position?.excessKg100 ?? zeroKg100) > 0
        )
      }),
    [positionsByProduct, products, view],
  )
  const groups = useMemo<readonly BalanceFamilyGroup[]>(() => {
    const grouped = new Map<string, BalanceFamilyGroup>()

    for (const product of balances) {
      const current = grouped.get(product.familyId)
      grouped.set(product.familyId, {
        familyId: product.familyId,
        familyName: product.familyName,
        products: current ? [...current.products, product] : [product],
      })
    }

    return [...grouped.values()]
  }, [balances])
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    () => new Set(groups.map((group) => group.familyId)),
  )

  const positionFor = (product: ProductReconciliation) =>
    positionsByProduct.get(product.productId) ?? currentMvpPosition(product)

  const isOutstandingView = view === 'outstanding'
  const total = sumBalances(
    balances,
    (product) =>
      isOutstandingView
        ? (positionsByProduct.get(product.productId)?.pendingKg100 ?? zeroKg100)
        : product.newClosingBalanceKg100,
  )
  const totalExcess = sumBalances(
    balances,
    (product) => positionsByProduct.get(product.productId)?.excessKg100 ?? zeroKg100,
  )
  const hasSubsequentConsumption = positions?.some(
    (position) =>
      position.processedDayKg100 > 0 || position.processedNightKg100 > 0,
  )
  const balanceStatusLabel = hasSubsequentConsumption
    ? 'Consumos posteriores incorporados'
    : isOutstandingView
      ? 'Saldo aún sin consumo posterior'
      : 'Sin consumos posteriores registrados'

  const toggleFamily = (familyId: string) => {
    setExpandedFamilies((current) => {
      const next = new Set(current)
      if (next.has(familyId)) next.delete(familyId)
      else next.add(familyId)
      return next
    })
  }

  return (
    <SectionCard
      title={
        isOutstandingView
          ? 'Saldo pendiente por producto'
          : 'Saldo generado al cierre por producto'
      }
      description={
        isOutstandingView
          ? 'Posiciones aún abiertas que conservan esta jornada como origen.'
          : 'Producto pendiente que esta jornada dejó como saldo al momento de su cierre.'
      }
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusBadge tone="info">{balances.length} productos</StatusBadge>
          {isOutstandingView ? (
            <ActionLink
              to={`/jornadas/${originDate}?process=PACKING`}
              variant="ghost"
              size="sm"
            >
              Ver jornada de origen
              <ArrowRight className="size-4" aria-hidden="true" />
            </ActionLink>
          ) : null}
        </div>
      }
    >
      <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-100 text-brand-800">
              <Boxes className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-slate-500">
                {isOutstandingView ? 'Pendiente desde' : 'Saldo generado al cierre ·'} {formatIsoDate(originDate)}
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

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-5">
        <p className="text-xs font-medium text-slate-500">
          {groups.length} familias con producto pendiente
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="min-h-8 rounded-lg px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-900"
            onClick={() => setExpandedFamilies(new Set(groups.map((group) => group.familyId)))}
          >
            Expandir todo
          </button>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <button
            type="button"
            className="min-h-8 rounded-lg px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-900"
            onClick={() => setExpandedFamilies(new Set())}
          >
            Contraer todo
          </button>
        </div>
      </div>

      <DataTableScroll
        label={
          isOutstandingView
            ? 'Saldo pendiente agrupado por familia y producto'
            : 'Saldo generado al cierre agrupado por familia y producto'
        }
        showEdgeIndicators={false}
        showAuxiliaryScrollbar={balances.length >= 12}
        className="data-scroll-clean-edge"
      >
        <table className="erp-table w-full min-w-[48rem] table-fixed border-collapse text-left">
          <caption className="sr-only">
            {isOutstandingView
              ? 'Detalle del saldo pendiente por producto'
              : 'Detalle del saldo generado al cierre por producto'}
          </caption>
          <colgroup>
            <col className="w-[48%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
              <th scope="col" className="px-4 py-2.5 sm:px-5">Producto</th>
              <th scope="col" className="px-3 py-2.5 text-center align-middle">Generado</th>
              <th scope="col" className="px-3 py-2.5 text-center align-middle">Procesado Día</th>
              <th scope="col" className="px-3 py-2.5 text-center align-middle">Procesado Noche</th>
              <th scope="col" className="px-3 py-2.5 text-center align-middle text-brand-800">
                {isOutstandingView ? 'Pendiente' : 'Saldo pendiente actual'}
              </th>
            </tr>
          </thead>
          {groups.map((group) => {
            const isExpanded = expandedFamilies.has(group.familyId)
            const generatedTotal = sumBalances(
              group.products,
              (product) => product.newClosingBalanceKg100,
            )
            const pendingTotal = sumBalances(
              group.products,
              (product) => positionFor(product).pendingKg100,
            )

            return (
              <tbody key={group.familyId} className="border-b border-slate-200 last:border-0">
                <tr className="bg-brand-50/65">
                  <th scope="rowgroup" className="px-4 py-2.5 sm:px-5">
                    <button
                      type="button"
                      className="flex max-w-xl items-center gap-2 text-left text-xs font-bold text-brand-950 hover:text-brand-700"
                      aria-expanded={isExpanded}
                      onClick={() => toggleFamily(group.familyId)}
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
                {isExpanded
                  ? group.products.map((product) => {
                      const position = positionFor(product)

                      return (
                        <tr
                          key={product.productId}
                          className="border-t border-slate-100 hover:bg-slate-50/75"
                        >
                          <th scope="row" className="max-w-xl px-4 py-2.5 pl-10 sm:px-5 sm:pl-11">
                            <span
                              className="line-clamp-2 text-xs font-medium leading-4 text-slate-700"
                              title={product.productName}
                            >
                              {product.productName}
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
                    })
                  : null}
              </tbody>
            )
          })}
        </table>
      </DataTableScroll>
    </SectionCard>
  )
}
