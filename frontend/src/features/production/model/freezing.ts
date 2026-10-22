import {
  calculateProductionDay,
  calculateShiftEntry,
  kg100,
  sumKg100,
} from "./calculations";
import {
  getPreviousProcess,
  getProductionProcess,
  isFreezingProductionDay,
} from "./productionProcess";
import { normalizeBalanceLots } from "./balanceLotNormalization";
import { productIdsEquivalent } from "./productIdentity";
import { normalizeProductName } from "../capture/productNormalizer";
import type {
  Kg100,
  ProductReconciliation,
  ProductionDay,
  ProductionLine,
  ProductionProcess,
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

export interface FreezingDayOriginUsage {
  readonly originDayId: string;
  readonly originDate: string;
  readonly familyId: string;
  readonly familyName: string;
  readonly productId: string;
  readonly productName: string;
  readonly availableAtStartKg100: Kg100;
  readonly frozenThisDayKg100: Kg100;
  readonly pendingAfterKg100: Kg100;
}

export interface FreezingComparisonRow {
  readonly id: string;
  readonly label: string;
  readonly packedKg100: Kg100;
  readonly frozenKg100: Kg100;
  readonly pendingKg100: Kg100;
  readonly unexplainedDifferenceKg100: Kg100;
  /** Freezing report amount attributed to Packing origins in this period. */
  readonly linkedKg100: Kg100;
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

export function calculateStageAvailability(
  targetProcess: ProductionProcess,
  productionDays: readonly ProductionDay[],
  asOfDate?: string,
): readonly FreezingAvailabilityPosition[] {
  const sourceProcess = getPreviousProcess(targetProcess);
  if (!sourceProcess) return [];

  const sourceDays = productionDays.flatMap((day) => {
    if (getProductionProcess(day) !== sourceProcess) return [];
    if (asOfDate && day.date > asOfDate) return [];
    const calculation = calculateProductionDay(day);
    return [{ day, calculation }];
  });

  const consumingDays = productionDays.filter(
    (day) =>
      getProductionProcess(day) === targetProcess && (!asOfDate || day.date <= asOfDate),
  );

  const sameDayPhysicalRemaining = new Map<
    string,
    { DAY: Kg100; NIGHT: Kg100 }
  >()
  const orderedSourceDays = [...sourceDays].sort((first, second) => {
    const firstIsSameDay = consumingDays.some((day) => day.date === first.day.date)
    const secondIsSameDay = consumingDays.some((day) => day.date === second.day.date)
    if (firstIsSameDay !== secondIsSameDay) return firstIsSameDay ? -1 : 1
    return second.day.date.localeCompare(first.day.date)
  })

  return orderedSourceDays.flatMap(({ day: originDay, calculation }) =>
    originDay.lines.flatMap((line, lineIndex) => {
      let source: PackingFreezingSource;
      if (sourceProcess === "PACKING") {
        source = calculatePackingFreezingSource(
          line,
          calculation.products[lineIndex],
        );
      } else {
        const physicalDayKg100 = line.shifts.DAY.reportedKg100;
        const physicalNightKg100 = line.shifts.NIGHT.reportedKg100;
        const generatedKg100 = sumKg100([physicalDayKg100, physicalNightKg100]);
        source = {
          physicalDayKg100,
          physicalNightKg100,
          receivedBalanceDayKg100: kg100(0),
          receivedBalanceNightKg100: kg100(0),
          ownDayKg100: physicalDayKg100,
          ownNightKg100: physicalNightKg100,
          closingBalanceKg100: kg100(0),
          generatedKg100,
        };
      }

      const generatedKg100 = source.generatedKg100;

      if (generatedKg100 <= 0) {
        return [];
      }

      // 1. Same-day consuming journey (if any)
      const sameDayConsuming = consumingDays.find(
        (day) => day.date === originDay.date,
      );

      let sameDayDayKg100 = kg100(0);
      let sameDayNightKg100 = kg100(0);

      if (sameDayConsuming) {
        // Physical reported in same-day consuming stage for this product
        const matchingSameDayLines = sameDayConsuming.lines.filter(
          (candidate) =>
            candidate.familyId === line.familyId &&
            (productIdsEquivalent(candidate.productId, line.productId) ||
              normalizeProductName(candidate.productName) ===
                normalizeProductName(line.productName)),
        );

        const physicalSameDayDayKg100 = sumKg100(
          matchingSameDayLines.map((l) => l.shifts.DAY.reportedKg100),
        );
        const physicalSameDayNightKg100 = sumKg100(
          matchingSameDayLines.map((l) => l.shifts.NIGHT.reportedKg100),
        );

        // Check if same-day consuming journey had explicit balance lots consumed from prior days (< originDay.date)
        const priorDayUses = normalizeBalanceLots(
          sameDayConsuming.receivedBalanceLots,
        ).flatMap((lot) => {
          const lotOriginDay = productionDays.find(
            (d) => d.id === lot.originDayId,
          );
          const isPrior = lotOriginDay
            ? lotOriginDay.date < originDay.date
            : false;

          if (
            isPrior &&
            lot.familyId === line.familyId &&
            productIdsEquivalent(
              lot.sourceProductId ?? lot.productId,
              line.productId,
            )
          ) {
            return lot.uses.filter(
              (u) => u.targetDayId === sameDayConsuming.id,
            );
          }
          return [];
        });

        const priorDayDayKg100 = sumKg100(
          priorDayUses.filter((u) => u.shift === "DAY").map((u) => u.kg100),
        );
        const priorDayNightKg100 = sumKg100(
          priorDayUses.filter((u) => u.shift === "NIGHT").map((u) => u.kg100),
        );

        const netPhysicalDayKg100 = kg100(
          Math.max(0, physicalSameDayDayKg100 - priorDayDayKg100),
        );
        const netPhysicalNightKg100 = kg100(
          Math.max(0, physicalSameDayNightKg100 - priorDayNightKg100),
        );

        // Also check if same-day consuming journey had explicit balance lots targeting originDay.id
        const sameDayExplicitUses = normalizeBalanceLots(
          sameDayConsuming.receivedBalanceLots,
        ).flatMap((lot) =>
          lot.originDayId === originDay.id &&
          lot.familyId === line.familyId &&
          (productIdsEquivalent(
            lot.sourceProductId ?? lot.productId,
            line.productId,
          ) ||
            normalizeProductName(lot.productId) ===
              normalizeProductName(line.productName))
            ? lot.uses.filter((u) => u.targetDayId === sameDayConsuming.id)
            : [],
        );

        const explicitDayKg100 = sumKg100(
          sameDayExplicitUses
            .filter((u) => u.shift === "DAY")
            .map((u) => u.kg100),
        );
        const explicitNightKg100 = sumKg100(
          sameDayExplicitUses
            .filter((u) => u.shift === "NIGHT")
            .map((u) => u.kg100),
        );

        const sameDayProductKey = `${sameDayConsuming.id}|${line.familyId}|${normalizeProductName(
          matchingSameDayLines[0]?.productName ?? line.productName,
        )}`
        const physicalRemaining =
          sameDayPhysicalRemaining.get(sameDayProductKey) ?? {
            DAY: physicalSameDayDayKg100,
            NIGHT: physicalSameDayNightKg100,
          }

        // One physical report can only be consumed once. Same-date origins
        // are processed first; older origins receive only the remainder.
        sameDayDayKg100 = kg100(
          Math.min(
            Math.max(netPhysicalDayKg100, explicitDayKg100),
            physicalRemaining.DAY,
          ),
        );
        sameDayNightKg100 = kg100(
          Math.min(
            Math.max(netPhysicalNightKg100, explicitNightKg100),
            physicalRemaining.NIGHT,
          ),
        );
        sameDayPhysicalRemaining.set(sameDayProductKey, {
          DAY: kg100(physicalRemaining.DAY - sameDayDayKg100),
          NIGHT: kg100(physicalRemaining.NIGHT - sameDayNightKg100),
        });
      }

      // 2. Subsequent consuming days (consumingDay.date > originDay.date)
      // These consume from originDay via receivedBalanceLots targeting originDay.id
      const subsequentDays = consumingDays.filter(
        (day) => day.date > originDay.date,
      );

      let subsequentDayKg100 = kg100(0);
      let subsequentNightKg100 = kg100(0);
      for (const consumingDay of subsequentDays) {
        const matchingUses = normalizeBalanceLots(
          consumingDay.receivedBalanceLots,
        ).flatMap((lot) =>
          lot.originDayId === originDay.id &&
          lot.familyId === line.familyId &&
          (productIdsEquivalent(
            lot.sourceProductId ?? lot.productId,
            line.productId,
          ) ||
            normalizeProductName(lot.productId) ===
              normalizeProductName(line.productName))
            ? lot.uses.filter((u) => u.targetDayId === consumingDay.id)
            : [],
        );
        if (matchingUses.length === 0) continue;

        const matchingLine = consumingDay.lines.find(
          (candidate) =>
            candidate.familyId === line.familyId &&
            (productIdsEquivalent(candidate.productId, line.productId) ||
              normalizeProductName(candidate.productName) ===
                normalizeProductName(line.productName)),
        );
        const capacityKey = `${consumingDay.id}|${line.familyId}|${normalizeProductName(
          matchingLine?.productName ?? line.productName,
        )}`;
        const physicalRemaining =
          sameDayPhysicalRemaining.get(capacityKey) ?? {
            DAY: matchingLine?.shifts.DAY.reportedKg100 ?? kg100(0),
            NIGHT: matchingLine?.shifts.NIGHT.reportedKg100 ?? kg100(0),
          };
        const requestedDay = sumKg100(
          matchingUses.filter((use) => use.shift === "DAY").map((use) => use.kg100),
        );
        const requestedNight = sumKg100(
          matchingUses.filter((use) => use.shift === "NIGHT").map((use) => use.kg100),
        );
        const acceptedDay = kg100(Math.min(requestedDay, physicalRemaining.DAY));
        const acceptedNight = kg100(Math.min(requestedNight, physicalRemaining.NIGHT));
        subsequentDayKg100 = kg100(subsequentDayKg100 + acceptedDay);
        subsequentNightKg100 = kg100(subsequentNightKg100 + acceptedNight);
        sameDayPhysicalRemaining.set(capacityKey, {
          DAY: kg100(physicalRemaining.DAY - acceptedDay),
          NIGHT: kg100(physicalRemaining.NIGHT - acceptedNight),
        });
      }

      const processedDayKg100 = sumKg100([
        sameDayDayKg100,
        subsequentDayKg100,
      ]);
      const processedNightKg100 = sumKg100([
        sameDayNightKg100,
        subsequentNightKg100,
      ]);
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

export function calculateFreezingAvailability(
  productionDays: readonly ProductionDay[],
  asOfDate?: string,
): readonly FreezingAvailabilityPosition[] {
  return calculateStageAvailability("FREEZING", productionDays, asOfDate);
}

/**
 * Returns the origin balances consumed by one Freezing day. Snapshots on the
 * previous and current dates keep direct same-day Packing consumption visible
 * without requiring it to be persisted as a previous-balance lot.
 */
export function calculateFreezingDayOriginUsage(
  productionDays: readonly ProductionDay[],
  freezingDate: string,
): readonly FreezingDayOriginUsage[] {
  const previousDateValue = new Date(`${freezingDate}T00:00:00.000Z`);
  previousDateValue.setUTCDate(previousDateValue.getUTCDate() - 1);
  const previousDate = previousDateValue.toISOString().slice(0, 10);

  const previousPositions = calculateFreezingAvailability(
    productionDays,
    previousDate,
  );
  const previousByKey = new Map(
    previousPositions.map((position) => [
      `${position.originDayId}|${position.familyId}|${position.productId}`,
      position,
    ] as const),
  );

  return calculateFreezingAvailability(productionDays, freezingDate).map(
    (position) => {
      const previous = previousByKey.get(
        `${position.originDayId}|${position.familyId}|${position.productId}`,
      );
      const availableAtStartKg100 =
        position.originDate === freezingDate
          ? position.generatedKg100
          : (previous?.pendingKg100 ?? kg100(0));
      const frozenBeforeDayKg100 = previous?.processedTotalKg100 ?? kg100(0);

      return {
        originDayId: position.originDayId,
        originDate: position.originDate,
        familyId: position.familyId,
        familyName: position.familyName,
        productId: position.productId,
        productName: position.productName,
        availableAtStartKg100,
        frozenThisDayKg100: kg100(
          Math.max(position.processedTotalKg100 - frozenBeforeDayKg100, 0),
        ),
        pendingAfterKg100: position.pendingKg100,
      };
    },
  );
}

interface ComparisonAdjustment {
  label: string;
  linkedKg100: Kg100;
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
  linkedKg100: Kg100 = kg100(0),
): void {
  const current = adjustments.get(id);
  adjustments.set(id, {
    label,
    linkedKg100: kg100((current?.linkedKg100 ?? 0) + linkedKg100),
    unlinkedKg100: kg100((current?.unlinkedKg100 ?? 0) + unlinkedKg100),
    linkageExcessKg100: kg100(
      (current?.linkageExcessKg100 ?? 0) + linkageExcessKg100,
    ),
  });
}

function balanceUseHasPhysicalReport(
  day: ProductionDay,
  lot: (typeof day.receivedBalanceLots)[number],
  use: (typeof lot.uses)[number],
): boolean {
  const matchingLines = day.lines.filter(
    (line) =>
      line.familyId === lot.familyId &&
      (productIdsEquivalent(line.productId, lot.productId) ||
        productIdsEquivalent(
          line.productId,
          lot.sourceProductId ?? lot.productId,
        )),
  );

  if (matchingLines.length > 0) {
    return matchingLines.some(
      (line) => calculateShiftEntry(line.shifts[use.shift]).ownProductionKg100 > 0,
    );
  }

  // Keep detecting a genuine orphan link when the shift reported production,
  // but do not mistake a merely received balance on a zero-production day for
  // product already frozen.
  return day.declaredShiftTotalsKg100[use.shift] > 0;
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
      linkedKg100: kg100(0),
      linkageExcessKg100: kg100(0),
    });
  }

  for (const [id, adjustment] of adjustmentsById) {
    if (
      adjustment.linkedKg100 === 0 &&
      adjustment.unlinkedKg100 === 0 &&
      adjustment.linkageExcessKg100 === 0
    ) {
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
            linkedKg100: adjustment.linkedKg100,
            linkageExcessKg100: adjustment.linkageExcessKg100,
          }
        : {
            id,
            label: adjustment.label,
            packedKg100: kg100(0),
            frozenKg100: kg100(0),
            pendingKg100: kg100(0),
            unexplainedDifferenceKg100: kg100(-adjustment.unlinkedKg100),
            linkedKg100: adjustment.linkedKg100,
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
      lot.uses.filter(
        (use) =>
          use.targetDayId === day.id &&
          balanceUseHasPhysicalReport(day, lot, use),
      );

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
      const sameDayPackingPositions = positions.filter(
        (position) =>
          position.originDate === day.date &&
          position.familyId === line.familyId &&
          productIdsEquivalent(position.productId, line.productId) &&
          position.generatedKg100 > 0,
      );
      const sameDayPackingKg100 = sumKg100(
        sameDayPackingPositions.map((position) => position.generatedKg100),
      );
      const sameDayOriginIds = new Set(
        sameDayPackingPositions.map((position) => position.originDayId),
      );
      const explicitlyLinkedFromSameDayKg100 = sumKg100(
        lots
          .filter(
            (lot) =>
              sameDayOriginIds.has(lot.originDayId) &&
              lot.familyId === line.familyId &&
              productIdsEquivalent(
                lot.sourceProductId ?? lot.productId,
                line.productId,
              ),
          )
          .flatMap((lot) => usesForDay(lot).map((use) => use.kg100)),
      );
      const remainingSameDayPackingKg100 = kg100(
        Math.max(sameDayPackingKg100 - explicitlyLinkedFromSameDayKg100, 0),
      );
      const sameDayDirectKg100 =
        sameDayPackingKg100 > 0
          ? kg100(
            Math.min(
              Math.max(physicalKg100 - linkedKg100, 0),
              remainingSameDayPackingKg100,
            ),
          )
          : kg100(0);
      const attributableLinkedKg100 = kg100(
        linkedKg100 + sameDayDirectKg100,
      );
      // Both differences are kept as separate non-negative quantities: neither
      // one is a clamp that hides the other.
      const unlinkedKg100 = kg100(
        Math.max(physicalKg100 - attributableLinkedKg100, 0),
      );
      const excessKg100 = kg100(
        Math.max(attributableLinkedKg100 - physicalKg100, 0),
      );

      physicalKg100ByLine.push(physicalKg100);
      linkedKg100ByLine.push(attributableLinkedKg100);
      unlinkedKg100ByLine.push(unlinkedKg100);
      excessKg100ByLine.push(excessKg100);
      addAdjustment(
        adjustmentsByFamily,
        line.familyId,
        line.familyName,
        unlinkedKg100,
        excessKg100,
        attributableLinkedKg100,
      );
      addAdjustment(
        adjustmentsByProduct,
        line.productId,
        line.productName,
        unlinkedKg100,
        excessKg100,
        attributableLinkedKg100,
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
        orphanKg100,
      );
      addAdjustment(
        adjustmentsByProduct,
        lot.productId,
        lot.productId,
        kg100(0),
        orphanKg100,
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
