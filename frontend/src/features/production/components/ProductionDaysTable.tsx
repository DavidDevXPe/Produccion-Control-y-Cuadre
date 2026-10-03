import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatOperationalPeriod } from '../../../utils/operationalContext'
import type { RegisteredProductionDayItem } from '../hooks/useProductionDaysData'
import type { calculateWeeklySummary, kg100 } from '../model/calculations'
import type { ProductionDay, ProductionProcess } from '../model/types'
import type { OperationalWeekView } from '../state/ProductionDataContext'
import { EmptyProductionDaysView } from './productionDays/EmptyProductionDaysView'
import { ProductionDayRow } from './productionDays/ProductionDayRow'
import { ProductionDaysTableFooter } from './productionDays/ProductionDaysTableFooter'
import { ProductionDaysTableHeader } from './productionDays/ProductionDaysTableHeader'

export interface ProductionDaysTableProps {
  registeredDays: RegisteredProductionDayItem[]
  activeWeek: OperationalWeekView
  activeWeekState: OperationalWeekView
  selectedProcess: ProductionProcess
  isFreezing: boolean
  latestDay: ProductionDay | undefined
  weeklySummary: ReturnType<typeof calculateWeeklySummary>
  frozenPhysicalKg100: ReturnType<typeof kg100>
  freezingLinkedKg100: ReturnType<typeof kg100>
  freezingDifferenceKg100: ReturnType<typeof kg100>
  balancedCount: number
}

export function ProductionDaysTable({
  registeredDays,
  activeWeek,
  activeWeekState,
  selectedProcess,
  isFreezing,
  latestDay,
  weeklySummary,
  frozenPhysicalKg100,
  freezingLinkedKg100,
  freezingDifferenceKg100,
  balancedCount,
}: ProductionDaysTableProps) {
  return (
    <SectionCard
      title={`Semana ${activeWeek.number}`}
      description={`${formatOperationalPeriod(activeWeek.period)} · ${
        activeWeekState.isClosed
          ? 'Cerrada · Solo lectura'
          : activeWeekState.isCurrent
            ? 'Actual'
            : `Abierta · ${registeredDays.length} de 7`
      }`}
      action={
        <StatusBadge tone="info">
          {registeredDays.length}{' '}
          {registeredDays.length === 1 ? 'REGISTRO' : 'REGISTROS'}
        </StatusBadge>
      }
    >
      {registeredDays.length === 0 ? (
        <EmptyProductionDaysView
          activeWeekNumber={activeWeek.number}
          selectedProcess={selectedProcess}
          activeWeekCanCreate={activeWeekState.canCreate}
          isFreezing={isFreezing}
        />
      ) : (
        <DataTableScroll
          label={`Jornadas de producción registradas en la semana ${activeWeek.number}`}
          showEdgeIndicators={false}
          className="data-scroll-clean-edge"
        >
          <table className="erp-table w-full min-w-[68rem] table-fixed border-collapse text-left">
            <ProductionDaysTableHeader isFreezing={isFreezing} />
            <tbody>
              {registeredDays.map((item, idx) => (
                <ProductionDayRow
                  key={item.day.id}
                  item={item}
                  idx={idx}
                  activeWeekNumber={activeWeek.number}
                  activeWeekReadOnly={activeWeekState.isReadOnly}
                  isFreezing={isFreezing}
                  latestDayDate={latestDay?.date}
                  selectedProcess={selectedProcess}
                />
              ))}
            </tbody>
            <ProductionDaysTableFooter
              registeredDays={registeredDays}
              weeklySummary={weeklySummary}
              isFreezing={isFreezing}
              frozenPhysicalKg100={frozenPhysicalKg100}
              freezingLinkedKg100={freezingLinkedKg100}
              freezingDifferenceKg100={freezingDifferenceKg100}
              balancedCount={balancedCount}
            />
          </table>
        </DataTableScroll>
      )}
    </SectionCard>
  )
}
