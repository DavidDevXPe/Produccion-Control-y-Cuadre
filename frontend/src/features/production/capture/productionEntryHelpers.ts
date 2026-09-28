import { formatCentiKg } from "../../../utils/formatters";
import { kg100, sumKg100 } from "../model/calculations";
import {
  CAPTURE_CATALOG_ITEMS,
  PRODUCTION_CATALOG_ITEMS,
} from "./productionCatalog";
import type {
  ProductionCaptureBalanceUse,
  ProductionCaptureDraft,
  ProductionCaptureRow,
} from "./productionCapture";

export type CaptureMode = "MANUAL" | "EXCEL";

export function createRow(
  productId: string,
  index: number,
): ProductionCaptureRow | null {
  const product =
    CAPTURE_CATALOG_ITEMS.find((item) => item.productId === productId) ??
    PRODUCTION_CATALOG_ITEMS.find((item) => item.productId === productId);
  if (!product) return null;

  return {
    key: `manual-${product.productId}-${Date.now()}-${index}`,
    product,
    dayReportedKg: "",
    dayPreviousBalanceKg: "0",
    nightReportedKg: "",
    nightPreviousBalanceKg: "0",
    tunnelDayKg: "0",
    tunnelNightKg: "0",
    treatmentKg: "0",
    closingBalanceKg: "0",
    finishedKg: "",
  };
}

export function shiftDifferenceMessage(
  label: "Día" | "Noche",
  differenceKg100: ReturnType<typeof kg100>,
) {
  if (differenceKg100 === 0) return `Turno ${label} conciliado.`;
  if (differenceKg100 > 0) {
    return `Faltan ${formatCentiKg(differenceKg100)} por registrar en Turno ${label}.`;
  }
  return `Sobran ${formatCentiKg(kg100(-differenceKg100))} en el detalle del Turno ${label}.`;
}

export function captureQuantityKg100(value: string) {
  const quantity = Number(value.trim().replace(",", "."));
  return Number.isFinite(quantity) && quantity >= 0
    ? kg100(Math.round(quantity * 100))
    : kg100(0);
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);

  const date = new Date(Date.UTC(year!, month! - 1, day!));

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export function isCaptureDraftEmpty(draft: ProductionCaptureDraft): boolean {
  return (
    draft.source === "MANUAL" &&
    draft.declaredDayTotalKg.trim() === "" &&
    draft.declaredNightTotalKg.trim() === "" &&
    (draft.rawMaterialKg.trim() === "" || draft.rawMaterialKg === "0") &&
    draft.rows.length === 0 &&
    draft.balanceUses.length === 0 &&
    draft.importedBalances.length === 0 &&
    !draft.hasTunnelProduction &&
    !draft.nucaWashConfirmed
  );
}

export function captureBalancePosition(balance: ProductionCaptureBalanceUse) {
  const dayKg100 = captureQuantityKg100(balance.dayKg);
  const nightKg100 = captureQuantityKg100(balance.nightKg);
  const processedKg100 = sumKg100([dayKg100, nightKg100]);

  return {
    processedKg100,
    pendingKg100: kg100(Math.max(balance.availableKg100 - processedKg100, 0)),
    overusedKg100: kg100(Math.max(processedKg100 - balance.availableKg100, 0)),
  };
}

export function captureProductAvailability(
  draft: ProductionCaptureDraft,
  productId: string,
) {
  const balances = draft.balanceUses.filter(
    (balance) => balance.productId === productId,
  );
  const availableKg100 = sumKg100(
    balances.map((balance) => balance.availableKg100),
  );
  const frozenKg100 = sumKg100(
    balances.flatMap((balance) => [
      captureQuantityKg100(balance.dayKg),
      captureQuantityKg100(balance.nightKg),
    ]),
  );

  return {
    availableKg100,
    frozenKg100,
    pendingKg100: kg100(Math.max(availableKg100 - frozenKg100, 0)),
  };
}
