import type React from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import type { FreezingExcelPreview } from '../capture/freezingExcelPreview'
import type { ParsedPackingReportImport } from '../capture/parseProductionWorkbook'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import { ExcelImportControls } from './excel/ExcelImportControls'
import { FreezingExcelPreviewTable } from './excel/FreezingExcelPreviewTable'
import { FreezingExcelValidationSummary } from './excel/FreezingExcelValidationSummary'
import { PackingExcelPreviewTable } from './excel/PackingExcelPreviewTable'
import { PackingExcelValidationSummary } from './excel/PackingExcelValidationSummary'

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

  const warnings = isFreezing
    ? (freezingExcelPreview?.warnings ?? [])
    : (excelPreview?.warnings ?? [])

  const unresolvedCount = isFreezing
    ? unresolvedFreezingExcelRows.length
    : unresolvedExcelRows.length

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
      <ExcelImportControls
        isFreezing={isFreezing}
        excelShift={excelShift}
        fileName={fileName}
        importState={importState}
        excelImportMessage={excelImportMessage}
        canConfirmExcelImport={canConfirmExcelImport}
        warnings={warnings}
        onChangeExcelShift={onChangeExcelShift}
        onWorkbookFileChange={onWorkbookFileChange}
        onApplyExcelPreview={onApplyExcelPreview}
      />

      {freezingExcelPreview ? (
        <FreezingExcelValidationSummary preview={freezingExcelPreview} />
      ) : null}

      {excelPreview ? (
        <PackingExcelValidationSummary preview={excelPreview} />
      ) : null}

      {unresolvedCount > 0 ? (
        <p
          className="mx-5 mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800 dark:border-ui-amber-border-dark dark:bg-ui-amber-surface-dark dark:text-ui-amber-text-dark-soft"
          role="status"
        >
          {unresolvedCount} producto(s) requieren revisión antes de confirmar la importación.
        </p>
      ) : null}

      {freezingExcelPreview?.rows.length ? (
        <FreezingExcelPreviewTable
          rows={freezingExcelPreview.rows}
          catalogItems={catalogItems}
          freezingCatalogFamilyOptions={freezingCatalogFamilyOptions}
          excelExistingProductByRow={excelExistingProductByRow}
          freezingNewProductFamilyByRow={freezingNewProductFamilyByRow}
          onSelectExistingProductForRow={onSelectExistingProductForRow}
          onSelectFreezingFamilyForRow={onSelectFreezingFamilyForRow}
          onAssociateFreezingExcelRowToExisting={
            onAssociateFreezingExcelRowToExisting
          }
          onAddFreezingExcelRowToCatalog={onAddFreezingExcelRowToCatalog}
        />
      ) : null}

      {excelPreview?.rows.length ? (
        <PackingExcelPreviewTable
          rows={excelPreview.rows}
          catalogItems={catalogItems}
          excelExistingProductByRow={excelExistingProductByRow}
          onSelectExistingProductForRow={onSelectExistingProductForRow}
          onAddExcelRowToCatalog={onAddExcelRowToCatalog}
          onAssociateExcelRowToExisting={onAssociateExcelRowToExisting}
        />
      ) : null}
    </SectionCard>
  )
}
