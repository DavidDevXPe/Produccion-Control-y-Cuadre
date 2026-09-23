import { calculateProductionDay, kg100, sumKg100 } from "./calculations";
import {
  isFreezingProductionDay,
  isPackingProductionDay,
} from "./productionProcess";
import { normalizeBalanceLots } from "./balanceLotNormalization";
import { productIdsEquivalent } from "./productIdentity";
import type {
  Kg100,
  ProductReconciliation,
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
  /**
   * Physical Packing report of each shift. Informative only: it can include
   * balance from an earlier journey that this shift finished packing.
   */
  readonly physicalDayKg100: Kg100;
  readonly physicalNightKg100: Kg100;
  /**
   * Balance from an earlier journey packed in each shift. It belongs to its
   * origin journey (FIFO) and is therefore not part of this journey's
   * availability.
   */
  readonly receivedBalanceDayKg100: Kg100;
  readonly receivedBalanceNightKg100: Kg100;
  /** Own packing of each shift = physical report − received balance. */
  readonly ownDayKg100: Kg100;
  readonly ownNightKg100: Kg100;
  /** Balance left at closing; it still belongs to this journey. */
  readonly closingBalanceKg100: Kg100;
  /** Freezable availability = own Day + own Night + closing balance. */
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
  /** Linked to Packing origins above the physical Freezing report. */
  readonly linkageExcessKg100: Kg100;
}

export type FreezingReviewReason =
  /** Packed − frozen − pending − unlinked is not zero. */
  | "UNEXPLAINED_DIFFERENCE"
  /** Freezing links more kilos to origins than it physically reported. */
  | "LINKAGE_EXCESS"
  /** An origin was consumed above what Packing generated. */
  | "ORIGIN_EXCESS"
  /** A Freezing journey carries integrity issues (for example over-use). */
  | "INTEGRITY_ISSUES";

export interface FreezingComparison {
  readonly packedKg100: Kg100;
  /** Attributed to the Packing origins of the period. */
  readonly frozenKg100: Kg100;
  readonly pendingKg100: Kg100;
  readonly unexplainedDifferenceKg100: Kg100;
  /** Physical Freezing reports of the period, before any linkage. */
  readonly physicalReportedKg100: Kg100;
  /** Quantity those Freezing reports link to Packing origins. */
  readonly linkedKg100: Kg100;
  /** Physical Freezing quantity that has no Packing origin. */
  readonly unlinkedPhysicalKg100: Kg100;
  /** Linked quantity above the physical report; kept, never netted away. */
  readonly linkageExcessKg100: Kg100;
  /** Origin consumption above what Packing generated. */
  readonly originExcessKg100: Kg100;
  readonly integrityIssueCount: number;
  readonly reviewReasons: readonly FreezingReviewReason[];
  /** REVIEW whenever `reviewReasons` is not empty. */
  readonly status: "BALANCED" | "REVIEW";
  readonly byFamily: readonly FreezingComparisonRow[];
  readonly byProduct: readonly FreezingComparisonRow[];
}

interface PackingFreezingSource {
  readonly physicalDayKg100: Kg100;
  readonly physicalNightKg100: Kg100;
  readonly receivedBalanceDayKg100: Kg100;
  readonly receivedBalanceNightKg100: Kg100;
  readonly ownDayKg100: Kg100;
  readonly ownNightKg100: Kg100;
  readonly closingBalanceKg100: Kg100;
  readonly generatedKg100: Kg100;
}

/**
 * Freezable availability of one Packing product. A balance received from an
 * earlier journey is packed physically in this journey, but it keeps its origin
 * journey: it is subtracted here so it is counted only once, in the journey
 * that left it. The physical report stays available as information.
 *
 * `previousBalanceProcessedKg100` comes from the same calculation used by the
 * Packing reconciliation, so both views apply one single rule.
 */
function calculatePackingFreezingSource(
  line: ProductionLine,
  product: ProductReconciliation | undefined,
): PackingFreezingSource {
  const physicalDayKg100 = line.shifts.DAY.reportedKg100;
  const physicalNightKg100 = line.shifts.NIGHT.reportedKg100;
  const receivedBalanceDayKg100 =
    product?.day.previousBalanceProcessedKg100 ?? kg100(0);
  const receivedBalanceNightKg100 =
    product?.night.previousBalanceProcessedKg100 ?? kg100(0);
  const ownDayKg100 = kg100(physicalDayKg100 - receivedBalanceDayKg100);
  const ownNightKg100 = kg100(physicalNightKg100 - receivedBalanceNightKg100);
  const closingBalanceKg100 = line.newClosingBalanceKg100;

  return {
    physicalDayKg100,
    physicalNightKg100,
    receivedBalanceDayKg100,
    receivedBalanceNightKg100,
    ownDayKg100,
    ownNightKg100,
    closingBalanceKg100,
    generatedKg100: sumKg100([ownDayKg100, ownNightKg100, closingBalanceKg100]),
  };
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
  const sourceDays = productionDays.flatMap((day) => {
    if (!isPackingProductionDay(day) || day.status !== "CLOSED") return [];
    if (asOfDate && day.date > asOfDate) return [];
    const calculation = calculateProductionDay(day);
    return calculation.status === "BALANCED" ? [{ day, calculation }] : [];
  });
  const freezingDays = productionDays.filter(
    (day) =>
      isFreezingProductionDay(day) && (!asOfDate || day.date <= asOfDate),
  );

  return sourceDays.flatMap(({ day: originDay, calculation }) =>
    originDay.lines.flatMap((line, lineIndex) => {
      const source = calculatePackingFreezingSource(
        line,
        calculation.products[lineIndex],
      );
      const generatedKg100 = source.generatedKg100;

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

          ...source,

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

interface ComparisonAdjustment {
  label: string;
  /** Physical Freezing quantity without a Packing origin. */
  unlinkedKg100: Kg100;
  /** Quantity linked to Packing origins above the physical Freezing report. */
  linkageExcessKg100: Kg100;
}

function addAdjustment(
  adjustments: Map<string, ComparisonAdjustment>,
  id: string,
  label: string,
  unlinkedKg100: Kg100,
  linkageExcessKg100: Kg100,
): void {
  const current = adjustments.get(id);
  adjustments.set(id, {
    label,
    unlinkedKg100: kg100((current?.unlinkedKg100 ?? 0) + unlinkedKg100),
    linkageExcessKg100: kg100(
      (current?.linkageExcessKg100 ?? 0) + linkageExcessKg100,
    ),
  });
}

function aggregateComparisonRows(
  positions: readonly FreezingAvailabilityPosition[],
  dimension: "family" | "product",
  adjustmentsById: ReadonlyMap<string, ComparisonAdjustment>,
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
      linkageExcessKg100: kg100(0),
    });
  }

  for (const [id, adjustment] of adjustmentsById) {
    if (adjustment.unlinkedKg100 === 0 && adjustment.linkageExcessKg100 === 0) {
      continue;
    }

    const current = rows.get(id);
    rows.set(
      id,
      current
        ? {
            ...current,
            unexplainedDifferenceKg100: kg100(
              current.unexplainedDifferenceKg100 - adjustment.unlinkedKg100,
            ),
            linkageExcessKg100: adjustment.linkageExcessKg100,
          }
        : {
            id,
            label: adjustment.label,
            packedKg100: kg100(0),
            frozenKg100: kg100(0),
            pendingKg100: kg100(0),
            unexplainedDifferenceKg100: kg100(-adjustment.unlinkedKg100),
            linkageExcessKg100: adjustment.linkageExcessKg100,
          },
    );
  }

  return [...rows.values()].sort((first, second) =>
    first.label.localeCompare(second.label, "es-PE"),
  );
}

/**
 * Compares Packing origins of the period with the Freezing reports of the same
 * period. Every concept is kept apart so none can absorb another:
 *
 * - physical reported: what Freezing reported (`physicalReportedKg100`);
 * - linked: what those reports attribute to Packing origins (`linkedKg100`);
 * - unlinked: physical quantity without an origin (`unlinkedPhysicalKg100`);
 * - linkage excess: linked above the physical report (`linkageExcessKg100`);
 * - pending: origin quantity still available (`pendingKg100`).
 *
 * The status does not depend on the net `unexplainedDifferenceKg100`, because
 * opposite differences could cancel each other out. Any reason to review
 * (see `reviewReasons`) makes the comparison `REVIEW`.
 */
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
  const originExcessKg100 = sumKg100(
    positions.map((position) => position.excessKg100),
  );

  const freezingDaysInPeriod = productionDays.filter(
    (day) =>
      isFreezingProductionDay(day) &&
      day.date >= period.startDate &&
      day.date <= period.endDate,
  );
  const adjustmentsByFamily = new Map<string, ComparisonAdjustment>();
  const adjustmentsByProduct = new Map<string, ComparisonAdjustment>();
  const physicalKg100ByLine: Kg100[] = [];
  const linkedKg100ByLine: Kg100[] = [];
  const unlinkedKg100ByLine: Kg100[] = [];
  const excessKg100ByLine: Kg100[] = [];

  for (const day of freezingDaysInPeriod) {
    const lots = normalizeBalanceLots(day.receivedBalanceLots);
    const usesForDay = (lot: (typeof lots)[number]) =>
      lot.uses.filter((use) => use.targetDayId === day.id);

    for (const line of day.lines) {
      const physicalKg100 = sumKg100([
        line.shifts.DAY.reportedKg100,
        line.shifts.NIGHT.reportedKg100,
      ]);
      const linkedKg100 = sumKg100(
        lots
          .filter(
            (lot) =>
              lot.familyId === line.familyId &&
              productIdsEquivalent(lot.productId, line.productId),
          )
          .flatMap((lot) => usesForDay(lot).map((use) => use.kg100)),
      );
      // Both differences are kept as separate non-negative quantities: neither
      // one is a clamp that hides the other.
      const unlinkedKg100 = kg100(Math.max(physicalKg100 - linkedKg100, 0));
      const excessKg100 = kg100(Math.max(linkedKg100 - physicalKg100, 0));

      physicalKg100ByLine.push(physicalKg100);
      linkedKg100ByLine.push(linkedKg100);
      unlinkedKg100ByLine.push(unlinkedKg100);
      excessKg100ByLine.push(excessKg100);
      addAdjustment(
        adjustmentsByFamily,
        line.familyId,
        line.familyName,
        unlinkedKg100,
        excessKg100,
      );
      addAdjustment(
        adjustmentsByProduct,
        line.productId,
        line.productName,
        unlinkedKg100,
        excessKg100,
      );
    }

    // Links to a product that this Freezing report does not list at all are
    // linked quantity above a physical report of zero.
    for (const lot of lots) {
      const hasReportLine = day.lines.some(
        (line) =>
          lot.familyId === line.familyId &&
          productIdsEquivalent(lot.productId, line.productId),
      );
      const orphanKg100 = sumKg100(usesForDay(lot).map((use) => use.kg100));

      if (hasReportLine || orphanKg100 === 0) continue;

      linkedKg100ByLine.push(orphanKg100);
      excessKg100ByLine.push(orphanKg100);
      addAdjustment(
        adjustmentsByFamily,
        lot.familyId,
        lot.familyId,
        kg100(0),
        orphanKg100,
      );
      addAdjustment(
        adjustmentsByProduct,
        lot.productId,
        lot.productId,
        kg100(0),
        orphanKg100,
      );
    }
  }

  const physicalReportedKg100 = sumKg100(physicalKg100ByLine);
  const linkedKg100 = sumKg100(linkedKg100ByLine);
  const unlinkedPhysicalKg100 = sumKg100(unlinkedKg100ByLine);
  const linkageExcessKg100 = sumKg100(excessKg100ByLine);
  const integrityIssueCount = freezingDaysInPeriod.reduce(
    (total, day) => total + calculateProductionDay(day).integrityIssues.length,
    0,
  );
  const unexplainedDifferenceKg100 = kg100(
    packedKg100 - frozenKg100 - pendingKg100 - unlinkedPhysicalKg100,
  );

  const reviewReasons: FreezingReviewReason[] = [
    ...(unexplainedDifferenceKg100 !== 0
      ? (["UNEXPLAINED_DIFFERENCE"] as const)
      : []),
    ...(linkageExcessKg100 > 0 ? (["LINKAGE_EXCESS"] as const) : []),
    ...(originExcessKg100 > 0 ? (["ORIGIN_EXCESS"] as const) : []),
    ...(integrityIssueCount > 0 ? (["INTEGRITY_ISSUES"] as const) : []),
  ];

  return {
    packedKg100,
    frozenKg100,
    pendingKg100,
    unexplainedDifferenceKg100,
    physicalReportedKg100,
    linkedKg100,
    unlinkedPhysicalKg100,
    linkageExcessKg100,
    originExcessKg100,
    integrityIssueCount,
    reviewReasons,
    status: reviewReasons.length === 0 ? "BALANCED" : "REVIEW",
    byFamily: aggregateComparisonRows(positions, "family", adjustmentsByFamily),
    byProduct: aggregateComparisonRows(
      positions,
      "product",
      adjustmentsByProduct,
    ),
  };
}
