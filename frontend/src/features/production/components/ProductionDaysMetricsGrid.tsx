import type { calculateWeeklySummary, kg100 } from '../model/calculations'
import {
  FreezingMetricCards,
  PackingMetricCards,
} from './ProductionDaysMetricCards'

export interface ProductionDaysMetricsGridProps {
  isFreezing: boolean
  freezingWeeklyAvailableKg100: ReturnType<typeof kg100>
  freezingWeeklyPhysicalKg100: ReturnType<typeof kg100>
  freezingWeeklyLinkedKg100: ReturnType<typeof kg100>
  freezingWeeklyDifferenceKg100: ReturnType<typeof kg100>
  freezingHasRecords: boolean
  freezingPendingKg100: ReturnType<typeof kg100>
  weeklySummary: ReturnType<typeof calculateWeeklySummary>
  registeredDaysCount: number
  belowReferenceCount: number
}

export function ProductionDaysMetricsGrid({
  isFreezing,
  freezingWeeklyAvailableKg100,
  freezingWeeklyPhysicalKg100,
  freezingWeeklyLinkedKg100,
  freezingWeeklyDifferenceKg100,
  freezingHasRecords,
  freezingPendingKg100,
  weeklySummary,
  registeredDaysCount,
  belowReferenceCount,
}: ProductionDaysMetricsGridProps) {
  return (
    <section
      className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      aria-label="Resumen de jornadas"
    >
      {isFreezing ? (
        <FreezingMetricCards
          freezingWeeklyAvailableKg100={freezingWeeklyAvailableKg100}
          freezingWeeklyPhysicalKg100={freezingWeeklyPhysicalKg100}
          freezingWeeklyLinkedKg100={freezingWeeklyLinkedKg100}
          freezingWeeklyDifferenceKg100={freezingWeeklyDifferenceKg100}
          freezingHasRecords={freezingHasRecords}
          freezingPendingKg100={freezingPendingKg100}
        />
      ) : (
        <PackingMetricCards
          weeklySummary={weeklySummary}
          registeredDaysCount={registeredDaysCount}
          belowReferenceCount={belowReferenceCount}
          freezingPendingKg100={freezingPendingKg100}
        />
      )}
    </section>
  )
}
