import { Download, LoaderCircle, Printer, Snowflake, Waves } from 'lucide-react'
import { useState } from 'react'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import { exportPageToPdf } from '../../../utils/pdfExport'
import {
  kg100,
  sumKg100,
} from '../model/calculations'
import {
  calculateFreezingAvailability,
  calculateFreezingComparison,
} from '../model/freezing'
import type { OperationalWeekView } from '../state/ProductionDataContext'
import type { ProductionDay } from '../model/types'

interface FreezingSummaryViewProps {
  week: OperationalWeekView
  allProductionDays: readonly ProductionDay[]
  selector: React.ReactNode
}

export function FreezingSummaryView({
  week,
  allProductionDays,
  selector,
}: FreezingSummaryViewProps) {
  const [exportState, setExportState] = useState<'IDLE' | 'EXPORTING' | 'ERROR'>('IDLE')

  const handleExportExcel = async () => {
    if (exportState === 'EXPORTING') return
    setExportState('EXPORTING')
    try {
      const { exportFreezingSummaryWorkbook } = await import(
        '../export/freezingSummaryWorkbook'
      )
      await exportFreezingSummaryWorkbook({
        week,
        allProductionDays,
      })
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

  const comparison = calculateFreezingComparison(allProductionDays, week.period)
  const physicalKg100 = comparison.physicalReportedKg100
  const linkedKg100 = comparison.linkedKg100
  const differenceKg100 = kg100(physicalKg100 - linkedKg100)
  const hasFreezingRecords = week.productionDays.length > 0
  const weeklyAvailableKg100 = sumKg100(
    calculateFreezingAvailability(allProductionDays)
      .filter(
        (position) =>
          position.originDate >= week.period.startDate &&
          position.originDate <= week.period.endDate,
      )
      .filter((position) => position.pendingKg100 > 0)
      .map((position) => position.pendingKg100),
  )
  const pendingKg100 = sumKg100(
    calculateFreezingAvailability(allProductionDays).map(
      (position) => position.pendingKg100,
    ),
  )
  const productTotals = new Map<string, {
    familyName: string
    productName: string
    dayKg100: number
    nightKg100: number
  }>()

  for (const day of week.productionDays) {
    for (const line of day.lines) {
      const current = productTotals.get(line.productId)
      productTotals.set(line.productId, {
        familyName: line.familyName,
        productName: line.productName,
        dayKg100: (current?.dayKg100 ?? 0) + line.shifts.DAY.reportedKg100,
        nightKg100: (current?.nightKg100 ?? 0) + line.shifts.NIGHT.reportedKg100,
      })
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reportes · Congelamiento"
        title="Resumen semanal"
        description={`Semana ${week.number} · ${week.productionDays.length} de 7 jornadas de Congelamiento.`}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone={week.isClosed ? 'success' : 'info'}>
              {week.isClosed ? 'SEMANA CERRADA' : `SEMANA PARCIAL · ${week.productionDays.length} DE 7`}
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
              {exportState === 'EXPORTING' ? 'Generando…' : 'Exportar Excel'}
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
        <p role="alert" className="text-xs font-semibold text-rose-700 dark:text-rose-300">
          No se pudo generar el archivo Excel. Intenta nuevamente.
        </p>
      ) : null}
      {selector}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Indicadores de Congelamiento">
        <MetricCard
          label="Disponible de Envasado"
          value={formatCentiKg(weeklyAvailableKg100)}
          icon={<Snowflake className="size-5" />}
          tone="brand"
          description="Semana seleccionada · pendiente real"
        />
        <MetricCard
          label="Congelado físicamente"
          value={formatCentiKg(physicalKg100)}
          icon={<Snowflake className="size-5" />}
          tone="success"
          description={
            hasFreezingRecords
              ? 'Reportes físicos de la semana'
              : 'Sin registros de congelamiento esta semana'
          }
        />
        <MetricCard
          label="Vinculado por trazabilidad"
          value={formatCentiKg(linkedKg100)}
          icon={<Waves className="size-5" />}
          tone="success"
          description="Consumos FIFO realizados esta semana"
        />
        <MetricCard
          label="Diferencia de trazabilidad semanal"
          value={hasFreezingRecords ? formatCentiKg(differenceKg100) : '—'}
          icon={<Waves className="size-5" />}
          tone={
            !hasFreezingRecords
              ? 'neutral'
              : differenceKg100 === 0
                ? 'success'
                : 'danger'
          }
          description={
            !hasFreezingRecords
              ? 'Sin registros para verificar la diferencia'
              : differenceKg100 === 0
                ? 'Físico − vinculado · semana conciliada'
                : 'Físico − vinculado · requiere revisión'
          }
        />
        <MetricCard
          label="Pendiente global de congelamiento"
          value={formatCentiKg(pendingKg100)}
          icon={<Waves className="size-5" />}
          tone="warning"
          description="Todas las semanas"
        />
      </section>

      <SectionCard
        title="Cuadre de Congelamiento"
        description="El total físico debe estar completamente vinculado con disponibilidad originada en Envasado."
        action={
          <StatusBadge
            tone={
              !hasFreezingRecords
                ? 'info'
                : differenceKg100 === 0
                  ? 'success'
                  : 'danger'
            }
          >
            {!hasFreezingRecords
              ? 'SIN REGISTROS'
              : differenceKg100 === 0
                ? 'CUADRADO'
                : 'REVISAR'}
          </StatusBadge>
        }
      >
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <MetricCard label="Congelado físicamente" value={formatCentiKg(physicalKg100)} />
          <MetricCard label="Congelado atribuible" value={formatCentiKg(linkedKg100)} />
          <MetricCard
            label="Diferencia"
            value={hasFreezingRecords ? formatCentiKg(differenceKg100) : '—'}
            tone={!hasFreezingRecords ? 'neutral' : differenceKg100 === 0 ? 'success' : 'danger'}
            description={
              hasFreezingRecords
                ? undefined
                : 'Sin registros para verificar la diferencia'
            }
          />
        </div>
      </SectionCard>

      <SectionCard title="Congelado por producto" description="Consolidado físico por producto y turno.">
        {productTotals.size === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">Sin registros de congelamiento esta semana.</p>
        ) : (
          <DataTableScroll label="Congelado semanal por producto">
            <table className="erp-table w-full min-w-[48rem] table-fixed border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
                  <th className="w-[52%] px-4 py-2.5 text-left">Familia / producto</th>
                  <th className="w-[16%] px-3 py-2.5 text-center">Día</th>
                  <th className="w-[16%] px-3 py-2.5 text-center">Noche</th>
                  <th className="w-[16%] px-3 py-2.5 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {[...productTotals.entries()].map(([productId, product]) => (
                  <tr key={productId} className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left">
                      <span className="block text-[0.625rem] font-bold uppercase text-sky-700">{product.familyName}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-800">{product.productName}</span>
                    </th>
                    <td className="number-tabular px-3 py-3 text-center text-xs">{formatCentiKg(kg100(product.dayKg100))}</td>
                    <td className="number-tabular px-3 py-3 text-center text-xs">{formatCentiKg(kg100(product.nightKg100))}</td>
                    <td className="number-tabular px-3 py-3 text-center text-xs font-bold">{formatCentiKg(kg100(product.dayKg100 + product.nightKg100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableScroll>
        )}
      </SectionCard>

      {week.productionDays.length > 0 ? (
        <p className="text-xs text-slate-500">
          Última jornada física: {formatIsoDate(week.productionDays.at(-1)!.date)}.
        </p>
      ) : null}
    </div>
  )
}
