import { useMemo, useState } from 'react'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import type { ProductReconciliation } from '../model/types'
import { type ProductGroup } from './breakdown/breakdownTypes'
import { ProductionBreakdownGroupRow } from './breakdown/ProductionBreakdownGroupRow'
import { ProductionBreakdownProductRow } from './breakdown/ProductionBreakdownProductRow'
import { ProductionBreakdownShiftBanner } from './breakdown/ProductionBreakdownShiftBanner'
import { ProductionBreakdownTableHeader } from './breakdown/ProductionBreakdownTableHeader'
import { ProductionBreakdownToolbar } from './breakdown/ProductionBreakdownToolbar'

export interface ProductionBreakdownProps {
  readonly products: readonly ProductReconciliation[]
}

export function ProductionBreakdown({ products }: ProductionBreakdownProps) {
  const groups = useMemo<readonly ProductGroup[]>(() => {
    const grouped = new Map<string, ProductGroup>()

    for (const product of products) {
      const current = grouped.get(product.familyId)
      grouped.set(product.familyId, {
        familyId: product.familyId,
        familyName: product.familyName,
        products: current ? [...current.products, product] : [product],
      })
    }

    return [...grouped.values()]
  }, [products])

  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    () => new Set(groups.map((group) => group.familyId)),
  )
  const [query, setQuery] = useState('')
  const hasReconciledShiftBreakdown = products.some(
    (product) => product.shiftBreakdownConfidence === 'RECONCILED_INFERENCE',
  )
  const showTunnel = products.some(
    (product) =>
      product.tunnel.DAY.reportedKg100 !== 0 ||
      product.tunnel.NIGHT.reportedKg100 !== 0,
  )
  const normalizedQuery = query.trim().toLocaleLowerCase('es')

  const filteredGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          products: normalizedQuery
            ? group.products.filter(
                (product) =>
                  product.productName.toLocaleLowerCase('es').includes(normalizedQuery) ||
                  product.familyName.toLocaleLowerCase('es').includes(normalizedQuery),
              )
            : group.products,
        }))
        .filter((group) => group.products.length > 0),
    [groups, normalizedQuery],
  )

  const toggleFamily = (familyId: string) => {
    setExpandedFamilies((current) => {
      const next = new Set(current)
      if (next.has(familyId)) next.delete(familyId)
      else next.add(familyId)
      return next
    })
  }

  const expandAll = () => {
    setExpandedFamilies(new Set(groups.map((group) => group.familyId)))
  }

  const collapseAll = () => {
    setExpandedFamilies(new Set())
  }

  return (
    <SectionCard
      title="Detalle por familia y producto"
      description={`${products.length} productos con movimiento en la jornada.`}
      action={
        <ProductionBreakdownToolbar
          query={query}
          onQueryChange={setQuery}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
        />
      }
    >
      {hasReconciledShiftBreakdown ? <ProductionBreakdownShiftBanner /> : null}

      <DataTableScroll
        label="Producción por familia, turno y concepto de cuadre"
        showEdgeIndicators={false}
        showAuxiliaryScrollbar={products.length >= 12}
        className="data-scroll-clean-edge"
      >
        <table
          className={`erp-table w-full border-collapse text-left ${
            showTunnel ? 'min-w-[100rem]' : 'min-w-[86rem]'
          }`}
        >
          <caption className="sr-only">
            Producción de la jornada agrupada por familia y producto
          </caption>
          <ProductionBreakdownTableHeader showTunnel={showTunnel} />

          {filteredGroups.map((group) => {
            const isExpanded =
              normalizedQuery.length > 0 || expandedFamilies.has(group.familyId)

            return (
              <tbody
                key={group.familyId}
                className="border-b border-slate-200 last:border-0"
              >
                <ProductionBreakdownGroupRow
                  group={group}
                  isExpanded={isExpanded}
                  showTunnel={showTunnel}
                  onToggleFamily={toggleFamily}
                />
                {isExpanded
                  ? group.products.map((product) => (
                      <ProductionBreakdownProductRow
                        key={product.productId}
                        product={product}
                        showTunnel={showTunnel}
                      />
                    ))
                  : null}
              </tbody>
            )
          })}
        </table>
      </DataTableScroll>

      {filteredGroups.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-slate-500">
          No se encontraron productos para “{query}”.
        </p>
      ) : null}
    </SectionCard>
  )
}

export default ProductionBreakdown

