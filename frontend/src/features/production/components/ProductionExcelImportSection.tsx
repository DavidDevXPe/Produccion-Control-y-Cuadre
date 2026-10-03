import type React from 'react'
import { FileSpreadsheet, Plus, Upload } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { formatCentiKg, formatCentiKgValue } from '../../../utils/formatters'
import {
  displayImportStatus,
  isTreatmentOnlyProduct,
  type FreezingExcelPreview,
} from '../capture/freezingExcelPreview'
import type { ParsedPackingReportImport } from '../capture/parseProductionWorkbook'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import { captureQuantityKg100 } from '../capture/productionEntryHelpers'

export interface ProductionExcelImportSectionProps {
  readonly enabled: boolean
  readonly isFreezing: boolean
  readonly excelShift: 'DAY' | 'NIGHT'
  readonly fileName: string
  readonly importState: 'IDLE' | 'READING' | 'READY' | 'ERROR'
  readonly excelImportMessage: string
  readonly canConfirmExcelImport: boolean
  readonly excelPreview: ParsedPackingReportImport | null
  readonly freezingExcelPreview: FreezingExcelPreview | null
  readonly unresolvedExcelRows: readonly unknown[]
  readonly unresolvedFreezingExcelRows: readonly unknown[]
  readonly excelExistingProductByRow: Record<number, string>
  readonly freezingNewProductFamilyByRow: Record<number, string>
  readonly freezingCatalogFamilyOptions: readonly {
    familyId: string
    familyName: string
  }[]
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly onChangeExcelShift: (shift: 'DAY' | 'NIGHT') => void
  readonly onWorkbookFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void
  readonly onApplyExcelPreview: () => void
  readonly onSelectExistingProductForRow: (
    rowNumber: number,
    productId: string,
  ) => void
  readonly onSelectFreezingFamilyForRow: (
    rowNumber: number,
    familyId: string,
  ) => void
  readonly onAssociateFreezingExcelRowToExisting: (rowNumber: number) => void
  readonly onAddFreezingExcelRowToCatalog: (rowNumber: number) => void
  readonly onAddExcelRowToCatalog: (rowNumber: number) => void
  readonly onAssociateExcelRowToExisting: (rowNumber: number) => void
}

export function ProductionExcelImportSection({
  enabled,
  isFreezing,
  excelShift,
  fileName,
  importState,
  excelImportMessage,
  canConfirmExcelImport,
  excelPreview,
  freezingExcelPreview,
  unresolvedExcelRows,
  unresolvedFreezingExcelRows,
  excelExistingProductByRow,
  freezingNewProductFamilyByRow,
  freezingCatalogFamilyOptions,
  catalogItems,
  onChangeExcelShift,
  onWorkbookFileChange,
  onApplyExcelPreview,
  onSelectExistingProductForRow,
  onSelectFreezingFamilyForRow,
  onAssociateFreezingExcelRowToExisting,
  onAddFreezingExcelRowToCatalog,
  onAddExcelRowToCatalog,
  onAssociateExcelRowToExisting,
}: ProductionExcelImportSectionProps) {
  if (!enabled) return null

  return (
    <SectionCard
      title={
        isFreezing
          ? 'Importar Excel de Congelamiento'
          : 'Importar Excel de Envasado'
      }
      description={
        isFreezing
          ? 'Lee la hoja Reporte, convierte los aros a kg y relaciona cada producto con el catálogo antes de aplicarlo al turno.'
          : 'Lee la hoja Reporte del archivo estructurado; primero verás una vista previa y luego decides si aplicarla al turno.'
      }
      action={
        <FileSpreadsheet
          className="size-5 text-emerald-700"
          aria-hidden="true"
        />
      }
    >
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

      {excelPreview?.warnings.length ? (
        <div
          className="mx-5 mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-ui-amber-border-dark dark:bg-ui-amber-surface-dark dark:text-ui-amber-text-dark-soft"
          role="status"
        >
          {excelPreview.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      {freezingExcelPreview?.warnings.length ? (
        <div
          className="mx-5 mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-ui-amber-border-dark dark:bg-ui-amber-surface-dark dark:text-ui-amber-text-dark-soft"
          role="status"
        >
          {freezingExcelPreview.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      {freezingExcelPreview ? (
        <div
          className="mx-5 mb-5 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-center text-xs sm:grid-cols-3 lg:grid-cols-9 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed"
          role="region"
          aria-label="Validación de Excel de Congelamiento"
        >
          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Archivo
            </p>
            <p className="mt-1 truncate font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {freezingExcelPreview.fileName}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Hoja
            </p>
            <p className="mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {freezingExcelPreview.sheetName}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Turno
            </p>
            <p className="mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {freezingExcelPreview.shift === 'DAY' ? 'Día' : 'Noche'}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Filas productivas
            </p>
            <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {
                freezingExcelPreview.rows.filter(
                  (row) => row.totalKg > 0,
                ).length
              }
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Reconocidas
            </p>
            <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {freezingExcelPreview.recognizedRows}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Revisión
            </p>
            <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {freezingExcelPreview.reviewRows}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Total aros
            </p>
            <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {freezingExcelPreview.totalAros.toLocaleString('es-PE')}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Total KG
            </p>
            <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {freezingExcelPreview.totalKg.toLocaleString('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Estado
            </p>
            <p
              className={`mt-1 font-extrabold ${
                freezingExcelPreview.status === 'EXCEL RECONCILIADO'
                  ? 'text-emerald-700 dark:text-ui-emerald-text-dark'
                  : 'text-amber-700 dark:text-ui-amber-text-dark-soft'
              }`}
            >
              {freezingExcelPreview.status}
            </p>
          </div>
        </div>
      ) : null}

      {excelPreview ? (
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
              {excelPreview.fileName}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Hoja
            </p>
            <p className="mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {excelPreview.sheetName}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Turno
            </p>
            <p className="mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {excelPreview.shift === 'DAY' ? 'Día' : 'Noche'}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Filas productivas
            </p>
            <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {excelPreview.productiveRows}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Reconocidas
            </p>
            <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {excelPreview.recognizedRows}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Normalizadas / alias
            </p>
            <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {excelPreview.normalizedRows} / {excelPreview.aliasRows}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Nuevas / revisión
            </p>
            <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {excelPreview.newRows} / {excelPreview.reviewRows}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Total KG
            </p>
            <p className="number-tabular mt-1 font-bold text-slate-950 dark:text-ui-text-dark-strong">
              {formatCentiKg(
                captureQuantityKg100(
                  String(excelPreview.reconstructedTotalKg),
                ),
              )}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-ui-text-soft">
              Estado
            </p>
            <p
              className={`mt-1 font-extrabold ${
                excelPreview.status === 'EXCEL RECONCILIADO'
                  ? 'text-emerald-700 dark:text-ui-emerald-text-dark'
                  : excelPreview.status === 'EXCEL REQUIERE REVISIÓN'
                    ? 'text-amber-700 dark:text-ui-amber-text-dark-soft'
                    : 'text-rose-700 dark:text-ui-rose-text-dark'
              }`}
            >
              {excelPreview.status}
            </p>
          </div>
        </div>
      ) : null}

      {(isFreezing
        ? unresolvedFreezingExcelRows.length
        : unresolvedExcelRows.length) > 0 ? (
        <p
          className="mx-5 mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800 dark:border-ui-amber-border-dark dark:bg-ui-amber-surface-dark dark:text-ui-amber-text-dark-soft"
          role="status"
        >
          {isFreezing
            ? unresolvedFreezingExcelRows.length
            : unresolvedExcelRows.length}{' '}
          producto(s) requieren revisión antes de confirmar la importación.
        </p>
      ) : null}

      {freezingExcelPreview?.rows.length ? (
        <div
          className="mx-5 mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed"
          role="region"
          aria-label="Vista previa Excel de Congelamiento"
        >
          <div className="border-b border-slate-200 px-4 py-3 dark:border-ui-line-dark-grid">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-950 dark:text-ui-text-dark-strong">
              Vista previa de Congelamiento
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ui-text-dark-soft">
              La cantidad del archivo corresponde a aros. Para la captura
              operativa se aplica 1 aro = 10 kg. La presentación logística se
              muestra solo como referencia y no cambia la identidad del producto.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[76rem] text-left text-xs">
              <thead className="border-b border-slate-300 bg-slate-100 text-[0.625rem] uppercase tracking-[0.08em] text-slate-700 dark:border-ui-line-dark dark:bg-ui-surface-dark-compact dark:text-ui-text-dark">
                <tr>
                  <th className="px-4 py-2.5">Producto Excel</th>
                  <th className="px-4 py-2.5">Producto sistema</th>
                  <th className="px-4 py-2.5 text-center">Presentación</th>
                  <th className="px-4 py-2.5 text-right">Aros</th>
                  <th className="px-4 py-2.5 text-right">Total KG</th>
                  <th className="px-4 py-2.5 text-center">Estado</th>
                  <th className="px-4 py-2.5 text-center">Acción</th>
                </tr>
              </thead>

              <tbody>
                {freezingExcelPreview.rows.map((row) => (
                  <tr
                    key={`freezing-excel-${row.rowNumber}`}
                    className="border-t border-slate-100 text-slate-950 hover:bg-slate-50 dark:border-ui-line-dark-grid dark:text-ui-text-dark-strong dark:hover:bg-ui-surface-dark"
                  >
                    <td className="px-4 py-2.5 font-semibold">
                      {row.baseProductName}
                    </td>

                    <td className="px-4 py-2.5 text-slate-600 dark:text-ui-text-dark-soft">
                      {row.product?.canonicalName ??
                        row.product?.productName ??
                        '—'}
                    </td>

                    <td className="px-4 py-2.5 text-center text-slate-600 dark:text-ui-text-dark-soft">
                      {row.packaging ?? '—'}
                    </td>

                    <td className="number-tabular px-4 py-2.5 text-right font-bold">
                      {row.quantityAros.toLocaleString('es-PE')}
                    </td>

                    <td className="number-tabular px-4 py-2.5 text-right font-bold">
                      {row.totalKg.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-4 py-2.5 text-center">
                      <span
                        title={row.matchReason}
                        className={`inline-flex rounded-full border px-2 py-1 text-[0.625rem] font-extrabold uppercase tracking-[0.06em] ${
                          row.status !== 'REQUIERE REVISIÓN'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-ui-emerald-border-dark dark:bg-ui-emerald-surface-dark dark:text-ui-emerald-text-dark'
                            : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-ui-amber-border-dark dark:bg-ui-amber-surface-dark dark:text-ui-amber-text-dark-soft'
                        }`}
                      >
                        {displayImportStatus(row.status)}
                      </span>
                    </td>

                    <td className="px-4 py-2.5">
                      {row.totalKg > 0 &&
                      row.status === 'REQUIERE REVISIÓN' ? (
                        <div className="flex min-w-[34rem] flex-col gap-2">
                          <div className="flex gap-2">
                            <select
                              aria-label={`Asociar ${row.baseProductName} a producto existente`}
                              value={
                                excelExistingProductByRow[row.rowNumber] ?? ''
                              }
                              onChange={(event) =>
                                onSelectExistingProductForRow(
                                  row.rowNumber,
                                  event.target.value,
                                )
                              }
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 focus:border-brand-400 dark:border-ui-line-dark dark:bg-ui-surface-dark-recessed dark:text-ui-text-dark-strong"
                            >
                              <option value="">Asociar a existente…</option>
                              {catalogItems
                                .filter(
                                  (product) =>
                                    product.active !== false &&
                                    !isTreatmentOnlyProduct(product),
                                )
                                .map((product) => (
                                  <option
                                    key={product.productId}
                                    value={product.productId}
                                  >
                                    {product.canonicalName ??
                                      product.productName}
                                  </option>
                                ))}
                            </select>

                            <button
                              type="button"
                              disabled={
                                !excelExistingProductByRow[row.rowNumber]
                              }
                              onClick={() =>
                                onAssociateFreezingExcelRowToExisting(
                                  row.rowNumber,
                                )
                              }
                              className={buttonStyles('secondary')}
                            >
                              Asociar
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-400 dark:text-ui-text-soft">
                            <span className="h-px flex-1 bg-slate-200 dark:bg-ui-line-dark-grid" />
                            o agregar como nuevo
                            <span className="h-px flex-1 bg-slate-200 dark:bg-ui-line-dark-grid" />
                          </div>

                          <div className="flex gap-2">
                            <select
                              aria-label={`Seleccionar familia para ${row.baseProductName}`}
                              value={
                                freezingNewProductFamilyByRow[row.rowNumber] ??
                                ''
                              }
                              onChange={(event) =>
                                onSelectFreezingFamilyForRow(
                                  row.rowNumber,
                                  event.target.value,
                                )
                              }
                              className="min-w-0 flex-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-2 text-xs font-semibold text-sky-900 focus:border-brand-400 dark:border-ui-line-dark dark:bg-ui-surface-dark-hover-strong dark:text-ui-text-dark-info"
                            >
                              <option value="">
                                Seleccionar familia del producto…
                              </option>
                              {freezingCatalogFamilyOptions.map((family) => (
                                <option
                                  key={family.familyId}
                                  value={family.familyId}
                                >
                                  {family.familyName}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              disabled={
                                !freezingNewProductFamilyByRow[row.rowNumber]
                              }
                              onClick={() =>
                                onAddFreezingExcelRowToCatalog(row.rowNumber)
                              }
                              className={buttonStyles('primary')}
                              title="Agrega el nombre base del Excel al catálogo activo; la presentación SACO no forma parte del nombre del producto."
                            >
                              <Plus className="size-4" aria-hidden="true" />
                              Agregar producto
                            </button>
                          </div>

                          <p className="text-[0.625rem] leading-4 text-slate-500 dark:text-ui-text-soft">
                            Se guardará como producto: {row.baseProductName}.
                            La presentación {row.packaging ?? 'del Excel'} se
                            conserva solo como referencia logística.
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-ui-text-soft">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {excelPreview?.rows.length ? (
        <div
          className="mx-5 mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed"
          role="region"
          aria-label="Vista previa Excel de Envasado"
        >
          <div className="border-b border-slate-200 px-4 py-3 dark:border-ui-line-dark-grid">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-950 dark:text-ui-text-dark-strong">
              Vista previa de Envasado
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ui-text-dark-soft">
              Cada fila usa únicamente Producto, Horario y la columna Total KG.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[72rem] text-left text-xs">
              <thead className="border-b border-slate-300 bg-slate-100 text-[0.625rem] uppercase tracking-[0.08em] text-slate-700 dark:border-ui-line-dark dark:bg-ui-surface-dark-compact dark:text-ui-text-dark">
                <tr>
                  <th className="px-4 py-2.5">Producto Excel</th>
                  <th className="px-4 py-2.5">Producto sistema</th>
                  <th className="px-4 py-2.5 text-center">Fecha calendario</th>
                  <th className="px-4 py-2.5 text-right">Total KG</th>
                  <th className="px-4 py-2.5 text-center">Estado</th>
                  <th className="px-4 py-2.5 text-center">Acción</th>
                </tr>
              </thead>

              <tbody>
                {excelPreview.rows.map((row, index) => (
                  <tr
                    key={`${row.productName}-${row.rowCalendarDate ?? 'sin-fecha'}-${index}`}
                    className="border-t border-slate-100 text-slate-950 hover:bg-slate-50 dark:border-ui-line-dark-grid dark:text-ui-text-dark-strong dark:hover:bg-ui-surface-dark"
                  >
                    <td className="px-4 py-2.5 font-semibold">
                      {row.productName}
                    </td>

                    <td className="px-4 py-2.5 text-slate-600 dark:text-ui-text-dark-soft">
                      {row.product?.canonicalName ??
                        row.product?.productName ??
                        '—'}
                    </td>

                    <td className="px-4 py-2.5 text-center text-slate-600 dark:text-ui-text-dark-soft">
                      {row.rowCalendarDate ?? 'No confirmada'}
                    </td>

                    <td className="number-tabular px-4 py-2.5 text-right font-bold">
                      {formatCentiKgValue(
                        captureQuantityKg100(String(row.totalKg)),
                      )}
                    </td>

                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[0.625rem] font-extrabold uppercase tracking-[0.06em] ${
                          row.status === 'COINCIDENCIA EXACTA' ||
                          row.status === 'COINCIDENCIA NORMALIZADA' ||
                          row.status === 'ALIAS CONOCIDO'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-ui-emerald-border-dark dark:bg-ui-emerald-surface-dark dark:text-ui-emerald-text-dark'
                            : row.status === 'NUEVO PRODUCTO'
                              ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-slate-200 dark:bg-slate-100 dark:text-sky-300'
                              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-ui-amber-border-dark dark:bg-ui-amber-surface-dark dark:text-ui-amber-text-dark-soft'
                        }`}
                        title={row.matchReason}
                      >
                        {displayImportStatus(row.status)}
                      </span>
                    </td>

                    <td className="px-4 py-2.5">
                      {row.totalKg > 0 &&
                      (row.status === 'NUEVO PRODUCTO' ||
                        row.status === 'REQUIERE REVISIÓN') ? (
                        <div className="flex min-w-72 flex-col gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-bold text-white hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:bg-sky-600 dark:hover:bg-sky-500 dark:text-white dark:focus:ring-sky-500/20"
                            onClick={() => onAddExcelRowToCatalog(row.rowNumber)}
                          >
                            Revisar / Agregar al catálogo
                          </button>

                          <div className="flex gap-2">
                            <select
                              aria-label={`Asociar ${row.productName} a producto existente`}
                              value={
                                excelExistingProductByRow[row.rowNumber] ?? ''
                              }
                              onChange={(event) =>
                                onSelectExistingProductForRow(
                                  row.rowNumber,
                                  event.target.value,
                                )
                              }
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 focus:border-brand-400 dark:border-slate-200 dark:bg-slate-50 dark:text-white dark:focus:border-brand-500"
                            >
                              <option value="">Asociar a existente…</option>
                              {catalogItems.map((product) => (
                                <option
                                  key={product.productId}
                                  value={product.productId}
                                >
                                  {product.canonicalName ?? product.productName}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              disabled={
                                !excelExistingProductByRow[row.rowNumber]
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand-300 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-200 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-white"
                              onClick={() =>
                                onAssociateExcelRowToExisting(row.rowNumber)
                              }
                            >
                              Asociar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-ui-text-soft">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}
