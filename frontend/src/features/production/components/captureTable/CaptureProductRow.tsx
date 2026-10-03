import { Circle, Trash2 } from 'lucide-react'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKgValue } from '../../../../utils/formatters'
import type {
  ProductionCaptureDraft,
  ProductionCaptureRow,
} from '../../capture/productionCapture'
import { kg100, sumKg100 } from '../../model/calculations'
import type { Kg100, ProductionDayCalculation } from '../../model/types'
import {
  freezingTraceabilityStatus,
  packingProductStatus,
} from '../../pages/captureProductStatus'
import { QuantityInput } from '../QuantityInput'

export interface CaptureProductRowProps {
  readonly row: ProductionCaptureRow
  readonly calculated: ProductionDayCalculation['products'][number] | undefined
  readonly draft: ProductionCaptureDraft
  readonly isFreezing: boolean
  readonly isEditingAllowed: boolean
  readonly rowIndex: number
  readonly availableKg100: Kg100
  readonly linkedKg100: Kg100
  readonly updateRow: (
    rowKey: string,
    field: 'dayReportedKg' | 'nightReportedKg',
    value: string,
  ) => void
  readonly removeRow: (rowKey: string) => void
  readonly autoLinkFreezingProduct: (productId: string) => void
  readonly getCaptureCellProps: (
    rowIndex: number,
    colIndex: number,
  ) => Record<string, unknown>
}

export function CaptureProductRow({
  row,
  calculated,
  draft,
  isFreezing,
  isEditingAllowed,
  rowIndex,
  availableKg100,
  linkedKg100,
  updateRow,
  removeRow,
  autoLinkFreezingProduct,
  getCaptureCellProps,
}: CaptureProductRowProps) {
  const inferred = draft.shiftAllocationMode === 'RECONCILED_INFERENCE'
  const totalKg100 = sumKg100([
    calculated?.day.reportedKg100 ?? kg100(0),
    calculated?.night.reportedKg100 ?? kg100(0),
  ])

  const productStatus = isFreezing
    ? freezingTraceabilityStatus(totalKg100, availableKg100, linkedKg100)
    : {
        ...packingProductStatus(totalKg100),
        pendingToLinkKg100: kg100(0),
      }

  return (
    <tr
      key={row.key}
      className={`group border-b border-slate-100 bg-white transition-colors hover:bg-brand-50/25 focus-within:bg-brand-50/50 dark:border-ui-line-dark-grid dark:bg-transparent dark:hover:bg-ui-surface-dark-compact/70 dark:focus-within:bg-ui-surface-dark-compact/80 ${
        totalKg100 > 0 ? 'bg-emerald-50/15 dark:bg-emerald-950/20' : ''
      }`}
    >
      <th
        className={`sticky left-0 z-10 border-l-2 border-r border-slate-200 px-4 py-2 transition-colors bg-white group-hover:bg-brand-50/25 group-focus-within:bg-brand-50/50 group-focus-within:border-l-brand-600 dark:border-r-ui-line-navy dark:bg-ui-surface-dark-canvas dark:group-hover:bg-ui-surface-dark-compact dark:group-focus-within:bg-ui-surface-dark-compact dark:group-focus-within:border-l-brand-500 ${
          totalKg100 > 0
            ? 'border-l-emerald-500 dark:border-l-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/30'
            : 'border-l-transparent'
        }`}
      >
        <span className="sr-only">{row.product.familyName}: </span>
        <span className="block text-xs font-semibold leading-relaxed text-slate-800 dark:text-ui-text-dark">
          {row.product.productName}
        </span>
      </th>
      <td className="px-2 py-1.5">
        <QuantityInput
          label=""
          value={
            inferred
              ? String((calculated?.day.reportedKg100 ?? 0) / 100)
              : row.dayReportedKg
          }
          readOnly={inferred}
          onChange={(value) => updateRow(row.key, 'dayReportedKg', value)}
          {...getCaptureCellProps(rowIndex, 0)}
        />
      </td>
      <td className="px-2 py-1.5">
        <QuantityInput
          label=""
          value={
            inferred
              ? String((calculated?.night.reportedKg100 ?? 0) / 100)
              : row.nightReportedKg
          }
          readOnly={inferred}
          onChange={(value) => updateRow(row.key, 'nightReportedKg', value)}
          {...getCaptureCellProps(rowIndex, 1)}
        />
      </td>
      <td
        className={`number-tabular px-3 py-2 text-right text-xs ${
          totalKg100 > 0
            ? 'font-bold text-slate-900 dark:text-white'
            : 'font-normal text-slate-400 dark:text-slate-500'
        }`}
      >
        <span>{formatCentiKgValue(totalKg100)}</span>
        <span
          className={`ml-1 text-[0.6875rem] font-medium ${
            totalKg100 > 0
              ? 'text-slate-600 dark:text-slate-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          kg
        </span>
      </td>
      <td className="number-tabular px-3 py-2 text-right text-xs text-slate-700 dark:text-slate-300">
        {isFreezing ? (
          <>
            <span className="font-semibold text-slate-800 dark:text-white">
              {formatCentiKgValue(availableKg100)}
            </span>
            <span className="ml-1 text-[0.6875rem] font-medium text-slate-500 dark:text-slate-400">
              kg
            </span>
          </>
        ) : (
          '—'
        )}
      </td>

      <td className="number-tabular px-3 py-2 text-right text-xs text-slate-700 dark:text-slate-300">
        {isFreezing ? (
          <>
            <span className="font-semibold text-slate-800 dark:text-white">
              {formatCentiKgValue(linkedKg100)}
            </span>
            <span className="ml-1 text-[0.6875rem] font-medium text-slate-500 dark:text-slate-400">
              kg
            </span>
          </>
        ) : (
          '—'
        )}
      </td>

      <td
        className={`number-tabular px-3 py-2 text-right text-xs ${
          isFreezing && productStatus.pendingToLinkKg100 > 0
            ? 'font-bold text-amber-700 dark:text-amber-400'
            : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {isFreezing ? (
          <>
            <span>{formatCentiKgValue(productStatus.pendingToLinkKg100)}</span>
            <span className="ml-1 text-[0.6875rem] font-medium">kg</span>
          </>
        ) : (
          '—'
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-center align-middle">
        <div className="flex flex-col items-center gap-1.5">
          {productStatus.label === 'SIN MOVIMIENTO' ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Circle
                className="size-2 fill-slate-400 text-slate-400 dark:fill-slate-500 dark:text-slate-400"
                aria-hidden="true"
              />
              <span aria-label="Sin movimiento">Sin mov.</span>
            </span>
          ) : (
            <StatusBadge tone={productStatus.tone} truncateText={false}>
              {productStatus.label}
            </StatusBadge>
          )}

          {isFreezing &&
          productStatus.pendingToLinkKg100 > 0 &&
          availableKg100 > linkedKg100 ? (
            <button
              type="button"
              onClick={() => autoLinkFreezingProduct(row.product.productId)}
              className="inline-flex min-h-7 items-center justify-center rounded-md border border-amber-300 bg-amber-50 px-2.5 text-[0.6875rem] font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
              aria-label={`Vincular FIFO ${row.product.productName}`}
              title="Consume primero la jornada de Envasado pendiente más antigua para este producto"
            >
              Vincular FIFO
            </button>
          ) : null}
        </div>
      </td>
      <td className="px-2 py-1.5 text-center">
        <button
          type="button"
          disabled={!isEditingAllowed}
          className="inline-grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Quitar producto ${row.product.productName}`}
          onClick={() => removeRow(row.key)}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </td>
    </tr>
  )
}
