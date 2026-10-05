import type { Workbook } from "exceljs";
import { formatIsoDate } from "../../../utils/formatters";
import { normalizeBalanceLots } from "../model/balanceLotNormalization";
import { kg100, sumKg100 } from "../model/calculations";
import { productIdsEquivalent } from "../model/productIdentity";
import type {
  ProductionDay,
  ProductionDayCalculation,
  ProductReconciliation,
} from "../model/types";
import {
  DETAIL_SHEET,
  FREEZING_ORIGIN_SHEET,
  SUMMARY_SHEET,
  kg,
  statusLabel,
  subtitle,
  writeObservations,
} from "./productionDayWorkbookShared";
import {
  KG_FORMAT,
  setupWorksheet,
  writeDataRow,
  writeMetric,
  writeSectionTitle,
  writeTableHeader,
  writeTitle,
  writeTotalsRow,
} from "./workbookStyles";

export function originDateOf(
  originDayId: string,
  productionDays: readonly ProductionDay[],
): string {
  return (
    productionDays.find((day) => day.id === originDayId)?.date ??
    originDayId.match(/\d{4}-\d{2}-\d{2}/)?.[0] ??
    originDayId
  );
}

export function writeFreezingWorkbook(
  workbook: Workbook,
  calculation: ProductionDayCalculation,
  productionDay: ProductionDay,
  productionDays: readonly ProductionDay[],
) {
  const lots = normalizeBalanceLots(productionDay.receivedBalanceLots);
  const usesOf = (lot: (typeof lots)[number], shift: "DAY" | "NIGHT") =>
    sumKg100(
      lot.uses
        .filter(
          (use) => use.targetDayId === productionDay.id && use.shift === shift,
        )
        .map((use) => use.kg100),
    );
  const linkedFor = (product: ProductReconciliation) =>
    sumKg100(
      lots
        .filter(
          (lot) =>
            lot.familyId === product.familyId &&
            productIdsEquivalent(lot.productId, product.productId),
        )
        .flatMap((lot) => [usesOf(lot, "DAY"), usesOf(lot, "NIGHT")]),
    );
  const physical = sumKg100([
    productionDay.declaredShiftTotalsKg100.DAY,
    productionDay.declaredShiftTotalsKg100.NIGHT,
  ]);
  const linked = sumKg100(calculation.products.map(linkedFor));
  const withoutOrigin = kg100(Math.max(physical - linked, 0));

  // --- Summary --------------------------------------------------------------
  const summary = setupWorksheet(
    workbook,
    SUMMARY_SHEET,
    [38, 20, 44, 18, 18, 18],
    "Jornada de Congelamiento cerrada",
  );
  writeTitle(
    summary,
    6,
    "TRABUNDA · PARTE DE CONGELAMIENTO",
    subtitle(productionDay, "Congelamiento"),
  );
  writeSectionTitle(summary, 5, 6, "INDICADORES CLAVE");
  writeMetric(
    summary,
    6,
    1,
    "Estado de la jornada",
    statusLabel(productionDay),
    {
      tone:
        (productionDay.closureObservations?.length ?? 0) > 0
          ? "warning"
          : "success",
    },
  );
  writeMetric(
    summary,
    7,
    1,
    "Congelado Turno Día",
    kg(productionDay.declaredShiftTotalsKg100.DAY),
    { format: KG_FORMAT },
  );
  writeMetric(
    summary,
    8,
    1,
    "Congelado Turno Noche",
    kg(productionDay.declaredShiftTotalsKg100.NIGHT),
    { format: KG_FORMAT },
  );
  writeMetric(
    summary,
    9,
    1,
    "= Congelado físico total",
    { formula: "B7+B8", result: kg(physical) },
    { format: KG_FORMAT },
  );
  writeMetric(summary, 10, 1, "Vinculado a Envasado (con origen)", kg(linked), {
    format: KG_FORMAT,
    hint: "Consumido de jornadas de Envasado por FIFO.",
  });
  writeMetric(
    summary,
    11,
    1,
    "Sin origen suficiente",
    { formula: "MAX(B9-B10,0)", result: kg(withoutOrigin) },
    {
      format: KG_FORMAT,
      tone: withoutOrigin === 0 ? "success" : "warning",
      hint: "Congelado físico que no tiene Envasado de origen vinculado.",
    },
  );
  const lastRow = writeObservations(summary, productionDay, 13, 6);
  summary.pageSetup.printArea = `A1:F${Math.max(lastRow, 11)}`;

  // --- Origin of the frozen product ----------------------------------------
  const origin = setupWorksheet(
    workbook,
    FREEZING_ORIGIN_SHEET,
    [34, 22, 56, 16, 16, 16],
    "Origen del congelado",
  );
  writeTitle(
    origin,
    6,
    "TRABUNDA · ORIGEN DEL CONGELADO",
    "Cada kilo congelado conserva su jornada de Envasado de origen (FIFO).",
  );
  writeTableHeader(origin, 5, [
    "Jornada de Envasado",
    "Familia",
    "Producto",
    "Congelado Día",
    "Congelado Noche",
    "Total",
  ]);
  const originRows = lots
    .map((lot) => ({
      lot,
      date: originDateOf(lot.originDayId, productionDays),
      day: usesOf(lot, "DAY"),
      night: usesOf(lot, "NIGHT"),
    }))
    .filter((entry) => entry.day !== 0 || entry.night !== 0)
    .sort((first, second) => first.date.localeCompare(second.date));
  originRows.forEach((entry, index) => {
    const current = 6 + index;
    const line = productionDay.lines.find(
      (candidate) =>
        candidate.familyId === entry.lot.familyId &&
        productIdsEquivalent(entry.lot.productId, candidate.productId),
    );
    writeDataRow(
      origin,
      current,
      [
        formatIsoDate(entry.date),
        line?.familyName ?? entry.lot.familyId,
        line?.productName ?? entry.lot.productId,
        kg(entry.day),
        kg(entry.night),
        {
          formula: `D${current}+E${current}`,
          result: kg(sumKg100([entry.day, entry.night])),
        },
      ],
      { textColumns: 3, zebra: index % 2 === 1 },
    );
  });
  writeTotalsRow(
    origin,
    6 + originRows.length,
    6,
    5 + originRows.length,
    4,
    6,
    "TOTAL",
    3,
  );
  origin.views = [{ state: "frozen", ySplit: 5, activeCell: "A6" }];

  // --- Detail by product ----------------------------------------------------
  const detail = setupWorksheet(
    workbook,
    DETAIL_SHEET,
    [22, 56, 16, 16, 16, 18, 18],
    "Detalle por producto",
  );
  writeTitle(
    detail,
    7,
    "TRABUNDA · DETALLE POR PRODUCTO",
    subtitle(productionDay, "Congelamiento"),
  );
  writeTableHeader(detail, 5, [
    "Familia",
    "Producto",
    "Congelado Día",
    "Congelado Noche",
    "Total congelado",
    "Vinculado a Envasado",
    "Sin origen",
  ]);
  calculation.products.forEach((product, index) => {
    const current = 6 + index;
    const productLinked = linkedFor(product);
    const total = sumKg100([
      product.day.reportedKg100,
      product.night.reportedKg100,
    ]);
    writeDataRow(
      detail,
      current,
      [
        product.familyName,
        product.productName,
        kg(product.day.reportedKg100),
        kg(product.night.reportedKg100),
        { formula: `C${current}+D${current}`, result: kg(total) },
        kg(productLinked),
        {
          formula: `MAX(E${current}-F${current},0)`,
          result: kg(kg100(Math.max(total - productLinked, 0))),
        },
      ],
      { textColumns: 2, zebra: index % 2 === 1 },
    );
  });
  const last = 5 + calculation.products.length;
  writeTotalsRow(detail, last + 1, 6, last, 3, 7, "TOTAL", 2);
  detail.views = [{ state: "frozen", xSplit: 2, ySplit: 5, activeCell: "C6" }];
  detail.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: last, column: 7 },
  };
}
