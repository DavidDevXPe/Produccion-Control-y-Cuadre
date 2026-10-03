import type React from 'react'
import { Trash2 } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type { ProductionCaptureRow } from '../capture/productionCapture'
import type { ProductionBusinessSummary } from '../model/businessRules'
import type { ProductionProcess } from '../model/types'
import {
  ClosingBalanceRowControl,
  ClosingBalanceYieldControl,
} from './ClosingBalanceYieldControl'
import { ProductPicker } from './ProductPicker'
import { QuantityInput } from './QuantityInput'

export interface ProductionClosingSectionProps {
  readonly enabled: boolean
  readonly reportsReconciled: boolean
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly rows: readonly ProductionCaptureRow[]
  readonly businessSummary: ProductionBusinessSummary
  readonly selectedProcess: ProductionProcess
  readonly searchInputRef: React.RefObject<HTMLInputElement | null>
  readonly onAddProduct: (productId: string) => void
  readonly onUpdateRow: (rowKey: string, value: string) => void
  readonly onRemoveProduct: (rowKey: string) => void
}

export function ProductionClosingSection({
  enabled,
  reportsReconciled,
  catalogItems,
  rows,
  businessSummary,
  selectedProcess,
  searchInputRef,
  onAddProduct,
  onUpdateRow,
  onRemoveProduct,
}: ProductionClosingSectionProps) {
  if (!enabled) return null

  return (
    <SectionCard
      allowStickyContent
      title="Saldo generado al cierre"
      description="Registra únicamente producto real de esta jornada que quedará pendiente para después."
      action={<StatusBadge tone="info">JORNADA ORIGEN ACTUAL</StatusBadge>}
    >
      <fieldset disabled={!reportsReconciled} className="min-w-0 disabled:opacity-65">
        <legend className="sr-only">Saldo generado al cierre</legend>
        <ProductPicker
          items={catalogItems}
          getItemId={(product) => product.productId}
          getItemLabel={(product) => `${product.familyName} · ${product.productName}`}
          getItemMeta={(product) => ({
            group: product.familyName,
          })}
          onAdd={(product) => onAddProduct(product.productId)}
          label="Buscar producto para saldo"
          placeholder="Ej.: aleta, manto o nuca"
          buttonLabel="Agregar saldo"
          buttonClassName="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!reportsReconciled}
          scopeKey={`${selectedProcess}:CLOSING`}
          searchInputRef={searchInputRef}
        />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-4 lg:p-4">
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500 lg:px-1">
              Busca y agrega únicamente los productos que generaron saldo real.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {rows.map((row) => (
                <div
                  key={`closing-${row.key}`}
                  className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center sm:px-5 lg:px-1"
                >
                  <div className="min-w-0">
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
                  <div className="flex items-end gap-2">
                    <QuantityInput
                      label="Saldo al cierre"
                      value={row.closingBalanceKg}
                      disabled={!reportsReconciled}
                      onChange={(value) =>
                        onUpdateRow(row.key, value)
                      }
                      className="min-w-0 flex-1"
                    />

                    <button
                      type="button"
                      onClick={() => onRemoveProduct(row.key)}
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                      aria-label={`Eliminar saldo de ${row.product.productName}`}
                      title="Eliminar saldo"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <ClosingBalanceRowControl
                    summary={businessSummary}
                    summaryGroupId={row.product.summaryGroupId}
                  />
                </div>
              ))}
            </div>
          )}
          <ClosingBalanceYieldControl summary={businessSummary} />
        </div>
      </fieldset>
    </SectionCard>
  )
}

