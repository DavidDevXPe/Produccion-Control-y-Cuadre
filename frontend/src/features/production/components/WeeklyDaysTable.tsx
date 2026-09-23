import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { ProductionDayCalculation, ProductionDayStatus } from '../model/types'
import type { JourneyStatusView } from '../presentation/journeyStatus'

export interface WeeklyDayRow {
  label: string
  date: string
  calculation: ProductionDayCalculation | null
  status?: ProductionDayStatus
  /** Shared journey status; when given it decides the badge shown. */
  journey?: Pick<JourneyStatusView, 'label' | 'tone'>
}

interface WeeklyDaysTableProps {
  days: readonly WeeklyDayRow[]
  totalKg100: number
  weekNumber?: number
  isWeekClosed?: boolean
}

export function WeeklyDaysTable({
  days,
  totalKg100,
  weekNumber = 41,
  isWeekClosed = false,
}: WeeklyDaysTableProps) {
  return (
    <SectionCard
      title="Producto terminado por jornada"
      description="Las jornadas no registradas permanecen visibles sin inventar cantidades."
    >
      <DataTableScroll label={`Producto terminado por jornada de la semana ${weekNumber}`}>
        <table className="erp-table w-full min-w-[48rem] table-fixed border-collapse text-center">
          <caption className="sr-only">Producto terminado diario de la semana {weekNumber}</caption>
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[20%]" />
            <col className="w-[38%]" />
            <col className="w-[24%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
              <th scope="col" className="px-3 py-2.5 text-center align-middle">Día</th>
              <th scope="col" className="px-3 py-2.5 text-center align-middle">Fecha</th>
              <th scope="col" className="px-3 py-2.5 text-center align-middle">Producto terminado</th>
              <th scope="col" className="px-3 py-2.5 text-center align-middle">Estado</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date} className="border-b border-slate-100 hover:bg-slate-50/80 last:border-0">
                <th scope="row" className="px-3 py-2.5 text-center align-middle text-xs font-bold text-slate-800">
                  <span className="inline-flex w-full items-center justify-center">
                    {day.label}
                  </span>
                </th>
                <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs text-slate-500">
                  <span className="inline-flex w-full items-center justify-center">
                    {day.date}
                  </span>
                </td>
                <td className="number-tabular whitespace-nowrap px-3 py-2.5 text-center align-middle text-xs font-semibold text-slate-800">
                  <span className="inline-flex w-full items-center justify-center">
                    {day.calculation ? formatCentiKg(day.calculation.declaredFinishedKg100) : '—'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center align-middle">
                  <div className="flex w-full items-center justify-center">
                    {day.calculation ? (
                      <StatusBadge
                        tone={
                          day.journey?.tone ??
                          (day.calculation.status === 'BALANCED' ? 'success' : 'danger')
                        }
                        truncateText={false}
                      >
                        {day.journey?.label ??
                          (day.calculation.status === 'BALANCED' ? 'CUADRADO' : 'NO CUADRADO')}
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">SIN REGISTRO</StatusBadge>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <th scope="row" colSpan={2} className="px-3 py-3 text-center align-middle text-xs font-bold text-slate-950">
                Total semanal registrado
              </th>
              <td className="number-tabular whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-bold text-slate-950">
                <span className="inline-flex w-full items-center justify-center">
                  {formatCentiKg(totalKg100)}
                </span>
              </td>
              <td className="px-3 py-3 text-center align-middle">
                <div className="flex w-full items-center justify-center">
                  <StatusBadge tone="info">
                    {isWeekClosed ? 'CERRADA' : 'PARCIAL'}
                  </StatusBadge>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </DataTableScroll>
    </SectionCard>
  )
}
