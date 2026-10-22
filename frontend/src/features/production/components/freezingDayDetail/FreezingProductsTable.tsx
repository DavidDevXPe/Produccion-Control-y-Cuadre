import { DataTableScroll } from '../../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../../components/ui/SectionCard'
import { formatCentiKg } from '../../../../utils/formatters'
import { sumKg100 } from '../../model/calculations'
import { productIdsEquivalent } from '../../model/productIdentity'
import type { FreezingComparisonRow } from '../../model/freezing'
import type { ProductionDay } from '../../model/types'

export interface FreezingProductsTableProps {
  readonly lines: readonly ProductionDay['lines'][number][]
  readonly linkedByProduct: readonly FreezingComparisonRow[]
}

export function FreezingProductsTable({
  lines,
  linkedByProduct,
}: FreezingProductsTableProps) {
  return (
    <SectionCard
      title="Productos congelados"
      description="Detalle físico por producto y turno."
    >
      <DataTableScroll label="Productos congelados de la jornada">
        <table className="erp-table w-full min-w-[54rem] table-fixed border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
              <th className="w-[46%] px-4 py-2.5 text-left">
                Familia / producto
              </th>
              <th className="px-3 py-2.5 text-center">Día</th>
              <th className="px-3 py-2.5 text-center">Noche</th>
              <th className="px-3 py-2.5 text-center">Congelado</th>
              <th className="px-3 py-2.5 text-center">Vinculado</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const exactLinkedRow = linkedByProduct.find(
                (row) => row.id === line.productId,
              )
              const linkedForProduct = exactLinkedRow
                ? exactLinkedRow.linkedKg100
                : sumKg100(
                    linkedByProduct
                      .filter((row) =>
                        productIdsEquivalent(row.id, line.productId),
                      )
                      .map((row) => row.linkedKg100),
                  )
              const frozenKg100 = sumKg100([
                line.shifts.DAY.reportedKg100,
                line.shifts.NIGHT.reportedKg100,
              ])
              return (
                <tr
                  key={line.productId}
                  className="border-b border-slate-100"
                >
                  <th className="px-4 py-3 text-left">
                    <span className="block text-[0.625rem] font-bold uppercase tracking-wide text-sky-700">
                      {line.familyName}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-800">
                      {line.productName}
                    </span>
                  </th>
                  <td className="number-tabular px-3 py-3 text-center text-xs">
                    {formatCentiKg(line.shifts.DAY.reportedKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-center text-xs">
                    {formatCentiKg(line.shifts.NIGHT.reportedKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-center text-xs font-bold">
                    {formatCentiKg(frozenKg100)}
                  </td>
                  <td
                    className={`number-tabular px-3 py-3 text-center text-xs font-bold ${
                      linkedForProduct === frozenKg100
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {formatCentiKg(linkedForProduct)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </DataTableScroll>
    </SectionCard>
  )
}
