import { formatIsoDate } from "../../../utils/formatters";
import {
  calculateOutstandingBalances,
  calculateProductionDay,
  kg,
  kg100,
  sumKg100,
  toKilograms,
} from "../model/calculations";
import { calculateFreezingAvailability } from "../model/freezing";
import { productIdsEquivalent } from "../model/productIdentity";
import { calculateProductionBusinessSummary } from "../model/businessRules";
import {
  GENERAL_MIN_YIELD_BPS,
  NUCA_BIKINI_REFERENCE_BPS,
} from "../model/businessConfig";
import type {
  BalanceLot,
  Kg100,
  ProductionDay,
  ProductionDayCalculation,
  ProductionDayOperationMode,
  ProductionProcess,
  ProductionDayStatus,
  ShiftCode,
} from "../model/types";
import { getProductionProcess } from "../model/productionProcess";
import { isSundayIsoDate } from "../model/productionDayMode";
import {
  PRODUCTION_CATALOG_ITEMS,
  type ProductionCatalogItem,
} from "./productionCatalog";

export type CaptureSource = "MANUAL" | "EXCEL";
export type FinishedTotalMode = "DERIVED_FROM_REPORTS" | "IMPORTED_DECLARED";
export type ShiftAllocationMode = "EXPLICIT" | "RECONCILED_INFERENCE";

export interface ProductionCaptureRow {
  key: string;
  product: ProductionCatalogItem;
  dayReportedKg: string;
  dayPreviousBalanceKg: string;
  nightReportedKg: string;
  nightPreviousBalanceKg: string;
  tunnelDayKg: string;
  tunnelNightKg: string;
  treatmentKg: string;
  closingBalanceKg: string;
  /** Independent finished-product value read from Excel; manual capture derives it. */
  finishedKg: string;
}

export interface ProductionCaptureBalanceUse {
  key: string;
  originDayId: string;
  originDate: string;
  familyId: string;
  familyName: string;
  productId: string;
  productName: string;
  availableKg100: Kg100;
  dayKg: string;
  nightKg: string;
  /** Original ledger product key; retained when a legacy family-only balance is mapped. */
  sourceProductId?: string;
  /** Legacy balances cannot be closed until the operator selects the exact product. */
  requiresProductDistribution?: boolean;
}

export interface ImportedBalanceNotice {
  label: string;
  kg: number;
}

export interface ProductionCaptureDraft {
  date: string;
  process: ProductionProcess;
  source: CaptureSource;
  sourceSheet: string;
  finishedTotalMode: FinishedTotalMode;
  shiftAllocationMode: ShiftAllocationMode;
  operationMode: ProductionDayOperationMode;
  rawMaterialKg: string;
  declaredDayTotalKg: string;
  declaredNightTotalKg: string;
  declaredFinishedTotalKg: string;
  reproductorAllocationKg: string;
  hasTunnelProduction: boolean;
  nucaWashConfirmed: boolean;
  nucaWashReference: string;
  rows: readonly ProductionCaptureRow[];
  balanceUses: readonly ProductionCaptureBalanceUse[];
  importedBalances: readonly ImportedBalanceNotice[];
}

export interface CaptureBuildResult {
  productionDay: ProductionDay;
  calculation: ProductionDayCalculation;
  inputErrors: readonly string[];
}

const ZERO_KG100 = kg100(0);

export function hasSufficientCaptureData(
  draft: ProductionCaptureDraft,
): boolean {
  const hasRequiredTotals = [
    ...(draft.operationMode === "BALANCE_ONLY" || draft.process === "FREEZING"
      ? []
      : [draft.rawMaterialKg]),
    draft.declaredDayTotalKg,
    draft.declaredNightTotalKg,
  ].every((value) => value.trim() !== "");
  const hasCompleteRows =
    draft.rows.length > 0 &&
    draft.rows.every(
      (row) =>
        draft.shiftAllocationMode === "RECONCILED_INFERENCE" ||
        (row.dayReportedKg.trim() !== "" && row.nightReportedKg.trim() !== ""),
    );

  return (
    /^\d{4}-\d{2}-\d{2}$/.test(draft.date) &&
    hasRequiredTotals &&
    hasCompleteRows
  );
}

function parseQuantity(value: string, label: string, errors: string[]): Kg100 {
  const normalized = value.trim().replace(",", ".");
  const quantity = normalized === "" ? 0 : Number(normalized);

  if (!Number.isFinite(quantity) || quantity < 0) {
    errors.push(`${label} debe ser una cantidad válida mayor o igual a cero.`);
    return kg100(0);
  }

  try {
    return kg(quantity);
  } catch {
    errors.push(`${label} admite como máximo dos decimales.`);
    return kg100(0);
  }
}

function formatDisplayName(date: string): string {
  const [, month, day] = date.split("-");
  const weekday = formatIsoDate(date).split(",")[0] ?? formatIsoDate(date);
  return `${weekday} ${day}/${month}/${date.slice(0, 4)}`;
}

function getInferredReports(
  rows: readonly ProductionCaptureRow[],
  declaredDayKg100: Kg100,
  quantityFor: (value: string, label: string) => Kg100,
): ReadonlyMap<string, Readonly<Record<ShiftCode, Kg100>>> {
  let remainingDay = declaredDayKg100;
  const allocation = new Map<string, Readonly<Record<ShiftCode, Kg100>>>();

  for (const row of rows) {
    const finished = quantityFor(
      row.finishedKg,
      `${row.product.productName}: producto terminado`,
    );
    const treatment = quantityFor(
      row.treatmentKg,
      `${row.product.productName}: tratamiento`,
    );
    const tunnelDay = quantityFor(
      row.tunnelDayKg,
      `${row.product.productName}: Túnel Día`,
    );
    const tunnelNight = quantityFor(
      row.tunnelNightKg,
      `${row.product.productName}: Túnel Noche`,
    );
    const closingBalance = quantityFor(
      row.closingBalanceKg,
      `${row.product.productName}: saldo final`,
    );
    const previousDay = quantityFor(
      row.dayPreviousBalanceKg,
      `${row.product.productName}: saldo anterior Día`,
    );
    const previousNight = quantityFor(
      row.nightPreviousBalanceKg,
      `${row.product.productName}: saldo anterior Noche`,
    );
    const physicalTotal = kg100(
      Math.max(
        finished -
          tunnelDay -
          tunnelNight -
          treatment -
          closingBalance +
          previousDay +
          previousNight,
        0,
      ),
    );
    const day = kg100(Math.min(physicalTotal, Math.max(remainingDay, 0)));
    const night = kg100(physicalTotal - day);
    remainingDay = kg100(remainingDay - day);
    allocation.set(row.key, { DAY: day, NIGHT: night });
  }

  return allocation;
}

function deduplicateBalanceLots(
  lots: readonly BalanceLot[],
): readonly BalanceLot[] {
  const lotsById = new Map<string, BalanceLot>();

  for (const lot of lots) {
    const existingLot = lotsById.get(lot.id);

    if (!existingLot) {
      lotsById.set(lot.id, {
        ...lot,
        uses: [...lot.uses],
      });

      continue;
    }

    const usesById = new Map(existingLot.uses.map((use) => [use.id, use]));

    for (const use of lot.uses) {
      const existingUse = usesById.get(use.id);

      if (!existingUse || use.kg100 > existingUse.kg100) {
        usesById.set(use.id, use);
      }
    }

    const sourceProductId = existingLot.sourceProductId ?? lot.sourceProductId;

    lotsById.set(lot.id, {
      ...existingLot,

      originalKg100: kg100(
        Math.max(existingLot.originalKg100, lot.originalKg100),
      ),

      ...(sourceProductId ? { sourceProductId } : {}),

      uses: [...usesById.values()],
    });
  }

  return [...lotsById.values()];
}

function buildReceivedBalanceLots(
  dayId: string,
  process: ProductionProcess,
  balanceUses: readonly ProductionCaptureBalanceUse[],
  previousDays: readonly ProductionDay[],
  subsequentLots: readonly BalanceLot[],
  quantityFor: (value: string, label: string) => Kg100,
  errors: string[],
): readonly BalanceLot[] {
  const positions = (
    process === "FREEZING"
      ? calculateFreezingAvailability(previousDays)
      : calculateOutstandingBalances(previousDays, subsequentLots)
  ).filter((position) => position.pendingKg100 > 0);

  const lots = balanceUses.map((selection) => {
    const sourceProductId = selection.sourceProductId ?? selection.productId;
    const position = positions.find(
      (candidate) =>
        candidate.originDayId === selection.originDayId &&
        candidate.familyId === selection.familyId &&
        productIdsEquivalent(candidate.productId, sourceProductId),
    );
    const availableKg100 = position?.pendingKg100 ?? ZERO_KG100;
    const dayKg100 = quantityFor(
      selection.dayKg,
      `${selection.productName}: saldo anterior procesado en Día`,
    );
    const nightKg100 = quantityFor(
      selection.nightKg,
      `${selection.productName}: saldo anterior procesado en Noche`,
    );

    if (!position) {
      errors.push(
        `El saldo de ${selection.productName} ya no está disponible o no tiene un origen válido.`,
      );
    }
    if (selection.requiresProductDistribution) {
      errors.push(
        `El saldo de ${selection.familyName} requiere distribución. Selecciona el producto exacto antes de cerrar.`,
      );
    }

    const uses = [
      dayKg100 > 0
        ? {
            id: `balance-use-${dayId}-${selection.originDayId}-${selection.productId}-DAY`,
            targetDayId: dayId,
            shift: "DAY" as const,
            kg100: dayKg100,
          }
        : null,
      nightKg100 > 0
        ? {
            id: `balance-use-${dayId}-${selection.originDayId}-${selection.productId}-NIGHT`,
            targetDayId: dayId,
            shift: "NIGHT" as const,
            kg100: nightKg100,
          }
        : null,
    ].filter((use): use is NonNullable<typeof use> => use !== null);

    return {
      id: `balance-lot-${dayId}-${selection.originDayId}-${selection.productId}`,
      process,
      originDayId: selection.originDayId,
      familyId: selection.familyId,
      productId: selection.productId,

      ...(sourceProductId !== selection.productId ? { sourceProductId } : {}),

      originalKg100: availableKg100,
      uses,
    };
  });

  return deduplicateBalanceLots(lots);
}

export function createEmptyCaptureDraft(
  date: string,
  process: ProductionProcess = "PACKING",
): ProductionCaptureDraft {
  const operationMode: ProductionDayOperationMode = isSundayIsoDate(date)
    ? "BALANCE_ONLY"
    : "NORMAL";

  return {
    date,
    process,
    source: "MANUAL",
    sourceSheet: "CAPTURA WEB",
    finishedTotalMode: "DERIVED_FROM_REPORTS",
    shiftAllocationMode: "EXPLICIT",
    operationMode,
    rawMaterialKg:
      operationMode === "BALANCE_ONLY" || process === "FREEZING" ? "0" : "",
    declaredDayTotalKg: "",
    declaredNightTotalKg: "",
    declaredFinishedTotalKg: "",
    reproductorAllocationKg: "",
    hasTunnelProduction: false,
    nucaWashConfirmed: false,
    nucaWashReference: "",
    rows: [],
    balanceUses: [],
    importedBalances: [],
  };
}

export function createCaptureDraftFromDay(
  productionDay: ProductionDay,
  allProductionDays: readonly ProductionDay[] = [],
): ProductionCaptureDraft {
  const calculation = calculateProductionDay(productionDay);

  return {
    date: productionDay.date,
    process: getProductionProcess(productionDay),
    source:
      productionDay.lines.at(0)?.source.sheet === "CAPTURA WEB"
        ? "MANUAL"
        : "EXCEL",
    sourceSheet: productionDay.lines.at(0)?.source.sheet ?? "CAPTURA WEB",
    finishedTotalMode: "DERIVED_FROM_REPORTS",
    shiftAllocationMode:
      productionDay.lines.at(0)?.shiftBreakdownConfidence === "EXPLICIT"
        ? "EXPLICIT"
        : "RECONCILED_INFERENCE",
    operationMode: productionDay.operationMode ?? "NORMAL",
    rawMaterialKg: String(toKilograms(productionDay.declaredRawMaterialKg100)),
    declaredDayTotalKg: String(
      toKilograms(productionDay.declaredShiftTotalsKg100.DAY),
    ),
    declaredNightTotalKg: String(
      toKilograms(productionDay.declaredShiftTotalsKg100.NIGHT),
    ),
    declaredFinishedTotalKg: String(
      toKilograms(productionDay.declaredFinishedTotalKg100),
    ),
    reproductorAllocationKg: String(
      toKilograms(
        productionDay.rawMaterialAllocationOverridesKg100.REPRODUCTOR ??
          kg100(0),
      ),
    ),
    hasTunnelProduction:
      productionDay.hasTunnelProduction ??
      productionDay.lines.some(
        (line) =>
          (line.tunnelShifts?.DAY.reportedKg100 ?? ZERO_KG100) > 0 ||
          (line.tunnelShifts?.NIGHT.reportedKg100 ?? ZERO_KG100) > 0,
      ),
    nucaWashConfirmed: productionDay.nucaWashAuthorization !== null,
    nucaWashReference: productionDay.nucaWashAuthorization?.reference ?? "",
    rows: productionDay.lines.map((line, index) => {
      const product = calculation.products[index]!;
      return {
        key: `${line.productId}-${index}`,
        product: {
          familyId: line.familyId,
          familyName: line.familyName,
          productId: line.productId,
          productName: line.productName,
          summaryGroupId: line.summaryGroupId,
        },
        dayReportedKg: String(toKilograms(line.shifts.DAY.reportedKg100)),
        dayPreviousBalanceKg: String(
          toKilograms(product.day.previousBalanceProcessedKg100),
        ),
        nightReportedKg: String(toKilograms(line.shifts.NIGHT.reportedKg100)),
        nightPreviousBalanceKg: String(
          toKilograms(product.night.previousBalanceProcessedKg100),
        ),
        tunnelDayKg: String(
          toKilograms(line.tunnelShifts?.DAY.reportedKg100 ?? ZERO_KG100),
        ),
        tunnelNightKg: String(
          toKilograms(line.tunnelShifts?.NIGHT.reportedKg100 ?? ZERO_KG100),
        ),
        treatmentKg: String(toKilograms(line.treatmentKg100)),
        closingBalanceKg: String(toKilograms(line.newClosingBalanceKg100)),
        finishedKg: String(toKilograms(line.declaredFinishedKg100)),
      };
    }),
    balanceUses: deduplicateBalanceLots(productionDay.receivedBalanceLots).map(
      (lot, index) => {
        const product = productionDay.lines.find(
          (line) => line.productId === lot.productId,
        );
        const catalogProduct = PRODUCTION_CATALOG_ITEMS.find(
          (candidate) => candidate.productId === lot.productId,
        );
        const requiresProductDistribution = !catalogProduct && !product;
        const originDay = allProductionDays.find(
          (day) => day.id === lot.originDayId,
        );
        const processedDayKg100 = sumKg100(
          lot.uses
            .filter(
              (use) =>
                use.targetDayId === productionDay.id && use.shift === "DAY",
            )
            .map((use) => use.kg100),
        );
        const processedNightKg100 = sumKg100(
          lot.uses
            .filter(
              (use) =>
                use.targetDayId === productionDay.id && use.shift === "NIGHT",
            )
            .map((use) => use.kg100),
        );

        return {
          key: `balance-${lot.id}-${index}`,
          originDayId: lot.originDayId,
          originDate: originDay?.date ?? "",
          familyId: lot.familyId,
          familyName: product?.familyName ?? lot.familyId,
          productId: lot.productId,
          productName:
            product?.productName ??
            catalogProduct?.productName ??
            "Producto exacto no identificado",
          availableKg100: lot.originalKg100,
          dayKg: String(toKilograms(processedDayKg100)),
          nightKg: String(toKilograms(processedNightKg100)),
          sourceProductId: lot.sourceProductId ?? lot.productId,
          requiresProductDistribution,
        };
      },
    ),
    importedBalances: [],
  };
}

export function buildProductionDayFromCapture(
  draft: ProductionCaptureDraft,
  allProductionDays: readonly ProductionDay[],
  subsequentLots: readonly BalanceLot[],
  status: ProductionDayStatus = "DRAFT",
): CaptureBuildResult {
  const errors: string[] = [];
  const operationMode: ProductionDayOperationMode =
    isSundayIsoDate(draft.date) && draft.operationMode === "BALANCE_ONLY"
      ? "BALANCE_ONLY"
      : "NORMAL";
  const isBalanceOnly = operationMode === "BALANCE_ONLY";
  const isFreezing = draft.process === "FREEZING";
  const usesExternalAvailability = isBalanceOnly || isFreezing;
  const keepsImportedFinishedTotals =
    draft.finishedTotalMode === "IMPORTED_DECLARED" &&
    !usesExternalAvailability;
  const quantityFor = (value: string, label: string) =>
    parseQuantity(value, label, errors);
  const rawMaterial = usesExternalAvailability
    ? ZERO_KG100
    : quantityFor(draft.rawMaterialKg, "Materia prima");
  const declaredDay = quantityFor(
    draft.declaredDayTotalKg,
    "Total del turno Día",
  );
  const declaredNight = quantityFor(
    draft.declaredNightTotalKg,
    "Total del turno Noche",
  );

  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
    errors.push("Selecciona una fecha válida para la jornada.");
  }
  const duplicateProducts = new Set<string>();
  const seenProducts = new Set<string>();
  for (const row of draft.rows) {
    if (seenProducts.has(row.product.productId)) {
      duplicateProducts.add(row.product.productName);
    }
    seenProducts.add(row.product.productId);
  }
  if (duplicateProducts.size > 0) {
    errors.push(
      `Hay productos duplicados: ${[...duplicateProducts].join(", ")}.`,
    );
  }

  const dayId =
    draft.process === "PACKING"
      ? `production-day-${draft.date}`
      : `production-day-freezing-${draft.date}`;
  const previousDays = allProductionDays.filter((day) =>
    draft.process === "FREEZING"
      ? day.date <= draft.date
      : day.date < draft.date,
  );
  const receivedBalanceLots = buildReceivedBalanceLots(
    dayId,
    draft.process,
    draft.balanceUses,
    previousDays,
    subsequentLots,
    quantityFor,
    errors,
  );
  const inferredReports =
    draft.shiftAllocationMode === "RECONCILED_INFERENCE"
      ? getInferredReports(draft.rows, declaredDay, quantityFor)
      : new Map<string, Readonly<Record<ShiftCode, Kg100>>>();

  const preliminaryLines = draft.rows.map((row, index) => {
    const inferred = inferredReports.get(row.key);
    return {
      familyId: row.product.familyId,
      familyName: row.product.familyName,
      productId: row.product.productId,
      productName: row.product.productName,
      summaryGroupId: row.product.summaryGroupId,
      source: {
        sheet: draft.sourceSheet,
        cell: draft.source === "EXCEL" ? `B${index + 1}` : `WEB-${index + 1}`,
      },
      shiftBreakdownConfidence:
        draft.shiftAllocationMode === "EXPLICIT"
          ? ("EXPLICIT" as const)
          : ("RECONCILED_INFERENCE" as const),
      shifts: {
        DAY: {
          reportedKg100:
            inferred?.DAY ??
            quantityFor(
              row.dayReportedKg,
              `${row.product.productName}: reporte Día`,
            ),
          adjustments: [],
        },
        NIGHT: {
          reportedKg100:
            inferred?.NIGHT ??
            quantityFor(
              row.nightReportedKg,
              `${row.product.productName}: reporte Noche`,
            ),
          adjustments: [],
        },
      },
      tunnelShifts: {
        DAY: {
          reportedKg100: usesExternalAvailability
            ? ZERO_KG100
            : quantityFor(
                row.tunnelDayKg,
                `${row.product.productName}: Túnel Día`,
              ),
          adjustments: [],
        },
        NIGHT: {
          reportedKg100: usesExternalAvailability
            ? ZERO_KG100
            : quantityFor(
                row.tunnelNightKg,
                `${row.product.productName}: Túnel Noche`,
              ),
          adjustments: [],
        },
      },
      treatmentKg100: usesExternalAvailability
        ? ZERO_KG100
        : quantityFor(
            row.treatmentKg,
            `${row.product.productName}: tratamiento`,
          ),
      newClosingBalanceKg100: usesExternalAvailability
        ? ZERO_KG100
        : quantityFor(
            row.closingBalanceKg,
            `${row.product.productName}: saldo final`,
          ),
      declaredFinishedKg100: keepsImportedFinishedTotals
        ? quantityFor(
            row.finishedKg,
            `${row.product.productName}: producto terminado de origen`,
          )
        : ZERO_KG100,
    };
  });

  const preliminaryDay: ProductionDay = {
    id: dayId,
    date: draft.date,
    displayName: formatDisplayName(draft.date),
    status,
    captureRequiredDataComplete: hasSufficientCaptureData(draft),
    process: draft.process,
    operationMode,
    rawMaterialEntries: usesExternalAvailability
      ? []
      : [
          {
            id: `raw-material-${draft.date}-1`,
            kg100: rawMaterial,
            shift: null,
          },
        ],
    declaredRawMaterialKg100: rawMaterial,
    declaredShiftTotalsKg100: { DAY: declaredDay, NIGHT: declaredNight },
    declaredFinishedTotalKg100: keepsImportedFinishedTotals
      ? quantityFor(
          draft.declaredFinishedTotalKg,
          "Total de producto terminado de origen",
        )
      : ZERO_KG100,
    hasTunnelProduction: usesExternalAvailability
      ? false
      : draft.hasTunnelProduction,
    lines: preliminaryLines,
    receivedBalanceLots,
    nucaWashAuthorization: draft.nucaWashConfirmed
      ? {
          kind: "USER_CONFIRMED_ORDER",
          reference: draft.nucaWashReference.trim() || null,
          reason: "Pedido de lavado confirmado durante la captura web.",
        }
      : null,
    performanceReferenceBasisPoints: GENERAL_MIN_YIELD_BPS,
    nucaBikiniReferenceBasisPoints: NUCA_BIKINI_REFERENCE_BPS,
    rawMaterialAllocationOverridesKg100: {},
  };
  const preliminaryCalculation = calculateProductionDay(preliminaryDay);
  const lines = keepsImportedFinishedTotals
    ? preliminaryLines
    : preliminaryLines.map((line, index) => ({
        ...line,
        declaredFinishedKg100:
          preliminaryCalculation.products[index]?.expectedFinishedKg100 ??
          ZERO_KG100,
      }));
  const calculatedFinishedKg100 = sumKg100(
    lines.map((line) => line.declaredFinishedKg100),
  );
  const dayWithCalculatedFinished: ProductionDay = {
    ...preliminaryDay,
    lines,
    declaredFinishedTotalKg100: keepsImportedFinishedTotals
      ? preliminaryDay.declaredFinishedTotalKg100
      : calculatedFinishedKg100,
  };
  const initialCalculation = calculateProductionDay(dayWithCalculatedFinished);
  const automaticReproductorAllocationKg100 =
    calculateProductionBusinessSummary(
      dayWithCalculatedFinished,
      initialCalculation,
    ).rejoReproductor.reproductorRawMaterialKg100;
  const productionDay: ProductionDay = {
    ...dayWithCalculatedFinished,
    rawMaterialAllocationOverridesKg100:
      !usesExternalAvailability && automaticReproductorAllocationKg100 > 0
        ? { REPRODUCTOR: automaticReproductorAllocationKg100 }
        : {},
  };
  const calculation = calculateProductionDay(productionDay);

  return {
    productionDay,
    calculation,
    inputErrors: [...new Set(errors)],
  };
}

export function sumImportedBalances(
  balances: readonly ImportedBalanceNotice[],
): Kg100 {
  return sumKg100(balances.map((balance) => kg(balance.kg)));
}
