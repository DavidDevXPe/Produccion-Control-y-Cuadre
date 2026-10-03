import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import type { ProductReconciliation } from '../model/types'
import {
  type BalanceFamilyGroup,
  type BalanceProductPosition,
  currentMvpPosition,
  sumBalances,
  zeroKg100,
} from './balancePanel/balancePanelTypes'
import { BalancePanelGroupRow } from './balancePanel/BalancePanelGroupRow'
import { BalancePanelHeroCard } from './balancePanel/BalancePanelHeroCard'
import { BalancePanelProductRow } from './balancePanel/BalancePanelProductRow'
import { BalancePanelTableHeader } from './balancePanel/BalancePanelTableHeader'
import { BalancePanelToolbar } from './balancePanel/BalancePanelToolbar'

export type { BalanceProductPosition } from './balancePanel/balancePanelTypes'

export interface BalancePanelProps {
  readonly products: readonly ProductReconciliation[]
  readonly originDate: string
  readonly positions?: readonly BalanceProductPosition[] | undefined
  readonly view?: 'closing' | 'outstanding' | undefined
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
      <BalancePanelHeroCard
        isOutstandingView={isOutstandingView}
        originDate={originDate}
        total={total}
        totalExcess={totalExcess}
        balanceStatusLabel={balanceStatusLabel}
      />

      <BalancePanelToolbar
        groupsCount={groups.length}
        onExpandAll={() => setExpandedFamilies(new Set(groups.map((group) => group.familyId)))}
        onCollapseAll={() => setExpandedFamilies(new Set())}
      />

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
          <BalancePanelTableHeader isOutstandingView={isOutstandingView} />
          {groups.map((group) => {
            const isExpanded = expandedFamilies.has(group.familyId)

            return (
              <tbody key={group.familyId} className="border-b border-slate-200 last:border-0">
                <BalancePanelGroupRow
                  group={group}
                  isExpanded={isExpanded}
                  onToggleFamily={toggleFamily}
                  positionFor={positionFor}
                />
                {isExpanded
                  ? group.products.map((product) => (
                      <BalancePanelProductRow
                        key={product.productId}
                        product={product}
                        position={positionFor(product)}
                      />
                    ))
                  : null}
              </tbody>
            )
          })}
        </table>
      </DataTableScroll>
    </SectionCard>
  )
}

export default BalancePanel

