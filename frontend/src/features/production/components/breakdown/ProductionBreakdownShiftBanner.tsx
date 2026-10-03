import { Info } from 'lucide-react'

export function ProductionBreakdownShiftBanner() {
  return (
    <div className="flex items-start gap-3 border-b border-brand-100 bg-brand-50/75 px-4 py-3 text-xs leading-5 text-brand-950 sm:px-5">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        Los totales de Día y Noche son explícitos. El reparto por producto fue
        reconstruido para conciliar los totales cuando el origen no identifica el
        turno.
      </p>
    </div>
  )
}
