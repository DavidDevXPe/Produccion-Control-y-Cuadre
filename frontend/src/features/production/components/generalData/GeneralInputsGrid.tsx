import { QuantityInput } from '../QuantityInput'
import { formatCentiKg } from '../../../../utils/formatters'
import type { ProductionCaptureDraft } from '../../capture/productionCapture'

export interface GeneralInputsGridProps {
  readonly draft: ProductionCaptureDraft
  readonly isFreezing: boolean
  readonly activeWeekStartDate: string
  readonly activeWeekEndDate: string
  readonly usesExternalAvailability: boolean
  readonly totalReportedKg100: number
  readonly onUpdateDraft: <K extends keyof ProductionCaptureDraft>(
    field: K,
    value: ProductionCaptureDraft[K],
  ) => void
  readonly onUpdateDate: (date: string) => void
}

export function GeneralInputsGrid({
  draft,
  isFreezing,
  activeWeekStartDate,
  activeWeekEndDate,
  usesExternalAvailability,
  totalReportedKg100,
  onUpdateDraft,
  onUpdateDate,
}: GeneralInputsGridProps) {
  return (
    <div
      className={`grid gap-4 p-4 sm:grid-cols-2 sm:p-5 ${
        isFreezing ? 'xl:grid-cols-4' : 'xl:grid-cols-5'
      }`}
    >
      <label className="block">
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
          Fecha
        </span>
        <input
          type="date"
          value={draft.date}
          min={activeWeekStartDate}
          max={activeWeekEndDate}
          onChange={(event) => onUpdateDate(event.target.value)}
          className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        />
      </label>
      {!isFreezing ? (
        <QuantityInput
          label="Materia prima"
          value={usesExternalAvailability ? '0' : draft.rawMaterialKg}
          disabled={usesExternalAvailability}
          onChange={(value) => onUpdateDraft('rawMaterialKg', value)}
        />
      ) : null}
      <QuantityInput
        label="Reporte Día"
        value={draft.declaredDayTotalKg}
        onChange={(value) => onUpdateDraft('declaredDayTotalKg', value)}
      />
      <QuantityInput
        label="Reporte Noche"
        value={draft.declaredNightTotalKg}
        onChange={(value) => onUpdateDraft('declaredNightTotalKg', value)}
      />
      <div>
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
          {isFreezing ? 'Total congelado' : 'Total reportado'}
        </span>
        <div className="number-tabular flex h-10 items-center justify-end rounded-lg border border-brand-200 bg-brand-50 px-3 text-sm font-extrabold text-brand-900">
          {formatCentiKg(totalReportedKg100)}
        </div>
      </div>
    </div>
  )
}
