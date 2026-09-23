import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatRatioAsPercent } from '../../../utils/formatters'
import type { Kg100, WeeklyProductTotal } from '../model/types'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'

export interface WeeklyProductGroupRow {
  id: string
  label: string
  totalKg100: Kg100
  allocationLabel: string
  performanceLabel: string
  rawMaterialShareLabel: string
  products: readonly WeeklyProductTotal[]
}

interface WeeklyProductSummaryProps {
  groups: readonly WeeklyProductGroupRow[]
  totalFinishedKg100: Kg100
  performanceRatio: number | null
}

export function WeeklyProductSummary({
  groups,
  totalFinishedKg100,
  performanceRatio,
}: WeeklyProductSummaryProps) {
  const productCount = groups.reduce(
    (total, group) => total + group.products.length,
    0,
  )
  const yieldStatus = getYieldStatus(
    performanceRatio === null ? null : performanceRatio * 100,
  )
  const yieldStyles = yieldVisualStyles[yieldStatus.colorVariant]

  return (
    <SectionCard
      title="Consolidado por grupo y producto"
      description="Mismas relaciones del RESUMEN, calculadas mediante identificadores estables."
    >
      <DataTableScroll
        label="Consolidado semanal por grupo y producto"
        showAuxiliaryScrollbar={productCount >= 12}
      >
        <table className="erp-table w-full min-w-[64rem] table-fixed border-collapse text-left">
          <caption className="sr-only">Consolidado semanal por grupo y producto</caption>
          <colgroup>
            <col className="w-[44%]" />
            <col className="w-[15%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
              <th scope="col" className="px-4 py-2.5 sm:px-5">Grupo / producto</th>
              <th scope="col" className="px-3 py-2.5 text-center align-middle">Producto</th>
              <th scope="col" className="px-3 py-2.5 text-center align-middle">Distribución MP</th>
              <th scope="col" className="px-3 py-2.5 text-center align-middle">Rend. técnico</th>
              <th scope="col" className="px-3 py-2.5 text-center align-middle">Aprov. MP</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.id} className="border-b border-slate-200 last:border-0">
              <tr className="bg-brand-50/55">
                <th scope="rowgroup" className="px-4 py-2.5 text-xs font-bold text-brand-950 sm:px-5">
                  {group.label}
                </th>
                <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs font-bold text-slate-950">
                  {formatCentiKg(group.totalKg100)}
                </td>
                <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs font-semibold text-slate-700">
                  {group.allocationLabel}
                </td>
                <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs font-semibold text-slate-700">
                  {group.performanceLabel}
                </td>
                <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs font-semibold text-slate-700">
                  {group.rawMaterialShareLabel}
                </td>
              </tr>
              {group.products.map((product) => (
                <tr key={product.productId} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <th scope="row" className="max-w-2xl px-4 py-2.5 pl-9 text-xs font-medium leading-4 text-slate-600 sm:px-5 sm:pl-10">
                    <span className="line-clamp-2" title={product.productName}>
                      {product.productName}
                    </span>
                  </th>
                  <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs font-semibold text-slate-700">
                    {formatCentiKg(product.totalKg100)}
                  </td>
                  <td colSpan={3} />
                </tr>
              ))}
            </tbody>
          ))}
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <th scope="row" className="px-4 py-3 text-xs font-bold text-slate-950 sm:px-5">
                TOTAL PRODUCTO TERMINADO
              </th>
              <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-bold text-slate-950">
                {formatCentiKg(totalFinishedKg100)}
              </td>
              <td className="px-3 py-3" />
              <td className="px-3 py-3" />
              <td className="px-3 py-3 text-center align-middle">
                <div className="flex w-full flex-col items-center justify-center gap-1 text-center">
                  <span className={`number-tabular whitespace-nowrap text-xs font-bold ${yieldStyles.textClass}`}>
                    {formatRatioAsPercent(performanceRatio)}
                  </span>
                  <StatusBadge
                    tone={yieldStyles.badgeTone}
                    title={`${yieldStatus.label}: ${yieldStatus.interpretation}`}
                    truncateText={false}
                  >
                    {yieldStatus.label}
                  </StatusBadge>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </DataTableScroll>
    </SectionCard>
  )
}
