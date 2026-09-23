import { describe, expect, it } from "vitest";
import {
  buildProductionDayFromCapture,
  createEmptyCaptureDraft,
  type ProductionCaptureDraft,
  type ProductionCaptureRow,
} from "../capture/productionCapture";
import {
  CAPTURE_CATALOG_ITEMS,
  PRODUCTION_CATALOG_ITEMS,
} from "../capture/productionCatalog";
import { validateProductionClosure } from "./businessRules";
import { calculateOutstandingBalances, kg, kg100 } from "./calculations";
import {
  calculateFreezingAvailability,
  calculateFreezingComparison,
} from "./freezing";
import { getProductionProcess } from "./productionProcess";
import type { ProductionDay } from "./types";

const product = PRODUCTION_CATALOG_ITEMS.find(
  (item) => item.summaryGroupId === "RECORTE_CRUDO",
)!;

function packingDay(date: string, amountKg: number): ProductionDay {
  const amount = kg(amountKg);
  return {
    id: `production-day-${date}`,
    date,
    displayName: date,
    status: "CLOSED",
    process: "PACKING",
    operationMode: "NORMAL",
    rawMaterialEntries: [],
    declaredRawMaterialKg100: kg100(0),
    declaredShiftTotalsKg100: { DAY: amount, NIGHT: kg100(0) },
    declaredFinishedTotalKg100: amount,
    hasTunnelProduction: false,
    lines: [
      {
        ...product,
        source: { sheet: "TEST", cell: "A1" },
        shiftBreakdownConfidence: "EXPLICIT",
        shifts: {
          DAY: { reportedKg100: amount, adjustments: [] },
          NIGHT: { reportedKg100: kg100(0), adjustments: [] },
        },
        tunnelShifts: {
          DAY: { reportedKg100: kg100(0), adjustments: [] },
          NIGHT: { reportedKg100: kg100(0), adjustments: [] },
        },
        treatmentKg100: kg100(0),
        newClosingBalanceKg100: kg100(0),
        declaredFinishedKg100: amount,
      },
    ],
    receivedBalanceLots: [],
    nucaWashAuthorization: null,
    performanceReferenceBasisPoints: 8000,
    nucaBikiniReferenceBasisPoints: 700,
    rawMaterialAllocationOverridesKg100: {},
  };
}

function freezingRow(amountKg: number): ProductionCaptureRow {
  return {
    key: `freeze-${amountKg}`,
    product,
    dayReportedKg: String(amountKg),
    dayPreviousBalanceKg: "0",
    nightReportedKg: "0",
    nightPreviousBalanceKg: "0",
    tunnelDayKg: "0",
    tunnelNightKg: "0",
    treatmentKg: "0",
    closingBalanceKg: "0",
    finishedKg: "",
  };
}

function freezingDay(
  date: string,
  amountKg: number,
  source: ProductionDay,
  previousDays: readonly ProductionDay[] = [source],
) {
  const available = calculateFreezingAvailability(previousDays, date).find(
    (position) =>
      position.originDayId === source.id &&
      position.productId === product.productId,
  );
  const draft: ProductionCaptureDraft = {
    ...createEmptyCaptureDraft(date, "FREEZING"),
    declaredDayTotalKg: String(amountKg),
    declaredNightTotalKg: "0",
    rows: [freezingRow(amountKg)],
    balanceUses: available
      ? [
          {
            key: `${source.id}-${product.productId}`,
            originDayId: source.id,
            originDate: source.date,
            familyId: product.familyId,
            familyName: product.familyName,
            productId: product.productId,
            productName: product.productName,
            availableKg100: available.pendingKg100,
            dayKg: String(amountKg),
            nightKg: "0",
          },
        ]
      : [],
  };
  return buildProductionDayFromCapture(draft, previousDays, [], "CLOSED");
}

describe("Packing to Freezing lifecycle", () => {
  it("treats historical records without process as Packing", () => {
    const historical = JSON.parse(
      JSON.stringify(packingDay("2026-09-07", 100), (key, value) =>
        key === "process" ? undefined : value,
      ),
    ) as ProductionDay;
    expect(getProductionProcess(historical)).toBe("PACKING");
  });

  it("derives availability from closed balanced Packing output", () => {
    const packing = packingDay("2026-09-07", 100_000);
    const [position] = calculateFreezingAvailability([packing]);

    expect(position?.generatedKg100).toBe(kg(100_000));
    expect(position?.pendingKg100).toBe(kg(100_000));
    expect(position?.originDayId).toBe(packing.id);
  });

  it("builds Freezing availability from own Day + own Night + closing balance and excludes Treatment", () => {
    const base = packingDay("2026-09-14", 100);

    const packing: ProductionDay = {
      ...base,

      declaredShiftTotalsKg100: {
        DAY: kg(60),
        NIGHT: kg(40),
      },

      /*
       * Producción propia:
       *
       * Día:
       * 60 reportados
       * - 30 de saldo anterior procesado
       * = 30 propios
       *
       * Noche:
       * 40 propios
       *
       * + Tratamiento: 15
       * + Saldo final: 20
       *
       * Producto terminado:
       * 30 + 40 + 15 + 20 = 105
       */
      declaredFinishedTotalKg100: kg(105),

      lines: [
        {
          ...base.lines[0]!,

          shifts: {
            DAY: {
              reportedKg100: kg(60),
              adjustments: [],
            },

            NIGHT: {
              reportedKg100: kg(40),
              adjustments: [],
            },
          },

          treatmentKg100: kg(15),

          newClosingBalanceKg100: kg(20),

          declaredFinishedKg100: kg(105),
        },
      ],

      receivedBalanceLots: [
        {
          id: "balance-lot-previous-packing",
          process: "PACKING",
          originDayId: "production-day-2026-09-13",

          familyId: product.familyId,
          productId: product.productId,

          originalKg100: kg(30),

          uses: [
            {
              id: "balance-use-previous-packing-day",
              targetDayId: base.id,
              shift: "DAY",
              kg100: kg(30),
            },
          ],
        },
      ],
    };

    const [position] = calculateFreezingAvailability([packing]);

    /*
     * Regla confirmada (23/09/2026): el saldo recibido pertenece a su
     * jornada origen y no se repite en la jornada que lo termina de envasar.
     *
     * Disponible de esta jornada:
     *
     *   30 Día propio (60 físicos − 30 de saldo de la jornada anterior)
     * + 40 Noche propia
     * + 20 Saldo al cierre
     * = 90 kg
     *
     * Tratamiento 15 kg queda fuera. Los 60 físicos siguen visibles.
     */
    expect(position?.physicalDayKg100).toBe(kg(60));
    expect(position?.receivedBalanceDayKg100).toBe(kg(30));
    expect(position?.ownDayKg100).toBe(kg(30));
    expect(position?.ownNightKg100).toBe(kg(40));
    expect(position?.closingBalanceKg100).toBe(kg(20));
    expect(position?.generatedKg100).toBe(kg(90));

    expect(position?.pendingKg100).toBe(kg(90));
  });

  it("counts a Night balance only once, in the journey that left it", () => {
    // Jornada A: Día 40 000 + Noche 25 000; la Noche deja 5 700 kg en saldo.
    const a = packingDay("2026-09-14", 40_000);
    const journeyA: ProductionDay = {
      ...a,
      declaredShiftTotalsKg100: { DAY: kg(40_000), NIGHT: kg(25_000) },
      declaredFinishedTotalKg100: kg(70_700),
      lines: [
        {
          ...a.lines[0]!,
          shifts: {
            DAY: { reportedKg100: kg(40_000), adjustments: [] },
            NIGHT: { reportedKg100: kg(25_000), adjustments: [] },
          },
          newClosingBalanceKg100: kg(5_700),
          declaredFinishedKg100: kg(70_700),
        },
      ],
    };
    // Jornada B: el Día reporta 50 000 físicos, 5 700 son el saldo de A.
    const b = packingDay("2026-09-15", 50_000);
    const journeyB: ProductionDay = {
      ...b,
      declaredShiftTotalsKg100: { DAY: kg(50_000), NIGHT: kg(30_000) },
      declaredFinishedTotalKg100: kg(74_300),
      lines: [
        {
          ...b.lines[0]!,
          shifts: {
            DAY: { reportedKg100: kg(50_000), adjustments: [] },
            NIGHT: { reportedKg100: kg(30_000), adjustments: [] },
          },
          declaredFinishedKg100: kg(74_300),
        },
      ],
      receivedBalanceLots: [
        {
          id: "balance-a-to-b",
          process: "PACKING",
          originDayId: journeyA.id,
          familyId: product.familyId,
          productId: product.productId,
          originalKg100: kg(5_700),
          uses: [
            {
              id: "balance-a-to-b-day",
              targetDayId: b.id,
              shift: "DAY",
              kg100: kg(5_700),
            },
          ],
        },
      ],
    };

    const positions = calculateFreezingAvailability([journeyA, journeyB]);
    const positionA = positions.find((p) => p.originDayId === journeyA.id);
    const positionB = positions.find((p) => p.originDayId === journeyB.id);

    expect(positionA?.generatedKg100).toBe(kg(70_700));
    expect(positionA?.closingBalanceKg100).toBe(kg(5_700));
    expect(positionB?.physicalDayKg100).toBe(kg(50_000));
    expect(positionB?.receivedBalanceDayKg100).toBe(kg(5_700));
    expect(positionB?.generatedKg100).toBe(kg(74_300));
    // Total congelable = envasado físico real (145 000), sin repetir 5 700.
    expect(
      positions.reduce((total, p) => total + p.generatedKg100, 0),
    ).toBe(kg(145_000));
  });

  it("does not generate new availability for a balance-only Sunday", () => {
    const saturday = packingDay("2026-09-12", 20_000);
    const saturdayWithBalance: ProductionDay = {
      ...saturday,
      declaredFinishedTotalKg100: kg(24_000),
      lines: [
        {
          ...saturday.lines[0]!,
          newClosingBalanceKg100: kg(4_000),
          declaredFinishedKg100: kg(24_000),
        },
      ],
    };
    const sunday = packingDay("2026-09-13", 4_000);
    const sundayBalanceOnly: ProductionDay = {
      ...sunday,
      operationMode: "BALANCE_ONLY",
      declaredFinishedTotalKg100: kg(0),
      lines: [{ ...sunday.lines[0]!, declaredFinishedKg100: kg(0) }],
      receivedBalanceLots: [
        {
          id: "balance-saturday-to-sunday",
          process: "PACKING",
          originDayId: saturdayWithBalance.id,
          familyId: product.familyId,
          productId: product.productId,
          originalKg100: kg(4_000),
          uses: [
            {
              id: "balance-saturday-to-sunday-day",
              targetDayId: sunday.id,
              shift: "DAY",
              kg100: kg(4_000),
            },
          ],
        },
      ],
    };

    const positions = calculateFreezingAvailability([
      saturdayWithBalance,
      sundayBalanceOnly,
    ]);

    expect(positions).toHaveLength(1);
    expect(positions[0]?.originDayId).toBe(saturdayWithBalance.id);
    expect(positions[0]?.generatedKg100).toBe(kg(24_000));
  });

  it("reduces the pending balance without losing its Packing origin", () => {
    const packing = packingDay("2026-09-07", 100_000);
    const freezing = freezingDay("2026-09-07", 90_000, packing);
    const [position] = calculateFreezingAvailability([
      packing,
      freezing.productionDay,
    ]);

    expect(freezing.productionDay.receivedBalanceLots[0]?.originDayId).toBe(
      packing.id,
    );
    expect(position?.processedTotalKg100).toBe(kg(90_000));
    expect(position?.pendingKg100).toBe(kg(10_000));
  });

  it("carries the same traceable balance across days and weeks", () => {
    const saturday = packingDay("2026-09-12", 20_000);
    const sunday = freezingDay("2026-09-13", 15_000, saturday);
    const monday = freezingDay("2026-09-14", 5_000, saturday, [
      saturday,
      sunday.productionDay,
    ]);
    const [position] = calculateFreezingAvailability([
      saturday,
      sunday.productionDay,
      monday.productionDay,
    ]);

    expect(sunday.productionDay.declaredRawMaterialKg100).toBe(kg(0));
    expect(monday.productionDay.receivedBalanceLots[0]?.originDayId).toBe(
      saturday.id,
    );
    expect(position?.pendingKg100).toBe(kg(0));
  });

  it("does not require raw material or the 80% reference to close Freezing", () => {
    const packing = packingDay("2026-09-07", 100_000);
    const result = freezingDay("2026-09-08", 90_000, packing);
    const validation = validateProductionClosure(
      result.productionDay,
      result.calculation,
      { requiredDataComplete: true, inputErrors: result.inputErrors },
    );

    expect(result.productionDay.declaredRawMaterialKg100).toBe(kg(0));
    expect(result.calculation.performance.percent).toBeNull();
    expect(validation.canClose).toBe(true);
    expect(validation.blockers).not.toContainEqual(
      expect.objectContaining({ code: "GENERAL_YIELD_BELOW_MIN" }),
    );
  });

  it("blocks freezing more than the traceable availability", () => {
    const packing = packingDay("2026-09-07", 100_000);
    const result = freezingDay("2026-09-08", 102_000, packing);
    const validation = validateProductionClosure(
      result.productionDay,
      result.calculation,
      { requiredDataComplete: true, inputErrors: result.inputErrors },
    );

    expect(validation.canClose).toBe(false);
    expect(validation.blockers).toContainEqual(
      expect.objectContaining({ code: "BALANCE_OVERUSED" }),
    );
  });

  it("allows a partially traced Freezing day to close with observation", () => {
    const packing = packingDay("2026-09-07", 1_000);

    const [available] = calculateFreezingAvailability([packing], "2026-09-08");

    const draft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft("2026-09-08", "FREEZING"),

      declaredDayTotalKg: "1100",
      declaredNightTotalKg: "0",

      rows: [freezingRow(1_100)],

      balanceUses: available
        ? [
            {
              key: `${packing.id}-${product.productId}`,

              originDayId: packing.id,
              originDate: packing.date,

              familyId: product.familyId,
              familyName: product.familyName,

              productId: product.productId,
              productName: product.productName,

              availableKg100: available.pendingKg100,

              dayKg: "1000",
              nightKg: "0",
            },
          ]
        : [],
    };

    const result = buildProductionDayFromCapture(draft, [packing], []);

    const validation = validateProductionClosure(
      result.productionDay,
      result.calculation,
      {
        requiredDataComplete: true,
        inputErrors: result.inputErrors,
      },
    );

    expect(result.calculation.processedPreviousBalanceKg100).toBe(kg(1_000));

    expect(result.calculation.reportOwnProductionKg100).toBe(kg(100));

    expect(validation.canClose).toBe(true);

    expect(validation.blockers).not.toContainEqual(
      expect.objectContaining({
        code: "FREEZING_WITHOUT_AVAILABILITY",
      }),
    );

    expect(validation.warnings).toContainEqual(
      expect.objectContaining({
        code: "FREEZING_TRACEABILITY_DIFFERENCE",
      }),
    );

    expect(validation.warnings).toContainEqual(
      expect.objectContaining({
        code: "FREEZING_PRODUCT_TRACEABILITY_DIFFERENCE",
        productId: product.productId,
      }),
    );
  });

  it("allows an investigation draft but blocks closure without availability", () => {
    const draft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft("2026-09-08", "FREEZING"),
      declaredDayTotalKg: "1000",
      declaredNightTotalKg: "0",
      rows: [freezingRow(1_000)],
    };
    const result = buildProductionDayFromCapture(draft, [], []);
    const validation = validateProductionClosure(
      result.productionDay,
      result.calculation,
      { requiredDataComplete: true, inputErrors: result.inputErrors },
    );

    expect(result.productionDay.status).toBe("DRAFT");
    expect(validation.canClose).toBe(false);
    expect(validation.blockers).toContainEqual(
      expect.objectContaining({ code: "FREEZING_WITHOUT_AVAILABILITY" }),
    );
    const comparison = calculateFreezingComparison([result.productionDay], {
      startDate: "2026-09-07",
      endDate: "2026-09-13",
    });
    expect(comparison.unexplainedDifferenceKg100).toBe(kg(-1_000));
    expect(comparison.status).toBe("REVIEW");
  });

  it("reconciles the week by product and family through traceable pending stock", () => {
    const packing = packingDay("2026-09-07", 100_000);
    const freezing = freezingDay("2026-09-08", 90_000, packing);
    const comparison = calculateFreezingComparison(
      [packing, freezing.productionDay],
      { startDate: "2026-09-07", endDate: "2026-09-13" },
    );

    expect(comparison).toMatchObject({
      packedKg100: kg(100_000),
      frozenKg100: kg(90_000),
      pendingKg100: kg(10_000),
      unexplainedDifferenceKg100: kg(0),
      status: "BALANCED",
    });
    expect(comparison.byProduct[0]).toMatchObject({
      id: product.productId,
      unexplainedDifferenceKg100: kg(0),
    });
    expect(comparison.byFamily[0]).toMatchObject({
      id: product.familyId,
      unexplainedDifferenceKg100: kg(0),
    });
  });

  it("marks an over-consumption as an unexplained weekly difference", () => {
    const packing = packingDay("2026-09-07", 100_000);
    const freezing = freezingDay("2026-09-08", 102_000, packing);
    const comparison = calculateFreezingComparison(
      [packing, freezing.productionDay],
      { startDate: "2026-09-07", endDate: "2026-09-13" },
    );

    expect(comparison.unexplainedDifferenceKg100).toBe(kg(-2_000));
    expect(comparison.status).toBe("REVIEW");
  });

  it("does not double count duplicated Freezing balance lots when rebuilding availability", () => {
    const packing = packingDay("2026-09-16", 46_970);
    const baseFreezing = freezingDay("2026-09-17", 46_970, packing);
    const duplicatedLot = baseFreezing.productionDay.receivedBalanceLots[0]!;
    const freezing: ProductionDay = {
      ...baseFreezing.productionDay,
      receivedBalanceLots: [
        duplicatedLot,
        {
          ...duplicatedLot,
          id: `${duplicatedLot.id}-copy`,
          uses: duplicatedLot.uses.map((use) => ({
            ...use,
            id: `${use.id}-copy`,
          })),
        },
      ],
    };

    const [position] = calculateFreezingAvailability([packing, freezing]);

    expect(position?.generatedKg100).toBe(kg(46_970));
    expect(position?.processedTotalKg100).toBe(kg(46_970));
    expect(position?.excessKg100).toBe(kg(0));
  });

  it("applies historical product id equivalence when discounting Freezing uses", () => {
    const aleta = CAPTURE_CATALOG_ITEMS.find(
      (item) => item.productId === "aleta-cruda-block-1000-2000-e",
    )!;
    const amount = kg(46_970);
    const packing: ProductionDay = {
      ...packingDay("2026-09-16", 46_970),
      lines: [
        {
          ...packingDay("2026-09-16", 46_970).lines[0]!,
          ...aleta,
          source: { sheet: "TEST", cell: "A1" },
          declaredFinishedKg100: amount,
          shifts: {
            DAY: { reportedKg100: amount, adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
        },
      ],
    };
    const legacyFreezing: ProductionDay = {
      ...packingDay("2026-09-17", 46_970),
      id: "production-day-freezing-2026-09-17",
      process: "FREEZING",
      declaredRawMaterialKg100: kg100(0),
      lines: [
        {
          ...packing.lines[0]!,
          source: { sheet: "FREEZING", cell: "A1" },
          shifts: {
            DAY: { reportedKg100: amount, adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
          declaredFinishedKg100: amount,
        },
      ],
      receivedBalanceLots: [
        {
          id: "balance-lot-freezing-legacy-aleta",
          process: "FREEZING",
          originDayId: packing.id,
          familyId: aleta.familyId,
          productId: "capture-seed-6",
          sourceProductId: "capture-seed-6",
          originalKg100: amount,
          uses: [
            {
              id: "balance-use-freezing-legacy-aleta-day",
              targetDayId: "production-day-freezing-2026-09-17",
              shift: "DAY",
              kg100: amount,
            },
          ],
        },
      ],
    };

    const [position] = calculateFreezingAvailability([
      packing,
      legacyFreezing,
    ]);

    expect(position?.pendingKg100).toBe(kg(0));
    expect(position?.processedTotalKg100).toBe(kg(46_970));
  });

  it("keeps the Packing balance ledger separate from Freezing uses", () => {
    const basePacking = packingDay("2026-09-07", 100_000);
    const packing: ProductionDay = {
      ...basePacking,
      declaredFinishedTotalKg100: kg(110_000),
      lines: [
        {
          ...basePacking.lines[0]!,
          newClosingBalanceKg100: kg(10_000),
          declaredFinishedKg100: kg(110_000),
        },
      ],
    };
    const freezing = freezingDay("2026-09-08", 90_000, packing);

    expect(
      calculateOutstandingBalances([packing, freezing.productionDay]),
    ).toContainEqual(expect.objectContaining({ pendingKg100: kg(10_000) }));
  });
});
