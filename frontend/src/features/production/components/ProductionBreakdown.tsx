import { ChevronDown, ChevronRight, Info, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { formatCentiKg } from '../../../utils/formatters'
import type { Kg100, ProductReconciliation } from '../model/types'

interface ProductionBreakdownProps {
  products: readonly ProductReconciliation[]
}

interface ProductGroup {
  familyId: string
  familyName: string
  products: readonly ProductReconciliation[]
}

function sumField(
  products: readonly ProductReconciliation[],
  selector: (product: ProductReconciliation) => number,
): Kg100 {
  return products.reduce((total, product) => total + selector(product), 0) as Kg100
}

function formatTunnelMovement(value: Kg100) {
  return value === 0 ? '—' : formatCentiKg(value)
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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="min-h-8 rounded-lg px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-900"
              onClick={expandAll}
            >
              Expandir todo
            </button>
            <button
              type="button"
              className="min-h-8 rounded-lg px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-900"
              onClick={collapseAll}
            >
              Contraer todo
            </button>
          </div>
          <label className="relative block w-full sm:w-64">
            <span className="sr-only">Buscar familia o producto</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-500 focus:border-brand-400 focus:bg-white"
            />
          </label>
        </div>
      }
    >
      {hasReconciledShiftBreakdown ? (
        <div className="flex items-start gap-3 border-b border-brand-100 bg-brand-50/75 px-4 py-3 text-xs leading-5 text-brand-950 sm:px-5">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Los totales de Día y Noche son explícitos. El reparto por producto fue
            reconstruido para conciliar los totales cuando el origen no identifica
            el turno.
          </p>
        </div>
      ) : null}
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
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
              <th scope="col" rowSpan={2} className="sticky-column-divider w-[20rem] bg-slate-50 px-4 py-3 text-left align-bottom md:sticky md:top-14 md:z-50 lg:left-0 xl:top-0">
                Familia / producto
              </th>
              <th scope="colgroup" colSpan={3} className="border-l-2 border-brand-200 bg-brand-50 px-2.5 py-2 text-center text-brand-800 md:sticky md:top-14 md:z-30 xl:top-0">
                Turno Día
              </th>
              <th scope="colgroup" colSpan={3} className="border-l-2 border-slate-300 bg-slate-100 px-2.5 py-2 text-center text-slate-700 md:sticky md:top-14 md:z-30 xl:top-0">
                Turno Noche
              </th>
              {showTunnel ? (
                <th scope="colgroup" colSpan={2} className="border-l-2 border-violet-200 bg-violet-50 px-2.5 py-2 text-center text-violet-800 md:sticky md:top-14 md:z-30 xl:top-0">
                  Túnel
                </th>
              ) : null}
              <th scope="colgroup" colSpan={5} className="border-l-2 border-brand-200 bg-brand-50 px-2.5 py-2 text-center text-brand-800 md:sticky md:top-14 md:z-30 xl:top-0">
                Cuadre
              </th>
            </tr>
            <tr className="border-b border-slate-200 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
              <th scope="col" className="border-l-2 border-brand-200 bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Reportado</th>
              <th scope="col" className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Saldo ant.</th>
              <th scope="col" className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Propio</th>
              <th scope="col" className="border-l-2 border-slate-300 bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Reportado</th>
              <th scope="col" className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Saldo ant.</th>
              <th scope="col" className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Propio</th>
              {showTunnel ? (
                <>
                  <th scope="col" className="border-l-2 border-violet-200 bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Día</th>
                  <th scope="col" className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Noche</th>
                </>
              ) : null}
              <th scope="col" className="border-l-2 border-brand-200 bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Ajustes</th>
              <th scope="col" className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Tratamiento</th>
              <th scope="col" className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Saldo al cierre</th>
              <th scope="col" className="bg-slate-50 px-2.5 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">P. terminado</th>
              <th scope="col" className="bg-slate-50 px-4 py-2.5 text-right md:sticky md:top-[5.5625rem] md:z-30 xl:top-[2.0625rem]">Diferencia</th>
            </tr>
          </thead>
          {filteredGroups.map((group) => {
            const isExpanded = normalizedQuery.length > 0 || expandedFamilies.has(group.familyId)
            const subtotal = (selector: (product: ProductReconciliation) => number) =>
              formatCentiKg(sumField(group.products, selector))
            const tunnelSubtotal = (
              selector: (product: ProductReconciliation) => number,
            ) => formatTunnelMovement(sumField(group.products, selector))
            const groupDifferenceKg100 = sumField(
              group.products,
              (product) => product.differenceKg100,
            )

            return (
              <tbody key={group.familyId} className="border-b border-slate-200 last:border-0">
                <tr className="bg-brand-50/65">
                  <th scope="rowgroup" className="sticky-family-divider bg-brand-50 px-4 py-2.5 lg:sticky lg:left-0 lg:z-20">
                    <button
                      type="button"
                      onClick={() => toggleFamily(group.familyId)}
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
                      groupDifferenceKg100 === 0
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {formatCentiKg(groupDifferenceKg100)}
                  </td>
                </tr>
                {isExpanded
                  ? group.products.map((product) => (
                      <tr key={product.productId} className="group border-t border-slate-100 hover:bg-slate-50/80">
                        <th scope="row" className="sticky-row-divider max-w-xl bg-white px-4 py-2.5 pl-10 text-xs font-medium leading-4 text-slate-700 group-hover:bg-slate-50 lg:sticky lg:left-0 lg:z-10">
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
