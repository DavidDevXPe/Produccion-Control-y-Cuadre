import { formatCentiKg } from '../../../../utils/formatters'
import type { ParsedPackingReportImport } from '../../capture/parseProductionWorkbook'
import { captureQuantityKg100 } from '../../capture/productionEntryHelpers'

export interface PackingExcelValidationSummaryProps {
  readonly preview: ParsedPackingReportImport
}

export function PackingExcelValidationSummary({
  preview,
}: PackingExcelValidationSummaryProps) {
  return (
    <div
      className="mx-5 mb-5 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-center text-xs sm:grid-cols-4 lg:grid-cols-9 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed"
      role="region"
      aria-label="Validación de Excel de Envasado"
    >
      <div>
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
          Archivo
        </p>
        <p className="mt-1 truncate font-bold text-slate-950 dark:text-ui-text-dark-strong">
          {preview.fileName}
        </p>
      </div>

      <div>
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
          Hoja
        </p>
        <p className="mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
          {preview.sheetName}
        </p>
      </div>

      <div>
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
          Turno
        </p>
        <p className="mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
          {preview.shift === 'DAY' ? 'Día' : 'Noche'}
        </p>
      </div>

      <div>
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
          Filas productivas
        </p>
        <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
          {preview.productiveRows}
        </p>
      </div>

      <div>
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
          Reconocidas
        </p>
        <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
          {preview.recognizedRows}
        </p>
      </div>

      <div>
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
          Normalizadas / alias
        </p>
        <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
          {preview.normalizedRows} / {preview.aliasRows}
        </p>
      </div>

      <div>
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
          Nuevas / revisión
        </p>
        <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
          {preview.newRows} / {preview.reviewRows}
        </p>
      </div>

      <div>
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
          Total KG
        </p>
        <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
          {formatCentiKg(
            captureQuantityKg100(String(preview.reconstructedTotalKg)),
          )}
        </p>
      </div>

      <div>
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
          Estado
        </p>
        <p
          className={`mt-1 font-extrabold ${
            preview.status === 'EXCEL RECONCILIADO'
              ? 'text-emerald-700 dark:text-ui-emerald-text-dark'
              : preview.status === 'EXCEL REQUIERE REVISIÓN'
                ? 'text-amber-700 dark:text-ui-amber-text-dark-soft'
                : 'text-rose-700 dark:text-ui-rose-text-dark'
          }`}
        >
          {preview.status}
        </p>
      </div>
    </div>
  )
}
