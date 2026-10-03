import type React from 'react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type { ProductionCaptureRow } from '../capture/productionCapture'
import { captureQuantityKg100 } from '../capture/productionEntryHelpers'
import { sumKg100 } from '../model/calculations'
import type { Kg100, ProductionProcess } from '../model/types'
import { ProductPicker } from './ProductPicker'
import { QuantityInput } from './QuantityInput'

export interface ProductionTunnelSectionProps {
  readonly enabled: boolean
  readonly reportsReconciled: boolean
  readonly tunnelMovementRequired: boolean
  readonly dayKg100: Kg100
  readonly nightKg100: Kg100
  readonly totalKg100: Kg100
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly rows: readonly ProductionCaptureRow[]
  readonly selectedProcess: ProductionProcess
  readonly searchInputRef: React.RefObject<HTMLInputElement | null>
  readonly onAddProduct: (productId: string) => void
  readonly onUpdateRow: (
    rowKey: string,
    field: 'tunnelDayKg' | 'tunnelNightKg',
    value: string,
  ) => void
  readonly getTunnelCellProps: (
    rowIndex: number,
    colIndex: number,
  ) => Record<string, unknown>
}

export function ProductionTunnelSection({
  enabled,
  reportsReconciled,
  tunnelMovementRequired,
  dayKg100,
  nightKg100,
  totalKg100,
  catalogItems,
  rows,
  selectedProcess,
  searchInputRef,
  onAddProduct,
  onUpdateRow,
  getTunnelCellProps,
}: ProductionTunnelSectionProps) {
  if (!enabled) return null

  return (
    <SectionCard
      allowStickyContent
      title="Túnel"
      description="Registra producción adicional por turno sin mezclarla con los reportes del supervisor."
      action={
        <StatusBadge tone={reportsReconciled ? 'success' : 'warning'}>
          {reportsReconciled ? 'TÚNEL DISPONIBLE' : 'TÚNEL ESPERANDO CUADRE'}
        </StatusBadge>
      }
    >
      {tunnelMovementRequired ? (
        <p
          role="alert"
          className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 sm:px-5"
        >
          Se indicó que existe producto para Túnel, pero no se registraron
          productos.
        </p>
      ) : null}
      <fieldset
        disabled={!reportsReconciled}
        className="min-w-0 disabled:opacity-65"
      >
        <legend className="sr-only">Registro de producción de Túnel</legend>
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50/55 p-4 sm:grid-cols-3 sm:p-5">
          <MetricCard
            label="Túnel Día"
            value={formatCentiKg(dayKg100)}
          />
          <MetricCard
            label="Túnel Noche"
            value={formatCentiKg(nightKg100)}
          />
          <MetricCard
            label="Total Túnel"
            value={formatCentiKg(totalKg100)}
            tone="brand"
          />
        </div>
        <ProductPicker
          items={catalogItems}
          getItemId={(product) => product.productId}
          getItemLabel={(product) =>
            `${product.familyName} · ${product.productName}`
          }
          getItemMeta={(product) => ({
            group: product.familyName,
          })}
          onAdd={(product) => onAddProduct(product.productId)}
          label="Buscar producto de Túnel"
          placeholder="Ej.: manto, nuca o anillas"
          buttonLabel="Agregar a Túnel"
          disabled={!reportsReconciled}
          scopeKey={`${selectedProcess}:TUNNEL`}
          searchInputRef={searchInputRef}
        />

        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No hay productos de Túnel registrados.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((row, tunnelIdx) => {
              const tunnelTotalKg100 = sumKg100([
                captureQuantityKg100(row.tunnelDayKg),
                captureQuantityKg100(row.tunnelNightKg),
              ])

              return (
                <div
                  key={`tunnel-${row.key}`}
                  className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_8rem] sm:items-end sm:px-5"
                >
                  <div className="min-w-0 sm:self-center">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-brand-700">
                      {row.product.familyName}
                    </p>
                    <p
                      className="mt-0.5 truncate text-xs font-semibold text-slate-800"
                      title={row.product.productName}
                    >
                      {row.product.productName}
                    </p>
                  </div>
                  <QuantityInput
                    label="Kg Día"
                    value={row.tunnelDayKg}
                    disabled={!reportsReconciled}
                    onChange={(value) =>
                      onUpdateRow(row.key, 'tunnelDayKg', value)
                    }
                    {...getTunnelCellProps(tunnelIdx, 0)}
                  />
                  <QuantityInput
                    label="Kg Noche"
                    value={row.tunnelNightKg}
                    disabled={!reportsReconciled}
                    onChange={(value) =>
                      onUpdateRow(row.key, 'tunnelNightKg', value)
                    }
                    {...getTunnelCellProps(tunnelIdx, 1)}
                  />
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:min-h-10">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                      Total
                    </p>
                    <p className="number-tabular mt-0.5 text-right text-xs font-extrabold text-slate-900">
                      {formatCentiKg(tunnelTotalKg100)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </fieldset>
    </SectionCard>
  )
}

