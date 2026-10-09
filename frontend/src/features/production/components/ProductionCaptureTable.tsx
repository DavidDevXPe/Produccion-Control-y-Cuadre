import { Fragment } from 'react'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { captureQuantityKg100 } from '../capture/productionEntryHelpers'
import type { ProductionCaptureDraft } from '../capture/productionCapture'
import { kg100, sumKg100 } from '../model/calculations'
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
      <table className="erp-table w-full min-w-[76rem] table-fixed border-collapse text-left">
        <CaptureTableHeader isFreezing={isFreezing} process={draft.process} />
        <tbody>
          {reportFamilySubtotals.map((subtotal) => {
            const familyTraceability = subtotal.productIds.reduce(
              (total, productId) => {
                const row = draft.rows.find(
                  (candidate) => candidate.product.productId === productId,
                )
                const productReportedKg100 = row
                  ? sumKg100([
                      captureQuantityKg100(row.dayReportedKg),
                      captureQuantityKg100(row.nightReportedKg),
                    ])
                  : kg100(0)
                const availableKg100 =
                  getFreezingPotentialAvailabilityKg100(productId)
                const linkedKg100 = kg100(
                  Math.min(productReportedKg100, availableKg100),
                )

                return {
                  availableKg100: kg100(total.availableKg100 + availableKg100),
                  linkedKg100: kg100(total.linkedKg100 + linkedKg100),
                }
              },
              {
                availableKg100: kg100(0),
                linkedKg100: kg100(0),
              },
            )

            const hasStageComparison = isFreezing || draft.process !== 'PACKING'

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
                  const productReportedKg100 = sumKg100([
                    captureQuantityKg100(row.dayReportedKg),
                    captureQuantityKg100(row.nightReportedKg),
                  ])
                  const availableKg100 = hasStageComparison
                    ? getFreezingPotentialAvailabilityKg100(productId)
                    : kg100(0)
                  const linkedKg100 = hasStageComparison
                    ? kg100(Math.min(productReportedKg100, availableKg100))
                    : kg100(0)
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
                  process={draft.process}
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
