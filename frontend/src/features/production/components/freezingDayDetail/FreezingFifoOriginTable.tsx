import { Boxes } from 'lucide-react'
import { DataTableScroll } from '../../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../../components/ui/SectionCard'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg, formatIsoDate } from '../../../../utils/formatters'
import type { Kg100, ProductionDay } from '../../model/types'

export interface FreezingOriginRowItem {
  readonly lot: ProductionDay['receivedBalanceLots'][number]
  readonly line: ProductionDay['lines'][number] | undefined
  readonly originDay: ProductionDay | undefined
  readonly usedKg100: Kg100
  readonly pendingKg100: Kg100
  readonly originKind: 'PREVIOUS' | 'CURRENT' | 'UNKNOWN'
}

export interface FreezingFifoOriginTableProps {
  readonly freezingOriginRows: readonly FreezingOriginRowItem[]
  readonly hasReceivedLots: boolean
}

export function FreezingFifoOriginTable({
  freezingOriginRows,
  hasReceivedLots,
}: FreezingFifoOriginTableProps) {
  return (
    <SectionCard
      title="Detalle FIFO por origen"
      description="Trazabilidad de la disponibilidad de Envasado utilizada por producto y jornada origen."
    >
      <DataTableScroll label="Origen del producto congelado">
        <table className="erp-table w-full min-w-[72rem] table-fixed border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-compact dark:text-ui-text-dark-soft">
              <th className="w-[32%] px-4 py-2.5 text-left">Producto</th>
              <th className="px-3 py-2.5 text-center">Origen Envasado</th>
              <th className="px-3 py-2.5 text-center">Tipo de origen</th>
              <th className="px-3 py-2.5 text-center">Disponible al iniciar</th>
              <th className="px-3 py-2.5 text-center">Congelado en jornada</th>
              <th className="px-3 py-2.5 text-center">Saldo posterior</th>
            </tr>
          </thead>
          <tbody>
            {freezingOriginRows.map((row) => (
              <tr
                key={row.lot.id}
                className="border-b border-slate-100 dark:border-ui-line-dark-grid"
              >
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-800 dark:text-ui-text-dark-strong">
                  {row.line?.productName ?? row.lot.productId}
                </th>
                <td className="px-3 py-3 text-center text-xs text-slate-600 dark:text-ui-text-dark-soft">
                  {row.originDay
                    ? formatIsoDate(row.originDay.date)
                    : row.lot.originDayId}
                </td>
                <td className="px-3 py-3 text-center">
                  <StatusBadge
                    tone={
                      row.originKind === 'PREVIOUS'
                        ? 'warning'
                        : row.originKind === 'CURRENT'
                          ? 'info'
                          : 'neutral'
                    }
                    showIcon={false}
                    truncateText={false}
                  >
                    {row.originKind === 'PREVIOUS'
                      ? 'SALDO ANTERIOR'
                      : row.originKind === 'CURRENT'
                        ? 'ENVASADO DEL DÍA'
                        : 'ORIGEN HISTÓRICO'}
                  </StatusBadge>
                </td>
                <td className="number-tabular px-3 py-3 text-center text-xs font-semibold text-slate-700 dark:text-ui-text-dark-pale">
                  {formatCentiKg(row.lot.originalKg100)}
                </td>
                <td className="number-tabular px-3 py-3 text-center text-xs font-bold text-sky-700 dark:text-sky-300">
                  {formatCentiKg(row.usedKg100)}
                </td>
                <td
                  className={`number-tabular px-3 py-3 text-center text-xs font-bold ${
                    row.pendingKg100 === 0
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {formatCentiKg(row.pendingKg100)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableScroll>
      {!hasReceivedLots ? (
        <div className="flex items-center gap-3 p-5 text-sm text-slate-500">
          <Boxes className="size-5 text-slate-400" aria-hidden="true" />
          No existe disponibilidad de Envasado vinculada a esta jornada.
        </div>
      ) : null}
    </SectionCard>
  )
}
