import {
  ArrowLeft,
  CheckCircle2,
  Download,
  LoaderCircle,
  Pencil,
  Printer,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatIsoDate } from '../../../utils/formatters'
import type { ProductionDay } from '../model/types'

interface ProductionDayHeaderProps {
  productionDay: ProductionDay
  process?: string | undefined
  isBalanceOnly: boolean
  sourceSheet: string
  statusBadge: {
    tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
    label: string
  }
  canEdit: boolean
  isReadyToClose: boolean
  canExport: boolean
  exportState: 'IDLE' | 'EXPORTING' | 'SUCCESS' | 'ERROR'
  onCloseDay: () => void
  onExportPdf: () => void
  onExportExcel: () => void
}

export function ProductionDayHeader({
  productionDay,
  process,
  isBalanceOnly,
  sourceSheet,
  statusBadge,
  canEdit,
  isReadyToClose,
  canExport,
  exportState,
  onCloseDay,
  onExportPdf,
  onExportExcel,
}: ProductionDayHeaderProps) {
  return (
    <>
      <Link
        to="/jornadas?process=PACKING"
        className="no-print inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Todas las jornadas
      </Link>

      <PageHeader
        eyebrow="Detalle de jornada · Envasado"
        title={formatIsoDate(productionDay.date)}
        description={
          isBalanceOnly
            ? 'Domingo de procesamiento físico vinculado íntegramente a saldos de jornadas anteriores.'
            : `Datos reconstruidos desde ${sourceSheet} y validados producto por producto.`
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone={statusBadge.tone} truncateText={false}>
              {statusBadge.label}
            </StatusBadge>
            {isBalanceOnly ? (
              <StatusBadge tone="info" truncateText={false}>
                JORNADA DE SALDOS
              </StatusBadge>
            ) : null}
            {canEdit ? (
              <>
                <ActionLink
                  to={`/jornadas/${productionDay.date}/editar?process=${process}`}
                  variant="secondary"
                  size="sm"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Seguir editando
                </ActionLink>
                <button
                  type="button"
                  disabled={!isReadyToClose}
                  onClick={onCloseDay}
                  className={buttonStyles('primary', 'sm')}
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Cerrar jornada
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={onExportPdf}
              className={`no-print ${buttonStyles('secondary', 'sm')}`}
            >
              <Printer className="size-4" aria-hidden="true" />
              Exportar PDF
            </button>
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
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          No se pudo generar el archivo Excel. Inténtalo nuevamente.
        </div>
      ) : null}

      <nav
        aria-label="Secciones de la jornada"
        className="no-print flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/80 p-1 dark:bg-slate-50/5"
      >
        {(
          [
            ['#cuadre', 'Cuadre'],
            ['#produccion', 'Producción'],
            ['#saldos', 'Saldos'],
          ] as const
        ).map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="shrink-0 rounded-md px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-brand-800 dark:hover:bg-slate-800"
          >
            {label}
          </a>
        ))}
      </nav>
    </>
  )
}
