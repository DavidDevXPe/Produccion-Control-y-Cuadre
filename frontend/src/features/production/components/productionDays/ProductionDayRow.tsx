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
  const yieldStatus = getYieldStatus(calculation.performance.percent)
  const performancePercent = calculation.performance.percent
  const hasInvalidYield =
    !isFreezing &&
    !isBalanceOnly &&
    performancePercent !== null &&
    performancePercent > 100

  const squareStatus = hasInvalidYield
    ? { tone: 'danger' as const, label: 'REVISAR INTEGRIDAD' }
    : { tone: journey.tone, label: journey.label }
  const yieldStyles = yieldVisualStyles[yieldStatus.colorVariant]
  const rowAccentClass =
    squareStatus.tone === 'danger'
      ? 'before:bg-rose-500'
      : squareStatus.tone === 'warning'
        ? 'before:bg-amber-500'
        : 'before:bg-emerald-500'

  const differenceClass =
    calculation.differenceKg100 === 0
      ? 'text-emerald-700'
      : journey.status === 'NOT_BALANCED'
        ? 'text-rose-700'
        : 'text-amber-700'

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
        <QuantityValue
          value={
            isFreezing
              ? day.declaredShiftTotalsKg100.DAY
              : day.declaredRawMaterialKg100
          }
        />
      </td>
      <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-950">
        <QuantityValue
          value={
            isFreezing
              ? day.declaredShiftTotalsKg100.NIGHT
              : calculation.declaredFinishedKg100
          }
        />
      </td>
      <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold text-slate-700">
        <QuantityValue
          value={
            isFreezing
              ? day.declaredShiftTotalsKg100.DAY +
                day.declaredShiftTotalsKg100.NIGHT
              : calculation.newClosingBalanceKg100
          }
        />
      </td>
      <td
        className={`number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold ${
          isFreezing
            ? calculation.ownTurnProductionKg100 === 0
              ? 'text-emerald-700'
              : 'text-amber-700'
            : differenceClass
        }`}
      >
        <QuantityValue
          value={
            isFreezing
              ? calculation.ownTurnProductionKg100
              : calculation.differenceKg100
          }
        />
      </td>
      <td className="px-3 py-3 text-center align-middle">
        <div className="flex w-full items-center justify-center">
          <StatusBadge tone={squareStatus.tone} truncateText={false}>
            {squareStatus.label}
          </StatusBadge>
        </div>
      </td>
      <td className="px-3 py-3 text-center align-middle">
        {isFreezing ? (
          <div className="number-tabular flex w-full items-center justify-center whitespace-nowrap text-center text-xs font-semibold text-slate-700">
            <QuantityValue
              value={calculation.processedPreviousBalanceKg100}
            />
          </div>
        ) : isBalanceOnly ? (
          <div
            className="flex w-full flex-col items-center justify-center gap-1 text-center"
            aria-label="Aprovechamiento no aplicable. Jornada de saldos."
          >
            <span className="text-xs font-bold text-slate-600">NO APLICA</span>
            <StatusBadge tone="neutral">JORNADA DE SALDOS</StatusBadge>
          </div>
        ) : (
          <div
            className="flex w-full flex-col items-center justify-center gap-1 text-center"
            title={`${formatRatioAsPercent(calculation.performance.ratio)} · ${yieldStatus.label}: ${yieldStatus.interpretation}`}
            aria-label={`Aprovechamiento ${formatRatioAsPercent(calculation.performance.ratio)}. Estado ${yieldStatus.label}. ${yieldStatus.interpretation}`}
          >
            <span
              className={`number-tabular whitespace-nowrap text-xs font-bold ${yieldStyles.textClass}`}
            >
              {formatRatioAsPercent(calculation.performance.ratio)}
            </span>
            <StatusBadge tone={yieldStyles.badgeTone}>
              {yieldStatus.label}
            </StatusBadge>
          </div>
        )}
      </td>
      <td className="px-3 py-3 text-center align-middle">
        <div className="flex w-full items-center justify-center gap-1.5">
          <ActionLink
            to={`${
              isClosed || activeWeekReadOnly || isReadyToClose
                ? `/jornadas/${day.date}`
                : `/jornadas/${day.date}/editar`
            }?process=${selectedProcess}`}
            variant="ghost"
            size="sm"
          >
            {isClosed || activeWeekReadOnly
              ? 'Ver detalle'
              : isReadyToClose
                ? 'Revisar y cerrar'
                : 'Seguir cuadrando'}
            <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
          {!isClosed && !activeWeekReadOnly && onDeleteDay ? (
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
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
