import { Plus } from 'lucide-react'
import { buttonStyles } from '../../../../components/ui/buttonStyles'
import {
  displayImportStatus,
  isTreatmentOnlyProduct,
  type FreezingExcelPreviewRow,
} from '../../capture/freezingExcelPreview'
import type { ProductionCatalogItem } from '../../capture/productionCatalog'

export interface FreezingExcelPreviewTableProps {
  readonly rows: readonly FreezingExcelPreviewRow[]
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly freezingCatalogFamilyOptions: readonly {
    familyId: string
    familyName: string
  }[]
  readonly excelExistingProductByRow: Record<number, string>
  readonly freezingNewProductFamilyByRow: Record<number, string>
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
}

export function FreezingExcelPreviewTable({
  rows,
  catalogItems,
  freezingCatalogFamilyOptions,
  excelExistingProductByRow,
  freezingNewProductFamilyByRow,
  onSelectExistingProductForRow,
  onSelectFreezingFamilyForRow,
  onAssociateFreezingExcelRowToExisting,
  onAddFreezingExcelRowToCatalog,
}: FreezingExcelPreviewTableProps) {
  if (rows.length === 0) return null

  return (
    <div
      className="mx-5 mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed"
      role="region"
      aria-label="Vista previa Excel de Congelamiento"
    >
      <div className="border-b border-slate-200 px-4 py-3 dark:border-ui-line-dark-grid">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-950 dark:text-ui-text-dark-strong">
          Vista previa de Congelamiento
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ui-text-soft">
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
            {rows.map((row) => (
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
  )
}
