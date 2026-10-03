import { formatCentiKgValue, formatRatioAsPercent } from '../../../../utils/formatters'
import type { calculateWeeklySummary, kg100 } from '../../model/calculations'
import { sumKg100 } from '../../model/calculations'
import type { RegisteredProductionDayItem } from '../../hooks/useProductionDaysData'

export interface ProductionDaysTableFooterProps {
  readonly registeredDays: readonly RegisteredProductionDayItem[]
  readonly weeklySummary: ReturnType<typeof calculateWeeklySummary>
  readonly isFreezing: boolean
  readonly frozenPhysicalKg100: ReturnType<typeof kg100>
  readonly freezingLinkedKg100: ReturnType<typeof kg100>
  readonly freezingDifferenceKg100: ReturnType<typeof kg100>
  readonly balancedCount: number
}

export function ProductionDaysTableFooter({
  registeredDays,
  weeklySummary,
  isFreezing,
  frozenPhysicalKg100,
  freezingLinkedKg100,
  freezingDifferenceKg100,
  balancedCount,
}: ProductionDaysTableFooterProps) {
  return (
    <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold">
      <tr>
        <th
          scope="row"
          className="px-3 py-3 text-center align-middle text-[0.6875rem] font-bold uppercase tracking-wider text-slate-800"
        >
          TOTAL ACUMULADO
        </th>
        <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-extrabold text-slate-950">
          <span className="number-tabular">
            {formatCentiKgValue(
              isFreezing ? frozenPhysicalKg100 : weeklySummary.rawMaterialKg100,
            )}{' '}
            kg
          </span>
        </td>
        <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-extrabold text-slate-950">
          <span className="number-tabular">
            {formatCentiKgValue(
              isFreezing
                ? freezingLinkedKg100
                : weeklySummary.declaredFinishedKg100,
            )}{' '}
            kg
          </span>
        </td>
        <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-extrabold text-slate-950">
          <span className="number-tabular">
            {formatCentiKgValue(
              isFreezing
                ? frozenPhysicalKg100
                : sumKg100(
                    registeredDays.map(
                      ({ calculation }) => calculation.newClosingBalanceKg100,
                    ),
                  ),
            )}{' '}
            kg
          </span>
        </td>
        <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-extrabold text-emerald-700">
          <span className="number-tabular">
            {formatCentiKgValue(
              isFreezing
                ? freezingDifferenceKg100
                : weeklySummary.differenceKg100,
            )}{' '}
            kg
          </span>
        </td>
        <td className="px-3 py-3 text-center align-middle text-xs font-semibold text-slate-600">
          {balancedCount} de {registeredDays.length} auditadas
        </td>
        <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-extrabold text-brand-800">
          {!isFreezing && weeklySummary.performance.percent !== null
            ? formatRatioAsPercent(weeklySummary.performance.ratio)
            : '—'}
        </td>
        <td className="px-3 py-3 text-center align-middle text-xs font-semibold text-slate-500">
          {registeredDays.length} {registeredDays.length === 1 ? 'jornada' : 'jornadas'}
        </td>
      </tr>
    </tfoot>
  )
}
