import { Fragment } from 'react'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { captureProductAvailability } from '../capture/productionEntryHelpers'
import type { ProductionCaptureDraft } from '../capture/productionCapture'
import { kg100 } from '../model/calculations'
import type { ReportFamilySubtotal } from '../model/businessRules'
import type { Kg100, ProductionDayCalculation } from '../model/types'
import { CaptureFamilyBand } from './captureTable/CaptureFamilyBand'
import { CaptureProductRow } from './captureTable/CaptureProductRow'
import { CaptureSubtotalRow } from './captureTable/CaptureSubtotalRow'
import { CaptureTableHeader } from './captureTable/CaptureTableHeader'

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
    <DataTableScroll label="Captura por producto y turno" showEdgeIndicators={false} className="data-scroll-clean-edge">
      <table className="erp-table w-full min-w-[70rem] table-fixed border-collapse text-left">
        <CaptureTableHeader isFreezing={isFreezing} />
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

            return (
              <Fragment key={subtotal.key}>
                <CaptureFamilyBand
                  label={subtotal.label}
                  count={subtotal.productIds.length}
                />
                {subtotal.productIds.map((productId) => {
                  const row = draft.rows.find(
                    (candidate) => candidate.product.productId === productId,
                  )!
                  const calculated = calculation.products.find(
                    (candidate) => candidate.productId === productId,
                  )
                  const linkedAvailability = isFreezing
                    ? captureProductAvailability(draft, productId)
                    : null
                  const availableKg100 = isFreezing
                    ? getFreezingPotentialAvailabilityKg100(productId)
                    : kg100(0)
                  const linkedKg100 =
                    linkedAvailability?.frozenKg100 ?? kg100(0)
                  const rowIndex = orderedProductIds.indexOf(productId)

                  return (
                    <CaptureProductRow
                      key={row.key}
                      row={row}
                      calculated={calculated}
                      draft={draft}
                      isFreezing={isFreezing}
                      isEditingAllowed={isEditingAllowed}
                      rowIndex={rowIndex}
                      availableKg100={availableKg100}
                      linkedKg100={linkedKg100}
                      updateRow={updateRow}
                      removeRow={removeRow}
                      autoLinkFreezingProduct={autoLinkFreezingProduct}
                      getCaptureCellProps={getCaptureCellProps}
                    />
                  )
                })}
                <CaptureSubtotalRow
                  subtotal={subtotal}
                  isFreezing={isFreezing}
                  isBalanceOnly={isBalanceOnly}
                  familyTraceability={familyTraceability}
                />
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </DataTableScroll>
  )
}
