import {
  ALETA_MP_SHARE_BPS,
  ALETA_TARGET,
  ALETA_TARGET_BPS,
  ANILLA_GENERAL_YIELD,
  ANILLA_POLAR_YIELD,
  ANILLA_USA_YIELD,
  GENERAL_MIN_YIELD,
  GENERAL_MIN_YIELD_BPS,
  MANTO_STANDARD_YIELD,
  MANTO_STANDARD_YIELD_BPS,
  NUCA_BIKINI_REFERENCE_BPS,
  NUCA_MP_SHARE_BPS,
  NUCA_TARGET,
  NUCA_TARGET_BPS,
  REJO_MP_SHARE_BPS,
  REJO_REPRODUCTOR_TARGET,
  REJO_REPRODUCTOR_TARGET_BPS,
  getAnillaYieldClass,
} from "./businessConfig";
import {
  applyBasisPoints,
  calculateBalancePosition,
  kg100,
  sumKg100,
} from "./calculations";
import { isBalanceOnlyProductionDay } from "./productionDayMode";
import { isFreezingProductionDay } from "./productionProcess";
import type {
  Kg100,
  ProductionDay,
  ProductionDayCalculation,
  ProductReconciliation,
  ShiftCode,
  SummaryGroupId,
} from "./types";
import {
  getGroupUtilization,
  getOverallUtilization,
  getProductionOutputPositions,
  getTubeMpBalance,
  type GroupUtilization,
  type OverallUtilization,
  type TubeMpBalance,
} from "./tubeMpBalance";

export type FamilyYieldKey = "ALETA" | "REJO_REPRODUCTOR" | "NUCA" | "MANTO";

export type FamilyYieldStatus =
  | "BELOW_TARGET"
  | "COMPLIES"
  | "INTEGRITY_ERROR"
  | "NO_TARGET";

export interface FamilyYieldProjection {
  key: FamilyYieldKey;
  label: string;
  rawMaterialKg100: Kg100;
  reportProductionKg100: Kg100;
  tunnelKg100: Kg100;
  productionAfterTunnelKg100: Kg100;
  productionBeforeClosingKg100: Kg100;
  treatmentKg100: Kg100;
  closingBalanceKg100: Kg100;
  projectedProductionKg100: Kg100;
  reportYieldPercent: number | null;
  afterTunnelYieldPercent: number | null;
  yieldBeforePercent: number | null;
  projectedYieldPercent: number | null;
  utilizationPercent: number | null;
  targetPercent: number | null;
  targetKg100: Kg100 | null;
  missingToTargetKg100: Kg100;
  capacityToOneHundredKg100: Kg100;
  excessKg100: Kg100;
  status: FamilyYieldStatus;
}

export interface ReportFamilySubtotal {
  key: string;
  label: string;
  productIds: readonly string[];

  /** Producción física reportada por los supervisores. */
  dayKg100: Kg100;
  nightKg100: Kg100;
  totalKg100: Kg100;

  /** Saldo histórico realmente procesado dentro de estos reportes. */
  previousBalanceProcessedKg100: Kg100;

  /**
   * Producción que pertenece realmente a la MP de esta jornada:
   * reportado + ajustes - saldo anterior procesado.
   */
  ownProductionKg100: Kg100;

  preliminaryYieldPercent: number | null;
  targetPercent: number | null;
  missingToTargetKg100: Kg100;
  status: FamilyYieldStatus;
}

export interface RejoReproductorAllocation {
  jointRawMaterialKg100: Kg100;
  rejoOutputKg100: Kg100;
  reproductorOutputKg100: Kg100;
  rejoRawMaterialKg100: Kg100;
  reproductorRawMaterialKg100: Kg100;
  sharedYieldPercent: number | null;
}

export interface GroupClosingProjection {
  groupId: SummaryGroupId;
  label: string;
  productionBeforeClosingKg100: Kg100;
  closingBalanceKg100: Kg100;
  projectedProductionKg100: Kg100;
  yieldBeforePercent: number | null;
  projectedYieldPercent: number | null;
  capacityToOneHundredKg100: Kg100;
  excessKg100: Kg100;
  status: "NO_TARGET" | "INTEGRITY_ERROR";
}

export interface ProductionBusinessSummary {
  generalYieldPercent: number | null;
  overallUtilization: OverallUtilization;
  overallControl: OverallUtilizationControl;
  finishedKg100: Kg100;
  families: readonly FamilyYieldProjection[];
  groupUtilizations: readonly GroupUtilization[];
  groupClosingProjections: readonly GroupClosingProjection[];
  rejoReproductor: RejoReproductorAllocation;
  tubeMpBalance: TubeMpBalance;
  nucaBikiniReferenceKg100: Kg100 | null;
}

export type OverallUtilizationControlStatus =
  | "UNAVAILABLE"
  | "BELOW_TARGET"
  | "COMPLIES"
  | "INTEGRITY_ERROR";

export interface OverallUtilizationControl {
  targetPercent: number;
  minimumFinishedKg100: Kg100;
  missingToTargetKg100: Kg100;
  capacityToOneHundredKg100: Kg100;
  excessKg100: Kg100;
  status: OverallUtilizationControlStatus;
}

export interface ClosureMessage {
  code: string;
  message: string;
  familyKey?: FamilyYieldKey;
  productId?: string;
}

export interface ProductionClosureValidation {
  canClose: boolean;
  blockers: readonly ClosureMessage[];
  warnings: readonly ClosureMessage[];
}

export interface BalanceShiftDiagnostic {
  readonly productId: string;
  readonly productName: string;
  readonly shift: ShiftCode;
  readonly reportedKg100: Kg100;
  readonly assignedBalanceKg100: Kg100;
  readonly maximumConsumableKg100: Kg100;
  readonly excessKg100: Kg100;
  readonly message: string;
}

interface ClosureValidationOptions {
  requiredDataComplete: boolean;
  inputErrors?: readonly string[];
}

const ZERO = kg100(0);
const REJO_GROUPS: readonly SummaryGroupId[] = [
  "REJOS_SPECIAL",
  "REJOS",
  "REPRODUCTOR",
];
const NUCA_GROUPS: readonly SummaryGroupId[] = [
  "NUCA_SEMILIMPIA",
  "NUCA_BIKINI",
];

function percent(numeratorKg100: Kg100, denominatorKg100: Kg100) {
  return denominatorKg100 === 0
    ? null
    : (numeratorKg100 / denominatorKg100) * 100;
}

export function getOverallUtilizationControl(
  finishedKg100: Kg100,
  rawMaterialKg100: Kg100,
): OverallUtilizationControl {
  const minimumFinishedKg100 = applyBasisPoints(
    rawMaterialKg100,
    GENERAL_MIN_YIELD_BPS,
  );
  const missingToTargetKg100 = kg100(
    Math.max(minimumFinishedKg100 - finishedKg100, 0),
  );
  const capacityToOneHundredKg100 = kg100(
    Math.max(rawMaterialKg100 - finishedKg100, 0),
  );
  const excessKg100 = kg100(Math.max(finishedKg100 - rawMaterialKg100, 0));

  return {
    targetPercent: GENERAL_MIN_YIELD * 100,
    minimumFinishedKg100,
    missingToTargetKg100,
    capacityToOneHundredKg100,
    excessKg100,
    status:
      rawMaterialKg100 === 0
        ? "UNAVAILABLE"
        : excessKg100 > 0
          ? "INTEGRITY_ERROR"
          : finishedKg100 < minimumFinishedKg100
            ? "BELOW_TARGET"
            : "COMPLIES",
  };
}

function productGroup(
  productionDay: ProductionDay,
  product: ProductReconciliation,
): SummaryGroupId | undefined {
  return productionDay.lines.find(
    (line) => line.productId === product.productId,
  )?.summaryGroupId;
}

function productsForGroups(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation,
  groups: readonly SummaryGroupId[],
) {
  const groupSet = new Set(groups);
  return calculation.products.filter((product) => {
    const group = productGroup(productionDay, product);
    return group !== undefined && groupSet.has(group);
  });
}

function outputParts(products: readonly ProductReconciliation[]) {
  const reportProductionKg100 = sumKg100(
    products.flatMap((product) => [
      product.day.ownProductionKg100,
      product.night.ownProductionKg100,
    ]),
  );
  const tunnelKg100 = sumKg100(
    products.flatMap((product) => [
      product.tunnel.DAY.ownProductionKg100,
      product.tunnel.NIGHT.ownProductionKg100,
    ]),
  );
  const productionAfterTunnelKg100 = sumKg100([
    reportProductionKg100,
    tunnelKg100,
  ]);
  const treatmentKg100 = sumKg100(
    products.map((product) => product.treatmentKg100),
  );
  const closingBalanceKg100 = sumKg100(
    products.map((product) => product.newClosingBalanceKg100),
  );
  const productionBeforeClosingKg100 = sumKg100([
    productionAfterTunnelKg100,
    treatmentKg100,
  ]);

  return {
    reportProductionKg100,
    tunnelKg100,
    productionAfterTunnelKg100,
    treatmentKg100,
    closingBalanceKg100,
    productionBeforeClosingKg100,
    projectedProductionKg100: sumKg100([
      productionBeforeClosingKg100,
      closingBalanceKg100,
    ]),
  };
}

function familyProjection(
  key: FamilyYieldKey,
  label: string,
  rawMaterialKg100: Kg100,
  totalRawMaterialKg100: Kg100,
  parts: ReturnType<typeof outputParts>,
  target: { ratio: number; basisPoints: number } | null,
): FamilyYieldProjection {
  const targetKg100 = target
    ? applyBasisPoints(rawMaterialKg100, target.basisPoints)
    : null;
  const excessKg100 = kg100(
    Math.max(parts.projectedProductionKg100 - rawMaterialKg100, 0),
  );
  const missingToTargetKg100 = kg100(
    Math.max((targetKg100 ?? ZERO) - parts.projectedProductionKg100, 0),
  );
  const status: FamilyYieldStatus =
    excessKg100 > 0
      ? "INTEGRITY_ERROR"
      : targetKg100 !== null && parts.projectedProductionKg100 < targetKg100
        ? "BELOW_TARGET"
        : targetKg100 !== null
          ? "COMPLIES"
          : "NO_TARGET";

  return {
    key,
    label,
    rawMaterialKg100,
    reportProductionKg100: parts.reportProductionKg100,
    tunnelKg100: parts.tunnelKg100,
    productionAfterTunnelKg100: parts.productionAfterTunnelKg100,
    productionBeforeClosingKg100: parts.productionBeforeClosingKg100,
    treatmentKg100: parts.treatmentKg100,
    closingBalanceKg100: parts.closingBalanceKg100,
    projectedProductionKg100: parts.projectedProductionKg100,
    reportYieldPercent: percent(parts.reportProductionKg100, rawMaterialKg100),
    afterTunnelYieldPercent: percent(
      parts.productionAfterTunnelKg100,
      rawMaterialKg100,
    ),
    yieldBeforePercent: percent(
      parts.productionBeforeClosingKg100,
      rawMaterialKg100,
    ),
    projectedYieldPercent: percent(
      parts.projectedProductionKg100,
      rawMaterialKg100,
    ),
    utilizationPercent: percent(
      parts.projectedProductionKg100,
      totalRawMaterialKg100,
    ),
    targetPercent: target ? target.ratio * 100 : null,
    targetKg100,
    missingToTargetKg100,
    capacityToOneHundredKg100: kg100(
      Math.max(rawMaterialKg100 - parts.productionBeforeClosingKg100, 0),
    ),
    excessKg100,
    status,
  };
}

function operationalFamily(line: ProductionDay["lines"][number]) {
  if (line.summaryGroupId === "ALETA") {
    return { key: "ALETA", label: "Aleta cruda" };
  }
  if (line.summaryGroupId === "MANTO") {
    return { key: "MANTO", label: "Manto crudo" };
  }
  if (line.summaryGroupId === "ANILLAS") {
    return { key: "ANILLAS", label: "Anillas" };
  }
  if (REJO_GROUPS.includes(line.summaryGroupId)) {
    return { key: "REJO_REPRODUCTOR", label: "Rejo + Reproductor" };
  }
  if (NUCA_GROUPS.includes(line.summaryGroupId)) {
    return { key: "NUCA", label: "Nuca" };
  }

  return { key: line.familyId, label: line.familyName };
}

/** Report-only family control. Tunnel, treatment and closing balances are intentionally excluded. */
export function calculateReportFamilySubtotals(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation,
): readonly ReportFamilySubtotal[] {
  const buckets = new Map<
    string,
    {
      label: string;
      productIds: string[];
      dayKg100: Kg100;
      nightKg100: Kg100;
    }
  >();

  for (const line of productionDay.lines) {
    const group = operationalFamily(line);
    const current = buckets.get(group.key) ?? {
      label: group.label,
      productIds: [],
      dayKg100: ZERO,
      nightKg100: ZERO,
    };
    current.productIds.push(line.productId);
    current.dayKg100 = kg100(current.dayKg100 + line.shifts.DAY.reportedKg100);
    current.nightKg100 = kg100(
      current.nightKg100 + line.shifts.NIGHT.reportedKg100,
    );
    buckets.set(group.key, current);
  }

  const rawMaterialKg100 = productionDay.declaredRawMaterialKg100;
  const preliminaryMantoOutputKg100 = sumKg100([
    buckets.get("MANTO")?.dayKg100 ?? ZERO,
    buckets.get("MANTO")?.nightKg100 ?? ZERO,
  ]);
  const preliminaryMantoRawKg100 = kg100(
    Math.round(preliminaryMantoOutputKg100 / MANTO_STANDARD_YIELD),
  );
  const anillaReportOutputByClass = productionDay.lines
    .filter((line) => line.summaryGroupId === "ANILLAS")
    .reduce(
      (totals, line) => {
        const yieldClass = getAnillaYieldClass(line.productId);
        if (yieldClass) {
          totals[yieldClass] +=
            line.shifts.DAY.reportedKg100 + line.shifts.NIGHT.reportedKg100;
        }
        return totals;
      },
      { POLAR: 0, GENERAL: 0, USA: 0 },
    );
  const preliminaryAnillasRawKg100 = kg100(
    Math.round(
      anillaReportOutputByClass.POLAR / ANILLA_POLAR_YIELD +
        anillaReportOutputByClass.GENERAL / ANILLA_GENERAL_YIELD +
        anillaReportOutputByClass.USA / ANILLA_USA_YIELD,
    ),
  );

  return [...buckets.entries()].map(([key, bucket]) => {
    const totalKg100 = sumKg100([bucket.dayKg100, bucket.nightKg100]);
    const familyProductIds = new Set(bucket.productIds);

    const familyCalculatedProducts = calculation.products.filter((product) =>
      familyProductIds.has(product.productId),
    );

    const previousBalanceProcessedKg100 = sumKg100(
      familyCalculatedProducts.flatMap((product) => [
        product.day.previousBalanceProcessedKg100,
        product.night.previousBalanceProcessedKg100,
      ]),
    );

    const ownProductionKg100 = sumKg100(
      familyCalculatedProducts.flatMap((product) => [
        product.day.ownProductionKg100,
        product.night.ownProductionKg100,
      ]),
    );
    const configured =
      key === "ALETA"
        ? {
            rawKg100: applyBasisPoints(rawMaterialKg100, ALETA_MP_SHARE_BPS),
            target: ALETA_TARGET,
          }
        : key === "REJO_REPRODUCTOR"
          ? {
              rawKg100: applyBasisPoints(rawMaterialKg100, REJO_MP_SHARE_BPS),
              target: REJO_REPRODUCTOR_TARGET,
            }
          : key === "NUCA"
            ? {
                rawKg100: applyBasisPoints(rawMaterialKg100, NUCA_MP_SHARE_BPS),
                target: NUCA_TARGET,
              }
            : key === "MANTO"
              ? {
                  rawKg100: preliminaryMantoRawKg100,
                  target: MANTO_STANDARD_YIELD,
                }
              : key === "ANILLAS"
                ? {
                    rawKg100: preliminaryAnillasRawKg100,
                    target: null,
                  }
                : null;
    const preliminaryYieldPercent = configured
      ? percent(ownProductionKg100, configured.rawKg100)
      : null;
    const targetKg100 =
      configured?.target == null
        ? null
        : kg100(Math.round(configured.rawKg100 * configured.target));
    const status: FamilyYieldStatus =
      configured &&
      configured.rawKg100 > 0 &&
      ownProductionKg100 > configured.rawKg100
        ? "INTEGRITY_ERROR"
        : targetKg100 !== null && ownProductionKg100 < targetKg100
          ? "BELOW_TARGET"
          : targetKg100 !== null
            ? "COMPLIES"
            : "NO_TARGET";

    return {
      key,
      label: bucket.label,
      productIds: bucket.productIds,
      dayKg100: bucket.dayKg100,
      nightKg100: bucket.nightKg100,
      totalKg100,
      previousBalanceProcessedKg100,
      ownProductionKg100,
      preliminaryYieldPercent,
      targetPercent:
        configured?.target == null ? null : configured.target * 100,
      missingToTargetKg100:
        targetKg100 === null
          ? ZERO
          : kg100(Math.max(targetKg100 - ownProductionKg100, 0)),
      status,
    };
  });
}

export function calculateProductionBusinessSummary(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation,
): ProductionBusinessSummary {
  const rawMaterialKg100 = productionDay.declaredRawMaterialKg100;
  const aletaParts = outputParts(
    productsForGroups(productionDay, calculation, ["ALETA"]),
  );
  const rejoParts = outputParts(
    productsForGroups(productionDay, calculation, REJO_GROUPS),
  );
  const nucaParts = outputParts(
    productsForGroups(productionDay, calculation, NUCA_GROUPS),
  );
  const mantoParts = outputParts(
    productsForGroups(productionDay, calculation, ["MANTO"]),
  );
  const outputPositions = getProductionOutputPositions(
    productionDay,
    calculation,
  );
  const groupUtilizations = getGroupUtilization(
    outputPositions,
    rawMaterialKg100,
  );
  const groupClosingProjections = groupUtilizations.map((group) => {
    const products = productsForGroups(productionDay, calculation, [
      group.groupId,
    ]);
    const closingBalanceKg100 = sumKg100(
      products.map((product) => product.newClosingBalanceKg100),
    );
    const productionBeforeClosingKg100 = kg100(
      Math.max(group.finishedKg100 - closingBalanceKg100, 0),
    );
    const excessKg100 = kg100(
      Math.max(group.finishedKg100 - rawMaterialKg100, 0),
    );

    return {
      groupId: group.groupId,
      label: group.label,
      productionBeforeClosingKg100,
      closingBalanceKg100,
      projectedProductionKg100: group.finishedKg100,
      yieldBeforePercent: percent(
        productionBeforeClosingKg100,
        rawMaterialKg100,
      ),
      projectedYieldPercent: group.percent,
      capacityToOneHundredKg100: kg100(
        Math.max(rawMaterialKg100 - productionBeforeClosingKg100, 0),
      ),
      excessKg100,
      status: excessKg100 > 0 ? "INTEGRITY_ERROR" : "NO_TARGET",
    } satisfies GroupClosingProjection;
  });
  const tubeMpBalance = getTubeMpBalance(productionDay, calculation);
  const overallUtilization = getOverallUtilization(
    calculation.expectedFinishedKg100,
    rawMaterialKg100,
  );
  const overallControl = getOverallUtilizationControl(
    calculation.expectedFinishedKg100,
    rawMaterialKg100,
  );
  const jointRawMaterialKg100 = applyBasisPoints(
    rawMaterialKg100,
    REJO_MP_SHARE_BPS,
  );
  const sharedRatio =
    jointRawMaterialKg100 === 0
      ? null
      : rejoParts.projectedProductionKg100 / jointRawMaterialKg100;
  const reproductorParts = outputParts(
    productsForGroups(productionDay, calculation, ["REPRODUCTOR"]),
  );
  const reproductorRawMaterialKg100 =
    sharedRatio && sharedRatio > 0
      ? kg100(
          Math.min(
            Math.round(reproductorParts.projectedProductionKg100 / sharedRatio),
            jointRawMaterialKg100,
          ),
        )
      : ZERO;
  const rejoOutputKg100 = kg100(
    rejoParts.projectedProductionKg100 -
      reproductorParts.projectedProductionKg100,
  );

  return {
    generalYieldPercent: overallUtilization.percent,
    overallUtilization,
    overallControl,
    finishedKg100: calculation.expectedFinishedKg100,
    groupUtilizations,
    groupClosingProjections,
    families: [
      familyProjection(
        "ALETA",
        "Aleta",
        applyBasisPoints(rawMaterialKg100, ALETA_MP_SHARE_BPS),
        rawMaterialKg100,
        aletaParts,
        { ratio: ALETA_TARGET, basisPoints: ALETA_TARGET_BPS },
      ),
      familyProjection(
        "REJO_REPRODUCTOR",
        "Rejo + Reproductor",
        jointRawMaterialKg100,
        rawMaterialKg100,
        rejoParts,
        {
          ratio: REJO_REPRODUCTOR_TARGET,
          basisPoints: REJO_REPRODUCTOR_TARGET_BPS,
        },
      ),
      familyProjection(
        "NUCA",
        "Nuca",
        applyBasisPoints(rawMaterialKg100, NUCA_MP_SHARE_BPS),
        rawMaterialKg100,
        nucaParts,
        { ratio: NUCA_TARGET, basisPoints: NUCA_TARGET_BPS },
      ),
      familyProjection(
        "MANTO",
        "Manto",
        tubeMpBalance.mpMantoEstimatedKg100,
        rawMaterialKg100,
        mantoParts,
        {
          ratio: MANTO_STANDARD_YIELD,
          basisPoints: MANTO_STANDARD_YIELD_BPS,
        },
      ),
    ],
    rejoReproductor: {
      jointRawMaterialKg100,
      rejoOutputKg100,
      reproductorOutputKg100: reproductorParts.projectedProductionKg100,
      rejoRawMaterialKg100: kg100(
        jointRawMaterialKg100 - reproductorRawMaterialKg100,
      ),
      reproductorRawMaterialKg100,
      sharedYieldPercent: sharedRatio === null ? null : sharedRatio * 100,
    },
    tubeMpBalance,
    nucaBikiniReferenceKg100: productionDay.nucaWashAuthorization
      ? applyBasisPoints(rawMaterialKg100, NUCA_BIKINI_REFERENCE_BPS)
      : null,
  };
}

function kilograms(value: Kg100) {
  return `${(value / 100).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kg`;
}

export function buildBalanceShiftDiagnostics(
  calculation: ProductionDayCalculation,
): readonly BalanceShiftDiagnostic[] {
  return calculation.products.flatMap((product) =>
    (
      [
        ["DAY", product.day],
        ["NIGHT", product.night],
      ] as const
    ).flatMap(([shift, entry]) => {
      const maximumConsumableKg100 = kg100(
        entry.reportedKg100 + entry.adjustmentKg100,
      );
      const excessKg100 = kg100(
        Math.max(
          entry.previousBalanceProcessedKg100 - maximumConsumableKg100,
          0,
        ),
      );
      if (excessKg100 === 0) return [];

      const shiftLabel = shift === "DAY" ? "Día" : "Noche";
      return [
        {
          productId: product.productId,
          productName: product.productName,
          shift,
          reportedKg100: maximumConsumableKg100,
          assignedBalanceKg100: entry.previousBalanceProcessedKg100,
          maximumConsumableKg100,
          excessKg100,
          message:
            `${product.productName} · Turno ${shiftLabel}: el saldo asignado supera ` +
            `los kg físicamente reportados en ${kilograms(excessKg100)}. ` +
            "Redistribuye el consumo entre Día/Noche o deja el remanente pendiente.",
        },
      ];
    }),
  );
}

export function buildProductionDiagnostics(
  calculation: ProductionDayCalculation,
  businessSummary: ProductionBusinessSummary,
): readonly ClosureMessage[] {
  const diagnostics: ClosureMessage[] = [];

  for (const [label, shift] of [
    ["Turno Día", calculation.day],
    ["Turno Noche", calculation.night],
  ] as const) {
    diagnostics.push({
      code:
        shift.detailDifferenceKg100 === 0
          ? "SHIFT_BALANCED"
          : "SHIFT_DIFFERENCE",
      message:
        shift.detailDifferenceKg100 === 0
          ? `${label}: conciliado.`
          : shift.detailDifferenceKg100 > 0
            ? `${label}: faltan ${kilograms(shift.detailDifferenceKg100)} por registrar.`
            : `${label}: sobran ${kilograms(kg100(-shift.detailDifferenceKg100))} en el detalle.`,
    });
  }

  for (const family of businessSummary.families) {
    if (family.status !== "INTEGRITY_ERROR") continue;
    diagnostics.push({
      code: "FAMILY_YIELD_ABOVE_MAX",
      familyKey: family.key,
      message: `${family.label} supera 100% en ${kilograms(family.excessKg100)}. Revisa reporte, Túnel, tratamiento, saldos, clasificación del producto o materia prima.`,
    });
  }

  if (businessSummary.tubeMpBalance.mpMantoExcessKg100 > 0) {
    diagnostics.push({
      code: "MANTO_MP_EXCEEDS_TUBE",
      familyKey: "MANTO",
      message: `La MP técnica estimada para Manto supera la MP Tubo en ${kilograms(businessSummary.tubeMpBalance.mpMantoExcessKg100)}.`,
    });
  }

  if (businessSummary.tubeMpBalance.mpMainAnillasExcessKg100 > 0) {
    diagnostics.push({
      code: "ANILLAS_MP_EXCEEDS_AVAILABLE",
      message: `Los rendimientos registrados para Anillas requieren ${kilograms(businessSummary.tubeMpBalance.mpMainAnillasExcessKg100)} más de MP que la disponible en el proceso de Tubo.`,
    });
  }

  if (businessSummary.tubeMpBalance.unclassifiedAnillasKg100 > 0) {
    diagnostics.push({
      code: "ANILLAS_YIELD_CLASS_MISSING",
      message: `Existen ${kilograms(businessSummary.tubeMpBalance.unclassifiedAnillasKg100)} de Anillas sin clase técnica Polar, General o USA.`,
    });
  }

  if (businessSummary.tubeMpBalance.tubeDifferenceKg100 !== 0) {
    diagnostics.push({
      code: "TUBE_MP_BALANCE_DIFFERENCE",
      message: `El balance principal del Tubo presenta una diferencia de ${kilograms(businessSummary.tubeMpBalance.tubeDifferenceKg100)}.`,
    });
  }

  return diagnostics;
}

export function validateProductionClosure(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation,
  options: ClosureValidationOptions,
): ProductionClosureValidation {
  const businessSummary = calculateProductionBusinessSummary(
    productionDay,
    calculation,
  );
  const blockers: ClosureMessage[] = [];
  const warnings: ClosureMessage[] = [];

  if (!options.requiredDataComplete) {
    blockers.push({
      code: "REQUIRED_DATA_INCOMPLETE",
      message: "Completa los datos obligatorios de la jornada.",
    });
  }
  for (const error of options.inputErrors ?? []) {
    blockers.push({ code: "INVALID_CAPTURE_INPUT", message: error });
  }
  if (
    productionDay.hasTunnelProduction === true &&
    calculation.tunnel.totalKg100 === 0
  ) {
    blockers.push({
      code: "TUNNEL_MOVEMENTS_REQUIRED",
      message:
        "Se indicó que existe producto para Túnel, pero no se registraron productos.",
    });
  }
  if (calculation.day.detailDifferenceKg100 !== 0) {
    blockers.push({
      code: "DAY_REPORT_NOT_RECONCILED",
      message:
        "El detalle del Turno Día no coincide con el reporte del supervisor.",
    });
  }
  if (calculation.night.detailDifferenceKg100 !== 0) {
    blockers.push({
      code: "NIGHT_REPORT_NOT_RECONCILED",
      message:
        "El detalle del Turno Noche no coincide con el reporte del supervisor.",
    });
  }
  if (calculation.differenceKg100 !== 0) {
    blockers.push({
      code: "FINAL_DIFFERENCE",
      message: `La diferencia final debe ser 0.00 kg; actualmente es ${kilograms(calculation.differenceKg100)}.`,
    });
  }
  for (const product of calculation.products) {
    if (product.differenceKg100 === 0) continue;
    blockers.push({
      code: "PRODUCT_RECONCILIATION_DIFFERENCE",
      message: `${product.productName} presenta una diferencia de ${kilograms(product.differenceKg100)} entre el cálculo operativo y el detalle declarado.`,
    });
  }
  for (const issue of calculation.integrityIssues) {
    const freezingLot =
      isFreezingProductionDay(productionDay) &&
      issue.code === "BALANCE_OVERUSED"
        ? productionDay.receivedBalanceLots.find(
            (lot) => lot.id === issue.balanceLotId,
          )
        : undefined;
    const overusedKg100 = freezingLot
      ? calculateBalancePosition(freezingLot).overusedKg100
      : ZERO;
    blockers.push({
      code: issue.code,
      message:
        overusedKg100 > 0
          ? `Se están registrando ${kilograms(overusedKg100)} más de los disponibles para congelar.`
          : issue.message,
    });
  }

  if (isFreezingProductionDay(productionDay)) {
    if (productionDay.declaredRawMaterialKg100 !== 0) {
      blockers.push({
        code: "FREEZING_RAW_MATERIAL",
        message:
          "Congelamiento recibe producto envasado y no registra una nueva descarga de materia prima.",
      });
    }
    if (
      calculation.reportOwnProductionKg100 !== 0 ||
      calculation.ownTurnProductionKg100 !== 0
    ) {
      const hasAnyTraceableOrigin =
        calculation.processedPreviousBalanceKg100 > 0;

      if (!hasAnyTraceableOrigin) {
        blockers.push({
          code: "FREEZING_WITHOUT_AVAILABILITY",
          message:
            "Existe producto congelado sin ninguna disponibilidad trazable desde Envasado. Vincula al menos un origen válido antes de cerrar.",
        });
      } else {
        warnings.push({
          code: "FREEZING_TRACEABILITY_DIFFERENCE",
          message: `Existen ${kilograms(
            calculation.reportOwnProductionKg100,
          )} congelados sin origen suficiente desde Envasado. La jornada puede cerrarse con observación y la diferencia queda sujeta a revisión de presentación, clasificación u origen.`,
        });

        for (const product of calculation.products) {
          const untracedKg100 = sumKg100([
            product.day.ownProductionKg100,
            product.night.ownProductionKg100,
          ]);

          if (untracedKg100 === 0) {
            continue;
          }

          warnings.push({
            code: "FREEZING_PRODUCT_TRACEABILITY_DIFFERENCE",
            productId: product.productId,
            message: `${product.productName}: ${kilograms(
              untracedKg100,
            )} congelados sin origen suficiente. Revisa si corresponde a una diferencia de presentación/clasificación o a un origen todavía no vinculado.`,
          });
        }
      }
    }
    if (
      calculation.tunnel.totalKg100 !== 0 ||
      calculation.treatmentKg100 !== 0 ||
      calculation.newClosingBalanceKg100 !== 0
    ) {
      blockers.push({
        code: "FREEZING_PACKING_STAGE",
        message:
          "Congelamiento no utiliza Túnel, Tratamiento ni saldo productivo de Envasado.",
      });
    }

    return {
      canClose: blockers.length === 0,
      blockers,
      warnings,
    };
  }

  if (isBalanceOnlyProductionDay(productionDay)) {
    if (productionDay.declaredRawMaterialKg100 !== 0) {
      blockers.push({
        code: "BALANCE_ONLY_RAW_MATERIAL",
        message:
          "Una jornada de saldos no puede registrar nueva materia prima.",
      });
    }
    if (
      calculation.reportOwnProductionKg100 !== 0 ||
      calculation.ownTurnProductionKg100 !== 0
    ) {
      blockers.push({
        code: "BALANCE_ONLY_UNLINKED_PRODUCTION",
        message:
          "Existe producción reportada que no está vinculada a saldos anteriores. Vincula el saldo faltante o activa “Hubo descarga / producción nueva”.",
      });
    }
    if (
      calculation.tunnel.totalKg100 !== 0 ||
      calculation.treatmentKg100 !== 0 ||
      calculation.newClosingBalanceKg100 !== 0
    ) {
      blockers.push({
        code: "BALANCE_ONLY_NEW_PRODUCTION_MOVEMENT",
        message:
          "Una jornada de saldos no genera Túnel, Tratamiento ni saldo productivo nuevo.",
      });
    }

    return {
      canClose: blockers.length === 0,
      blockers,
      warnings,
    };
  }

  const generalYield = businessSummary.generalYieldPercent;

  if (generalYield === null) {
    blockers.push({
      code: "GENERAL_YIELD_BELOW_MIN",
      message: "No se pudo calcular el aprovechamiento general de la jornada.",
    });
  } else if (generalYield > 100) {
    blockers.push({
      code: "GENERAL_YIELD_ABOVE_MAX",
      message: "El aprovechamiento general no puede superar 100%.",
    });
  } else if (generalYield < GENERAL_MIN_YIELD * 100) {
    warnings.push({
      code: "GENERAL_YIELD_BELOW_MIN",
      message: `El aprovechamiento general es ${generalYield.toFixed(
        2,
      )}%, por debajo de la referencia de 80%. La jornada puede cerrarse con observación.`,
    });
  }

  if (businessSummary.tubeMpBalance.mpMantoExcessKg100 > 0) {
    blockers.push({
      code: "MANTO_MP_EXCEEDS_TUBE",
      familyKey: "MANTO",
      message: `La MP técnica estimada para Manto supera la MP Tubo en ${kilograms(businessSummary.tubeMpBalance.mpMantoExcessKg100)}.`,
    });
  }

  if (businessSummary.tubeMpBalance.mpMainAnillasExcessKg100 > 0) {
    warnings.push({
      code: "ANILLAS_MP_EXCEEDS_AVAILABLE",
      message: `La reconstrucción teórica de las Anillas supera la MP disponible del proceso de Tubo en ${kilograms(
        businessSummary.tubeMpBalance.mpMainAnillasExcessKg100,
      )}. Revisa la variación de rendimiento antes de cerrar.`,
    });
  }

  if (businessSummary.tubeMpBalance.unclassifiedAnillasKg100 > 0) {
    blockers.push({
      code: "ANILLAS_YIELD_CLASS_MISSING",
      message:
        "Todos los productos de Anillas deben tener una clase técnica Polar, General o USA.",
    });
  }

  if (businessSummary.tubeMpBalance.tubeDifferenceKg100 !== 0) {
    blockers.push({
      code: "TUBE_MP_BALANCE_DIFFERENCE",
      message: `El balance principal del Tubo debe ser 0.00 kg; actualmente es ${kilograms(businessSummary.tubeMpBalance.tubeDifferenceKg100)}.`,
    });
  }

  for (const family of businessSummary.families) {
    if (family.status === "INTEGRITY_ERROR") {
      blockers.push({
        code: "FAMILY_YIELD_ABOVE_MAX",
        familyKey: family.key,
        message: `${family.label} no puede superar 100% de su materia prima asignada.`,
      });
    } else if (family.status === "BELOW_TARGET") {
      warnings.push({
        code: "FAMILY_BELOW_TARGET",
        familyKey: family.key,
        message: `${family.label} está por debajo de su objetivo de ${family.targetPercent?.toFixed(0)}%.`,
      });
    }
  }

  return {
    canClose: blockers.length === 0,
    blockers,
    warnings,
  };
}
