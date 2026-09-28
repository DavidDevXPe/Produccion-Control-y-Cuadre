import type {
  ParsedFreezingWorkbook,
  ParsedFreezingWorkbookRow,
} from "./parseFreezingWorkbook";
import type { ProductionCatalogItem } from "./productionCatalog";
import { normalizeProductName } from "./productNormalizer";

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
  status: "EXCEL RECONCILIADO" | "EXCEL REQUIERE REVISIÓN";
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
    (product) => product.active !== false && !isTreatmentOnlyProduct(product),
  );

  const rows: FreezingExcelPreviewRow[] = parsed.rows.map((row) => {
    const sourceExact = comparableProductName(row.baseProductName);

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
        matchReason: "El nombre base coincide exactamente con el catálogo.",
      };
    }

    const sourceNormalized = normalizeProductName(row.baseProductName);

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
          "El nombre de Congelamiento ya está registrado como alias.",
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
    status:
      parsed.reconciled && reviewRows === 0
        ? "EXCEL RECONCILIADO"
        : "EXCEL REQUIERE REVISIÓN",
  };
}
