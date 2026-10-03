import type React from 'react'
import { Trash2 } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type { ProductionCaptureRow } from '../capture/productionCapture'
import type { ProductionProcess } from '../model/types'
import { ProductPicker } from './ProductPicker'
import { QuantityInput } from './QuantityInput'

export interface ProductionTreatmentSectionProps {
  readonly enabled: boolean
  readonly reportsReconciled: boolean
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly rows: readonly ProductionCaptureRow[]
  readonly selectedProcess: ProductionProcess
  readonly searchInputRef: React.RefObject<HTMLInputElement | null>
  readonly onAddProduct: (productId: string) => void
  readonly onUpdateRow: (rowKey: string, value: string) => void
  readonly onRemoveProduct: (rowKey: string) => void
  readonly getTreatmentCellProps: (
    rowIndex: number,
    colIndex: number,
  ) => Record<string, unknown>
}

export function ProductionTreatmentSection({
  enabled,
  reportsReconciled,
  catalogItems,
  rows,
  selectedProcess,
  searchInputRef,
  onAddProduct,
  onUpdateRow,
  onRemoveProduct,
  getTreatmentCellProps,
}: ProductionTreatmentSectionProps) {
  if (!enabled) return null

  return (
    <SectionCard
      allowStickyContent
      title="Tratamiento"
      description="Registra movimientos de tratamiento de forma independiente al reporte de los turnos."
      action={
        <StatusBadge tone={reportsReconciled ? 'success' : 'warning'}>
          {reportsReconciled ? 'DISPONIBLE' : 'ESPERANDO CUADRE DE TURNOS'}
        </StatusBadge>
      }
    >
      <fieldset
        disabled={!reportsReconciled}
        className="min-w-0 disabled:opacity-65"
      >
        <legend className="sr-only">Registro de tratamiento</legend>
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
          label="Buscar producto de tratamiento"
          placeholder="Ej.: aleta, manto o nuca"
          buttonLabel="Agregar tratamiento"
          disabled={!reportsReconciled}
          scopeKey={`${selectedProcess}:TREATMENT`}
          searchInputRef={searchInputRef}
        />

        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No hay productos de tratamiento registrados.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((row, treatmentIdx) => (
              <div
                key={`treatment-${row.key}`}
                className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_10rem_2.5rem] sm:items-end sm:px-5"
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
                  label="Kg tratamiento"
                  value={row.treatmentKg}
                  disabled={!reportsReconciled}
                  onChange={(value) => onUpdateRow(row.key, value)}
                  {...getTreatmentCellProps(treatmentIdx, 0)}
                />

                <button
                  type="button"
                  onClick={() => onRemoveProduct(row.key)}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                  aria-label={`Eliminar tratamiento de ${row.product.productName}`}
                  title="Eliminar de tratamiento"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </fieldset>
    </SectionCard>
  )
}

