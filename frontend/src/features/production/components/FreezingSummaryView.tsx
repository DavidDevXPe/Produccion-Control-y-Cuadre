import { Download, LoaderCircle, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatIsoDate } from '../../../utils/formatters'
import { exportPageToPdf } from '../../../utils/pdfExport'
import { kg100, sumKg100 } from '../model/calculations'
import {
  calculateFreezingAvailability,
  calculateFreezingComparison,
} from '../model/freezing'
import type { ProductionDay } from '../model/types'
import type { OperationalWeekView } from '../state/ProductionDataContext'
import {
  FreezingComparisonSection,
  FreezingProductTotalsSection,
  FreezingSummaryMetrics,
  type FreezingProductTotal,
} from './FreezingSummarySections'

interface FreezingSummaryViewProps {
  week: OperationalWeekView
  allProductionDays: readonly ProductionDay[]
  selector: React.ReactNode
}

function buildProductTotals(
  days: readonly ProductionDay[],
): ReadonlyMap<string, FreezingProductTotal> {
  const totals = new Map<string, FreezingProductTotal>()

  for (const day of days) {
    for (const line of day.lines) {
      const current = totals.get(line.productId)
      totals.set(line.productId, {
        familyName: line.familyName,
        productName: line.productName,
        dayKg100: (current?.dayKg100 ?? 0) + line.shifts.DAY.reportedKg100,
        nightKg100:
          (current?.nightKg100 ?? 0) + line.shifts.NIGHT.reportedKg100,
      })
    }
  }

  return totals
}

export function FreezingSummaryView({
  week,
  allProductionDays,
  selector,
}: FreezingSummaryViewProps) {
  const [exportState, setExportState] = useState<'IDLE' | 'EXPORTING' | 'ERROR'>(
    'IDLE',
  )
  const comparison = calculateFreezingComparison(allProductionDays, week.period)
  const availability = useMemo(
    () => calculateFreezingAvailability(allProductionDays),
    [allProductionDays],
  )
  const productTotals = useMemo(
    () => buildProductTotals(week.productionDays),
    [week.productionDays],
  )
  const physicalKg100 = comparison.physicalReportedKg100
  const linkedKg100 = comparison.linkedKg100
  const differenceKg100 = kg100(physicalKg100 - linkedKg100)
  const hasFreezingRecords = week.productionDays.length > 0
  const weeklyAvailableKg100 = sumKg100(
    availability
      .filter(
        (position) =>
          position.originDate >= week.period.startDate &&
          position.originDate <= week.period.endDate,
      )
      .filter((position) => position.pendingKg100 > 0)
      .map((position) => position.pendingKg100),
  )
  const pendingKg100 = sumKg100(
    availability.map((position) => position.pendingKg100),
  )

  const handleExportExcel = async () => {
    if (exportState === 'EXPORTING') return
    setExportState('EXPORTING')
    try {
      const { exportFreezingSummaryWorkbook } = await import(
        '../export/freezingSummaryWorkbook'
      )
      await exportFreezingSummaryWorkbook({ week, allProductionDays })
      setExportState('IDLE')
    } catch {
      setExportState('ERROR')
    }
  }

  const handleExportPdf = async () => {
    try {
      await exportPageToPdf(`Resumen_Congelamiento_Semana_${week.number}`)
    } catch {
      setExportState('ERROR')
    }
  }

  const exportLabel = exportState === 'EXPORTING' ? 'Generando…' : 'Exportar Excel'
  const weekStatus = week.isClosed
    ? 'SEMANA CERRADA'
    : `SEMANA PARCIAL · ${week.productionDays.length} DE 7`

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reportes · Congelamiento"
        title="Resumen semanal"
        description={`Semana ${week.number} · ${week.productionDays.length} de 7 jornadas de Congelamiento.`}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone={week.isClosed ? 'success' : 'info'}>
              {weekStatus}
            </StatusBadge>
            <button
              type="button"
              className={buttonStyles('secondary', 'sm')}
              onClick={handleExportExcel}
              disabled={exportState === 'EXPORTING'}
              title="Descargar resumen de congelamiento en Excel"
            >
              {exportState === 'EXPORTING' ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              {exportLabel}
            </button>
            <button
              type="button"
              className={buttonStyles('secondary', 'sm')}
              onClick={handleExportPdf}
              title="Imprimir o exportar resumen de congelamiento a PDF"
            >
              <Printer className="size-4" aria-hidden="true" />
              Exportar PDF
            </button>
          </div>
        }
      />
      {exportState === 'ERROR' ? (
        <p
          role="alert"
          className="text-xs font-semibold text-rose-700 dark:text-rose-300"
        >
          No se pudo generar el archivo Excel. Intenta nuevamente.
        </p>
      ) : null}
      {selector}

      <FreezingSummaryMetrics
        weeklyAvailableKg100={weeklyAvailableKg100}
        physicalKg100={physicalKg100}
        linkedKg100={linkedKg100}
        differenceKg100={differenceKg100}
        pendingKg100={pendingKg100}
        hasFreezingRecords={hasFreezingRecords}
      />
      <FreezingComparisonSection
        physicalKg100={physicalKg100}
        linkedKg100={linkedKg100}
        differenceKg100={differenceKg100}
        hasFreezingRecords={hasFreezingRecords}
      />
      <FreezingProductTotalsSection productTotals={productTotals} />

      {week.productionDays.length > 0 ? (
        <p className="text-xs text-slate-500">
          Última jornada física: {formatIsoDate(week.productionDays.at(-1)!.date)}.
        </p>
      ) : null}
    </div>
  )
}
