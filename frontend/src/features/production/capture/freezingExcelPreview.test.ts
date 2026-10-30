import { describe, expect, it } from "vitest";
import type { ParsedFreezingWorkbook } from "./parseFreezingWorkbook";
import type { ProductionCatalogItem } from "./productionCatalog";
import { SEED_CAPTURE_PRODUCTS } from "./seedProducts";
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

    const seededRejosTiras = SEED_CAPTURE_PRODUCTS.find(
      (product) => product.productId === "rejos-tiras-tratamiento",
    );
    expect(seededRejosTiras).toBeDefined();
    expect(isTreatmentOnlyProduct(seededRejosTiras!)).toBe(true);

    for (const productId of [
      "reproductor-grueso-tratamiento",
      "reproductor-fino-tratamiento",
      "reproductor-parte-terminal-tratamiento",
    ]) {
      const seededProduct = SEED_CAPTURE_PRODUCTS.find(
        (product) => product.productId === productId,
      );
      expect(seededProduct).toBeDefined();
      expect(isTreatmentOnlyProduct(seededProduct!)).toBe(true);
    }
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

  it("matches the complete SACO description instead of the Envasado base", () => {
    const product = SEED_CAPTURE_PRODUCTS.find((candidate) =>
      candidate.productName.includes("MANTO ESTANDAR") &&
      candidate.productName.includes("SACO 2 x 10 kg"),
    );
    expect(product).toBeDefined();

    const rawProductName = product!.productName;
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
          rowNumber: 4,
          rawProductName,
          baseProductName: rawProductName.replace(/\s*-\s*SACO.*$/i, ""),
          packaging: "SACO 2 x 10 kg",
          quantityAros: 10,
          totalKg: 100,
        },
      ],
    };

    const preview = buildFreezingExcelPreview(
      parsed,
      "guide.xlsx",
      "DAY",
      SEED_CAPTURE_PRODUCTS,
    );

    expect(preview.rows[0]?.product?.productId).toBe(product!.productId);
    expect(preview.rows[0]?.status).toBe("COINCIDENCIA EXACTA");
  });

  it("does not reuse an Envasado-only base product for Congelamiento", () => {
    const baseProduct: ProductionCatalogItem = {
      productId: "base-manto",
      productName: "MANTO BASE",
      familyId: "manto",
      familyName: "MANTO",
      summaryGroupId: "MANTO",
      allowedProcesses: ["PACKING"],
    };

    const preview = buildFreezingExcelPreview(
      {
        sheetName: "Reporte",
        reconciled: true,
        totalAros: 10,
        totalKg: 100,
        sourceGrandTotalAros: null,
        sourceGrandTotalKg: null,
        warnings: [],
        rows: [
          {
            rowNumber: 7,
            rawProductName: "MANTO BASE",
            baseProductName: "MANTO BASE",
            packaging: null,
            quantityAros: 10,
            totalKg: 100,
          },
        ],
      },
      "base.xlsx",
      "DAY",
      [baseProduct],
    );

    expect(preview.rows[0]?.product).toBeNull();
    expect(preview.reviewRows).toBe(1);
    expect(preview.presentationWarnings).toEqual([
      expect.stringContaining("Fila 7"),
    ]);
  });

  it("warns when a guide uses an unsupported sack weight", () => {
    const preview = buildFreezingExcelPreview(
      {
        sheetName: "Reporte",
        reconciled: true,
        totalAros: 10,
        totalKg: 100,
        sourceGrandTotalAros: null,
        sourceGrandTotalKg: null,
        warnings: [],
        rows: [
          {
            rowNumber: 8,
            rawProductName: "MANTO - SACO 4 x 10 kg",
            baseProductName: "MANTO",
            packaging: "SACO 4 x 10 kg",
            quantityAros: 10,
            totalKg: 100,
          },
        ],
      },
      "unsupported.xlsx",
      "DAY",
      [],
    );

    expect(preview.presentationWarnings?.[0]).toMatch(/20, 27 o 30 kg/);
  });
});
