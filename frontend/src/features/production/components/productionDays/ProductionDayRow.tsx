import { ArrowRight, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ActionLink } from '../../../../components/ui/ActionLink'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import {
  formatCentiKgValue,
  formatIsoDateCompact,
  formatIsoWeekday,
  formatRatioAsPercent,
} from '../../../../utils/formatters'
import type { RegisteredProductionDayItem } from '../../hooks/useProductionDaysData'
import { isBalanceOnlyProductionDay } from '../../model/productionDayMode'
import { productionProcessLabels } from '../../model/productionProcess'
import type { ProductionProcess } from '../../model/types'
import { getYieldStatus, yieldVisualStyles } from '../../presentation/yieldStatus'
import { ProductionDayDeleteDialog } from '../ProductionDayDeleteDialog'

function QuantityValue({ value }: { value: number }) {
  return (
    <span className="inline-flex w-full items-baseline justify-center whitespace-nowrap text-center">
      <span>{formatCentiKgValue(value)}</span>
      <span className="ml-1 text-[0.6875rem] font-medium">kg</span>
    </span>
  )
}

function getRowAccentClass(tone: string) {
  if (tone === 'danger') return 'before:bg-rose-500'
  if (tone === 'warning') return 'before:bg-amber-500'
  return 'before:bg-emerald-500'
}

function getDifferenceClass(
  differenceKg100: number,
  journeyStatus: string,
  freezingDifferenceKg100?: number,
) {
  if (freezingDifferenceKg100 !== undefined) {
    if (freezingDifferenceKg100 === 0) return 'text-emerald-700'
    return freezingDifferenceKg100 < 0 ? 'text-rose-700' : 'text-amber-700'
  }
  if (differenceKg100 === 0) return 'text-emerald-700'
  return journeyStatus === 'NOT_BALANCED' ? 'text-rose-700' : 'text-amber-700'
}

function getReportedQuantities(
  item: RegisteredProductionDayItem,
  isFreezing: boolean,
): [number, number, number, number] {
  if (isFreezing) {
    return [
      item.day.declaredShiftTotalsKg100.DAY,
      item.day.declaredShiftTotalsKg100.NIGHT,
      item.day.declaredShiftTotalsKg100.DAY +
        item.day.declaredShiftTotalsKg100.NIGHT,
      item.freezingDifferenceKg100,
    ]
  }

  return [
    item.day.declaredRawMaterialKg100,
    item.calculation.declaredFinishedKg100,
    item.calculation.newClosingBalanceKg100,
    item.calculation.differenceKg100,
  ]
}

function PerformanceCell({
  item,
  isFreezing,
  isBalanceOnly,
}: {
  readonly item: RegisteredProductionDayItem
  readonly isFreezing: boolean
  readonly isBalanceOnly: boolean
}) {
  if (isFreezing) {
    return (
      <div className="number-tabular flex w-full items-center justify-center whitespace-nowrap text-center text-xs font-semibold text-slate-700">
        <QuantityValue value={item.freezingLinkedKg100} />
      </div>
    )
  }

  if (isBalanceOnly) {
    return (
      <div
        className="flex w-full flex-col items-center justify-center gap-1 text-center"
        aria-label="Aprovechamiento no aplicable. Jornada de saldos."
      >
        <span className="text-xs font-bold text-slate-600">NO APLICA</span>
        <StatusBadge tone="neutral">JORNADA DE SALDOS</StatusBadge>
      </div>
    )
  }

  const yieldStatus = getYieldStatus(item.calculation.performance.percent)
  const yieldStyles = yieldVisualStyles[yieldStatus.colorVariant]
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-1 text-center"
      title={`${formatRatioAsPercent(item.calculation.performance.ratio)} · ${yieldStatus.label}: ${yieldStatus.interpretation}`}
      aria-label={`Aprovechamiento ${formatRatioAsPercent(item.calculation.performance.ratio)}. Estado ${yieldStatus.label}. ${yieldStatus.interpretation}`}
    >
      <span
        className={`number-tabular whitespace-nowrap text-xs font-bold ${yieldStyles.textClass}`}
      >
        {formatRatioAsPercent(item.calculation.performance.ratio)}
      </span>
      <StatusBadge tone={yieldStyles.badgeTone}>{yieldStatus.label}</StatusBadge>
    </div>
  )
}

function ActionLabel({
  isClosed,
  activeWeekReadOnly,
  isReadyToClose,
}: {
  readonly isClosed: boolean
  readonly activeWeekReadOnly: boolean
  readonly isReadyToClose: boolean
}) {
  if (isClosed || activeWeekReadOnly) return 'Ver detalle'
  if (isReadyToClose) return 'Revisar y cerrar'
  return 'Seguir cuadrando'
}

export interface ProductionDayRowProps {
  readonly item: RegisteredProductionDayItem
  readonly idx: number
  readonly activeWeekNumber: number
  readonly activeWeekReadOnly: boolean
  readonly isFreezing: boolean
  readonly latestDayDate: string | undefined
  readonly selectedProcess: ProductionProcess
  readonly onDeleteDay?: ((date: string) => void) | undefined
}

export function ProductionDayRow({
  item,
  idx,
  activeWeekNumber,
  activeWeekReadOnly,
  isFreezing,
  latestDayDate,
  selectedProcess,
  onDeleteDay,
}: ProductionDayRowProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const { day, calculation, operationalState, journey } = item
  const isClosed = operationalState.lifecycle === 'CLOSED'
  const isReadyToClose = operationalState.state === 'READY_TO_CLOSE'
  const isBalanceOnly = isBalanceOnlyProductionDay(day)
  const performancePercent = calculation.performance.percent
  const hasInvalidYield =
    !isFreezing &&
    !isBalanceOnly &&
    performancePercent !== null &&
    performancePercent > 100

  const squareStatus = hasInvalidYield
    ? { tone: 'danger' as const, label: 'REVISAR INTEGRIDAD' }
    : { tone: journey.tone, label: journey.label }
  const rowAccentClass = getRowAccentClass(squareStatus.tone)
  const [dayValue, nightValue, totalValue, differenceValue] =
    getReportedQuantities(item, isFreezing)
  const differenceClass = getDifferenceClass(
    calculation.differenceKg100,
    journey.status,
    isFreezing ? item.freezingDifferenceKg100 : undefined,
  )

  return (
    <tr
      key={day.id}
      className="border-b border-slate-100 hover:bg-slate-50/80 last:border-0"
    >
      <th
        scope="row"
        className={`relative px-3 py-3 text-center align-middle before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] ${rowAccentClass}`}
      >
        <span className="flex w-full flex-col items-center justify-center text-center">
          <span className="block text-xs font-bold tracking-[0.04em] text-slate-950">
            {formatIsoWeekday(day.date)}
          </span>
          <span className="number-tabular mt-0.5 block text-xs font-semibold text-slate-600">
            {formatIsoDateCompact(day.date)}
          </span>
          <span className="mt-0.5 block text-[0.625rem] font-medium text-sky-700">
            Lote Z-{activeWeekNumber}0{idx + 1}
          </span>
          {day.date === latestDayDate ? (
            <span className="mt-0.5 block text-[0.625rem] font-medium text-slate-500">
              Último registro disponible
            </span>
          ) : null}
        </span>
      </th>
      <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-700">
        <QuantityValue value={dayValue} />
      </td>
      <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-950">
        <QuantityValue value={nightValue} />
      </td>
      <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-700">
        <QuantityValue value={totalValue} />
      </td>
      <td
        className={`number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold ${
          differenceClass
        }`}
      >
        <QuantityValue value={differenceValue} />
      </td>
      <td className="px-3 py-3 text-center align-middle">
        <div className="flex w-full items-center justify-center">
          <StatusBadge tone={squareStatus.tone} truncateText={false}>
            {squareStatus.label}
          </StatusBadge>
        </div>
      </td>
      <td className="px-3 py-3 text-center align-middle">
        <PerformanceCell
          item={item}
          isFreezing={isFreezing}
          isBalanceOnly={isBalanceOnly}
        />
      </td>
      <td className="px-3 py-3 text-center align-middle">
        <div className="flex w-full items-center justify-center">
          <ActionLink
            to={`${
              isClosed || activeWeekReadOnly || isReadyToClose
                ? `/jornadas/${day.date}`
                : `/jornadas/${day.date}/editar`
            }?process=${selectedProcess}`}
            variant="ghost"
            size="sm"
          >
            <ActionLabel
              isClosed={isClosed}
              activeWeekReadOnly={activeWeekReadOnly}
              isReadyToClose={isReadyToClose}
            />
            <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </div>
      </td>
      <td className="px-2 py-3 text-center align-middle">
        <div className="flex w-full items-center justify-center">
          {!isClosed && !activeWeekReadOnly && onDeleteDay ? (
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-ui-line-dark dark:bg-ui-surface-dark dark:text-ui-text-dark-pale dark:hover:border-rose-500/50 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 dark:focus-visible:ring-offset-ui-surface-dark-deep"
              title={`Eliminar jornada del ${formatIsoDateCompact(day.date)}`}
              aria-label={`Eliminar jornada del ${formatIsoDateCompact(day.date)}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <ProductionDayDeleteDialog
          isOpen={isDeleteOpen}
          date={day.date}
          processLabel={productionProcessLabels[selectedProcess]}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={() => {
            setIsDeleteOpen(false)
            onDeleteDay?.(day.date)
          }}
        />
      </td>
    </tr>
  )
}
