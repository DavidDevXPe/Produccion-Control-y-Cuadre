import { AlertTriangle } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { QuantityInput } from './QuantityInput'
import { formatCentiKg } from '../../../utils/formatters'
import type { ProductionCaptureDraft } from '../capture/productionCapture'

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
          <div className="border-b border-brand-200 bg-brand-50 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-900">
                  DOMINGO ·{' '}
                  {isFreezing
                    ? 'CONGELAMIENTO DE PENDIENTES'
                    : isBalanceOnly
                      ? 'PROCESAMIENTO DE SALDOS'
                      : 'PRODUCCIÓN NORMAL'}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {isFreezing
                    ? 'Los kg congelados se descuentan de la disponibilidad pendiente y conservan la jornada de Envasado que los originó.'
                    : 'Por defecto el domingo no registra nueva descarga. Los kg procesados se descuentan de saldos pendientes de jornadas anteriores.'}
                </p>
              </div>
              {!isFreezing ? (
                <label className="flex shrink-0 items-start gap-2.5 rounded-lg border border-brand-200 bg-white px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={!isBalanceOnly}
                    onChange={(event) =>
                      onUpdateDraft(
                        'operationMode',
                        event.target.checked ? 'NORMAL' : 'BALANCE_ONLY',
                      )
                    }
                    className="mt-0.5 size-4 rounded border-slate-300 text-brand-700"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Hubo descarga / producción nueva el domingo
                  </span>
                </label>
              ) : null}
            </div>
          </div>
        ) : null}
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
              min={editingDate ? existingDayDate : activeWeekStartDate}
              max={editingDate ? existingDayDate : activeWeekEndDate}
              disabled={Boolean(existingDayDate)}
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
        {!usesExternalAvailability ? (
          <div className="grid gap-4 border-t border-slate-200 px-4 py-3 sm:px-5 lg:grid-cols-2">
            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={draft.nucaWashConfirmed}
                  onChange={(event) =>
                    onUpdateDraft('nucaWashConfirmed', event.target.checked)
                  }
                  className="mt-0.5 size-4 rounded border-slate-300 text-brand-700"
                />
                <span>
                  <span className="block text-xs font-bold text-slate-800">
                    Existe pedido confirmado para lavado de Nuca Bikini
                  </span>
                  <span className="mt-0.5 block text-[0.6875rem] leading-4 text-slate-500">
                    Márcalo solo cuando corresponda; no afecta el cuadre de otros productos.
                  </span>
                </span>
              </label>
              {draft.nucaWashConfirmed ? (
                <label className="mt-3 block max-w-sm">
                  <span className="mb-1 block text-xs font-bold text-slate-700">
                    Referencia del pedido (opcional)
                  </span>
                  <input
                    type="text"
                    value={draft.nucaWashReference}
                    onChange={(event) =>
                      onUpdateDraft('nucaWashReference', event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
              ) : null}
            </div>
            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  aria-label="Existe producto para Túnel"
                  checked={draft.hasTunnelProduction}
                  onChange={(event) =>
                    onUpdateTunnelCondition(event.target.checked)
                  }
                  className="mt-0.5 size-4 rounded border-slate-300 text-brand-700"
                />
                <span>
                  <span className="block text-xs font-bold text-slate-800">
                    Existe producto para Túnel
                  </span>
                  <span className="mt-0.5 block text-[0.6875rem] leading-4 text-slate-500">
                    Activa la etapa solo cuando existan movimientos reales de Túnel.
                  </span>
                </span>
              </label>
              {tunnelToggleError ? (
                <p
                  className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900"
                  role="alert"
                >
                  {tunnelToggleError}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="border-t border-brand-200 bg-brand-50/60 px-4 py-3 text-xs font-semibold text-brand-900 sm:px-5">
            {isFreezing
              ? 'Congelamiento no recibe nueva MP anatómica. La validación usa reportes físicos y disponibilidad trazable desde Envasado.'
              : 'Materia Prima fija en 0 kg. La validación se realizará con los reportes físicos y los saldos vinculados por turno.'}
          </p>
        )}
      </SectionCard>

      {draft.importedBalances.length > 0 ? (
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
      ) : null}
    </>
  )
}
