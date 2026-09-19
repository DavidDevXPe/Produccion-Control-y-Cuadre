import { describe, expect, it } from "vitest";

import { kg100 } from "../model/calculations";
import type { FreezingAvailabilityPosition } from "../model/freezing";
import { buildFreezingFifoAllocation } from "./freezingFifo";

const product = {
  productId: "manto-estandar",
  productName: "MANTO ESTANDAR",
  familyId: "manto-crudo",
  familyName: "MANTO CRUDO",
};

function position(
  originDayId: string,
  originDate: string,
  pendingKg: number,
): FreezingAvailabilityPosition {
  return {
    originDayId,
    originDate,
    familyId: "manto-crudo",
    familyName: "MANTO CRUDO",
    productId: "manto-estandar",
    productName: "MANTO ESTANDAR",
    summaryGroupId: "MANTO",
    generatedKg100: kg100(pendingKg * 100),
    processedDayKg100: kg100(0),
    processedNightKg100: kg100(0),
    processedTotalKg100: kg100(0),
    pendingKg100: kg100(pendingKg * 100),
    excessKg100: kg100(0),
  };
}

describe("freezing FIFO allocation", () => {
  it("uses oldest Packing availability first and then continues with the next origin", () => {
    const result = buildFreezingFifoAllocation({
      targetProduct: product,
      reportedDayKg100: kg100(120 * 100),
      reportedNightKg100: kg100(30 * 100),
      positions: [
        position("packing-new", "2026-09-15", 100),
        position("packing-old", "2026-09-14", 100),
      ],
      existingUses: [],
    });

    expect(result.remainingDayKg100).toBe(0);
    expect(result.remainingNightKg100).toBe(0);

    expect(result.balanceUses).toHaveLength(2);

    expect(result.balanceUses[0]).toEqual(
      expect.objectContaining({
        originDayId: "packing-old",
        dayKg: "100",
        nightKg: "0",
      }),
    );

    expect(result.balanceUses[1]).toEqual(
      expect.objectContaining({
        originDayId: "packing-new",
        dayKg: "20",
        nightKg: "30",
      }),
    );
  });

  it("completes an existing partial link before creating another source", () => {
    const result = buildFreezingFifoAllocation({
      targetProduct: product,
      reportedDayKg100: kg100(80 * 100),
      reportedNightKg100: kg100(0),
      positions: [position("packing-old", "2026-09-14", 100)],
      existingUses: [
        {
          key: "balance-packing-old-manto-estandar",
          originDayId: "packing-old",
          originDate: "2026-09-14",
          familyId: "manto-crudo",
          familyName: "MANTO CRUDO",
          productId: "manto-estandar",
          productName: "MANTO ESTANDAR",
          availableKg100: kg100(100 * 100),
          dayKg: "50",
          nightKg: "0",
          requiresProductDistribution: false,
        },
      ],
    });

    expect(result.balanceUses).toHaveLength(1);

    expect(result.balanceUses[0]).toEqual(
      expect.objectContaining({
        dayKg: "80",
        nightKg: "0",
      }),
    );

    expect(result.remainingDayKg100).toBe(0);
  });

  it("leaves the unmatched quantity pending when traceable availability is insufficient", () => {
    const result = buildFreezingFifoAllocation({
      targetProduct: product,
      reportedDayKg100: kg100(80 * 100),
      reportedNightKg100: kg100(0),
      positions: [position("packing-old", "2026-09-14", 50)],
      existingUses: [],
    });

    expect(result.balanceUses).toHaveLength(1);

    expect(result.balanceUses[0]).toEqual(
      expect.objectContaining({
        dayKg: "50",
      }),
    );

    expect(result.remainingDayKg100).toBe(kg100(30 * 100));
  });

  it("does not reuse availability already consumed by another linked product", () => {
    const result = buildFreezingFifoAllocation({
      targetProduct: product,
      reportedDayKg100: kg100(80 * 100),
      reportedNightKg100: kg100(0),
      positions: [position("packing-old", "2026-09-14", 100)],
      existingUses: [
        {
          key: "existing-other-product",
          originDayId: "packing-old",
          originDate: "2026-09-14",
          familyId: "manto-crudo",
          familyName: "MANTO CRUDO",
          productId: "otro-producto",
          productName: "OTRO PRODUCTO",
          sourceProductId: "manto-estandar",
          availableKg100: kg100(100 * 100),
          dayKg: "60",
          nightKg: "0",
          requiresProductDistribution: false,
        },
      ],
    });

    expect(result.remainingDayKg100).toBe(kg100(40 * 100));
    expect(result.remainingNightKg100).toBe(0);

    expect(result.balanceUses).toHaveLength(2);

    expect(result.balanceUses[0]).toEqual(
      expect.objectContaining({
        productId: "otro-producto",
        originDayId: "packing-old",
        dayKg: "60",
        nightKg: "0",
      }),
    );

    expect(result.balanceUses[1]).toEqual(
      expect.objectContaining({
        productId: "manto-estandar",
        originDayId: "packing-old",
        dayKg: "40",
        nightKg: "0",
      }),
    );
  });

  it("matches historical source product ids with their canonical target", () => {
    const result = buildFreezingFifoAllocation({
      targetProduct: {
        productId: "aleta-cruda-block-1000-2000-e",
        productName: "ALETA CRUDA CONGELADA BLOCK S/TTO 1000 g - 2000 g (E) 100% P.N.",
        familyId: "aleta-cruda",
        familyName: "ALETA CRUDA",
      },
      reportedDayKg100: kg100(100 * 100),
      reportedNightKg100: kg100(0),
      positions: [
        {
          ...position("packing-legacy", "2026-09-14", 100),
          familyId: "aleta-cruda",
          familyName: "ALETA CRUDA",
          productId: "capture-seed-6",
          productName: "ALETA CRUDA LEGACY",
          summaryGroupId: "ALETA",
        },
      ],
      existingUses: [],
    });

    expect(result.remainingDayKg100).toBe(0);
    expect(result.balanceUses[0]).toEqual(
      expect.objectContaining({
        originDayId: "packing-legacy",
        sourceProductId: "capture-seed-6",
        dayKg: "100",
      }),
    );
  });
});
