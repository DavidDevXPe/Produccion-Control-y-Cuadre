import type { ProductionCaptureDraft } from '../../capture/productionCapture'

export interface SecondaryCaptureControlsProps {
  readonly draft: ProductionCaptureDraft
  readonly isFreezing: boolean
  readonly usesExternalAvailability: boolean
  readonly tunnelToggleError: string | null
  readonly onUpdateDraft: <K extends keyof ProductionCaptureDraft>(
    field: K,
    value: ProductionCaptureDraft[K],
  ) => void
  readonly onUpdateTunnelCondition: (checked: boolean) => void
}

export function SecondaryCaptureControls({
  draft,
  isFreezing,
  usesExternalAvailability,
  tunnelToggleError,
  onUpdateDraft,
  onUpdateTunnelCondition,
}: SecondaryCaptureControlsProps) {
  if (usesExternalAvailability) {
    return (
      <p className="border-t border-brand-200 bg-brand-50/60 px-4 py-3 text-xs font-semibold text-brand-900 sm:px-5">
        {isFreezing
          ? 'Congelamiento no recibe nueva MP anatómica. La validación usa reportes físicos y disponibilidad trazable desde Envasado.'
          : 'Materia Prima fija en 0 kg. La validación se realizará con los reportes físicos y los saldos vinculados por turno.'}
      </p>
    )
  }

  return (
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
  )
}
