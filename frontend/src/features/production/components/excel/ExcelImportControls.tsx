import type React from 'react'
import { Upload } from 'lucide-react'

export interface ExcelImportControlsProps {
  readonly isFreezing: boolean
  readonly excelShift: 'DAY' | 'NIGHT'
  readonly fileName: string
  readonly importState: 'IDLE' | 'READING' | 'READY' | 'ERROR'
  readonly excelImportMessage: string
  readonly canConfirmExcelImport: boolean
  readonly warnings: readonly string[]
  readonly onChangeExcelShift: (shift: 'DAY' | 'NIGHT') => void
  readonly onWorkbookFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void
  readonly onApplyExcelPreview: () => void
}

export function ExcelImportControls({
  isFreezing,
  excelShift,
  fileName,
  importState,
  excelImportMessage,
  canConfirmExcelImport,
  warnings,
  onChangeExcelShift,
  onWorkbookFileChange,
  onApplyExcelPreview,
}: ExcelImportControlsProps) {
  return (
    <>
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[12rem_minmax(0,1fr)_auto] lg:items-start">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-ui-text-dark-soft">
            Turno a importar
          </span>
          <select
            value={excelShift}
            onChange={(event) =>
              onChangeExcelShift(event.target.value as 'DAY' | 'NIGHT')
            }
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-brand-400 dark:border-ui-line-dark dark:bg-ui-surface-dark-recessed dark:text-ui-text-dark-strong dark:focus:border-ui-brand"
          >
            <option value="DAY">Turno Día</option>
            <option value="NIGHT">Turno Noche</option>
          </select>
        </label>

        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-ui-text-dark-soft">
            Archivo de producción
          </span>
          <span className="relative block">
            <Upload
              className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-brand-700"
              aria-hidden="true"
            />
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="block h-10 w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white pl-9 text-xs font-semibold text-slate-800 file:mr-3 file:h-10 file:border-0 file:border-r file:border-slate-200 file:bg-transparent file:px-3 file:text-xs file:font-bold file:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-200 dark:bg-slate-50 dark:text-white dark:file:border-slate-200 dark:file:text-sky-300 dark:focus:ring-brand-500/20"
              aria-describedby="excel-file-status"
              onChange={onWorkbookFileChange}
            />
          </span>
          <span
            id="excel-file-status"
            className="mt-1 block truncate text-[0.6875rem] text-slate-500 dark:text-slate-400"
          >
            {fileName || 'Archivo .xlsx con hoja Reporte.'}
          </span>
        </label>

        <div className="block">
          <span
            className="mb-1.5 block text-xs font-bold text-transparent select-none"
            aria-hidden="true"
          >
            Acción
          </span>
          <button
            type="button"
            disabled={!canConfirmExcelImport}
            onClick={onApplyExcelPreview}
            className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-100/50 lg:w-auto"
          >
            Confirmar importación
          </button>
        </div>
      </div>

      {excelImportMessage ? (
        <p
          className="mx-5 mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-ui-emerald-border-dark dark:bg-ui-emerald-surface-dark dark:text-ui-emerald-text-dark"
          role="status"
        >
          {excelImportMessage}
        </p>
      ) : null}

      {importState === 'READING' ? (
        <p
          className="px-5 pb-4 text-center text-xs font-semibold text-brand-800 dark:text-sky-300"
          role="status"
        >
          Leyendo y validando la hoja Reporte…
        </p>
      ) : null}

      {importState === 'ERROR' ? (
        <p
          className="mx-5 mb-5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"
          role="alert"
        >
          {isFreezing
            ? 'No se pudo leer el reporte de Congelamiento. Verifica que el archivo tenga hoja Reporte y las columnas Producto (Descripción) y Cantidad (suma).'
            : 'No se pudo leer el reporte de Envasado. Verifica que el archivo tenga hoja Reporte y columna Total KG.'}
        </p>
      ) : null}

      {warnings.length ? (
        <div
          className="mx-5 mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-ui-amber-border-dark dark:bg-ui-amber-surface-dark dark:text-ui-amber-text-dark-soft"
          role="status"
        >
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </>
  )
}
