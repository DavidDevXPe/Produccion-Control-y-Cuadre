import { describe, expect, it } from "vitest";
import { createEmptyCaptureDraft } from "./productionCapture";
import {
  addDaysToIsoDate,
  captureBalancePosition,
  captureProductAvailability,
  captureQuantityKg100,
  createRow,
  isCaptureDraftEmpty,
  shiftDifferenceMessage,
} from "./productionEntryHelpers";
import { kg100 } from "../model/calculations";

describe("productionEntryHelpers", () => {
  it("converts quantity string to Kg100", () => {
    expect(captureQuantityKg100("12.34")).toBe(1234);
    expect(captureQuantityKg100("12,34")).toBe(1234);
    expect(captureQuantityKg100("")).toBe(0);
    expect(captureQuantityKg100("invalid")).toBe(0);
    expect(captureQuantityKg100("-5")).toBe(0);
  });

  it("calculates days offset from ISO date", () => {
    expect(addDaysToIsoDate("2026-09-10", 1)).toBe("2026-09-11");
    expect(addDaysToIsoDate("2026-09-30", 2)).toBe("2026-10-02");
    expect(addDaysToIsoDate("2026-09-10", -1)).toBe("2026-09-09");
  });

  it("generates appropriate shift difference messages", () => {
    expect(shiftDifferenceMessage("Día", kg100(0))).toBe(
      "Turno Día conciliado.",
    );
    expect(shiftDifferenceMessage("Día", kg100(5000))).toContain(
      "Faltan 50.00 kg por registrar en Turno Día.",
    );
    expect(shiftDifferenceMessage("Noche", kg100(-2550))).toContain(
      "Sobran 25.50 kg en el detalle del Turno Noche.",
    );
  });

  it("checks if capture draft is empty", () => {
    const emptyDraft = createEmptyCaptureDraft("2026-09-10");
    expect(isCaptureDraftEmpty(emptyDraft)).toBe(true);

    const nonEmptyDraft = { ...emptyDraft, declaredDayTotalKg: "100" };
    expect(isCaptureDraftEmpty(nonEmptyDraft)).toBe(false);
  });

  it("creates row from catalog product", () => {
    const row = createRow("aleta-cruda-ucrania-codificada", 0);
    expect(row).not.toBeNull();
    expect(row?.product.productId).toBe("aleta-cruda-ucrania-codificada");
    expect(row?.dayReportedKg).toBe("");
  });

  it("calculates balance position pending and overused", () => {
    const balance = {
      key: "b-1",
      originDayId: "2026-09-09",
      originDate: "2026-09-09",
      familyId: "aleta",
      familyName: "ALETA",
      productId: "aleta-fresca",
      productName: "ALETA FRESCA",
      availableKg100: kg100(10000), // 100 kg
      dayKg: "60",
      nightKg: "30",
    };

    const pos = captureBalancePosition(balance);
    expect(pos.processedKg100).toBe(9000);
    expect(pos.pendingKg100).toBe(1000);
    expect(pos.overusedKg100).toBe(0);
  });

  it("calculates product availability from balance uses", () => {
    const draft = createEmptyCaptureDraft("2026-09-10");
    draft.balanceUses = [
      {
        key: "b-1",
        originDayId: "2026-09-09",
        originDate: "2026-09-09",
        familyId: "aleta",
        familyName: "ALETA",
        productId: "aleta-fresca",
        productName: "ALETA FRESCA",
        availableKg100: kg100(10000),
        dayKg: "40",
        nightKg: "20",
      },
    ];

    const avail = captureProductAvailability(draft, "aleta-fresca");
    expect(avail.availableKg100).toBe(10000);
    expect(avail.frozenKg100).toBe(6000);
    expect(avail.pendingKg100).toBe(4000);
  });
});
