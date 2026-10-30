import type { KeyboardEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg, formatIsoDate } from '../../../../utils/formatters'
import type { ProductionCaptureBalanceUse } from '../../capture/productionCapture'
import {
  captureBalancePosition,
  captureQuantityKg100,
} from '../../capture/productionEntryHelpers'
import { QuantityInput } from '../QuantityInput'

export interface BalanceUseStatus {
  readonly tone: 'warning' | 'danger' | 'success'
  readonly label: string
}

export interface BalanceUseHeaderProps {
  readonly balance: ProductionCaptureBalanceUse
  readonly isFreezing: boolean
  readonly prevProcessName?: string
  readonly onRemoveBalanceUse: (key: string) => void
}

export function BalanceUseHeader({
  balance,
  isFreezing,
  prevProcessName,
  onRemoveBalanceUse,
}: BalanceUseHeaderProps) {
  const originLabel = isFreezing ? `Origen ${prevProcessName ?? 'Envasado'}` : 'Origen'
  const availableLabel = isFreezing
    ? 'Saldo disponible del origen'
    : 'Disponible'

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
          {balance.familyName} · {balance.productName}
        </p>
        <p className="mt-1 text-[0.6875rem] text-slate-500 dark:text-ui-text-dark-soft">
          {originLabel}: {balance.originDate
            ? formatIsoDate(balance.originDate)
            : balance.originDayId}{' '}
          · {availableLabel}: {formatCentiKg(balance.availableKg100)}
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
  )
}

export interface BalanceUseMetricsProps {
  readonly balance: ProductionCaptureBalanceUse
  readonly balanceIdx: number
  readonly isFreezing: boolean
  readonly position: ReturnType<typeof captureBalancePosition>
  readonly balanceStatus: BalanceUseStatus
  readonly dayShiftAvailable: boolean
  readonly nightShiftAvailable: boolean
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

function ShiftAmountInput({
  label,
  value,
  available,
  message,
  onChange,
  cellProps,
}: {
  readonly label: string
  readonly value: string
  readonly available: boolean
  readonly message: string
  readonly onChange: (value: string) => void
  readonly cellProps: BalanceUseMetricsProps['getBalancesCellProps'] extends (
    rowIndex: number,
    colIndex: number,
  ) => infer Result
    ? Result
    : never
}) {
  const disabled = !available && captureQuantityKg100(value) === 0

  return (
    <div>
      <QuantityInput
        label={label}
        value={value}
        disabled={disabled}
        onChange={onChange}
        {...cellProps}
      />
      {!available ? (
        <p
          role="status"
          className="mt-1 text-[0.6875rem] leading-4 text-amber-700 dark:text-amber-300"
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  valueClassName = 'text-slate-900 dark:text-ui-text-dark-strong',
}: {
  readonly label: string
  readonly value: string
  readonly valueClassName?: string | undefined
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-ui-line-dark dark:bg-ui-surface-dark">
      <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
        {label}
      </p>
      <p className={`number-tabular mt-1 text-sm font-extrabold ${valueClassName}`}>
        {value}
      </p>
    </div>
  )
}

export function BalanceUseMetrics({
  balance,
  balanceIdx,
  isFreezing,
  position,
  balanceStatus,
  dayShiftAvailable,
  nightShiftAvailable,
  onUpdateBalanceUse,
  getBalancesCellProps,
}: BalanceUseMetricsProps) {
  const dayLabel = isFreezing ? 'Congelado Turno Día' : 'Procesado Día'
  const nightLabel = isFreezing ? 'Congelado Turno Noche' : 'Procesado Noche'
  const totalLabel = isFreezing ? 'Total congelado' : 'Total procesado'
  const remainingLabel = isFreezing ? 'Saldo restante' : 'Pendiente'
  const dayMessage = 'No hay producción registrada de este producto en el turno Día.'
  const nightMessage = 'No hay producción registrada de este producto en el turno Noche.'
  const pendingValue = position.overusedKg100 > 0
    ? `Exceso ${formatCentiKg(position.overusedKg100)}`
    : formatCentiKg(position.pendingKg100)
  const pendingClassName = position.overusedKg100 > 0
    ? 'text-rose-700 dark:text-rose-300'
    : undefined

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
      <SummaryMetric
        label={isFreezing ? 'Saldo disponible del origen' : 'Disponible'}
        value={formatCentiKg(balance.availableKg100)}
      />
      <ShiftAmountInput
        label={dayLabel}
        value={balance.dayKg}
        available={dayShiftAvailable}
        message={dayMessage}
        onChange={(value) => onUpdateBalanceUse(balance.key, 'dayKg', value)}
        cellProps={getBalancesCellProps(balanceIdx, 0)}
      />
      <ShiftAmountInput
        label={nightLabel}
        value={balance.nightKg}
        available={nightShiftAvailable}
        message={nightMessage}
        onChange={(value) => onUpdateBalanceUse(balance.key, 'nightKg', value)}
        cellProps={getBalancesCellProps(balanceIdx, 1)}
      />
      <SummaryMetric
        label={totalLabel}
        value={formatCentiKg(position.processedKg100)}
      />
      <SummaryMetric
        label={remainingLabel}
        value={pendingValue}
        valueClassName={pendingClassName}
      />
      <div className="flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 dark:border-ui-line-dark dark:bg-ui-surface-dark">
        <StatusBadge tone={balanceStatus.tone}>{balanceStatus.label}</StatusBadge>
      </div>
    </div>
  )
}
