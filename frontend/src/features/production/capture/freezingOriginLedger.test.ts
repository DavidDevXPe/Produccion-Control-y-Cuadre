import { describe, expect, it } from "vitest";
import { kg100 } from "../model/calculations";
import type { FreezingAvailabilityPosition } from "../model/freezing";
import type { ProductionCaptureBalanceUse } from "./productionCapture";
import { buildFreezingOriginLedger } from "./freezingOriginLedger";

const kg = (value: number) => kg100(value * 100);

function position(
  originDayId: string,
  originDate: string,
  productId: string,
  generatedKg: number,
  frozenKg: number,
): FreezingAvailabilityPosition {
  return {
    originDayId,
    originDate,

    familyId: "manto-crudo",
    familyName: "MANTO CRUDO",

    productId,
    productName: productId,

    summaryGroupId: "MANTO",

    physicalDayKg100: kg(generatedKg),
    physicalNightKg100: kg(0),
    receivedBalanceDayKg100: kg(0),
    receivedBalanceNightKg100: kg(0),
    ownDayKg100: kg(generatedKg),
    ownNightKg100: kg(0),
    closingBalanceKg100: kg(0),
    generatedKg100: kg(generatedKg),

    processedDayKg100: kg(frozenKg),

    processedNightKg100: kg(0),

    processedTotalKg100: kg(frozenKg),

    pendingKg100: kg(Math.max(generatedKg - frozenKg, 0)),

    excessKg100: kg(Math.max(frozenKg - generatedKg, 0)),
  };
}

function currentUse(
  originDayId: string,
  productId: string,
  dayKg: number,
): ProductionCaptureBalanceUse {
  return {
    key: `use-${originDayId}-${productId}`,

    originDayId,
    originDate: "2026-09-14",

    familyId: "manto-crudo",
    familyName: "MANTO CRUDO",

    productId,
    productName: productId,

    sourceProductId: productId,

    availableKg100: kg(100),

    dayKg: String(dayKg),
    nightKg: "0",

    requiresProductDistribution: false,
  };
}

describe("freezing origin ledger", () => {
  it("groups products by Packing origin journey and includes current draft freezing", () => {
    const ledger = buildFreezingOriginLedger({
      positions: [
        position("packing-14", "2026-09-14", "manto-a", 100, 60),

        position("packing-14", "2026-09-14", "manto-b", 50, 50),
      ],

      currentUses: [currentUse("packing-14", "manto-a", 20)],
    });

    expect(ledger).toHaveLength(1);

    const row = ledger[0]!;

    expect(row.productCount).toBe(2);

    expect(row.generatedKg100).toBe(kg(150));

    expect(row.frozenBeforeCurrentKg100).toBe(kg(110));

    expect(row.frozenCurrentKg100).toBe(kg(20));

    expect(row.frozenAccumulatedKg100).toBe(kg(130));

    expect(row.pendingKg100).toBe(kg(20));

    expect(row.excessKg100).toBe(kg(0));

    expect(row.status).toBe("PENDING");

    expect(row.completionPercent).toBeCloseTo(86.6667, 3);
  });

  it("marks the origin journey complete only when all generated product is frozen", () => {
    const ledger = buildFreezingOriginLedger({
      positions: [
        position("packing-14", "2026-09-14", "manto-a", 100, 60),

        position("packing-14", "2026-09-14", "manto-b", 50, 50),
      ],

      currentUses: [currentUse("packing-14", "manto-a", 40)],
    });

    const row = ledger[0]!;

    expect(row.frozenAccumulatedKg100).toBe(kg(150));

    expect(row.pendingKg100).toBe(kg(0));

    expect(row.completionPercent).toBe(100);

    expect(row.status).toBe("COMPLETE");
  });

  it("detects freezing above the generated origin quantity", () => {
    const ledger = buildFreezingOriginLedger({
      positions: [
        position("packing-14", "2026-09-14", "manto-a", 100, 60),

        position("packing-14", "2026-09-14", "manto-b", 50, 50),
      ],

      currentUses: [currentUse("packing-14", "manto-a", 50)],
    });

    const row = ledger[0]!;

    expect(row.excessKg100).toBe(kg(10));

    expect(row.status).toBe("EXCESS");
  });
});
