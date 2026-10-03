import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKgValue } from '../../../../utils/formatters'
import type { ReportFamilySubtotal } from '../../model/businessRules'
import type { Kg100 } from '../../model/types'
import { freezingTraceabilityStatus } from '../../pages/captureProductStatus'

export interface CaptureSubtotalRowProps {
  readonly subtotal: ReportFamilySubtotal
  readonly isFreezing: boolean
  readonly isBalanceOnly: boolean
  readonly familyTraceability: {
    readonly availableKg100: Kg100
    readonly linkedKg100: Kg100
  }
}

export function CaptureSubtotalRow({
  subtotal,
  isFreezing,
  isBalanceOnly,
  familyTraceability,
}: CaptureSubtotalRowProps) {
  const familyTraceabilityStatusData = freezingTraceabilityStatus(
    subtotal.totalKg100,
    familyTraceability.availableKg100,
    familyTraceability.linkedKg100,
  )

  return (
    <tr className="border-b border-slate-200 border-t-2 border-slate-300 bg-slate-50/90 font-bold dark:border-b-ui-line-dark-grid dark:border-t-2 dark:border-t-ui-line-navy dark:bg-ui-surface-dark-recessed/90">
      <th className="sticky left-0 z-10 border-r border-slate-200 border-t-2 border-slate-300 bg-slate-50/90 px-4 py-2 text-xs uppercase text-slate-800 dark:border-r-ui-line-navy dark:border-t-2 dark:border-t-ui-line-navy dark:bg-ui-surface-dark-recessed/90 dark:text-white">
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
            ? 'font-extrabold text-brand-700 dark:text-sky-300'
            : 'font-normal text-slate-400 dark:text-slate-500'
        }`}
      >
        <span>{formatCentiKgValue(subtotal.totalKg100)}</span>
        <span
          className={`ml-1 text-[0.6875rem] font-medium ${
            subtotal.totalKg100 > 0
              ? 'text-brand-600/80 dark:text-slate-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          kg
        </span>
      </td>
      <td className="number-tabular px-3 py-2 text-right text-xs">
        {isFreezing ? (
          <>
            <span className="font-semibold text-slate-800 dark:text-white">
              {formatCentiKgValue(familyTraceability.availableKg100)}
            </span>
            <span className="ml-1 text-[0.6875rem] font-medium text-slate-500 dark:text-slate-400">
              kg
            </span>
          </>
        ) : isBalanceOnly ? (
          'No aplica'
        ) : subtotal.preliminaryYieldPercent === null ? (
          <span
            title="Rendimiento disponible al ingresar kg"
            aria-label="Rendimiento disponible al ingresar kg"
            className="text-slate-400 dark:text-slate-500"
          >
            —
          </span>
        ) : (
          <span
            className={
              subtotal.totalKg100 > 0 && subtotal.targetPercent !== null
                ? subtotal.status === 'COMPLIES'
                  ? 'font-bold text-emerald-700 dark:text-emerald-400'
                  : 'font-bold text-amber-700 dark:text-amber-400'
                : 'font-semibold text-slate-800 dark:text-white'
            }
          >
            {`${subtotal.preliminaryYieldPercent.toFixed(2)}%`}
          </span>
        )}
      </td>
      <td className="number-tabular px-3 py-2 text-right text-xs text-slate-700 dark:text-slate-300">
        {isFreezing ? (
          <>
            <span className="font-semibold text-slate-800 dark:text-white">
              {formatCentiKgValue(familyTraceability.linkedKg100)}
            </span>
            <span className="ml-1 text-[0.6875rem] font-medium text-slate-500 dark:text-slate-400">
              kg
            </span>
          </>
        ) : isBalanceOnly ? (
          'No aplica'
        ) : subtotal.totalKg100 === 0 ? (
          '—'
        ) : subtotal.targetPercent === null ? (
          '—'
        ) : (
          `≥ ${subtotal.targetPercent.toFixed(0)}%`
        )}
      </td>
      <td className="number-tabular px-3 py-2 text-right text-xs text-slate-700 dark:text-slate-300">
        {isFreezing ? (
          <>
            <span className="font-semibold text-slate-800 dark:text-white">
              {formatCentiKgValue(familyTraceabilityStatusData.pendingToLinkKg100)}
            </span>
            <span className="ml-1 text-[0.6875rem] font-medium text-slate-500 dark:text-slate-400">
              kg
            </span>
          </>
        ) : isBalanceOnly ||
          subtotal.targetPercent === null ||
          subtotal.totalKg100 === 0 ? (
          '—'
        ) : (
          <>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatCentiKgValue(subtotal.missingToTargetKg100)}
            </span>
            <span className="ml-1 text-[0.6875rem] font-medium text-slate-600 dark:text-slate-400">
              kg
            </span>
          </>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-center">
        <StatusBadge
          tone={
            isFreezing
              ? familyTraceabilityStatusData.tone
              : isBalanceOnly
                ? 'neutral'
                : subtotal.totalKg100 === 0
                  ? 'neutral'
                  : subtotal.status === 'INTEGRITY_ERROR'
                    ? 'danger'
                    : subtotal.status === 'BELOW_TARGET'
                      ? 'warning'
                      : subtotal.status === 'COMPLIES'
                        ? 'success'
                        : 'neutral'
          }
          showIcon={
            isFreezing
              ? true
              : isBalanceOnly ||
                  subtotal.totalKg100 === 0 ||
                  subtotal.targetPercent === null
                ? false
                : true
          }
          truncateText={false}
        >
          {isFreezing
            ? familyTraceabilityStatusData.label
            : isBalanceOnly
              ? 'NO APLICA'
              : subtotal.totalKg100 === 0
                ? 'SIN DATOS'
                : subtotal.status === 'INTEGRITY_ERROR'
                  ? 'ERROR'
                  : subtotal.status === 'BELOW_TARGET'
                    ? 'BAJO OBJETIVO'
                    : subtotal.status === 'COMPLIES'
                      ? 'CUMPLE'
                      : 'SIN OBJETIVO'}
        </StatusBadge>
      </td>
      <td />
    </tr>
  )
}
