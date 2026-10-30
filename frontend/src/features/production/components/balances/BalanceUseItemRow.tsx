import type { KeyboardEvent } from 'react'
import { formatCentiKg } from '../../../../utils/formatters'
import type { ProductionCatalogItem } from '../../capture/productionCatalog'
import type { ProductionCaptureBalanceUse } from '../../capture/productionCapture'
import { captureBalancePosition } from '../../capture/productionEntryHelpers'
import type { BalanceShiftDiagnostic } from '../../model/businessRules'
import {
  BalanceUseHeader,
  BalanceUseMetrics,
  type BalanceUseStatus,
} from './BalanceUseItemSections'

export interface BalanceUseItemRowProps {
  readonly balance: ProductionCaptureBalanceUse
  readonly balanceIdx: number
  readonly isFreezing: boolean
  readonly prevProcessName?: string
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly balanceShiftDiagnostics: readonly BalanceShiftDiagnostic[]
  readonly dayShiftAvailable: boolean
  readonly nightShiftAvailable: boolean
  readonly onRemoveBalanceUse: (key: string) => void
  readonly onDistributeLegacyBalance: (key: string, productId: string) => void
  readonly onUpdateBalanceUse: (
    key: string,
    field: 'dayKg' | 'nightKg',
    value: string,
  ) => void
  readonly getBalancesCellProps: (
    rowIndex: number,
    colIndex: number,
  ) => {
    'data-grid-id': string
    'data-grid-row': number
    'data-grid-col': number
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  }
}

function getBalanceStatus(
  requiresProductDistribution: boolean,
  position: ReturnType<typeof captureBalancePosition>,
  diagnosticCount: number,
): BalanceUseStatus {
  if (requiresProductDistribution) {
    return { tone: 'warning', label: 'REQUIERE DISTRIBUCIÓN' }
  }
  if (position.overusedKg100 > 0 || diagnosticCount > 0) {
    return { tone: 'danger', label: 'REVISAR' }
  }
  if (position.pendingKg100 === 0) {
    return { tone: 'success', label: 'CONSUMIDO' }
  }
  return { tone: 'warning', label: 'PENDIENTE' }
}

function LegacyBalanceDistribution({
  balance,
  catalogItems,
  onDistribute,
}: {
  readonly balance: ProductionCaptureBalanceUse
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly onDistribute: (key: string, productId: string) => void
}) {
  if (balance.requiresProductDistribution !== true) return null

  return (
    <div
      role="alert"
      className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 dark:border-amber-500/30 dark:bg-amber-500/10"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-amber-900 dark:text-amber-200">
            Requiere distribución
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-100">
            Este saldo histórico solo identifica la familia. Selecciona el
            producto comercial exacto; el sistema no lo asignará automáticamente.
          </p>
        </div>

        <label className="min-w-0 sm:w-[28rem]">
          <span className="mb-1 block text-[0.6875rem] font-bold text-amber-900 dark:text-amber-200">
            Producto exacto
          </span>
          <select
            value=""
            onChange={(event) => onDistribute(balance.key, event.target.value)}
            className="h-10 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-400 dark:border-amber-500/30 dark:bg-ui-surface-dark-recessed dark:text-ui-text-dark-strong"
          >
            <option value="">Seleccionar producto…</option>
            {catalogItems
              .filter(
                (product) =>
                  product.familyId === balance.familyId && product.active !== false,
              )
              .map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.productName}
                </option>
              ))}
          </select>
        </label>
      </div>
    </div>
  )
}

function BalanceShiftDiagnostics({
  diagnostics,
}: {
  readonly diagnostics: readonly BalanceShiftDiagnostic[]
}) {
  if (diagnostics.length === 0) return null

  return (
    <div
      role="alert"
      className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
    >
      <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em]">
        Saldo anterior mal distribuido
      </p>
      {diagnostics.map((diagnostic) => (
        <div
          key={`${diagnostic.productId}-${diagnostic.shift}`}
          className="mt-2 text-xs leading-5"
        >
          <p className="font-bold">
            {diagnostic.productName} · Turno{' '}
            {diagnostic.shift === 'DAY' ? 'Día' : 'Noche'}
          </p>
          <p>
            Reporte físico: {formatCentiKg(diagnostic.reportedKg100)} · Saldo
            asignado: {formatCentiKg(diagnostic.assignedBalanceKg100)} · Máximo
            consumible: {formatCentiKg(diagnostic.maximumConsumableKg100)} · Exceso:{' '}
            {formatCentiKg(diagnostic.excessKg100)}
          </p>
          <p className="mt-1">
            El saldo asignado supera los kg físicamente reportados para este producto.
            Redistribuye el consumo entre Día/Noche o deja el remanente pendiente.
          </p>
        </div>
      ))}
    </div>
  )
}

export function BalanceUseItemRow({
  balance,
  balanceIdx,
  isFreezing,
  prevProcessName,
  catalogItems,
  balanceShiftDiagnostics,
  dayShiftAvailable,
  nightShiftAvailable,
  onRemoveBalanceUse,
  onDistributeLegacyBalance,
  onUpdateBalanceUse,
  getBalancesCellProps,
}: BalanceUseItemRowProps) {
  const position = captureBalancePosition(balance)
  const productShiftDiagnostics = balanceShiftDiagnostics.filter(
    (diagnostic) => diagnostic.productId === balance.productId,
  )
  const balanceStatus = getBalanceStatus(
    balance.requiresProductDistribution === true,
    position,
    productShiftDiagnostics.length,
  )

  return (
    <div className="px-4 py-4 sm:px-5">
      <BalanceUseHeader
        balance={balance}
        isFreezing={isFreezing}
        {...(prevProcessName ? { prevProcessName } : {})}
        onRemoveBalanceUse={onRemoveBalanceUse}
      />
      <LegacyBalanceDistribution
        balance={balance}
        catalogItems={catalogItems}
        onDistribute={onDistributeLegacyBalance}
      />
      <BalanceUseMetrics
        balance={balance}
        balanceIdx={balanceIdx}
        isFreezing={isFreezing}
        position={position}
        balanceStatus={balanceStatus}
        dayShiftAvailable={dayShiftAvailable}
        nightShiftAvailable={nightShiftAvailable}
        onUpdateBalanceUse={onUpdateBalanceUse}
        getBalancesCellProps={getBalancesCellProps}
      />
      <BalanceShiftDiagnostics diagnostics={productShiftDiagnostics} />
    </div>
  )
}
