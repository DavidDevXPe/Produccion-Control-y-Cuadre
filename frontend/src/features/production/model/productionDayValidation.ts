import { isProductionProcess } from './productionProcess'
import type { ProductionDay } from './types'

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function quantity(value: unknown): boolean {
  return typeof value === 'number' && Number.isSafeInteger(value)
}

function shiftEntry(value: unknown): boolean {
  return record(value) && quantity(value.reportedKg100) &&
    Array.isArray(value.adjustments) && value.adjustments.every((adjustment: unknown) =>
      record(adjustment) && typeof adjustment.id === 'string' && quantity(adjustment.kg100) &&
      (adjustment.direction === 'INCREASE' || adjustment.direction === 'DECREASE'))
}

function shifts(value: unknown): boolean {
  return record(value) && shiftEntry(value.DAY) && shiftEntry(value.NIGHT)
}

// Validate the nested structures consumed by calculations before loading them.
// Negative integers remain valid input: business rules must report their issues.
export function isProductionDay(value: unknown): value is ProductionDay {
  if (!record(value)) return false
  const date = value.date
  return typeof value.id === 'string' && typeof date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date &&
    typeof value.displayName === 'string' &&
    (value.process === undefined || isProductionProcess(value.process)) &&
    quantity(value.declaredRawMaterialKg100) && quantity(value.declaredFinishedTotalKg100) &&
    record(value.declaredShiftTotalsKg100) && quantity(value.declaredShiftTotalsKg100.DAY) &&
    quantity(value.declaredShiftTotalsKg100.NIGHT) &&
    Array.isArray(value.rawMaterialEntries) && value.rawMaterialEntries.every((entry: unknown) =>
      record(entry) && typeof entry.id === 'string' && quantity(entry.kg100)) &&
    Array.isArray(value.lines) && value.lines.every((line: unknown) =>
      record(line) && typeof line.productId === 'string' && typeof line.productName === 'string' &&
      typeof line.familyId === 'string' && typeof line.familyName === 'string' &&
      typeof line.summaryGroupId === 'string' && shifts(line.shifts) &&
      (line.tunnelShifts === undefined || shifts(line.tunnelShifts)) &&
      quantity(line.treatmentKg100) && quantity(line.newClosingBalanceKg100) && quantity(line.declaredFinishedKg100)) &&
    Array.isArray(value.receivedBalanceLots) && value.receivedBalanceLots.every((lot: unknown) =>
      record(lot) && typeof lot.id === 'string' && typeof lot.originDayId === 'string' &&
      typeof lot.productId === 'string' && typeof lot.familyId === 'string' &&
      quantity(lot.originalKg100) && Array.isArray(lot.uses) && lot.uses.every((use: unknown) =>
        record(use) && typeof use.id === 'string' && typeof use.targetDayId === 'string' &&
        (use.shift === 'DAY' || use.shift === 'NIGHT') && quantity(use.kg100)))
}
