import { formatCentiKgValue } from '../../../../utils/formatters'
import { displayImportStatus } from '../../capture/freezingExcelPreview'
import type { ParsedPackingReportRow } from '../../capture/parseProductionWorkbook'
import type { ProductionCatalogItem } from '../../capture/productionCatalog'
import { captureQuantityKg100 } from '../../capture/productionEntryHelpers'

export interface PackingExcelPreviewTableProps {
  readonly rows: readonly ParsedPackingReportRow[]
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly excelExistingProductByRow: Record<number, string>
  readonly onSelectExistingProductForRow: (
    rowNumber: number,
    productId: string,
  ) => void
  readonly onAddExcelRowToCatalog: (rowNumber: number) => void
  readonly onAssociateExcelRowToExisting: (rowNumber: number) => void
}

export function PackingExcelPreviewTable({
  rows,
  catalogItems,
  excelExistingProductByRow,
  onSelectExistingProductForRow,
  onAddExcelRowToCatalog,
  onAssociateExcelRowToExisting,
}: PackingExcelPreviewTableProps) {
  if (rows.length === 0) return null

  return (
    <div
      className="mx-5 mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed"
      role="region"
      aria-label="Vista previa Excel de Envasado"
    >
      <div className="border-b border-slate-200 px-4 py-3 dark:border-ui-line-dark-grid">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-950 dark:text-ui-text-dark-strong">
          Vista previa de Envasado
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ui-text-soft">
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
            {rows.map((row, index) => (
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
  )
}
