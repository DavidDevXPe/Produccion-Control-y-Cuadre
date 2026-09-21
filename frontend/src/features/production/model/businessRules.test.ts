import { describe, expect, it } from "vitest";
import { PRODUCTION_CATALOG_ITEMS } from "../capture/productionCatalog";
import {
  ANILLA_GENERAL_YIELD,
  ANILLA_POLAR_YIELD,
  ANILLA_USA_YIELD,
  MANTO_STANDARD_YIELD,
} from "./businessConfig";
import {
  calculateOutstandingBalances,
  calculateProductionDay,
  kg,
  kg100,
  sumKg100,
} from "./calculations";
import {
  buildBalanceShiftDiagnostics,
  calculateReportFamilySubtotals,
  calculateProductionBusinessSummary,
  validateProductionClosure,
} from "./businessRules";
import type { ProductionDay, ProductionLine, SummaryGroupId } from "./types";

interface LineSeed {
  group: SummaryGroupId;
  productId?: string;
  day?: number;
  night?: number;
  tunnelDay?: number;
  tunnelNight?: number;
  treatment?: number;
  closing?: number;
}

const productIdsByGroup: Partial<Record<SummaryGroupId, readonly string[]>> = {
  ALETA: ["aleta-cruda-codificada"],
  MANTO: ["manto-japones-crudo"],
  ANILLAS: ["anillas-espana-polar-mixta"],
  BOTON: ["boton-usa-sm-cp-tratamiento"],
  RECORTE_CRUDO: ["recorte-crudo-manto-japones"],
  RECORTE_COCIDO: ["membranas-cocidas"],
  REJOS: ["rejo-baa-1-2"],
  REPRODUCTOR: ["reproductor-50-70"],
  NUCA_SEMILIMPIA: ["nuca-semilimpia-codificada"],
  NUCA_BIKINI: ["nuca-bikini-300-500"],
};

function lineFor(seed: LineSeed, index: number): ProductionLine {
  const productId = seed.productId ?? productIdsByGroup[seed.group]?.[0];
  const product = PRODUCTION_CATALOG_ITEMS.find(
    (candidate) => candidate.productId === productId,
  );
  if (!product) throw new Error(`Missing test product for ${seed.group}`);

  const day = kg(seed.day ?? 0);
  const night = kg(seed.night ?? 0);
  const tunnelDay = kg(seed.tunnelDay ?? 0);
  const tunnelNight = kg(seed.tunnelNight ?? 0);
  const treatment = kg(seed.treatment ?? 0);
  const closing = kg(seed.closing ?? 0);

  return {
    ...product,
    source: { sheet: "TEST", cell: `A${index + 1}` },
    shiftBreakdownConfidence: "EXPLICIT",
    shifts: {
      DAY: { reportedKg100: day, adjustments: [] },
      NIGHT: { reportedKg100: night, adjustments: [] },
    },
    tunnelShifts: {
      DAY: { reportedKg100: tunnelDay, adjustments: [] },
      NIGHT: { reportedKg100: tunnelNight, adjustments: [] },
    },
    treatmentKg100: treatment,
    newClosingBalanceKg100: closing,
    declaredFinishedKg100: sumKg100([
      day,
      night,
      tunnelDay,
      tunnelNight,
      treatment,
      closing,
    ]),
  };
}

function productionDay(
  rawMaterialKg: number,
  seeds: readonly LineSeed[],
  options: {
    date?: string;
    nucaBikiniOrder?: boolean;
  } = {},
): ProductionDay {
  const date = options.date ?? "2026-09-07";
  const lines = seeds.map(lineFor);
  const dayTotal = sumKg100(lines.map((line) => line.shifts.DAY.reportedKg100));
  const nightTotal = sumKg100(
    lines.map((line) => line.shifts.NIGHT.reportedKg100),
  );
  const finishedTotal = sumKg100(
    lines.map((line) => line.declaredFinishedKg100),
  );

  return {
    id: `production-day-${date}`,
    date,
    displayName: date,
    status: "DRAFT",
    rawMaterialEntries: [
      { id: `raw-material-${date}`, kg100: kg(rawMaterialKg), shift: null },
    ],
    declaredRawMaterialKg100: kg(rawMaterialKg),
    declaredShiftTotalsKg100: { DAY: dayTotal, NIGHT: nightTotal },
    declaredFinishedTotalKg100: finishedTotal,
    lines,
    receivedBalanceLots: [],
    nucaWashAuthorization: options.nucaBikiniOrder
      ? {
          kind: "USER_CONFIRMED_ORDER",
          reference: null,
          reason: "Pedido confirmado para prueba.",
        }
      : null,
    performanceReferenceBasisPoints: 8_000,
    nucaBikiniReferenceBasisPoints: 700,
    rawMaterialAllocationOverridesKg100: {},
  };
}

function summaryFor(day: ProductionDay) {
  const calculation = calculateProductionDay(day);
  return {
    calculation,
    summary: calculateProductionBusinessSummary(day, calculation),
  };
}

function family(
  summary: ReturnType<typeof calculateProductionBusinessSummary>,
  key: "ALETA" | "REJO_REPRODUCTOR" | "NUCA" | "MANTO",
) {
  return summary.families.find((candidate) => candidate.key === key)!;
}

function utilization(
  summary: ReturnType<typeof calculateProductionBusinessSummary>,
  groupId: SummaryGroupId,
) {
  return summary.groupUtilizations.find(
    (candidate) => candidate.groupId === groupId,
  )!;
}

describe("production business rules", () => {
  it("classifies the exact Polar, USA and General Anillas presentations by productId", () => {
    const anillas = PRODUCTION_CATALOG_ITEMS.filter(
      (product) => product.summaryGroupId === "ANILLAS",
    );
    const polarIds = anillas
      .filter((product) => product.anillaYieldClass === "POLAR")
      .map((product) => product.productId);
    const usaIds = anillas
      .filter((product) => product.anillaYieldClass === "USA")
      .map((product) => product.productId)
      .sort();

    expect(anillas.length).toBeGreaterThan(0);
    expect(anillas.every((product) => product.anillaYieldClass)).toBe(true);
    expect(polarIds).toEqual(["anillas-espana-polar-mixta"]);
    expect(usaIds).toEqual([
      "anillas-block-tratamiento-usa-cm-sp-st",
      "anillas-block-tratamiento-usa-sm-cp-st",
      "anillas-block-tratamiento-usa-sm-sp-st",
    ]);
    expect(
      anillas
        .filter(
          (product) =>
            !polarIds.includes(product.productId) &&
            !usaIds.includes(product.productId),
        )
        .every((product) => product.anillaYieldClass === "GENERAL"),
    ).toBe(true);
    expect(
      anillas.find(
        (product) =>
          product.productId === "anillas-iqf-tratamiento-usa-sm-cp-st",
      )?.anillaYieldClass,
    ).toBe("GENERAL");
  });

  it("keeps the confirmed technical yields centralized", () => {
    expect(MANTO_STANDARD_YIELD).toBe(0.8);
    expect(ANILLA_POLAR_YIELD).toBe(0.36);
    expect(ANILLA_USA_YIELD).toBe(0.34);
    expect(ANILLA_GENERAL_YIELD).toBe(0.42);
  });

  it("associates Anillas coproduct origins explicitly", () => {
    expect(
      PRODUCTION_CATALOG_ITEMS.find(
        (product) => product.productId === "boton-usa-sm-cp-tratamiento",
      )?.processOrigin,
    ).toBe("ANILLAS");
    expect(
      PRODUCTION_CATALOG_ITEMS.find(
        (product) => product.productId === "recorte-crudo-anillas-sm-sp-st",
      )?.processOrigin,
    ).toBe("ANILLAS");
    expect(
      PRODUCTION_CATALOG_ITEMS.find(
        (product) => product.productId === "membranas-cocidas",
      )?.processOrigin,
    ).toBe("ANILLAS");
  });

  it("recalculates report-only Aleta subtotals and preliminary yield", () => {
    const initialDay = productionDay(500_000, [
      { group: "ALETA", day: 47_020, night: 49_380 },
    ]);

    const changedDay = productionDay(500_000, [
      { group: "ALETA", day: 48_020, night: 49_380 },
    ]);

    const initialCalculation = calculateProductionDay(initialDay);
    const changedCalculation = calculateProductionDay(changedDay);

    const initial = calculateReportFamilySubtotals(
      initialDay,
      initialCalculation,
    ).find((subtotal) => subtotal.key === "ALETA")!;

    const changed = calculateReportFamilySubtotals(
      changedDay,
      changedCalculation,
    ).find((subtotal) => subtotal.key === "ALETA")!;

    expect(initial.dayKg100).toBe(kg(47_020));
    expect(initial.nightKg100).toBe(kg(49_380));
    expect(initial.totalKg100).toBe(kg(96_400));
    expect(initial.preliminaryYieldPercent).toBeCloseTo(96.4, 8);

    expect(changed.totalKg100).toBe(kg(97_400));
    expect(changed.preliminaryYieldPercent).toBeCloseTo(97.4, 8);
  });

  it("updates Aleta from 78% to 90% when a real closing balance is entered", () => {
    const before = summaryFor(
      productionDay(100, [{ group: "ALETA", day: 15.6 }]),
    ).summary;
    const projected = summaryFor(
      productionDay(100, [{ group: "ALETA", day: 15.6, closing: 2.4 }]),
    ).summary;

    expect(family(before, "ALETA").projectedYieldPercent).toBeCloseTo(78, 8);
    expect(family(before, "ALETA").missingToTargetKg100).toBe(kg(2.4));
    expect(family(projected, "ALETA").projectedYieldPercent).toBeCloseTo(90, 8);
    expect(family(projected, "ALETA").missingToTargetKg100).toBe(kg100(0));
    expect(family(projected, "ALETA").capacityToOneHundredKg100).toBe(kg(4.4));
    expect(family(projected, "ALETA").status).toBe("COMPLIES");
  });

  it("allows an 88% Aleta result through an explicit warning confirmation path", () => {
    const day = productionDay(100, [
      { group: "ALETA", day: 17.6 },
      { group: "RECORTE_CRUDO", day: 62.4 },
    ]);
    const { calculation, summary } = summaryFor(day);
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    });

    expect(summary.generalYieldPercent).toBeCloseTo(80, 8);
    expect(family(summary, "ALETA").projectedYieldPercent).toBeCloseTo(88, 8);
    expect(validation.canClose).toBe(true);
    expect(validation.warnings).toContainEqual(
      expect.objectContaining({
        code: "FAMILY_BELOW_TARGET",
        familyKey: "ALETA",
      }),
    );
  });

  it("blocks Aleta above 100%", () => {
    const day = productionDay(100, [
      { group: "ALETA", day: 20.01 },
      { group: "RECORTE_CRUDO", day: 59.99 },
    ]);
    const { calculation, summary } = summaryFor(day);
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    });

    expect(family(summary, "ALETA").status).toBe("INTEGRITY_ERROR");
    expect(validation.canClose).toBe(false);
    expect(validation.blockers).toContainEqual(
      expect.objectContaining({
        code: "FAMILY_YIELD_ABOVE_MAX",
        familyKey: "ALETA",
      }),
    );
  });

  it("uses one identical yield and automatic MP split for Rejo and Reproductor", () => {
    const { summary } = summaryFor(
      productionDay(100, [
        { group: "REJOS", day: 10 },
        { group: "REPRODUCTOR", day: 5 },
      ]),
    );

    expect(summary.rejoReproductor.sharedYieldPercent).toBeCloseTo(100, 8);
    expect(family(summary, "REJO_REPRODUCTOR").projectedYieldPercent).toBe(
      summary.rejoReproductor.sharedYieldPercent,
    );
    expect(summary.rejoReproductor.rejoRawMaterialKg100).toBe(kg(10));
    expect(summary.rejoReproductor.reproductorRawMaterialKg100).toBe(kg(5));
  });

  it("treats Rejo/Reproductor below 97% as a warning, not a blocker", () => {
    const day = productionDay(100, [
      { group: "REJOS", day: 10 },
      { group: "REPRODUCTOR", day: 4 },
      { group: "RECORTE_CRUDO", day: 66 },
    ]);
    const { calculation, summary } = summaryFor(day);
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    });

    expect(
      family(summary, "REJO_REPRODUCTOR").projectedYieldPercent,
    ).toBeCloseTo(93.333333, 5);
    expect(validation.canClose).toBe(true);
    expect(validation.warnings).toContainEqual(
      expect.objectContaining({ familyKey: "REJO_REPRODUCTOR" }),
    );
  });

  it("evaluates Nuca semilimpia and Bikini together over the same 15%", () => {
    const { summary } = summaryFor(
      productionDay(
        100,
        [
          { group: "NUCA_SEMILIMPIA", day: 4 },
          { group: "NUCA_BIKINI", night: 2.75 },
        ],
        { nucaBikiniOrder: true },
      ),
    );

    expect(family(summary, "NUCA").rawMaterialKg100).toBe(kg(15));
    expect(family(summary, "NUCA").projectedProductionKg100).toBe(kg(6.75));
    expect(family(summary, "NUCA").projectedYieldPercent).toBeCloseTo(45, 8);
  });

  it("includes Nuca Tunnel in the family yield and updates every stage", () => {
    const { summary } = summaryFor(
      productionDay(100, [
        { group: "NUCA_SEMILIMPIA", day: 2.43, tunnelDay: 4.32 },
        { group: "RECORTE_CRUDO", day: 73.25 },
      ]),
    );
    const nuca = family(summary, "NUCA");

    expect(nuca.reportYieldPercent).toBeCloseTo(16.2, 8);
    expect(nuca.tunnelKg100).toBe(kg(4.32));
    expect(nuca.afterTunnelYieldPercent).toBeCloseTo(45, 8);
    expect(nuca.projectedYieldPercent).toBeCloseTo(45, 8);
  });

  it("shows the Bikini 7% reference as information without making it a requirement", () => {
    const day = productionDay(100, [{ group: "RECORTE_CRUDO", day: 80 }], {
      nucaBikiniOrder: true,
    });
    const { calculation, summary } = summaryFor(day);
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    });

    expect(summary.nucaBikiniReferenceKg100).toBe(kg(7));
    expect(validation.blockers.map((item) => item.code)).not.toContain(
      "NUCA_BIKINI_REFERENCE",
    );
  });

  it("reconstructs the Monday Tube balance with confirmed technical yields", () => {
    const monday = productionDay(615_239, [
      { group: "ALETA", day: 111_400 },
      { group: "MANTO", day: 185_010 },
      {
        group: "ANILLAS",
        productId: "anillas-espana-polar-mixta",
        day: 22_130,
      },
      {
        group: "ANILLAS",
        productId: "anillas-espana-segunda-mixta",
        day: 840,
      },
      {
        group: "ANILLAS",
        productId: "anillas-block-tratamiento-usa-sm-cp-st",
        treatment: 45,
      },
      { group: "RECORTE_CRUDO", day: 173_338 },
    ]);
    const { calculation, summary } = summaryFor(monday);
    const balance = summary.tubeMpBalance;

    expect(balance.mpTotalKg100).toBe(kg(615_239));
    expect(balance.mpTubeKg100).toBe(kg(307_619.5));
    expect(balance.ptMantoKg100).toBe(kg(185_010));
    expect(balance.mpMantoEstimatedKg100).toBe(kg(231_262.5));
    expect(balance.mpAnillaProcessKg100).toBe(kg(76_357));
    expect(balance.mpAnillaPolarEstimatedKg100).toBe(kg(61_472.22));
    expect(balance.mpAnillaGeneralEstimatedKg100).toBe(kg(2_000));
    expect(balance.mpAnillaUsaEstimatedKg100).toBe(kg(132.35));
    expect(balance.mpMainAnillasEstimatedKg100).toBe(kg(63_604.58));
    expect(balance.mpAnillasUnallocatedKg100).toBe(kg(12_752.42));
    expect(balance.tubeDifferenceKg100).toBe(kg(0));
    expect(family(summary, "MANTO").projectedYieldPercent).toBeCloseTo(80, 8);
    expect(family(summary, "MANTO").utilizationPercent).toBeCloseTo(
      30.071241,
      5,
    );
    expect(
      validateProductionClosure(monday, calculation, {
        requiredDataComplete: true,
      }).blockers.map((blocker) => blocker.code),
    ).not.toContain("ANILLAS_MP_UNALLOCATED");
  });

  it("calculates Monday group and overall utilization over total raw material", () => {
    const { summary } = summaryFor(
      productionDay(615_239, [
        { group: "ALETA", day: 111_400 },
        { group: "MANTO", day: 185_010 },
        {
          group: "ANILLAS",
          productId: "anillas-espana-polar-mixta",
          day: 22_130,
        },
        {
          group: "ANILLAS",
          productId: "anillas-espana-segunda-mixta",
          day: 840,
        },
        {
          group: "ANILLAS",
          productId: "anillas-block-tratamiento-usa-sm-cp-st",
          treatment: 45,
        },
        { group: "RECORTE_CRUDO", day: 173_338 },
      ]),
    );

    expect(summary.finishedKg100).toBe(kg(492_763));
    expect(summary.overallUtilization.percent).toBeCloseTo(80.0929394918, 8);
    expect(utilization(summary, "MANTO").percent).toBeCloseTo(30.071241, 5);
    expect(utilization(summary, "ANILLAS").percent).toBeCloseTo(3.740822, 5);
    expect(utilization(summary, "ALETA").percent).toBeCloseTo(18.106783, 5);
    expect(
      summary.groupUtilizations.reduce(
        (total, group) => total + (group.percent ?? 0),
        0,
      ),
    ).toBeCloseTo(summary.overallUtilization.percent!, 8);
  });

  it("counts Anillas coproducts in PT without assigning them a second technical MP", () => {
    const { summary } = summaryFor(
      productionDay(100, [
        { group: "MANTO", day: 32 },
        {
          group: "ANILLAS",
          productId: "anillas-espana-segunda-mixta",
          day: 4.2,
        },
        {
          group: "BOTON",
          productId: "boton-usa-sm-cp-tratamiento",
          treatment: 5,
        },
        {
          group: "RECORTE_CRUDO",
          productId: "recorte-crudo-anillas-sm-sp-st",
          day: 5,
        },
        {
          group: "RECORTE_COCIDO",
          productId: "membranas-cocidas",
          day: 5,
        },
        { group: "RECORTE_CRUDO", day: 28.8 },
      ]),
    );

    expect(summary.tubeMpBalance.mpAnillaProcessKg100).toBe(kg(10));
    expect(summary.tubeMpBalance.mpMainAnillasEstimatedKg100).toBe(kg(10));
    expect(summary.tubeMpBalance.processOutputs).toMatchObject({
      mainAnillasKg100: kg(4.2),
      botonKg100: kg(5),
      recorteKg100: kg(5),
      membranasKg100: kg(5),
      coproductsTotalKg100: kg(15),
      processOutputsTotalKg100: kg(19.2),
    });
    expect(summary.finishedKg100).toBe(kg(80));
    expect(summary.overallUtilization.percent).toBeCloseTo(80, 8);
  });

  it("recalculates Tube MP with Report, Tunnel, Treatment and closing balance exactly once", () => {
    const { summary } = summaryFor(
      productionDay(1_000, [
        {
          group: "MANTO",
          day: 80,
          night: 40,
          tunnelDay: 10,
          tunnelNight: 20,
          treatment: 10,
          closing: 40,
        },
        {
          group: "ANILLAS",
          productId: "anillas-espana-polar-mixta",
          day: 3.6,
          night: 3.6,
          tunnelDay: 3.6,
          tunnelNight: 3.6,
          treatment: 3.6,
          closing: 3.6,
        },
      ]),
    );

    expect(summary.tubeMpBalance.ptMantoKg100).toBe(kg(200));
    expect(summary.tubeMpBalance.mpMantoEstimatedKg100).toBe(kg(250));
    expect(summary.tubeMpBalance.ptAnillasKg100).toBe(kg(21.6));
    expect(summary.tubeMpBalance.mpAnillaPolarEstimatedKg100).toBe(kg(60));
    expect(summary.finishedKg100).toBe(kg(221.6));
    expect(summary.overallUtilization.percent).toBeCloseTo(22.16, 8);
  });

  it("recalculates Tube allocation when Tunnel and Treatment change Manto output", () => {
    const reportOnly = summaryFor(
      productionDay(100, [{ group: "MANTO", day: 32 }]),
    ).summary;
    const withTunnelAndTreatment = summaryFor(
      productionDay(100, [
        { group: "MANTO", day: 32, tunnelDay: 2, treatment: 2 },
      ]),
    ).summary;

    expect(reportOnly.tubeMpBalance.mpMantoEstimatedKg100).toBe(kg(40));
    expect(reportOnly.tubeMpBalance.mpAnillaProcessKg100).toBe(kg(10));
    expect(withTunnelAndTreatment.tubeMpBalance.mpMantoEstimatedKg100).toBe(
      kg(45),
    );
    expect(withTunnelAndTreatment.tubeMpBalance.mpAnillaProcessKg100).toBe(
      kg(5),
    );
  });

  it("recalculates group and overall utilization immediately when closing balance changes", () => {
    const before = summaryFor(
      productionDay(100, [{ group: "RECORTE_CRUDO", day: 79 }]),
    ).summary;
    const after = summaryFor(
      productionDay(100, [{ group: "RECORTE_CRUDO", day: 79, closing: 1 }]),
    ).summary;

    expect(utilization(before, "RECORTE_CRUDO").percent).toBeCloseTo(79, 8);
    expect(before.overallUtilization.percent).toBeCloseTo(79, 8);
    expect(utilization(after, "RECORTE_CRUDO").percent).toBeCloseTo(80, 8);
    expect(after.overallUtilization.percent).toBeCloseTo(80, 8);
    expect(before.overallControl).toMatchObject({
      targetPercent: 80,
      minimumFinishedKg100: kg(80),
      missingToTargetKg100: kg(1),
      status: "BELOW_TARGET",
    });
    expect(after.overallControl).toMatchObject({
      minimumFinishedKg100: kg(80),
      missingToTargetKg100: kg(0),
      status: "COMPLIES",
    });
    expect(
      before.groupClosingProjections.find(
        (group) => group.groupId === "RECORTE_CRUDO",
      ),
    ).toMatchObject({
      productionBeforeClosingKg100: kg(79),
      closingBalanceKg100: kg(0),
      projectedProductionKg100: kg(79),
      yieldBeforePercent: 79,
      projectedYieldPercent: 79,
    });
    expect(
      after.groupClosingProjections.find(
        (group) => group.groupId === "RECORTE_CRUDO",
      ),
    ).toMatchObject({
      productionBeforeClosingKg100: kg(79),
      closingBalanceKg100: kg(1),
      projectedProductionKg100: kg(80),
      yieldBeforePercent: 79,
      projectedYieldPercent: 80,
    });
  });

  it("allows a 79.99% general yield with warning and permits 80% normally", () => {
    const below = productionDay(100, [{ group: "RECORTE_CRUDO", day: 79.99 }]);

    const exact = productionDay(100, [{ group: "RECORTE_CRUDO", day: 80 }]);

    const belowCalculation = calculateProductionDay(below);
    const exactCalculation = calculateProductionDay(exact);

    const belowValidation = validateProductionClosure(below, belowCalculation, {
      requiredDataComplete: true,
    });

    expect(belowValidation.canClose).toBe(true);

    expect(belowValidation.blockers).not.toContainEqual(
      expect.objectContaining({
        code: "GENERAL_YIELD_BELOW_MIN",
      }),
    );

    expect(belowValidation.warnings).toContainEqual(
      expect.objectContaining({
        code: "GENERAL_YIELD_BELOW_MIN",
      }),
    );

    expect(
      validateProductionClosure(exact, exactCalculation, {
        requiredDataComplete: true,
      }).canClose,
    ).toBe(true);
  });

  it("blocks an overall utilization above 100%", () => {
    const day = productionDay(100, [{ group: "RECORTE_CRUDO", day: 100.01 }]);
    const calculation = calculateProductionDay(day);
    const summary = calculateProductionBusinessSummary(day, calculation);

    expect(
      validateProductionClosure(day, calculation, {
        requiredDataComplete: true,
      }).blockers,
    ).toContainEqual(
      expect.objectContaining({ code: "GENERAL_YIELD_ABOVE_MAX" }),
    );
    expect(summary.overallControl).toMatchObject({
      status: "INTEGRITY_ERROR",
      excessKg100: kg(0.01),
      capacityToOneHundredKg100: kg(0),
    });
  });

  it("recalculates after treatment changes and blocks when Aleta moves from 90% to 102%", () => {
    const atTargetDay = productionDay(100, [
      { group: "ALETA", day: 16, closing: 2 },
      { group: "RECORTE_CRUDO", day: 62 },
    ]);
    const correctedDay = productionDay(100, [
      { group: "ALETA", day: 16, treatment: 2.4, closing: 2 },
      { group: "RECORTE_CRUDO", day: 62 },
    ]);
    const atTarget = summaryFor(atTargetDay);
    const corrected = summaryFor(correctedDay);

    expect(family(atTarget.summary, "ALETA").projectedYieldPercent).toBeCloseTo(
      90,
      8,
    );
    expect(
      family(corrected.summary, "ALETA").projectedYieldPercent,
    ).toBeCloseTo(102, 8);
    expect(corrected.summary.finishedKg100).not.toBe(
      atTarget.summary.finishedKg100,
    );
    expect(
      validateProductionClosure(correctedDay, corrected.calculation, {
        requiredDataComplete: true,
      }).canClose,
    ).toBe(false);
  });

  it("recalculates after Tunnel changes and blocks a family above 100%", () => {
    const day = productionDay(100, [
      { group: "ALETA", day: 18, tunnelDay: 2.01 },
      { group: "RECORTE_CRUDO", day: 59.99 },
    ]);
    const { calculation, summary } = summaryFor(day);
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    });

    expect(family(summary, "ALETA").afterTunnelYieldPercent).toBeCloseTo(
      100.05,
      8,
    );
    expect(validation.canClose).toBe(false);
    expect(validation.blockers).toContainEqual(
      expect.objectContaining({
        code: "FAMILY_YIELD_ABOVE_MAX",
        familyKey: "ALETA",
      }),
    );
  });

  it("recalculates family yield when Tunnel changes after a closing balance exists", () => {
    const before = summaryFor(
      productionDay(100, [
        { group: "ALETA", day: 15.6, closing: 2.4 },
        { group: "RECORTE_CRUDO", day: 62 },
      ]),
    ).summary;
    const after = summaryFor(
      productionDay(100, [
        { group: "ALETA", day: 15.6, tunnelDay: 1, closing: 2.4 },
        { group: "RECORTE_CRUDO", day: 61 },
      ]),
    ).summary;

    expect(family(before, "ALETA").projectedYieldPercent).toBeCloseTo(90, 8);
    expect(family(after, "ALETA").projectedYieldPercent).toBeCloseTo(95, 8);
  });

  it("keeps a Tunnel-influenced family below target as a warning when it is at most 100%", () => {
    const day = productionDay(100, [
      { group: "ALETA", day: 15, tunnelDay: 2 },
      { group: "RECORTE_CRUDO", day: 63 },
    ]);
    const { calculation, summary } = summaryFor(day);
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    });

    expect(family(summary, "ALETA").projectedYieldPercent).toBeCloseTo(85, 8);
    expect(validation.canClose).toBe(true);
    expect(validation.warnings).toContainEqual(
      expect.objectContaining({
        code: "FAMILY_BELOW_TARGET",
        familyKey: "ALETA",
      }),
    );
  });

  it("keeps a prior-week balance available after partial Sunday consumption", () => {
    const saturday = productionDay(
      60_000,
      [{ group: "ALETA", closing: 44_660 }],
      { date: "2026-09-05" },
    );
    const sourceLine = saturday.lines[0]!;
    const sunday = productionDay(60_000, [{ group: "ALETA", day: 40_000 }], {
      date: "2026-09-06",
    });
    const sundayWithUse: ProductionDay = {
      ...sunday,
      receivedBalanceLots: [
        {
          id: "saturday-aleta-balance",
          originDayId: saturday.id,
          familyId: sourceLine.familyId,
          productId: sourceLine.productId,
          originalKg100: kg(44_660),
          uses: [
            {
              id: "sunday-use",
              targetDayId: sunday.id,
              shift: "DAY",
              kg100: kg(40_000),
            },
          ],
        },
      ],
    };

    const mondayBalances = calculateOutstandingBalances([
      saturday,
      sundayWithUse,
    ]);

    expect(mondayBalances).toContainEqual(
      expect.objectContaining({
        originDayId: saturday.id,
        productId: sourceLine.productId,
        pendingKg100: kg(4_660),
      }),
    );
  });

  it("reports an exact actionable excess independently for Day and Night", () => {
    const base = productionDay(100, [
      { group: "REJOS", day: 3_120, night: 31_560 },
    ]);
    const line = base.lines[0]!;
    const withBadDistribution: ProductionDay = {
      ...base,
      receivedBalanceLots: [
        {
          id: "previous-rejo-balance",
          originDayId: "production-day-2026-09-06",
          familyId: line.familyId,
          productId: line.productId,
          originalKg100: kg(13_405),
          uses: [
            {
              id: "previous-rejo-balance-day",
              targetDayId: base.id,
              shift: "DAY",
              kg100: kg(13_405),
            },
          ],
        },
      ],
    };

    const diagnostics = buildBalanceShiftDiagnostics(
      calculateProductionDay(withBadDistribution),
    );

    expect(diagnostics).toEqual([
      expect.objectContaining({
        productName: line.productName,
        shift: "DAY",
        reportedKg100: kg(3_120),
        assignedBalanceKg100: kg(13_405),
        maximumConsumableKg100: kg(3_120),
        excessKg100: kg(10_285),
      }),
    ]);
    expect(diagnostics[0]?.message).toContain("Redistribuye");
  });

  it("allows closure with warning when Anillas MP exceeds the available Tube MP", () => {
    const day = productionDay(100, [
      { group: "ANILLAS", day: 21.26 },
      { group: "RECORTE_CRUDO", day: 58.74 },
    ]);
    const { calculation, summary } = summaryFor(day);
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    });

    expect(summary.tubeMpBalance.mpMainAnillasExcessKg100).toBeGreaterThan(0);

    expect(validation.blockers).not.toContainEqual(
      expect.objectContaining({ code: "ANILLAS_MP_EXCEEDS_AVAILABLE" }),
    );

    expect(validation.warnings).toContainEqual(
      expect.objectContaining({ code: "ANILLAS_MP_EXCEEDS_AVAILABLE" }),
    );

    expect(validation.canClose).toBe(true);
  });

  it("blocks when estimated Manto MP exceeds the Tube pool", () => {
    const day = productionDay(100, [
      { group: "MANTO", day: 41 },
      { group: "RECORTE_CRUDO", day: 39 },
    ]);
    const { calculation, summary } = summaryFor(day);
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    });

    expect(summary.tubeMpBalance.mpMantoExcessKg100).toBe(kg(1.25));
    expect(validation.blockers).toContainEqual(
      expect.objectContaining({ code: "MANTO_MP_EXCEEDS_TUBE" }),
    );
  });

  it("blocks an Anillas product that has no explicit technical class", () => {
    const original = productionDay(100, [
      { group: "ANILLAS", day: 20 },
      { group: "RECORTE_CRUDO", day: 60 },
    ]);
    const day: ProductionDay = {
      ...original,
      lines: original.lines.map((line) =>
        line.summaryGroupId === "ANILLAS"
          ? { ...line, productId: "anillas-presentation-without-class" }
          : line,
      ),
    };
    const { calculation, summary } = summaryFor(day);
    const validation = validateProductionClosure(day, calculation, {
      requiredDataComplete: true,
    });

    expect(summary.tubeMpBalance.unclassifiedAnillasKg100).toBe(kg(20));
    expect(validation.blockers).toContainEqual(
      expect.objectContaining({ code: "ANILLAS_YIELD_CLASS_MISSING" }),
    );
  });

  it("keeps Wednesday 09/09/2026 reconciled with previous balance and Tunnel", () => {
    const baseDay = productionDay(
      0,
      [
        {
          group: "RECORTE_CRUDO",
          day: 270_940,
          night: 226_540,
          tunnelDay: 32_400,
          tunnelNight: 26_100,
          treatment: 9_140,
          closing: 71_550,
        },
      ],
      { date: "2026-09-09" },
    );
    const sourceLine = baseDay.lines[0]!;
    const wednesday: ProductionDay = {
      ...baseDay,
      displayName: "Miércoles 09/09/2026",
      lines: [
        {
          ...sourceLine,
          declaredFinishedKg100: kg(571_670),
        },
      ],
      declaredFinishedTotalKg100: kg(571_670),
      receivedBalanceLots: [
        {
          id: "wednesday-previous-balance",
          originDayId: "production-day-2026-09-08",
          familyId: sourceLine.familyId,
          productId: sourceLine.productId,
          originalKg100: kg(65_000),
          uses: [
            {
              id: "wednesday-day-balance-use",
              targetDayId: baseDay.id,
              shift: "DAY",
              kg100: kg(65_000),
            },
          ],
        },
      ],
    };
    const calculation = calculateProductionDay(wednesday);
    const summary = calculateProductionBusinessSummary(wednesday, calculation);

    expect(calculation.day.reportedKg100).toBe(kg(270_940));
    expect(calculation.night.reportedKg100).toBe(kg(226_540));
    expect(calculation.processedPreviousBalanceKg100).toBe(kg(65_000));
    expect(calculation.tunnel.dayKg100).toBe(kg(32_400));
    expect(calculation.tunnel.nightKg100).toBe(kg(26_100));
    expect(calculation.productiveDayKg100).toBe(kg(238_340));
    expect(calculation.productiveNightKg100).toBe(kg(252_640));
    expect(calculation.treatmentKg100).toBe(kg(9_140));
    expect(calculation.newClosingBalanceKg100).toBe(kg(71_550));
    expect(calculation.expectedFinishedKg100).toBe(kg(571_670));
    expect(calculation.differenceKg100).toBe(kg(0));
    expect(calculation.status).toBe("BALANCED");
    expect(summary.finishedKg100).toBe(kg(571_670));
    expect(summary.overallUtilization.percent).toBeNull();
    expect(summary.tubeMpBalance.tubeDifferenceKg100).toBe(kg(0));
  });

  it("blocks compensating product-detail differences even when the final total is zero", () => {
    const balanced = productionDay(100, [
      { group: "RECORTE_CRUDO", day: 40 },
      { group: "ALETA", day: 20 },
    ]);
    const inconsistent: ProductionDay = {
      ...balanced,
      lines: balanced.lines.map((line, index) => ({
        ...line,
        declaredFinishedKg100: kg(
          index === 0
            ? line.declaredFinishedKg100 / 100 + 1
            : line.declaredFinishedKg100 / 100 - 1,
        ),
      })),
    };
    const calculation = calculateProductionDay(inconsistent);
    const validation = validateProductionClosure(inconsistent, calculation, {
      requiredDataComplete: true,
    });

    expect(calculation.differenceKg100).toBe(kg100(0));
    expect(validation.canClose).toBe(false);
    expect(validation.blockers.map((item) => item.code)).toContain(
      "PRODUCT_RECONCILIATION_DIFFERENCE",
    );
  });
});
