import { kg100, sumKg100 } from "../model/calculations";
import type { FreezingAvailabilityPosition } from "../model/freezing";
import { productIdsEquivalent } from "../model/productIdentity";
import type { Kg100 } from "../model/types";
import type { ProductionCaptureBalanceUse } from "./productionCapture";

export type FreezingOriginLedgerStatus = "COMPLETE" | "PENDING" | "EXCESS";

export interface FreezingOriginLedgerRow {
  originDayId: string;
  originDate: string;

  productCount: number;

  generatedKg100: Kg100;

  frozenBeforeCurrentKg100: Kg100;

  frozenCurrentKg100: Kg100;

  frozenAccumulatedKg100: Kg100;

  pendingKg100: Kg100;

  excessKg100: Kg100;

  completionPercent: number;

  status: FreezingOriginLedgerStatus;
}

interface BuildFreezingOriginLedgerArgs {
  positions: readonly FreezingAvailabilityPosition[];
  currentUses: readonly ProductionCaptureBalanceUse[];
}

function captureValueToKg100(value: string): Kg100 {
  const parsed = Number(value.trim().replace(",", "."));

  return Number.isFinite(parsed) && parsed >= 0
    ? kg100(Math.round(parsed * 100))
    : kg100(0);
}

function currentUseForPosition(
  position: FreezingAvailabilityPosition,
  currentUses: readonly ProductionCaptureBalanceUse[],
): Kg100 {
  return sumKg100(
    currentUses
      .filter(
        (use) =>
          use.requiresProductDistribution !== true &&
          use.originDayId === position.originDayId &&
          use.familyId === position.familyId &&
          productIdsEquivalent(
            use.sourceProductId ?? use.productId,
            position.productId,
          ),
      )
      .flatMap((use) => [
        captureValueToKg100(use.dayKg),
        captureValueToKg100(use.nightKg),
      ]),
  );
}

export function buildFreezingOriginLedger({
  positions,
  currentUses,
}: BuildFreezingOriginLedgerArgs): readonly FreezingOriginLedgerRow[] {
  const grouped = new Map<
    string,
    {
      originDayId: string;
      originDate: string;

      productIds: Set<string>;

      generatedKg100: Kg100;
      frozenBeforeCurrentKg100: Kg100;
      frozenCurrentKg100: Kg100;
      frozenAccumulatedKg100: Kg100;
      pendingKg100: Kg100;
      excessKg100: Kg100;
    }
  >();

  for (const position of positions) {
    const frozenCurrentKg100 = currentUseForPosition(position, currentUses);

    const frozenAccumulatedKg100 = kg100(
      position.processedTotalKg100 + frozenCurrentKg100,
    );

    const pendingKg100 = kg100(
      Math.max(position.generatedKg100 - frozenAccumulatedKg100, 0),
    );

    const excessKg100 = kg100(
      Math.max(frozenAccumulatedKg100 - position.generatedKg100, 0),
    );

    const key = `${position.originDayId}|${position.originDate}`;

    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        originDayId: position.originDayId,
        originDate: position.originDate,

        productIds: new Set([position.productId]),

        generatedKg100: position.generatedKg100,

        frozenBeforeCurrentKg100: position.processedTotalKg100,

        frozenCurrentKg100,

        frozenAccumulatedKg100,

        pendingKg100,

        excessKg100,
      });

      continue;
    }

    current.productIds.add(position.productId);

    current.generatedKg100 = kg100(
      current.generatedKg100 + position.generatedKg100,
    );

    current.frozenBeforeCurrentKg100 = kg100(
      current.frozenBeforeCurrentKg100 + position.processedTotalKg100,
    );

    current.frozenCurrentKg100 = kg100(
      current.frozenCurrentKg100 + frozenCurrentKg100,
    );

    current.frozenAccumulatedKg100 = kg100(
      current.frozenAccumulatedKg100 + frozenAccumulatedKg100,
    );

    current.pendingKg100 = kg100(current.pendingKg100 + pendingKg100);

    current.excessKg100 = kg100(current.excessKg100 + excessKg100);
  }

  return [...grouped.values()]
    .map((row): FreezingOriginLedgerRow => {
      const completionPercent =
        row.generatedKg100 > 0
          ? Math.min(
              100,
              (row.frozenAccumulatedKg100 / row.generatedKg100) * 100,
            )
          : 0;

      const status: FreezingOriginLedgerStatus =
        row.excessKg100 > 0
          ? "EXCESS"
          : row.pendingKg100 === 0
            ? "COMPLETE"
            : "PENDING";

      return {
        originDayId: row.originDayId,
        originDate: row.originDate,

        productCount: row.productIds.size,

        generatedKg100: row.generatedKg100,

        frozenBeforeCurrentKg100: row.frozenBeforeCurrentKg100,

        frozenCurrentKg100: row.frozenCurrentKg100,

        frozenAccumulatedKg100: row.frozenAccumulatedKg100,

        pendingKg100: row.pendingKg100,

        excessKg100: row.excessKg100,

        completionPercent,

        status,
      };
    })
    .sort((first, second) => {
      const dateComparison = first.originDate.localeCompare(second.originDate);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return first.originDayId.localeCompare(second.originDayId);
    });
}
