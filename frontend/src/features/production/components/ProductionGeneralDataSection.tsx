import { SectionCard } from '../../../components/ui/SectionCard'
import type { ProductionCaptureDraft } from '../capture/productionCapture'
import { ExcelImportedBalancesAlert } from './generalData/ExcelImportedBalancesAlert'
import { GeneralInputsGrid } from './generalData/GeneralInputsGrid'
import { SecondaryCaptureControls } from './generalData/SecondaryCaptureControls'
import { SundayOperationBanner } from './generalData/SundayOperationBanner'

export interface ProductionGeneralDataSectionProps {
  readonly draft: ProductionCaptureDraft
  readonly isSunday: boolean
  readonly isFreezing: boolean
  readonly isBalanceOnly: boolean
  readonly editingDate?: string | undefined
  readonly existingDayDate?: string | undefined
  readonly activeWeekStartDate: string
  readonly activeWeekEndDate: string
  readonly usesExternalAvailability: boolean
  readonly totalReportedKg100: number
  readonly tunnelToggleError: string | null
  readonly importedBalanceMatches: boolean
  readonly importedBalanceTotal: number
  readonly newClosingBalanceKg100: number
  readonly onUpdateDraft: <K extends keyof ProductionCaptureDraft>(
    field: K,
    value: ProductionCaptureDraft[K],
  ) => void
  readonly onUpdateDate: (date: string) => void
  readonly onUpdateTunnelCondition: (checked: boolean) => void
}

export function ProductionGeneralDataSection({
  draft,
  isSunday,
  isFreezing,
  isBalanceOnly,
  editingDate,
  existingDayDate,
  activeWeekStartDate,
  activeWeekEndDate,
  usesExternalAvailability,
  totalReportedKg100,
  tunnelToggleError,
  importedBalanceMatches,
  importedBalanceTotal,
  newClosingBalanceKg100,
  onUpdateDraft,
  onUpdateDate,
  onUpdateTunnelCondition,
}: ProductionGeneralDataSectionProps) {
  return (
    <>
      <SectionCard
        title="Datos generales"
        description={
          draft.source === 'EXCEL'
            ? `Vista previa de ${draft.sourceSheet}; todos los campos siguen siendo editables antes de guardar.`
            : 'Totales independientes usados para validar el cuadre y el aprovechamiento.'
        }
      >
        {isSunday ? (
          <SundayOperationBanner
            isFreezing={isFreezing}
            isBalanceOnly={isBalanceOnly}
            onUpdateDraft={onUpdateDraft}
          />
        ) : null}

        <GeneralInputsGrid
          draft={draft}
          isFreezing={isFreezing}
          editingDate={editingDate}
          existingDayDate={existingDayDate}
          activeWeekStartDate={activeWeekStartDate}
          activeWeekEndDate={activeWeekEndDate}
          usesExternalAvailability={usesExternalAvailability}
          totalReportedKg100={totalReportedKg100}
          onUpdateDraft={onUpdateDraft}
          onUpdateDate={onUpdateDate}
        />

        <SecondaryCaptureControls
          draft={draft}
          isFreezing={isFreezing}
          usesExternalAvailability={usesExternalAvailability}
          tunnelToggleError={tunnelToggleError}
          onUpdateDraft={onUpdateDraft}
          onUpdateTunnelCondition={onUpdateTunnelCondition}
        />
      </SectionCard>

      <ExcelImportedBalancesAlert
        draft={draft}
        importedBalanceMatches={importedBalanceMatches}
        importedBalanceTotal={importedBalanceTotal}
        newClosingBalanceKg100={newClosingBalanceKg100}
      />
    </>
  )
}

export default ProductionGeneralDataSection
