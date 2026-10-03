import { Circle, Trash2 } from 'lucide-react'
import { Fragment } from 'react'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKgValue } from '../../../utils/formatters'
import { captureProductAvailability } from '../capture/productionEntryHelpers'
import type { ProductionCaptureDraft } from '../capture/productionCapture'
import { kg100, sumKg100 } from '../model/calculations'
import type { ReportFamilySubtotal } from '../model/businessRules'
import type { Kg100, ProductionDayCalculation } from '../model/types'
import {
  freezingTraceabilityStatus,
  packingProductStatus,
} from '../pages/captureProductStatus'
import { QuantityInput } from './QuantityInput'

export interface ProductionCaptureTableProps {
  readonly draft: ProductionCaptureDraft
  readonly calculation: ProductionDayCalculation
  readonly reportFamilySubtotals: readonly ReportFamilySubtotal[]
  readonly orderedProductIds: readonly string[]
  readonly isFreezing: boolean
  readonly isBalanceOnly: boolean
  readonly isEditingAllowed: boolean
  readonly getFreezingPotentialAvailabilityKg100: (productId: string) => Kg100
  readonly autoLinkFreezingProduct: (productId: string) => void
  readonly updateRow: (
    rowKey: string,
    field: 'dayReportedKg' | 'nightReportedKg',
    value: string,
  ) => void
  readonly removeRow: (rowKey: string) => void
  readonly getCaptureCellProps: (
    rowIndex: number,
    colIndex: number,
  ) => Record<string, unknown>
}

export function ProductionCaptureTable({
  draft,
  calculation,
  reportFamilySubtotals,
  orderedProductIds,
  isFreezing,
  isBalanceOnly,
  isEditingAllowed,
  getFreezingPotentialAvailabilityKg100,
  autoLinkFreezingProduct,
  updateRow,
  removeRow,
  getCaptureCellProps,
}: ProductionCaptureTableProps) {
  return (
    <DataTableScroll label="Captura por producto y turno">
      <table className="erp-table w-full min-w-[70rem] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[28%] min-w-[15rem]" />
          <col className="w-[11.5%] min-w-[8.75rem]" />
          <col className="w-[11.5%] min-w-[8.75rem]" />
          <col className="w-[10%] min-w-[7rem]" />
          <col className="w-[9.5%] min-w-[6.5rem]" />
          <col className="w-[8%] min-w-[6rem]" />
          <col className="w-[9.5%] min-w-[6.5rem]" />
          <col className="w-[12%] min-w-[8.5rem]" />
          <col className="w-[3rem] min-w-[3rem]" />
        </colgroup>
        <caption className="sr-only">Ingreso de producción por producto</caption>
        <thead>
          <tr className="border-b-2 border-slate-300 bg-slate-100 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-800 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-canvas dark:text-ui-text-dark-subtle">
            <th className="sticky left-0 z-20 border-r border-slate-300 bg-slate-100 px-4 py-2.5 text-left dark:border-r-ui-line-navy dark:bg-ui-surface-dark-canvas dark:text-ui-text-dark-subtle">
              Familia / producto
            </th>
            <th className="px-2 py-2.5 text-right leading-tight">Día reportado</th>
            <th className="px-2 py-2.5 text-right leading-tight">Noche reportado</th>
            <th className="px-3 py-2.5 text-right leading-tight">Total jornada</th>
            <th className="px-2.5 py-2.5 text-right leading-tight">
              {isFreezing ? 'Disponible' : 'Rend. preliminar'}
            </th>
            <th className="px-2.5 py-2.5 text-right leading-tight">
              {isFreezing ? 'Vinculado' : 'Objetivo'}
            </th>
            <th className="px-2.5 py-2.5 text-right leading-tight">
              {isFreezing ? 'Por vincular' : 'Kg faltantes'}
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-center">Estado</th>
            <th className="w-12 px-2 py-2.5 text-center">
              <span className="sr-only">Eliminar</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {reportFamilySubtotals.map((subtotal) => {
            const familyTraceability = subtotal.productIds.reduce(
              (total, productId) => {
                const linkedAvailability = captureProductAvailability(
                  draft,
                  productId,
                )
                const availableKg100 =
                  getFreezingPotentialAvailabilityKg100(productId)

                return {
                  availableKg100: kg100(total.availableKg100 + availableKg100),
                  linkedKg100: kg100(
                    total.linkedKg100 + linkedAvailability.frozenKg100,
                  ),
                }
              },
              {
                availableKg100: kg100(0),
                linkedKg100: kg100(0),
              },
            )

            const familyTraceabilityStatus = freezingTraceabilityStatus(
              subtotal.totalKg100,
              familyTraceability.availableKg100,
              familyTraceability.linkedKg100,
            )

            return (
              <Fragment key={subtotal.key}>
                <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-canvas/90">
                  <th
                    colSpan={9}
                    className="sticky left-0 z-10 border-l-4 border-l-brand-600 bg-slate-100/70 px-4 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-800 dark:border-l-brand-500 dark:bg-ui-surface-dark-canvas/90 dark:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <span>{subtotal.label}</span>
                      <span className="inline-flex items-center rounded-full border border-brand-200/80 bg-brand-50/70 px-2 py-0.5 text-[0.625rem] font-semibold text-brand-700 dark:border-ui-line-navy dark:bg-ui-surface-dark-compact dark:text-ui-text-dark-subtle">
                        {subtotal.productIds.length}{' '}
                        {subtotal.productIds.length === 1
                          ? 'producto'
                          : 'productos'}
                      </span>
                    </div>
                  </th>
                </tr>
                {subtotal.productIds.map((productId) => {
                  const row = draft.rows.find(
                    (candidate) => candidate.product.productId === productId,
                  )!
                  const calculated = calculation.products.find(
                    (candidate) => candidate.productId === productId,
                  )
                  const inferred =
                    draft.shiftAllocationMode === 'RECONCILED_INFERENCE'
                  const totalKg100 = sumKg100([
                    calculated?.day.reportedKg100 ?? kg100(0),
                    calculated?.night.reportedKg100 ?? kg100(0),
                  ])
                  const linkedAvailability = isFreezing
                    ? captureProductAvailability(draft, productId)
                    : null
                  const availableKg100 = isFreezing
                    ? getFreezingPotentialAvailabilityKg100(productId)
                    : kg100(0)
                  const linkedKg100 =
                    linkedAvailability?.frozenKg100 ?? kg100(0)
                  const productStatus = isFreezing
                    ? freezingTraceabilityStatus(
                        totalKg100,
                        availableKg100,
                        linkedKg100,
                      )
                    : {
                        ...packingProductStatus(totalKg100),
                        pendingToLinkKg100: kg100(0),
                      }
                  const rowIndex = orderedProductIds.indexOf(productId)
                  return (
                    <tr
                      key={row.key}
                      className={`group border-b border-slate-100 bg-white transition-colors hover:bg-brand-50/25 focus-within:bg-brand-50/50 dark:border-ui-line-dark-grid dark:bg-transparent dark:hover:bg-ui-surface-dark-compact/70 dark:focus-within:bg-ui-surface-dark-compact/80 ${
                        totalKg100 > 0
                          ? 'bg-emerald-50/15 dark:bg-emerald-950/20'
                          : ''
                      }`}
                    >
                      <th
                        className={`sticky left-0 z-10 border-l-2 border-r border-slate-200 px-4 py-2 transition-colors bg-white group-hover:bg-brand-50/25 group-focus-within:bg-brand-50/50 group-focus-within:border-l-brand-600 dark:border-r-ui-line-navy dark:bg-ui-surface-dark-canvas dark:group-hover:bg-ui-surface-dark-compact dark:group-focus-within:bg-ui-surface-dark-compact dark:group-focus-within:border-l-brand-500 ${
                          totalKg100 > 0
                            ? 'border-l-emerald-500 dark:border-l-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/30'
                            : 'border-l-transparent'
                        }`}
                      >
                        <span className="sr-only">
                          {row.product.familyName}:{' '}
                        </span>
                        <span className="block text-xs font-semibold leading-relaxed text-slate-800 dark:text-ui-text-dark">
                          {row.product.productName}
                        </span>
                      </th>
                      <td className="px-2 py-1.5">
                        <QuantityInput
                          label=""
                          value={
                            inferred
                              ? String(
                                  (calculated?.day.reportedKg100 ?? 0) / 100,
                                )
                              : row.dayReportedKg
                          }
                          readOnly={inferred}
                          onChange={(value) =>
                            updateRow(row.key, 'dayReportedKg', value)
                          }
                          {...getCaptureCellProps(rowIndex, 0)}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <QuantityInput
                          label=""
                          value={
                            inferred
                              ? String(
                                  (calculated?.night.reportedKg100 ?? 0) / 100,
                                )
                              : row.nightReportedKg
                          }
                          readOnly={inferred}
                          onChange={(value) =>
                            updateRow(row.key, 'nightReportedKg', value)
                          }
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
                            <span>
                              {formatCentiKgValue(
                                productStatus.pendingToLinkKg100,
                              )}
                            </span>
                            <span className="ml-1 text-[0.6875rem] font-medium">
                              kg
                            </span>
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
                            <StatusBadge
                              tone={productStatus.tone}
                              truncateText={false}
                            >
                              {productStatus.label}
                            </StatusBadge>
                          )}

                          {isFreezing &&
                          productStatus.pendingToLinkKg100 > 0 &&
                          availableKg100 > linkedKg100 ? (
                            <button
                              type="button"
                              onClick={() => autoLinkFreezingProduct(productId)}
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
                })}
                <tr className="border-b border-slate-200 border-t-2 border-slate-300 bg-slate-50/90 font-bold dark:border-b-ui-line-dark-grid dark:border-t-2 dark:border-t-ui-line-navy dark:bg-ui-surface-dark-recessed/90">
                  <th className="sticky left-0 z-10 border-r border-slate-200 border-t-2 border-slate-300 bg-slate-50/90 px-4 py-2 text-xs uppercase text-slate-800 dark:border-r-ui-line-navy dark:border-t-2 dark:border-t-ui-line-navy dark:bg-ui-surface-dark-recessed/90 dark:text-white">
                    Subtotal {subtotal.label}
                  </th>
                  <td
                    className={`number-tabular px-3 py-2 text-right text-xs ${
                      subtotal.dayKg100 > 0
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'font-normal text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span>{formatCentiKgValue(subtotal.dayKg100)}</span>
                    <span
                      className={`ml-1 text-[0.6875rem] font-medium ${
                        subtotal.dayKg100 > 0
                          ? 'text-slate-600 dark:text-slate-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      kg
                    </span>
                  </td>
                  <td
                    className={`number-tabular px-3 py-2 text-right text-xs ${
                      subtotal.nightKg100 > 0
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'font-normal text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span>{formatCentiKgValue(subtotal.nightKg100)}</span>
                    <span
                      className={`ml-1 text-[0.6875rem] font-medium ${
                        subtotal.nightKg100 > 0
                          ? 'text-slate-600 dark:text-slate-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      kg
                    </span>
                  </td>
                  <td
                    className={`number-tabular px-3 py-2 text-right text-xs ${
                      subtotal.totalKg100 > 0
                        ? 'font-extrabold text-brand-700 dark:text-sky-300'
                        : 'font-normal text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span>{formatCentiKgValue(subtotal.totalKg100)}</span>
                    <span
                      className={`ml-1 text-[0.6875rem] font-medium ${
                        subtotal.totalKg100 > 0
                          ? 'text-brand-600/80 dark:text-slate-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      kg
                    </span>
                  </td>
                  <td className="number-tabular px-3 py-2 text-right text-xs">
                    {isFreezing ? (
                      <>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {formatCentiKgValue(familyTraceability.availableKg100)}
                        </span>
                        <span className="ml-1 text-[0.6875rem] font-medium text-slate-500 dark:text-slate-400">
                          kg
                        </span>
                      </>
                    ) : isBalanceOnly ? (
                      'No aplica'
                    ) : subtotal.preliminaryYieldPercent === null ? (
                      <span
                        title="Rendimiento disponible al ingresar kg"
                        aria-label="Rendimiento disponible al ingresar kg"
                        className="text-slate-400 dark:text-slate-500"
                      >
                        —
                      </span>
                    ) : (
                      <span
                        className={
                          subtotal.totalKg100 > 0 &&
                          subtotal.targetPercent !== null
                            ? subtotal.status === 'COMPLIES'
                              ? 'font-bold text-emerald-700 dark:text-emerald-400'
                              : 'font-bold text-amber-700 dark:text-amber-400'
                            : 'font-semibold text-slate-800 dark:text-white'
                        }
                      >
                        {`${subtotal.preliminaryYieldPercent.toFixed(2)}%`}
                      </span>
                    )}
                  </td>
                  <td className="number-tabular px-3 py-2 text-right text-xs text-slate-700 dark:text-slate-300">
                    {isFreezing ? (
                      <>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {formatCentiKgValue(familyTraceability.linkedKg100)}
                        </span>
                        <span className="ml-1 text-[0.6875rem] font-medium text-slate-500 dark:text-slate-400">
                          kg
                        </span>
                      </>
                    ) : isBalanceOnly ? (
                      'No aplica'
                    ) : subtotal.totalKg100 === 0 ? (
                      '—'
                    ) : subtotal.targetPercent === null ? (
                      '—'
                    ) : (
                      `≥ ${subtotal.targetPercent.toFixed(0)}%`
                    )}
                  </td>
                  <td className="number-tabular px-3 py-2 text-right text-xs text-slate-700 dark:text-slate-300">
                    {isFreezing ? (
                      <>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {formatCentiKgValue(
                            familyTraceabilityStatus.pendingToLinkKg100,
                          )}
                        </span>
                        <span className="ml-1 text-[0.6875rem] font-medium text-slate-500 dark:text-slate-400">
                          kg
                        </span>
                      </>
                    ) : isBalanceOnly ||
                      subtotal.targetPercent === null ||
                      subtotal.totalKg100 === 0 ? (
                      '—'
                    ) : (
                      <>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCentiKgValue(subtotal.missingToTargetKg100)}
                        </span>
                        <span className="ml-1 text-[0.6875rem] font-medium text-slate-600 dark:text-slate-400">
                          kg
                        </span>
                      </>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-center">
                    <StatusBadge
                      tone={
                        isFreezing
                          ? familyTraceabilityStatus.tone
                          : isBalanceOnly
                            ? 'neutral'
                            : subtotal.totalKg100 === 0
                              ? 'neutral'
                              : subtotal.status === 'INTEGRITY_ERROR'
                                ? 'danger'
                                : subtotal.status === 'BELOW_TARGET'
                                  ? 'warning'
                                  : subtotal.status === 'COMPLIES'
                                    ? 'success'
                                    : 'neutral'
                      }
                      showIcon={
                        isFreezing
                          ? true
                          : isBalanceOnly ||
                              subtotal.totalKg100 === 0 ||
                              subtotal.targetPercent === null
                            ? false
                            : true
                      }
                      truncateText={false}
                    >
                      {isFreezing
                        ? familyTraceabilityStatus.label
                        : isBalanceOnly
                          ? 'NO APLICA'
                          : subtotal.totalKg100 === 0
                            ? 'SIN DATOS'
                            : subtotal.status === 'INTEGRITY_ERROR'
                              ? 'ERROR'
                              : subtotal.status === 'BELOW_TARGET'
                                ? 'BAJO OBJETIVO'
                                : subtotal.status === 'COMPLIES'
                                  ? 'CUMPLE'
                                  : 'SIN OBJETIVO'}
                    </StatusBadge>
                  </td>
                  <td />
                </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </DataTableScroll>
  )
}

