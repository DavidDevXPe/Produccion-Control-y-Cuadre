import type { KeyboardEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg, formatIsoDate } from '../../../../utils/formatters'
import type { ProductionCatalogItem } from '../../capture/productionCatalog'
import type { ProductionCaptureBalanceUse } from '../../capture/productionCapture'
import { captureBalancePosition } from '../../capture/productionEntryHelpers'
import type { BalanceShiftDiagnostic } from '../../model/businessRules'
import { QuantityInput } from '../QuantityInput'

export interface BalanceUseItemRowProps {
  readonly balance: ProductionCaptureBalanceUse
  readonly balanceIdx: number
  readonly isFreezing: boolean
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly balanceShiftDiagnostics: readonly BalanceShiftDiagnostic[]
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
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  }
}

export function BalanceUseItemRow({
  balance,
  balanceIdx,
  isFreezing,
  catalogItems,
  balanceShiftDiagnostics,
  onRemoveBalanceUse,
  onDistributeLegacyBalance,
  onUpdateBalanceUse,
  getBalancesCellProps,
}: BalanceUseItemRowProps) {
  const position = captureBalancePosition(balance)
  const requiresProductDistribution =
    balance.requiresProductDistribution === true
  const productShiftDiagnostics = balanceShiftDiagnostics.filter(
    (diagnostic) => diagnostic.productId === balance.productId,
  )

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
            {balance.familyName} · {balance.productName}
          </p>
          <p className="mt-1 text-[0.6875rem] text-slate-500 dark:text-ui-text-dark-soft">
            {isFreezing ? 'Origen Envasado' : 'Origen'}:{' '}
            {balance.originDate
              ? formatIsoDate(balance.originDate)
              : balance.originDayId}{' '}
            · {isFreezing ? 'Saldo disponible del origen' : 'Disponible'}:{' '}
            {formatCentiKg(balance.availableKg100)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemoveBalanceUse(balance.key)}
          className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          aria-label={`Quitar saldo de ${balance.productName}`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {requiresProductDistribution ? (
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
                onChange={(event) =>
                  onDistributeLegacyBalance(balance.key, event.target.value)
                }
                className="h-10 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-400 dark:border-amber-500/30 dark:bg-ui-surface-dark-recessed dark:text-ui-text-dark-strong"
              >
                <option value="">Seleccionar producto…</option>
                {catalogItems
                  .filter(
                    (product) =>
                      product.familyId === balance.familyId &&
                      product.active !== false,
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
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-ui-line-dark dark:bg-ui-surface-dark">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
            {isFreezing ? 'Saldo disponible del origen' : 'Disponible'}
          </p>
          <p className="number-tabular mt-1 text-sm font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
            {formatCentiKg(balance.availableKg100)}
          </p>
        </div>

        <QuantityInput
          label={isFreezing ? 'Utilizado Turno Día' : 'Procesado Día'}
          value={balance.dayKg}
          onChange={(value) => onUpdateBalanceUse(balance.key, 'dayKg', value)}
          {...getBalancesCellProps(balanceIdx, 0)}
        />

        <QuantityInput
          label={isFreezing ? 'Utilizado Turno Noche' : 'Procesado Noche'}
          value={balance.nightKg}
          onChange={(value) =>
            onUpdateBalanceUse(balance.key, 'nightKg', value)
          }
          {...getBalancesCellProps(balanceIdx, 1)}
        />

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-ui-line-dark dark:bg-ui-surface-dark">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
            {isFreezing ? 'Total utilizado' : 'Total procesado'}
          </p>
          <p className="number-tabular mt-1 text-sm font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
            {formatCentiKg(position.processedKg100)}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-ui-line-dark dark:bg-ui-surface-dark">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
            {isFreezing ? 'Saldo restante' : 'Pendiente'}
          </p>
          <p
            className={`number-tabular mt-1 text-sm font-extrabold ${
              position.overusedKg100 > 0
                ? 'text-rose-700 dark:text-rose-300'
                : 'text-slate-900 dark:text-ui-text-dark-strong'
            }`}
          >
            {position.overusedKg100 > 0
              ? `Exceso ${formatCentiKg(position.overusedKg100)}`
              : formatCentiKg(position.pendingKg100)}
          </p>
        </div>

        <div className="flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 dark:border-ui-line-dark dark:bg-ui-surface-dark">
          <StatusBadge
            tone={
              requiresProductDistribution ||
              position.overusedKg100 > 0 ||
              productShiftDiagnostics.length > 0
                ? requiresProductDistribution
                  ? 'warning'
                  : 'danger'
                : position.pendingKg100 === 0
                  ? 'success'
                  : 'warning'
            }
          >
            {requiresProductDistribution
              ? 'REQUIERE DISTRIBUCIÓN'
              : position.overusedKg100 > 0 ||
                  productShiftDiagnostics.length > 0
                ? 'REVISAR'
                : position.pendingKg100 === 0
                  ? 'CONSUMIDO'
                  : 'PENDIENTE'}
          </StatusBadge>
        </div>
      </div>

      {productShiftDiagnostics.length > 0 ? (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
        >
          <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em]">
            Saldo anterior mal distribuido
          </p>
          {productShiftDiagnostics.map((diagnostic) => (
            <div
              key={`${diagnostic.productId}-${diagnostic.shift}`}
              className="mt-2 text-xs leading-5"
            >
              <p className="font-bold">
                {diagnostic.productName} · Turno{' '}
                {diagnostic.shift === 'DAY' ? 'Día' : 'Noche'}
              </p>
              <p>
                Reporte físico: {formatCentiKg(diagnostic.reportedKg100)} ·
                Saldo asignado: {formatCentiKg(diagnostic.assignedBalanceKg100)}{' '}
                · Máximo consumible:{' '}
                {formatCentiKg(diagnostic.maximumConsumableKg100)} · Exceso:{' '}
                {formatCentiKg(diagnostic.excessKg100)}
              </p>
              <p className="mt-1">
                El saldo asignado supera los kg físicamente reportados para este
                producto. Redistribuye el consumo entre Día/Noche o deja el
                remanente pendiente.
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
