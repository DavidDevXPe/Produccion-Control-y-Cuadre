import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface ProductionEntryReadOnlyWarningProps {
  editingDate?: string | undefined
}

export function ProductionEntryReadOnlyWarning({
  editingDate,
}: ProductionEntryReadOnlyWarningProps) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <AlertTriangle className="mx-auto size-10 text-amber-600" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-bold text-slate-900">
        {editingDate
          ? 'Esta jornada no se puede editar'
          : 'Esta semana es de solo lectura'}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Las semanas abiertas permiten captura; las semanas cerradas y futuras son de solo lectura.
      </p>
      <Link
        to="/jornadas"
        className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-bold text-white"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a jornadas
      </Link>
    </div>
  )
}
