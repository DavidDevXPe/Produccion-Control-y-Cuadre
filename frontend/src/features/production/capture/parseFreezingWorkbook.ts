import { Workbook, type CellValue, type Worksheet } from "exceljs";

export interface ParsedFreezingWorkbookRow {
  rowNumber: number;
  rawProductName: string;
  baseProductName: string;
  packaging: string | null;
  quantityAros: number;
  totalKg: number;
}

export interface ParsedFreezingWorkbook {
  sheetName: string;
  rows: readonly ParsedFreezingWorkbookRow[];
  totalAros: number;
  totalKg: number;
  sourceGrandTotalAros: number | null;
  sourceGrandTotalKg: number | null;
  reconciled: boolean;
  warnings: readonly string[];
}

interface FreezingColumns {
  headerRow: number;
  productColumn: number;
  quantityColumn: number;
}

function getFormulaResult(value: CellValue): unknown {
  if (value && typeof value === "object" && "result" in value) {
    return value.result;
  }

  return value;
}

function cellText(value: CellValue): string {
  const resolved = getFormulaResult(value);

  if (resolved === null || resolved === undefined) {
    return "";
  }

  if (typeof resolved === "string") {
    return resolved.trim();
  }

  if (typeof resolved === "number") {
    return String(resolved);
  }

  if (resolved instanceof Date) {
    return resolved.toISOString();
  }

  if (typeof resolved === "object" && "text" in resolved) {
    return String((resolved as { text?: unknown }).text ?? "").trim();
  }

  return String(resolved).trim();
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\t/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeHeader(value: string): string {
  return normalizeWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function parseExcelNumber(value: CellValue): number | null {
  const resolved = getFormulaResult(value);

  if (typeof resolved === "number" && Number.isFinite(resolved)) {
    return resolved;
  }

  const text = cellText(value);

  if (!text) {
    return null;
  }

  const compact = text.replace(/\s/g, "").replace(/,/g, "");

  const numeric = Number(compact);

  return Number.isFinite(numeric) ? numeric : null;
}

/**
 * Los reportes de Congelamiento agregan una presentación
 * logística al final del nombre.
 *
 * Ejemplos:
 *
 * "... 100% P.N. - SACO 2 x 10 kg"
 * "... 100% P.N. - SACO 3 x 9 kg"
 * "... 100% P.N. - SACO 3 x 10 kg"
 *
 * La presentación NO cambia la identidad canónica del producto.
 */
export function splitFreezingProductName(rawValue: string): {
  baseProductName: string;
  packaging: string | null;
} {
  const value = normalizeWhitespace(rawValue);

  const match = value.match(/\s*-\s*(SACO\s+\d+\s*[xX×]\s*\d+\s*kg)\s*$/i);

  if (!match) {
    return {
      baseProductName: value,
      packaging: null,
    };
  }

  const packaging = normalizeWhitespace(match[1] ?? "");

  const baseProductName = normalizeWhitespace(
    value.slice(0, match.index ?? value.length),
  );

  return {
    baseProductName,
    packaging,
  };
}

function detectColumns(worksheet: Worksheet): FreezingColumns | null {
  const maxRows = Math.min(worksheet.rowCount, 20);

  for (let rowNumber = 1; rowNumber <= maxRows; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);

    let productColumn: number | null = null;
    let quantityColumn: number | null = null;

    row.eachCell((cell, columnNumber) => {
      const header = normalizeHeader(cellText(cell.value));

      if (header.includes("PRODUCTO")) {
        productColumn = columnNumber;
      }

      if (
        header === "CANTIDAD" ||
        header.includes("CANTIDAD (SUMA)") ||
        header.includes("CANTIDAD SUMA")
      ) {
        quantityColumn = columnNumber;
      }
    });

    if (productColumn !== null && quantityColumn !== null) {
      return {
        headerRow: rowNumber,
        productColumn,
        quantityColumn,
      };
    }
  }

  return null;
}

function isFooterRow(productName: string): boolean {
  const normalized = normalizeHeader(productName);

  return (
    normalized === "TOTAL GENERAL" || normalized.startsWith("TOTAL GENERAL ")
  );
}

function parseFreezingWorksheet(worksheet: Worksheet): ParsedFreezingWorkbook {
  const columns = detectColumns(worksheet);

  if (!columns) {
    throw new Error(
      'ARCHIVO NO COMPATIBLE. No se encontraron las columnas "Producto (Descripción)" y "Cantidad (suma)".',
    );
  }

  const rows: ParsedFreezingWorkbookRow[] = [];
  const warnings: string[] = [];

  let sourceGrandTotalAros: number | null = null;

  for (
    let rowNumber = columns.headerRow + 1;
    rowNumber <= worksheet.rowCount;
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);

    const rawProductName = normalizeWhitespace(
      cellText(row.getCell(columns.productColumn).value),
    );

    if (!rawProductName) {
      continue;
    }

    const quantityAros = parseExcelNumber(
      row.getCell(columns.quantityColumn).value,
    );

    if (isFooterRow(rawProductName)) {
      sourceGrandTotalAros = quantityAros;

      continue;
    }

    if (quantityAros === null || quantityAros < 0) {
      warnings.push(`Fila ${rowNumber}: cantidad de aros inválida.`);

      continue;
    }

    const { baseProductName, packaging } =
      splitFreezingProductName(rawProductName);

    /**
     * REGLA OPERATIVA CONFIRMADA:
     *
     * Congelamiento reporta cantidad de aros.
     *
     * 1 aro = 10 kg.
     *
     * NO se calcula el peso desde:
     *
     * SACO 2 x 10 kg
     * SACO 3 x 9 kg
     * SACO 3 x 10 kg
     *
     * Esos textos representan presentación logística.
     */
    const totalKg = quantityAros * 10;

    rows.push({
      rowNumber,
      rawProductName,
      baseProductName,
      packaging,
      quantityAros,
      totalKg,
    });
  }

  if (rows.length === 0) {
    throw new Error(
      "No se encontraron productos válidos en el reporte de Congelamiento.",
    );
  }

  const totalAros = rows.reduce((sum, row) => sum + row.quantityAros, 0);

  const totalKg = totalAros * 10;

  const sourceGrandTotalKg =
    sourceGrandTotalAros === null ? null : sourceGrandTotalAros * 10;

  const reconciled =
    sourceGrandTotalAros === null ||
    Math.abs(sourceGrandTotalAros - totalAros) <= 0.01;

  if (!reconciled) {
    warnings.push(
      `El total general del archivo es ${
        sourceGrandTotalAros?.toLocaleString("es-PE") ?? "—"
      } aros, pero la suma de productos es ${totalAros.toLocaleString(
        "es-PE",
      )} aros.`,
    );
  }

  return {
    sheetName: worksheet.name,
    rows,
    totalAros,
    totalKg,
    sourceGrandTotalAros,
    sourceGrandTotalKg,
    reconciled,
    warnings,
  };
}

export async function parseFreezingWorkbook(
  file: ArrayBuffer,
): Promise<ParsedFreezingWorkbook> {
  const workbook = new Workbook();

  await workbook.xlsx.load(file);

  const worksheet = workbook.getWorksheet("Reporte") ?? workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("El archivo no contiene ninguna hoja.");
  }

  return parseFreezingWorksheet(worksheet);
}
