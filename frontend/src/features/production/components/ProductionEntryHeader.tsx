import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { ProcessSelector } from './ProcessSelector'
import { formatIsoDate } from '../../../utils/formatters'
import type { ProductionDay, ProductionProcess } from '../model/types'
import type { ProductionClosureValidation } from '../model/businessRules'

export interface ProductionEntryHeaderProps {
  existingDay: ProductionDay | undefined
  isFreezing: boolean
  canClose: boolean
  closureValidation: ProductionClosureValidation
  isBalanceOnly: boolean
  draftProcess: ProductionProcess
  mode: 'MANUAL' | 'EXCEL'
  onModeChange: (mode: 'MANUAL' | 'EXCEL') => void
  onChangeProcess: (process: ProductionProcess) => void
}

export function ProductionEntryHeader({
  existingDay,
  isFreezing,
  canClose,
  closureValidation,
  isBalanceOnly,
  draftProcess,
  mode,
  onModeChange,
  onChangeProcess,
}: ProductionEntryHeaderProps) {
  return (
    <>
      <Link
        to="/jornadas"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a jornadas
      </Link>

      <PageHeader
        eyebrow="Captura operativa"
        title={existingDay ? `Editar ${formatIsoDate(existingDay.date)}` : 'Nueva jornada'}
        description={
          isFreezing
            ? 'Registra lo congelado por turno y vincula cada kilo con el producto disponible desde Envasado.'
            : 'Registra los reportes de producción y concilia cada turno hasta obtener un cuadre exacto.'
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone="info">
              {isFreezing ? 'CONGELAMIENTO' : 'ENVASADO'}
            </StatusBadge>
            <StatusBadge
              tone={
                !canClose
                  ? 'warning'
                  : closureValidation.warnings.length > 0
                    ? 'warning'
                    : 'success'
              }
            >
              {!canClose
                ? 'EN CAPTURA'
                : closureValidation.warnings.length > 0
                  ? 'LISTA · CON OBSERVACIONES'
                  : 'LISTA PARA CERRAR'}
            </StatusBadge>
            {isBalanceOnly ? (
              <StatusBadge tone="neutral">JORNADA DE SALDOS</StatusBadge>
            ) : null}
          </div>
        }
      />

      <ProcessSelector
        value={draftProcess}
        disabled={Boolean(existingDay)}
        onChange={(process) => {
          if (process !== 'COMPARISON') onChangeProcess(process)
        }}
      />

      <div>
        <p className="mb-1.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-slate-500">
          Modo de registro
        </p>
        <div
          className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
          role="tablist"
          aria-label="Forma de ingreso"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'MANUAL'}
            className={`min-h-9 rounded-lg px-4 text-xs font-bold transition ${
              mode === 'MANUAL'
                ? 'bg-brand-700 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => onModeChange('MANUAL')}
          >
            Ingreso manual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'EXCEL'}
            className={`min-h-9 rounded-lg px-4 text-xs font-bold transition ${
              mode === 'EXCEL'
                ? 'bg-brand-700 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => onModeChange('EXCEL')}
          >
            Importar Excel
          </button>
        </div>
      </div>
    </>
  )
}
