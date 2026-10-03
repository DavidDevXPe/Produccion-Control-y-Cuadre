import {
  ArrowLeft,
  CheckCircle2,
  Download,
  LoaderCircle,
  Pencil,
  Printer,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActionLink } from '../../../../components/ui/ActionLink'
import { PageHeader } from '../../../../components/ui/PageHeader'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { buttonStyles } from '../../../../components/ui/buttonStyles'
import { formatIsoDate } from '../../../../utils/formatters'
import type { ProductionDay } from '../../model/types'

export interface FreezingDayDetailHeaderProps {
  readonly productionDay: ProductionDay
  readonly statusBadge: {
    readonly tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
    readonly label: string
  }
  readonly canEdit: boolean
  readonly canClose: boolean
  readonly canExport?: boolean
  readonly exportState?: 'IDLE' | 'EXPORTING' | 'SUCCESS' | 'ERROR'
  readonly onClose: () => void
  readonly onExportPdf?: (() => void) | undefined
  readonly onExportExcel?: (() => void) | undefined
}

export function FreezingDayDetailHeader({
  productionDay,
  statusBadge,
  canEdit,
  canClose,
  canExport = false,
  exportState = 'IDLE',
  onClose,
  onExportPdf,
  onExportExcel,
}: FreezingDayDetailHeaderProps) {
  return (
    <>
      <Link
        to="/jornadas?process=FREEZING"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Todas las jornadas
      </Link>

      <PageHeader
        eyebrow="Detalle de jornada · Congelamiento"
        title={formatIsoDate(productionDay.date)}
        description="Producto congelado por turno y vinculado a su jornada de origen en Envasado."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone={statusBadge.tone} truncateText={false}>
              {statusBadge.label}
            </StatusBadge>
            {canEdit ? (
              <>
                <ActionLink
                  to={`/jornadas/${productionDay.date}/editar?process=FREEZING`}
                  variant="secondary"
                  size="sm"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Seguir editando
                </ActionLink>
                <button
                  type="button"
                  disabled={!canClose}
                  onClick={onClose}
                  className={buttonStyles('primary', 'sm')}
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Cerrar jornada
                </button>
              </>
            ) : null}
            {onExportPdf ? (
              <button
                type="button"
                onClick={onExportPdf}
                className={`no-print ${buttonStyles('secondary', 'sm')}`}
              >
                <Printer className="size-4" aria-hidden="true" />
                Exportar PDF
              </button>
            ) : null}
            {onExportExcel ? (
              <button
                type="button"
                className={`no-print ${buttonStyles('secondary', 'sm')}`}
                disabled={!canExport || exportState === 'EXPORTING'}
                onClick={onExportExcel}
                title={
                  canExport
                    ? 'Descargar jornada cerrada en formato Excel'
                    : 'Disponible únicamente para jornadas cerradas y cuadradas'
                }
              >
                {exportState === 'EXPORTING' ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Download className="size-4" aria-hidden="true" />
                )}
                {exportState === 'EXPORTING' ? 'Generando…' : 'Exportar Excel'}
              </button>
            ) : null}
          </div>
        }
      />

      <p className="sr-only" role="status" aria-live="polite">
        {exportState === 'SUCCESS'
          ? 'El archivo Excel de la jornada se descargó correctamente.'
          : exportState === 'ERROR'
            ? 'No se pudo generar el archivo Excel. Inténtalo nuevamente.'
            : ''}
      </p>
      {exportState === 'ERROR' ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200"
        >
          No se pudo generar el archivo Excel. Verifica los datos e inténtalo nuevamente.
        </div>
      ) : null}
    </>
  )
}
