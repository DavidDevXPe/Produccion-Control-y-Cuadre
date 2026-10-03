import { FileSpreadsheet, Printer } from 'lucide-react'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatusBadge } from '../../../components/ui/StatusBadge'

interface WeeklySummaryHeaderProps {
  weekNumber: number
  productionDaysCount: number
  isClosed: boolean
  onExportExcel: () => void
  onExportPdf: () => void
}

export function WeeklySummaryHeader({
  weekNumber,
  productionDaysCount,
  isClosed,
  onExportExcel,
  onExportPdf,
}: WeeklySummaryHeaderProps) {
  return (
    <PageHeader
      eyebrow="Reportes"
      title="Resumen semanal"
      description={`Semana ${weekNumber} · Validación acumulada con ${productionDaysCount} jornadas registradas.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportExcel}
            className={`no-print ${buttonStyles('secondary', 'sm')}`}
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className={`no-print ${buttonStyles('secondary', 'sm')}`}
          >
            <Printer className="size-4" aria-hidden="true" />
            Exportar PDF
          </button>
          <StatusBadge tone="info">
            {isClosed
              ? `SEMANA CERRADA · ${productionDaysCount} ${productionDaysCount === 1 ? 'JORNADA' : 'JORNADAS'}`
              : `SEMANA PARCIAL · ${productionDaysCount} DE 7`}
          </StatusBadge>
        </div>
      }
    />
  )
}
