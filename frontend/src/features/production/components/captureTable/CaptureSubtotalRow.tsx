import type { ReactNode } from 'react'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKgValue } from '../../../../utils/formatters'
import type { ReportFamilySubtotal } from '../../model/businessRules'
import type { Kg100 } from '../../model/types'
import { freezingTraceabilityStatus } from '../../pages/captureProductStatus'

import type { ProductionProcess } from '../../model/types'

export interface CaptureSubtotalRowProps {
  readonly subtotal: ReportFamilySubtotal
  readonly isFreezing?: boolean
  readonly process?: ProductionProcess
  readonly isBalanceOnly: boolean
  readonly familyTraceability: {
    readonly availableKg100: Kg100
    readonly linkedKg100: Kg100
  }
}

type TraceabilityStatus = ReturnType<typeof freezingTraceabilityStatus>

function SubtotalYieldCell({
  subtotal,
  isDownstream,
  isBalanceOnly,
  availableKg100,
}: {
  readonly subtotal: ReportFamilySubtotal
  readonly isDownstream: boolean
  readonly isBalanceOnly: boolean
  readonly availableKg100: Kg100
}) {
  let content: ReactNode
  if (isDownstream) {
    content = (
      <>
        <span className="font-semibold text-slate-800 dark:text-white">
          {formatCentiKgValue(availableKg100)}
        </span>
        <span className="ml-1 text-[0.6875rem] font-medium text-slate-500 dark:text-slate-400">
          kg
        </span>
      </>
    )
  } else if (isBalanceOnly) {
    content = 'No aplica'
  } else if (subtotal.preliminaryYieldPercent === null) {
    content = (
      <span
        title="Rendimiento disponible al ingresar kg"
        aria-label="Rendimiento disponible al ingresar kg"
        className="text-slate-400 dark:text-slate-500"
      >
        —
      </span>
    )
  } else {
    const isNuca = subtotal.key === 'NUCA'
    // Nuca's subtotal uses the same equivalent-production compliance as the
    // detail card. The physical yield remains a secondary datum so the table
    // never falls back to the old 15% denominator.
    const displayedYieldPercent = isNuca
      ? Math.min(subtotal.preliminaryYieldPercent, 100)
      : subtotal.preliminaryYieldPercent
    const exceedsReference =
      isNuca &&
      subtotal.preliminaryYieldPercent !== null &&
      subtotal.preliminaryYieldPercent > 100
    const yieldClass =
      subtotal.totalKg100 > 0 && subtotal.targetPercent !== null
        ? subtotal.status === 'COMPLIES'
          ? 'font-bold text-emerald-700 dark:text-emerald-400'
          : 'font-bold text-amber-700 dark:text-amber-400'
        : 'font-semibold text-slate-800 dark:text-white'
    content = displayedYieldPercent === null ? (
      <span className={yieldClass}>—</span>
    ) : (
      <span
        className={`inline-flex flex-col items-end ${yieldClass}`}
        title={
          isNuca && subtotal.preliminaryYieldPercent !== null
            ? `Cumplimiento de referencia: ${subtotal.preliminaryYieldPercent.toFixed(2)}%${
                subtotal.actualYieldPercent == null
                  ? ''
                  : ` · Rendimiento físico: ${subtotal.actualYieldPercent.toFixed(2)}%`
              }`
            : undefined
        }
      >
        <span>{`${displayedYieldPercent.toFixed(2)}%`}</span>
        {isNuca && subtotal.actualYieldPercent != null ? (
          <span className="text-[0.625rem] font-medium text-slate-500 dark:text-slate-400">
            Real {subtotal.actualYieldPercent.toFixed(2)}%
            {exceedsReference ? ' · supera' : ''}
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <td className="number-tabular px-3 py-2 text-right text-xs">{content}</td>
  )
}

function SubtotalTargetCell({
  subtotal,
  isDownstream,
  isBalanceOnly,
}: {
  readonly subtotal: ReportFamilySubtotal
  readonly isDownstream: boolean
  readonly isBalanceOnly: boolean
}) {
  let content: ReactNode
  if (isDownstream) {
    content = (
      <>
        <span className="font-semibold text-slate-800 dark:text-white">
          {formatCentiKgValue(subtotal.totalKg100)}
        </span>
        <span className="ml-1 text-[0.6875rem] font-medium text-slate-500 dark:text-slate-400">
          kg
        </span>
      </>
    )
  } else if (isBalanceOnly) {
    content = 'No aplica'
  } else if (subtotal.totalKg100 === 0 || subtotal.targetPercent === null) {
    content = '—'
  } else {
    content = `≥ ${subtotal.targetPercent.toFixed(0)}%`
  }

  return (
    <td className="number-tabular px-3 py-2 text-right text-xs text-slate-700 dark:text-slate-300">
      {content}
    </td>
  )
}

function SubtotalDifferenceCell({
  subtotal,
  traceabilityStatus,
  isDownstream,
  isBalanceOnly,
}: {
  readonly subtotal: ReportFamilySubtotal
  readonly traceabilityStatus: TraceabilityStatus
  readonly isDownstream: boolean
  readonly isBalanceOnly: boolean
}) {
  let content: ReactNode
  if (isDownstream) {
    const differenceClass =
      traceabilityStatus.differenceKg100 < 0
        ? 'font-bold text-rose-700 dark:text-rose-400'
        : traceabilityStatus.differenceKg100 > 0
          ? 'font-semibold text-sky-700 dark:text-sky-400'
          : 'text-slate-800 dark:text-white'
    content = (
      <>
        <span className={`font-semibold ${differenceClass}`}>
          {formatCentiKgValue(traceabilityStatus.differenceKg100)}
        </span>
        <span className="ml-1 text-[0.6875rem] font-medium text-slate-500 dark:text-slate-400">
          kg
        </span>
      </>
    )
  } else if (
    isBalanceOnly ||
    subtotal.key === 'NUCA' ||
    subtotal.targetPercent === null ||
    subtotal.totalKg100 === 0
  ) {
    content = '—'
  } else {
    content = (
      <>
        <span className="font-bold text-slate-900 dark:text-white">
          {formatCentiKgValue(subtotal.missingToTargetKg100)}
        </span>
        <span className="ml-1 text-[0.6875rem] font-medium text-slate-600 dark:text-slate-400">
          kg
        </span>
      </>
    )
  }

  return (
    <td className="number-tabular px-3 py-2 text-right text-xs text-slate-700 dark:text-slate-300">
      {content}
    </td>
  )
}

function getSubtotalStatus(
  subtotal: ReportFamilySubtotal,
  traceabilityStatus: TraceabilityStatus,
  isFreezing: boolean,
  isBalanceOnly: boolean,
) {
  if (isFreezing) {
    return {
      tone: traceabilityStatus.tone,
      label: traceabilityStatus.label,
      showIcon: true,
    }
  }
  if (isBalanceOnly) {
    return { tone: 'neutral' as const, label: 'NO APLICA', showIcon: false }
  }
  if (subtotal.totalKg100 === 0) {
    return { tone: 'neutral' as const, label: 'SIN DATOS', showIcon: false }
  }

  const showIcon = subtotal.targetPercent !== null
  if (subtotal.status === 'INTEGRITY_ERROR') {
    return { tone: 'danger' as const, label: 'ERROR', showIcon }
  }
  if (subtotal.status === 'BELOW_TARGET') {
    return { tone: 'warning' as const, label: 'BAJO OBJETIVO', showIcon }
  }
  if (subtotal.status === 'COMPLIES') {
    return { tone: 'success' as const, label: 'CUMPLE', showIcon }
  }
  return { tone: 'neutral' as const, label: 'SIN OBJETIVO', showIcon }
}

export function CaptureSubtotalRow({
  subtotal,
  isFreezing,
  process,
  isBalanceOnly,
  familyTraceability,
}: CaptureSubtotalRowProps) {
  const currentProcess = process ?? (isFreezing ? 'FREEZING' : 'PACKING')
  const isDownstream = currentProcess !== 'PACKING'
  const familyTraceabilityStatusData = freezingTraceabilityStatus(
    subtotal.totalKg100,
    familyTraceability.availableKg100,
    familyTraceability.linkedKg100,
  )
  const subtotalStatus = getSubtotalStatus(
    subtotal,
    familyTraceabilityStatusData,
    isFreezing === true,
    isBalanceOnly,
  )

  return (
    <tr className="border-b border-slate-200 border-t-2 border-slate-200 bg-slate-50/90 font-bold dark:border-slate-200 dark:bg-slate-100/40">
      <th scope="row" className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50/90 px-4 py-2 text-xs uppercase text-slate-900 dark:border-r-slate-200 dark:bg-slate-50 dark:text-white sm:px-5">
        Subtotal {subtotal.label}
      </th>
      <td
        className={`number-tabular px-3 py-2 text-right text-xs ${
          subtotal.dayKg100 > 0
            ? 'font-bold text-slate-900 dark:text-white'
            : 'font-normal text-slate-400 dark:text-slate-500'
        }`}
      >
        <span>{formatCentiKgValue(subtotal.dayKg100)}</span>
        <span
          className={`ml-1 text-[0.6875rem] font-medium ${
            subtotal.dayKg100 > 0
              ? 'text-slate-600 dark:text-slate-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          kg
        </span>
      </td>
      <td
        className={`number-tabular px-3 py-2 text-right text-xs ${
          subtotal.nightKg100 > 0
            ? 'font-bold text-slate-900 dark:text-white'
            : 'font-normal text-slate-400 dark:text-slate-500'
        }`}
      >
        <span>{formatCentiKgValue(subtotal.nightKg100)}</span>
        <span
          className={`ml-1 text-[0.6875rem] font-medium ${
            subtotal.nightKg100 > 0
              ? 'text-slate-600 dark:text-slate-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          kg
        </span>
      </td>
      <td
        className={`number-tabular px-3 py-2 text-right text-xs ${
          subtotal.totalKg100 > 0
            ? 'font-extrabold text-slate-950 dark:text-white'
            : 'font-normal text-slate-400 dark:text-slate-500'
        }`}
      >
        <span>{formatCentiKgValue(subtotal.totalKg100)}</span>
        <span
          className={`ml-1 text-[0.6875rem] font-medium ${
            subtotal.totalKg100 > 0
              ? 'text-slate-500 dark:text-slate-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          kg
        </span>
      </td>
      <SubtotalYieldCell
        subtotal={subtotal}
        isDownstream={isDownstream}
        isBalanceOnly={isBalanceOnly}
        availableKg100={familyTraceability.availableKg100}
      />
      <SubtotalTargetCell
        subtotal={subtotal}
        isDownstream={isDownstream}
        isBalanceOnly={isBalanceOnly}
      />
      <SubtotalDifferenceCell
        subtotal={subtotal}
        traceabilityStatus={familyTraceabilityStatusData}
        isDownstream={isDownstream}
        isBalanceOnly={isBalanceOnly}
      />
      <td className="whitespace-nowrap px-3 py-2 text-center">
        <StatusBadge
          tone={subtotalStatus.tone}
          showIcon={subtotalStatus.showIcon}
          truncateText={false}
        >
          {subtotalStatus.label}
        </StatusBadge>
      </td>
      <td className="w-12" />
    </tr>
  )
}
