import type {
  ParsedFreezingWorkbook,
  ParsedFreezingWorkbookRow,
} from "./parseFreezingWorkbook";
import {
  isCatalogItemAllowedForProcess,
  type ProductionCatalogItem,
} from "./productionCatalog";
import { normalizeProductName } from "./productNormalizer";
import { parseSackPresentation } from "../model/sackPresentation";

export type FreezingExcelRowStatus =
  | "COINCIDENCIA EXACTA"
  | "COINCIDENCIA NORMALIZADA"
  | "ALIAS CONOCIDO"
  | "REQUIERE REVISIÓN";

export interface FreezingExcelPreviewRow extends ParsedFreezingWorkbookRow {
  product: ProductionCatalogItem | null;
  status: FreezingExcelRowStatus;
  matchReason?: string;
}

export interface FreezingExcelPreview extends Omit<
  ParsedFreezingWorkbook,
  "rows"
> {
  fileName: string;
  shift: "DAY" | "NIGHT";
  rows: readonly FreezingExcelPreviewRow[];
  recognizedRows: number;
  reviewRows: number;
  /** Advisory checks for the downstream SACO presentation. */
  presentationWarnings?: readonly string[];
  status: "EXCEL RECONCILIADO" | "EXCEL REQUIERE REVISIÓN";
}

const SUPPORTED_SACK_WEIGHTS_KG = new Set([20, 27, 30]);

function buildPresentationWarnings(
  rows: readonly ParsedFreezingWorkbookRow[],
): readonly string[] {
  return rows.flatMap((row) => {
    if (row.totalKg <= 0) return [];

    if (!row.packaging) {
      return [
        `Fila ${row.rowNumber}: la descripción no incluye presentación SACO. ` +
          "Verifica que corresponde a la descripción completa de Congelamiento.",
      ];
    }

    const presentation = parseSackPresentation(row.rawProductName, row.packaging);
    if (!presentation) {
      return [
        `Fila ${row.rowNumber}: no se pudo interpretar la presentación "${row.packaging}".`,
      ];
    }

    if (!SUPPORTED_SACK_WEIGHTS_KG.has(presentation.totalKg)) {
      return [
        `Fila ${row.rowNumber}: la presentación ${presentation.name} equivale a ` +
          `${presentation.totalKg} kg por saco y no está en las presentaciones autorizadas (20, 27 o 30 kg).`,
      ];
    }

    return [];
  });
}

export function isTreatmentOnlyProduct(
  product: ProductionCatalogItem,
): boolean {
  const productId = product.productId.toLowerCase();

  const productName = normalizeProductName(
    product.canonicalName ?? product.productName,
  );

  return (
    productId.includes("tratamiento") || productName.includes("EN TRATAMIENTO")
  );
}

export function comparableProductName(value: string): string {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

export function displayImportStatus(status: string): string {
  if (status === "COINCIDENCIA NORMALIZADA" || status === "ALIAS CONOCIDO") {
    return "COINCIDENCIA";
  }

  return status;
}

export function buildFreezingExcelPreview(
  parsed: ParsedFreezingWorkbook,
  fileName: string,
  shift: "DAY" | "NIGHT",
  catalogItems: readonly ProductionCatalogItem[],
): FreezingExcelPreview {
  const activeProducts = catalogItems.filter(
    (product) =>
      product.active !== false &&
      isCatalogItemAllowedForProcess(product, "FREEZING") &&
      !isTreatmentOnlyProduct(product),
  );

  const rows: FreezingExcelPreviewRow[] = parsed.rows.map((row) => {
    // A SACO presentation is part of the downstream identity. Matching only
    // the Envasado base name would select the first variant and lose its sack
    // composition (20, 27 or 30 kg).
    const sourceName = row.packaging ? row.rawProductName : row.baseProductName;
    const sourceExact = comparableProductName(sourceName);

    const exactMatches = activeProducts.filter((product) =>
      [product.productName, product.canonicalName ?? ""].some(
        (name) => comparableProductName(name) === sourceExact,
      ),
    );

    if (exactMatches.length === 1) {
      return {
        ...row,
        product: exactMatches[0]!,
        status: "COINCIDENCIA EXACTA",
        matchReason: row.packaging
          ? "La descripción completa y la presentación SACO coinciden con el catálogo."
          : "El nombre base coincide exactamente con el catálogo.",
      };
    }

    const sourceNormalized = normalizeProductName(sourceName);

    const normalizedMatches = activeProducts.filter((product) =>
      [product.productName, product.canonicalName ?? ""].some(
        (name) => normalizeProductName(name) === sourceNormalized,
      ),
    );

    if (normalizedMatches.length === 1) {
      return {
        ...row,
        product: normalizedMatches[0]!,
        status: "COINCIDENCIA NORMALIZADA",
        matchReason: "Coincidencia después de normalizar escritura y formato.",
      };
    }

    const aliasMatches = activeProducts.filter((product) =>
      (product.aliases ?? []).some(
        (alias) => normalizeProductName(alias) === sourceNormalized,
      ),
    );

    if (aliasMatches.length === 1) {
      return {
        ...row,
        product: aliasMatches[0]!,
        status: "ALIAS CONOCIDO",
        matchReason:
          "El nombre completo de Congelamiento ya está registrado como alias.",
      };
    }

    const ambiguous =
      exactMatches.length > 1 ||
      normalizedMatches.length > 1 ||
      aliasMatches.length > 1;

    return {
      ...row,
      product: null,
      status: "REQUIERE REVISIÓN",
      matchReason: ambiguous
        ? "Existen varios productos posibles en el catálogo."
        : "No se encontró un producto equivalente en el catálogo.",
    };
  });

  const productiveRows = rows.filter((row) => row.totalKg > 0);
  const presentationWarnings = buildPresentationWarnings(parsed.rows);

  const recognizedRows = productiveRows.filter(
    (row) => row.product !== null && row.status !== "REQUIERE REVISIÓN",
  ).length;

  const reviewRows = productiveRows.filter(
    (row) => row.status === "REQUIERE REVISIÓN",
  ).length;

  return {
    ...parsed,
    fileName,
    shift,
    rows,
    recognizedRows,
    reviewRows,
    presentationWarnings,
    status:
      parsed.reconciled && reviewRows === 0
        ? "EXCEL RECONCILIADO"
        : "EXCEL REQUIERE REVISIÓN",
  };
}
