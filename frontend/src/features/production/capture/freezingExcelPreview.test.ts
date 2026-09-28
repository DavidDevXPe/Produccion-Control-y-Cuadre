import { describe, expect, it } from "vitest";
import type { ParsedFreezingWorkbook } from "./parseFreezingWorkbook";
import type { ProductionCatalogItem } from "./productionCatalog";
import {
  buildFreezingExcelPreview,
  comparableProductName,
  displayImportStatus,
  isTreatmentOnlyProduct,
} from "./freezingExcelPreview";

describe("freezingExcelPreview", () => {
  it("identifies treatment-only products", () => {
    const treatmentItem: ProductionCatalogItem = {
      productId: "p-tubo-tratamiento",
      productName: "TUBO EN TRATAMIENTO",
      familyName: "TUBO",
      familyId: "tubo",
      summaryGroupId: "MANTO",
    };
    const normalItem: ProductionCatalogItem = {
      productId: "p-tubo-limpio",
      productName: "TUBO LIMPIO",
      familyName: "TUBO",
      familyId: "tubo",
      summaryGroupId: "MANTO",
    };

    expect(isTreatmentOnlyProduct(treatmentItem)).toBe(true);
    expect(isTreatmentOnlyProduct(normalItem)).toBe(false);
  });

  it("formats display status", () => {
    expect(displayImportStatus("COINCIDENCIA EXACTA")).toBe(
      "COINCIDENCIA EXACTA",
    );
    expect(displayImportStatus("COINCIDENCIA NORMALIZADA")).toBe(
      "COINCIDENCIA",
    );
    expect(displayImportStatus("ALIAS CONOCIDO")).toBe("COINCIDENCIA");
    expect(displayImportStatus("REQUIERE REVISIÓN")).toBe("REQUIERE REVISIÓN");
  });

  it("normalizes comparable product name", () => {
    expect(comparableProductName("  aleta   congelada  ")).toBe(
      "ALETA CONGELADA",
    );
  });

  it("matches exact and alias products in freezing preview", () => {
    const catalog: ProductionCatalogItem[] = [
      {
        productId: "aleta-fresca",
        productName: "ALETA FRESCA",
        familyName: "ALETA",
        familyId: "aleta",
        summaryGroupId: "ALETA",
        aliases: ["ALETA RAW"],
      },
    ];

    const parsed: ParsedFreezingWorkbook = {
      sheetName: "Reporte",
      reconciled: true,
      totalAros: 10,
      totalKg: 100,
      sourceGrandTotalAros: null,
      sourceGrandTotalKg: null,
      warnings: [],
      rows: [
        {
          rowNumber: 1,
          rawProductName: "ALETA FRESCA",
          baseProductName: "ALETA FRESCA",
          packaging: null,
          quantityAros: 5,
          totalKg: 50,
        },
        {
          rowNumber: 2,
          rawProductName: "Aleta Raw",
          baseProductName: "Aleta Raw",
          packaging: null,
          quantityAros: 5,
          totalKg: 50,
        },
      ],
    };

    const preview = buildFreezingExcelPreview(
      parsed,
      "test.xlsx",
      "DAY",
      catalog,
    );
    expect(preview.status).toBe("EXCEL RECONCILIADO");
    expect(preview.recognizedRows).toBe(2);
    expect(preview.reviewRows).toBe(0);
    expect(preview.rows[0]?.status).toBe("COINCIDENCIA EXACTA");
    expect(preview.rows[1]?.status).toBe("ALIAS CONOCIDO");
  });
});
