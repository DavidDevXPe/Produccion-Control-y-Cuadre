import { buttonStyles } from '../../../components/ui/buttonStyles'

export interface BulkFreezingLinkDialogProps {
  readonly isOpen: boolean
  readonly pendingLinkCount: number
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

export function BulkFreezingLinkDialog({
  isOpen,
  pendingLinkCount,
  onCancel,
  onConfirm,
}: BulkFreezingLinkDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-freezing-link-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#203E50] bg-[#0D2534] shadow-2xl"
      >
        <div className="px-5 py-5">
          <h2
            id="bulk-freezing-link-title"
            className="text-base font-bold text-[#F3F8FB]"
          >
            Vincular productos mediante FIFO
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#A5BED0]">
            Se intentarán vincular{' '}
            <strong className="text-white">
              {pendingLinkCount}{' '}
              {pendingLinkCount === 1 ? 'producto' : 'productos'}
            </strong>{' '}
            utilizando primero las jornadas origen de Envasado que todavía tienen
            saldo pendiente de congelar.
          </p>

          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-3 text-xs leading-5 text-amber-100">
            Los reportes Día/Noche no serán modificados. Los vínculos generados
            podrán revisarse, editarse o eliminarse antes de cerrar la jornada.
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#203E50] bg-[#0A1A27] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className={buttonStyles('secondary')}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={buttonStyles('warning')}
          >
            Vincular todos FIFO
          </button>
        </div>
      </section>
    </div>
  )
}

