import { formatCentiKg } from "../../../utils/formatters";
import type {
  ProductionProcess,
  ShiftCode,
} from "../../production/model/types";
import { aggregatePerformanceRecords } from "./performanceCalculations";
import type { PerformanceAggregate, PerformanceRecord } from "./types";

export function formatPerformanceMetric(
  value: number | null,
  suffix = "",
): string {
  return value === null || !Number.isFinite(value)
    ? "—"
    : `${value.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}${suffix}`;
}

export function aggregatePerformanceFor(
  records: readonly PerformanceRecord[],
  process: ProductionProcess,
  shift?: ShiftCode,
): PerformanceAggregate {
  return aggregatePerformanceRecords(
    records.filter(
      (record) =>
        record.process === process &&
        (shift === undefined || record.shift === shift),
    ),
  );
}

export function formatProductivityGap(aggregate: PerformanceAggregate): string {
  const gap = aggregate.productivityGapKg100;
  if (gap === null) return "—";
  return gap < 0
    ? `+${formatCentiKg(-gap)} sobre benchmark`
    : formatCentiKg(gap);
}
