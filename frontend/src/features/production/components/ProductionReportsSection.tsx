import type React from 'react'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type { ProductionCaptureDraft } from '../capture/productionCapture'
import { kg100 } from '../model/calculations'
import type { ReportFamilySubtotal } from '../model/businessRules'
import type { Kg100, ProductionDayCalculation, ProductionProcess } from '../model/types'
import { ProductPicker } from './ProductPicker'
import { ProductionCaptureTable } from './ProductionCaptureTable'
import { ProductionShiftCards } from './ProductionShiftCards'

export interface ProductionReportsSectionProps {
  readonly draft: ProductionCaptureDraft
  readonly calculation: ProductionDayCalculation
  readonly reportCatalogItems: readonly ProductionCatalogItem[]
  readonly freezingAvailabilityByProduct: ReadonlyMap<string, Kg100>
  readonly reportFamilySubtotals: readonly ReportFamilySubtotal[]
  readonly orderedProductIds: readonly string[]
  readonly dayHasReportData: boolean
  readonly nightHasReportData: boolean
  readonly isFreezing: boolean
  readonly isBalanceOnly: boolean
  readonly isEditingAllowed: boolean
  readonly mode: 'EXCEL' | 'MANUAL'
  readonly selectedProcess: ProductionProcess
  readonly searchInputRef: React.RefObject<HTMLInputElement | null>
  readonly getFreezingPotentialAvailabilityKg100: (productId: string) => Kg100
  readonly autoLinkFreezingProduct: (productId: string) => void
  readonly onAddReportProduct: (productId: string) => void
  readonly onUpdateRow: (
    rowKey: string,
    field: 'dayReportedKg' | 'nightReportedKg',
    value: string,
  ) => void
  readonly onRemoveRow: (rowKey: string) => void
  readonly getCaptureCellProps: (
    rowIndex: number,
    colIndex: number,
  ) => Record<string, unknown>
}

export function ProductionReportsSection({
  draft,
  calculation,
  reportCatalogItems,
  freezingAvailabilityByProduct,
  reportFamilySubtotals,
  orderedProductIds,
  dayHasReportData,
  nightHasReportData,
  isFreezing,
  isBalanceOnly,
  isEditingAllowed,
  mode,
  selectedProcess,
  searchInputRef,
  getFreezingPotentialAvailabilityKg100,
  autoLinkFreezingProduct,
  onAddReportProduct,
  onUpdateRow,
  onRemoveRow,
  getCaptureCellProps,
}: ProductionReportsSectionProps) {
  const isExplicit = draft.shiftAllocationMode === 'EXPLICIT'

  return (
    <SectionCard
      allowStickyContent
      title="Reportes Día / Noche"
      description={
        isExplicit
          ? 'Registra los productos informados por los supervisores y concilia cada turno.'
          : 'Día y Noche se distribuyen desde los totales del Excel y conservan su trazabilidad.'
      }
      action={
        <StatusBadge tone={isExplicit ? 'info' : 'warning'}>
          {isExplicit ? 'TURNOS EXPLÍCITOS' : 'REPARTO CONCILIADO'}
        </StatusBadge>
      }
    >
      <ProductionShiftCards
        dayShift={calculation.day}
        nightShift={calculation.night}
        dayHasReportData={dayHasReportData}
        nightHasReportData={nightHasReportData}
      />

      {mode === 'MANUAL' ? (
        <ProductPicker
          items={reportCatalogItems}
          getItemId={(product) => product.productId}
          getItemLabel={(product) => `${product.familyName} · ${product.productName}`}
          getItemMeta={(product) => ({
            group: product.familyName,
            secondaryText:
              selectedProcess !== 'PACKING'
                ? `Disponible: ${formatCentiKg(
                    freezingAvailabilityByProduct.get(product.productId) ??
                      kg100(0),
                  )}`
                : undefined,
          })}
          onAdd={(product) => onAddReportProduct(product.productId)}
          label="Buscar producto"
          placeholder="Buscar producto o seleccionar del catálogo (ej.: aleta, manto o nuca)..."
          buttonLabel="Agregar producto"
          buttonClassName={buttonStyles('primary')}
          scopeKey={`${selectedProcess}:REPORTS`}
          searchInputRef={searchInputRef}
        />
      ) : null}

      {draft.rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          Carga una captura de producción para construir la lista de productos de esta jornada.
        </div>
      ) : (
        <ProductionCaptureTable
          draft={draft}
          calculation={calculation}
          reportFamilySubtotals={reportFamilySubtotals}
          orderedProductIds={orderedProductIds}
          isFreezing={isFreezing}
          isBalanceOnly={isBalanceOnly}
          isEditingAllowed={isEditingAllowed}
          getFreezingPotentialAvailabilityKg100={getFreezingPotentialAvailabilityKg100}
          autoLinkFreezingProduct={autoLinkFreezingProduct}
          updateRow={onUpdateRow}
          removeRow={onRemoveRow}
          getCaptureCellProps={getCaptureCellProps}
        />
      )}
    </SectionCard>
  )
}

