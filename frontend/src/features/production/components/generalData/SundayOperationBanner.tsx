import type { ProductionCaptureDraft } from '../../capture/productionCapture'

export interface SundayOperationBannerProps {
  readonly isFreezing: boolean
  readonly isBalanceOnly: boolean
  readonly onUpdateDraft: <K extends keyof ProductionCaptureDraft>(
    field: K,
    value: ProductionCaptureDraft[K],
  ) => void
}

export function SundayOperationBanner({
  isFreezing,
  isBalanceOnly,
  onUpdateDraft,
}: SundayOperationBannerProps) {
  return (
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
  )
}
