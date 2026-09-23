import type {
  WeeklyProductionChartDatum,
  WeeklyProductionSeries,
} from './WeeklyProductionChart'

/**
 * Value of the chart line for one journey: the finished-product total
 * (Día + Noche + Tratamiento + Saldo) for "Total", otherwise the value of the
 * selected series, so the line follows what the user is looking at.
 */
export function getWeeklyChartLineKg100(
  datum: WeeklyProductionChartDatum,
  series: WeeklyProductionSeries,
): number {
  switch (series) {
    case 'DAY':
      return datum.dayKg100
    case 'NIGHT':
      return datum.nightKg100
    case 'TREATMENT':
      return datum.treatmentKg100
    case 'BALANCE':
      return datum.balanceKg100
    case 'ALL':
      return (
        datum.dayKg100 +
        datum.nightKg100 +
        datum.treatmentKg100 +
        datum.balanceKg100
      )
  }
}
