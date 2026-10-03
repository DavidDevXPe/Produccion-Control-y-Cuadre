import { AlertTriangle } from 'lucide-react'
import { formatCentiKg } from '../../../../utils/formatters'
import type { ProductionCaptureDraft } from '../../capture/productionCapture'

export interface ExcelImportedBalancesAlertProps {
  readonly draft: ProductionCaptureDraft
  readonly importedBalanceMatches: boolean
  readonly importedBalanceTotal: number
  readonly newClosingBalanceKg100: number
}

export function ExcelImportedBalancesAlert({
  draft,
  importedBalanceMatches,
  importedBalanceTotal,
  newClosingBalanceKg100,
}: ExcelImportedBalancesAlertProps) {
  if (draft.importedBalances.length === 0) return null

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        importedBalanceMatches
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-amber-700"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900">
            Saldos detectados en el Excel: {formatCentiKg(importedBalanceTotal)}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Asígnalos en la columna “Saldo final” del producto correspondiente.
            Asignado ahora: {formatCentiKg(newClosingBalanceKg100)}.
          </p>
          <p className="mt-1 text-[0.6875rem] font-semibold text-slate-500">
            {draft.importedBalances
              .map(
                (balance) =>
                  `${balance.label}: ${balance.kg.toLocaleString('es-PE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} kg`,
              )
              .join(' · ')}
          </p>
        </div>
      </div>
    </div>
  )
}
