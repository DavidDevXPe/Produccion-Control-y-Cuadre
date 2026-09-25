import { AlertTriangle, Snowflake } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import {
  formatCentiKg,
  formatIsoDate,
  formatIsoDateCompact,
} from '../../../utils/formatters'
import type { FreezingAvailabilityPosition } from '../model/freezing'

interface FreezingBalancesPanelProps {
  /** Positions with pending product or with consumption above their origin. */
  positions: readonly FreezingAvailabilityPosition[]
}

export function FreezingBalancesPanel({
  positions,
}: FreezingBalancesPanelProps) {
  const excessCount = positions.filter(
    (position) => position.excessKg100 > 0,
  ).length
  const useScroll = positions.length > 12

  return (
    <SectionCard
      title="Producto pendiente de congelar"
      description="Cada posición conserva la jornada de Envasado que originó el producto. Primero las inconsistencias; luego orden FIFO: el origen más antiguo se congela primero."
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {excessCount > 0 ? (
            <StatusBadge tone="danger" truncateText={false}>
              {excessCount} {excessCount === 1 ? 'EXCESO' : 'EXCESOS'}
            </StatusBadge>
          ) : null}
          <StatusBadge tone="info">
            {positions.length} {positions.length === 1 ? 'LOTE' : 'LOTES'}
          </StatusBadge>
        </div>
      }
      contentClassName="p-0"
    >
      <DataTableScroll label="Disponibilidad de Congelamiento por producto y origen">
        <div
          className={
            useScroll
              ? 'max-h-[28rem] overflow-y-auto overscroll-contain'
              : undefined
          }
        >
          <table className="erp-table w-full min-w-[58rem] table-fixed border-collapse text-left">
            <caption className="sr-only">
              Producto envasado, congelado y pendiente por jornada de origen
            </caption>
            <colgroup>
              <col className="w-[39%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500 dark:bg-slate-100">
                <th scope="col" className="px-4 py-2.5">
                  Producto
                </th>
                <th scope="col" className="px-3 py-2.5 text-center">
                  Origen Envasado
                </th>
                <th scope="col" className="px-3 py-2.5 text-center">
                  Envasado
                </th>
                <th scope="col" className="px-3 py-2.5 text-center">
                  Congelado
                </th>
                <th scope="col" className="px-3 py-2.5 text-center text-brand-800">
                  Pendiente
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => {
                const hasExcess = position.excessKg100 > 0

                return (
                  <tr
                    key={`${position.originDayId}|${position.productId}`}
                    className={`border-b border-slate-100 hover:bg-brand-50/40 ${
                      hasExcess
                        ? 'bg-rose-50 dark:bg-rose-500/10'
                        : 'bg-white'
                    }`}
                  >
                    <th scope="row" className="px-4 py-3">
                      <span className="block text-[0.625rem] font-bold uppercase tracking-[0.06em] text-brand-700">
                        {position.familyName}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold leading-4 text-slate-800">
                        {position.productName}
                      </span>
                    </th>
                    <td className="number-tabular px-3 py-3 text-center text-xs">
                      <Link
                        to={`/jornadas/${position.originDate}?process=PACKING`}
                        className="font-semibold text-brand-800 underline-offset-2 hover:underline"
                        aria-label={`Ver jornada de Envasado de origen del ${formatIsoDate(position.originDate)}`}
                      >
                        {formatIsoDateCompact(position.originDate)}
                      </Link>
                    </td>
                    <td className="number-tabular px-3 py-3 text-center text-xs font-semibold text-slate-800">
                      {formatCentiKg(position.generatedKg100)}
                    </td>
                    <td className="number-tabular px-3 py-3 text-center text-xs font-semibold text-slate-700">
                      {formatCentiKg(position.processedTotalKg100)}
                    </td>
                    <td className="number-tabular px-3 py-3 text-center text-xs font-bold">
                      {hasExcess ? (
                        <span className="inline-flex flex-col items-center gap-0.5 text-rose-700 dark:text-rose-300">
                          <span className="inline-flex items-center gap-1.5">
                            <AlertTriangle
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Exceso {formatCentiKg(position.excessKg100)}
                          </span>
                          <span className="text-[0.625rem] font-semibold">
                            Congelado por encima del origen
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 text-brand-800">
                          <Snowflake className="size-3.5" aria-hidden="true" />
                          {formatCentiKg(position.pendingKg100)}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </DataTableScroll>

      {useScroll ? (
        <p className="border-t border-slate-100 px-4 py-2 text-[0.6875rem] text-slate-500">
          {positions.length} lotes · header fijo al desplazarte · primero
          excesos, luego FIFO
        </p>
      ) : null}
    </SectionCard>
  )
}