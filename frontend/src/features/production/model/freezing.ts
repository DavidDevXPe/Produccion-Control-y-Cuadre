import { calculateProductionDay, kg100, sumKg100 } from "./calculations";
import {
  isFreezingProductionDay,
  isPackingProductionDay,
} from "./productionProcess";
import { normalizeBalanceLots } from "./balanceLotNormalization";
import { productIdsEquivalent } from "./productIdentity";
import type {
  Kg100,
  ProductionDay,
  ProductionLine,
  SummaryGroupId,
  WeeklySummaryPeriod,
} from "./types";

export interface FreezingAvailabilityPosition {
  readonly originDayId: string;
  readonly originDate: string;
  readonly familyId: string;
  readonly familyName: string;
  readonly productId: string;
  readonly productName: string;
  readonly summaryGroupId: SummaryGroupId;
  readonly generatedKg100: Kg100;
  readonly processedDayKg100: Kg100;
  readonly processedNightKg100: Kg100;
  readonly processedTotalKg100: Kg100;
  readonly pendingKg100: Kg100;
  readonly excessKg100: Kg100;
}

export interface FreezingComparisonRow {
  readonly id: string;
  readonly label: string;
  readonly packedKg100: Kg100;
  readonly frozenKg100: Kg100;
  readonly pendingKg100: Kg100;
  readonly unexplainedDifferenceKg100: Kg100;
}

export interface FreezingComparison {
  readonly packedKg100: Kg100;
  readonly frozenKg100: Kg100;
  readonly pendingKg100: Kg100;
  readonly unexplainedDifferenceKg100: Kg100;
  readonly status: "BALANCED" | "REVIEW";
  readonly byFamily: readonly FreezingComparisonRow[];
  readonly byProduct: readonly FreezingComparisonRow[];
}

function calculatePackingFreezingSourceKg100(line: ProductionLine): Kg100 {
  return sumKg100([
    line.shifts.DAY.reportedKg100,
    line.shifts.NIGHT.reportedKg100,
    line.newClosingBalanceKg100,
  ]);
}

function isClosedBalancedPackingDay(day: ProductionDay): boolean {
  return (
    isPackingProductionDay(day) &&
    day.status === "CLOSED" &&
    calculateProductionDay(day).status === "BALANCED"
  );
}

export function calculateFrozenPhysicalKg100(day: ProductionDay): Kg100 {
  if (!isFreezingProductionDay(day)) return kg100(0);
  return sumKg100([
    day.declaredShiftTotalsKg100.DAY,
    day.declaredShiftTotalsKg100.NIGHT,
  ]);
}

export function calculateFreezingAvailability(
  productionDays: readonly ProductionDay[],
  asOfDate?: string,
): readonly FreezingAvailabilityPosition[] {
  const sourceDays = productionDays.filter(
    (day) =>
      isClosedBalancedPackingDay(day) && (!asOfDate || day.date <= asOfDate),
  );
  const freezingDays = productionDays.filter(
    (day) =>
      isFreezingProductionDay(day) && (!asOfDate || day.date <= asOfDate),
  );

  return sourceDays.flatMap((originDay) =>
    originDay.lines.flatMap((line) => {
      const generatedKg100 = calculatePackingFreezingSourceKg100(line);

      if (generatedKg100 <= 0) {
        return [];
      }

      const matchingUses = freezingDays.flatMap((freezingDay) =>
        normalizeBalanceLots(freezingDay.receivedBalanceLots).flatMap((lot) =>
          lot.originDayId === originDay.id &&
          productIdsEquivalent(
            lot.sourceProductId ?? lot.productId,
            line.productId,
          ) &&
          lot.familyId === line.familyId
            ? lot.uses.filter((use) => use.targetDayId === freezingDay.id)
            : [],
        ),
      );

      const processedDayKg100 = sumKg100(
        matchingUses
          .filter((use) => use.shift === "DAY")
          .map((use) => use.kg100),
      );

      const processedNightKg100 = sumKg100(
        matchingUses
          .filter((use) => use.shift === "NIGHT")
          .map((use) => use.kg100),
      );

      const processedTotalKg100 = sumKg100([
        processedDayKg100,
        processedNightKg100,
      ]);

      const differenceKg100 = kg100(generatedKg100 - processedTotalKg100);

      return [
        {
          originDayId: originDay.id,
          originDate: originDay.date,
          familyId: line.familyId,
          familyName: line.familyName,
          productId: line.productId,
          productName: line.productName,
          summaryGroupId: line.summaryGroupId,

          generatedKg100,

          processedDayKg100,
          processedNightKg100,
          processedTotalKg100,

          pendingKg100: kg100(Math.max(differenceKg100, 0)),

          excessKg100: kg100(Math.max(-differenceKg100, 0)),
        },
      ];
    }),
  );
}

function aggregateComparisonRows(
  positions: readonly FreezingAvailabilityPosition[],
  dimension: "family" | "product",
  unlinkedById: ReadonlyMap<string, { label: string; kg100: Kg100 }>,
): readonly FreezingComparisonRow[] {
  const rows = new Map<string, FreezingComparisonRow>();

  for (const position of positions) {
    const id = dimension === "family" ? position.familyId : position.productId;
    const label =
      dimension === "family" ? position.familyName : position.productName;
    const current = rows.get(id);
    const packedKg100 = kg100(
      (current?.packedKg100 ?? 0) + position.generatedKg100,
    );
    const frozenKg100 = kg100(
      (current?.frozenKg100 ?? 0) + position.processedTotalKg100,
    );
    const pendingKg100 = kg100(
      (current?.pendingKg100 ?? 0) + position.pendingKg100,
    );

    rows.set(id, {
      id,
      label,
      packedKg100,
      frozenKg100,
      pendingKg100,
      unexplainedDifferenceKg100: kg100(
        packedKg100 - frozenKg100 - pendingKg100,
      ),
    });
  }

  for (const [id, unlinked] of unlinkedById) {
    if (unlinked.kg100 === 0) {
      continue;
    }

    const current = rows.get(id);
    rows.set(
      id,
      current
        ? {
            ...current,
            unexplainedDifferenceKg100: kg100(
              current.unexplainedDifferenceKg100 - unlinked.kg100,
            ),
          }
        : {
            id,
            label: unlinked.label,
            packedKg100: kg100(0),
            frozenKg100: kg100(0),
            pendingKg100: kg100(0),
            unexplainedDifferenceKg100: kg100(-unlinked.kg100),
          },
    );
  }

  return [...rows.values()].sort((first, second) =>
    first.label.localeCompare(second.label, "es-PE"),
  );
}

export function calculateFreezingComparison(
  productionDays: readonly ProductionDay[],
  period: WeeklySummaryPeriod,
): FreezingComparison {
  const positions = calculateFreezingAvailability(productionDays).filter(
    (position) =>
      position.originDate >= period.startDate &&
      position.originDate <= period.endDate,
  );
  const packedKg100 = sumKg100(
    positions.map((position) => position.generatedKg100),
  );
  const frozenKg100 = sumKg100(
    positions.map((position) => position.processedTotalKg100),
  );
  const pendingKg100 = sumKg100(
    positions.map((position) => position.pendingKg100),
  );
  const unlinkedByFamily = new Map<string, { label: string; kg100: Kg100 }>();
  const unlinkedByProduct = new Map<string, { label: string; kg100: Kg100 }>();
  const unlinkedPhysicalKg100 = sumKg100(
    productionDays
      .filter(
        (day) =>
          isFreezingProductionDay(day) &&
          day.date >= period.startDate &&
          day.date <= period.endDate,
      )
      .flatMap((day) =>
        day.lines.map((line) => {
          const physicalKg100 = sumKg100([
            line.shifts.DAY.reportedKg100,
            line.shifts.NIGHT.reportedKg100,
          ]);
          const linkedKg100 = sumKg100(
            normalizeBalanceLots(day.receivedBalanceLots)
              .filter(
                (lot) =>
                  lot.familyId === line.familyId &&
                  productIdsEquivalent(lot.productId, line.productId),
              )
              .flatMap((lot) =>
                lot.uses
                  .filter((use) => use.targetDayId === day.id)
                  .map((use) => use.kg100),
              ),
          );
          const unlinkedKg100 = kg100(Math.max(physicalKg100 - linkedKg100, 0));
          unlinkedByFamily.set(line.familyId, {
            label: line.familyName,
            kg100: kg100(
              (unlinkedByFamily.get(line.familyId)?.kg100 ?? 0) + unlinkedKg100,
            ),
          });
          unlinkedByProduct.set(line.productId, {
            label: line.productName,
            kg100: kg100(
              (unlinkedByProduct.get(line.productId)?.kg100 ?? 0) +
                unlinkedKg100,
            ),
          });
          return unlinkedKg100;
        }),
      ),
  );
  const unexplainedDifferenceKg100 = kg100(
    packedKg100 - frozenKg100 - pendingKg100 - unlinkedPhysicalKg100,
  );

  return {
    packedKg100,
    frozenKg100,
    pendingKg100,
    unexplainedDifferenceKg100,
    status: unexplainedDifferenceKg100 === 0 ? "BALANCED" : "REVIEW",
    byFamily: aggregateComparisonRows(positions, "family", unlinkedByFamily),
    byProduct: aggregateComparisonRows(positions, "product", unlinkedByProduct),
  };
}
