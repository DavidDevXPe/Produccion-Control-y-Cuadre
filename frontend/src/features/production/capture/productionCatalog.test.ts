import { describe, expect, it } from "vitest";

import {
  CAPTURE_CATALOG_ITEMS,
  confirmProductionCatalogItem,
  createUnconfirmedCatalogItem,
  filterCaptureCatalogItems,
  filterProductionCatalogItems,
  PRODUCTION_CATALOG_ITEMS,
} from "./productionCatalog";
import { SEED_CAPTURE_PRODUCTS } from "./seedProducts";
import { addAliasToActiveProduct, getActiveProducts } from "./productCatalogRepository";
import { canonicalProductId, productIdsEquivalent } from "../model/productIdentity";
import { buildFreezingExcelPreview } from "./freezingExcelPreview";

describe("production catalog filtering", () => {
  it.each(["aleta", "MANTO", "nuca", "semi limpia"])(
    "filters the catalog while typing %s",
    (query) => {
      const matches = filterProductionCatalogItems(query);
      const normalizedQuery = query.toLocaleUpperCase("es-PE");

      expect(matches.length).toBeGreaterThan(0);
      expect(
        matches.every((product) =>
          `${product.familyName} ${product.productName}`
            .toLocaleUpperCase("es-PE")
            .includes(normalizedQuery),
        ),
      ).toBe(true);
    },
  );

  it("returns the complete catalog for an empty search", () => {
    expect(filterProductionCatalogItems("")).toHaveLength(
      PRODUCTION_CATALOG_ITEMS.length,
    );
  });

  it("ignores accents while filtering", () => {
    expect(filterProductionCatalogItems("japones")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: "manto-japones-crudo" }),
      ]),
    );
  });

  it("accepts multiple words even when they are not consecutive", () => {
    expect(filterProductionCatalogItems("aleta codificada")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: "aleta-cruda-codificada" }),
      ]),
    );
  });
});

describe("active capture catalog", () => {
  it("starts from the capture seed without replacing legacy resolution", () => {
    expect(CAPTURE_CATALOG_ITEMS).toEqual(
      expect.arrayContaining([...SEED_CAPTURE_PRODUCTS]),
    );
    expect(CAPTURE_CATALOG_ITEMS).toHaveLength(SEED_CAPTURE_PRODUCTS.length);
    expect(PRODUCTION_CATALOG_ITEMS).toEqual(
      expect.arrayContaining([expect.objectContaining({ productId: "pico-crudo" })]),
    );
  });

  it("includes Panza Ballena Cocida in the Recorte Cocido group", () => {
    expect(CAPTURE_CATALOG_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "panza-ballena-cocida",
          productName: "PANZA BALLENA COCIDA",
          familyId: "recorte-cocido",
          familyName: "RECORTE COCIDO",
          summaryGroupId: "RECORTE_COCIDO",
        }),
      ]),
    );
  });

  it("includes and finds Recorte de Anillas SM CP ST in the active catalog", () => {
    expect(CAPTURE_CATALOG_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "recorte-crudo-anillas-sm-cp-st",
          productName:
            "RECORTE CRUDO CONGELADO BLOCK S/TTO ANILLAS SM CP ST 100% P.N.",
          familyId: "recorte-crudo",
          familyName: "RECORTE CRUDO",
          summaryGroupId: "RECORTE_CRUDO",
        }),
      ]),
    );

    const matches = filterCaptureCatalogItems("anillas sm cp st");

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "recorte-crudo-anillas-sm-cp-st",
        }),
      ]),
    );
  });

  it("includes and finds Aleta Cruda Block 0 g - 500 g in the active catalog", () => {
    expect(CAPTURE_CATALOG_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "aleta-cruda-block-0-500",
          productName:
            "ALETA CRUDA CONGELADA BLOCK S/TTO 0 g - 500 g 100% P.N.",
          familyId: "aleta-cruda",
          familyName: "ALETA CRUDA",
          summaryGroupId: "ALETA",
        }),
      ]),
    );

    const matches = filterCaptureCatalogItems("aleta 0 500");

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "aleta-cruda-block-0-500",
        }),
      ]),
    );
  });

  it("includes Botón España SM SP ST as a treatment product", () => {
    expect(SEED_CAPTURE_PRODUCTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "boton-espana-sm-sp-st-tratamiento",

          productName: "BOTON ESPAÑA SM SP ST (TRATAMIENTO)",

          familyId: "boton",

          summaryGroupId: "BOTON",
        }),
      ]),
    );
  });

  it("includes BOTON CRUDO CONGELADO BLOCK S/TTO ESPAÑA P SM CP ST 100% P.N in the Boton family", () => {
    expect(SEED_CAPTURE_PRODUCTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "boton-crudo-block-espana-p-sm-cp-st",
          productName:
            "BOTON CRUDO CONGELADO BLOCK S/TTO ESPAÑA P SM CP ST 100% P.N",
          canonicalName:
            "BOTON CRUDO CONGELADO BLOCK S/TTO ESPAÑA P SM CP ST 100% P.N",
          familyId: "boton",
          familyName: "BOTON",
          summaryGroupId: "BOTON",
          active: true,
        }),
      ]),
    );

    const matches = filterCaptureCatalogItems(
      "BOTÃ“N CRUDO CONGELADO BLOCK S/TTO ESPAÑA P SM CP ST 100% P.N.",
    );
    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "boton-crudo-block-espana-p-sm-cp-st",
        }),
      ]),
    );
  });

  it("includes BOTON CRUDO CONGELADO BLOCK S/TTO POLAR SM SP ST 100% P.N. in the Boton family", () => {
    expect(SEED_CAPTURE_PRODUCTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "boton-crudo-block-polar-sm-sp-st",
          productName:
            "BOTON CRUDO CONGELADO BLOCK S/TTO POLAR SM SP ST 100% P.N.",
          canonicalName:
            "BOTON CRUDO CONGELADO BLOCK S/TTO POLAR SM SP ST 100% P.N.",
          familyId: "boton",
          familyName: "BOTON",
          summaryGroupId: "BOTON",
          active: true,
        }),
      ]),
    );

    const matches = filterCaptureCatalogItems(
      "BOTON CRUDO CONGELADO BLOCK S/TTO POLAR SM SP ST 100% P.N.",
    );
    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "boton-crudo-block-polar-sm-sp-st",
        }),
      ]),
    );
  });

  it("includes ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P CM CP ST MIXTA 100% P.N. in the Anillas family", () => {
    expect(SEED_CAPTURE_PRODUCTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "anillas-espana-p-cm-cp-st-mixta",
          productName:
            "ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P CM CP ST MIXTA 100% P.N.",
          canonicalName:
            "ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P CM CP ST MIXTA 100% P.N.",
          familyId: "anillas",
          familyName: "ANILLAS",
          summaryGroupId: "ANILLAS",
          technicalClassification: "GENERAL",
          active: true,
        }),
      ]),
    );

    const matches = filterCaptureCatalogItems(
      "ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P CM CP ST MIXTA 100% P.N.",
    );
    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "anillas-espana-p-cm-cp-st-mixta",
        }),
      ]),
    );
  });

  it("keeps every capture seed product paired with a unique product id", () => {
    const ids = SEED_CAPTURE_PRODUCTS.map((product) => product.productId);

    expect(ids).toHaveLength(SEED_CAPTURE_PRODUCTS.length);
    expect(new Set(ids).size).toBe(ids.length);

    expect(
      SEED_CAPTURE_PRODUCTS.every(
        (product) =>
          typeof product.productId === "string" &&
          product.productId.trim().length > 0,
      ),
    ).toBe(true);
  });

  it("reuses the historical Rejo Tiras id with the new canonical name and aliases", () => {
    expect(SEED_CAPTURE_PRODUCTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "rejos-tiras-tratamiento",
          productName: "REJO 1-2 TIRAS (EN TRATAMIENTO)",
          canonicalName: "REJO 1-2 TIRAS (EN TRATAMIENTO)",
          aliases: expect.arrayContaining([
            "REJOS TIRAS (EN TRATAMIENTO)",
            "REJO 1-2 TIRAS",
          ]),
          familyId: "rejos-crudo",
          familyName: "REJOS CRUDO",
          summaryGroupId: "REJOS",
          active: true,
        }),
      ]),
    );
  });

  it("includes the three Reproductor treatment cuts in one family", () => {
    const treatmentProducts = SEED_CAPTURE_PRODUCTS.filter((product) =>
      [
        "reproductor-grueso-tratamiento",
        "reproductor-fino-tratamiento",
        "reproductor-parte-terminal-tratamiento",
      ].includes(product.productId),
    );

    expect(treatmentProducts).toHaveLength(3);
    expect(treatmentProducts.map((product) => product.productName)).toEqual([
      "REPRODUCTOR GRUESO (EN TRATAMIENTO)",
      "REPRODUCTOR FINO (EN TRATAMIENTO)",
      "REPRODUCTOR PARTE TERMINAL (EN TRATAMIENTO)",
    ]);
    expect(
      treatmentProducts.every(
        (product) =>
          product.familyId === "reproductor-crudo" &&
          product.summaryGroupId === "REPRODUCTOR" &&
          product.productName.includes("EN TRATAMIENTO"),
      ),
    ).toBe(true);
  });

  it("does not assign incomplete imported fragments to Aleta or Manto by default", () => {
    const item = createUnconfirmedCatalogItem("3000 q 100% P.N. 18");

    expect(item.familyId).toBe("unclassified");
    expect(item.familyName).toBe("REQUIERE CLASIFICACIÓN");
    expect(item.technicalClassification).toBe("UNCLASSIFIED");
  });

  it("keeps Membranas on its historical product id with the new canonical name", () => {
    expect(SEED_CAPTURE_PRODUCTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "membranas-cocidas",
          canonicalName: "MEMBRANAS COCIDAS CONGELADAS BLOCK S/TTO 100% P.N.",
          aliases: expect.arrayContaining([
            "MEMBRANAS COCIDAS CONGELADAS 100% P.N.",
          ]),
        }),
      ]),
    );
  });

  it("persists dynamic products and aliases through the active catalog repository", () => {
    const dynamic = confirmProductionCatalogItem({
      ...createUnconfirmedCatalogItem(
        "NUCAS CRUDAS CONGELADAS BLOCK S/TTO SEMI-LIMPIAS 100-300 100% P.N.",
      ),
      productId: "nuca-semilimpia-100-300",
      familyId: "nuca-semilimpia",
      familyName: "NUCA SEMILIMPIA",
      summaryGroupId: "NUCA_SEMILIMPIA",
      source: "MANUAL",
    });

    addAliasToActiveProduct(dynamic.productId, "NUCA SEMILIMPIA 100-300 EXTERNO");

    expect(getActiveProducts()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "nuca-semilimpia-100-300",
          familyId: "nuca-semilimpia",
          aliases: expect.arrayContaining(["NUCA SEMILIMPIA 100-300 EXTERNO"]),
        }),
      ]),
    );
    expect(window.localStorage.getItem("trabunda-product-catalog-v2")).toContain(
      "nuca-semilimpia-100-300",
    );
  });

  it("maps dynamically generated slug IDs of recently added products to their canonical seed IDs and deduplicates catalog", () => {
    expect(
      canonicalProductId(
        "anillas-crudas-congeladas-block-stto-espana-p-cm-cp-st-mixta-100-pn",
      ),
    ).toBe("anillas-espana-p-cm-cp-st-mixta");
    expect(
      canonicalProductId(
        "boton-crudo-congelado-block-stto-espana-p-sm-cp-st-100-pn",
      ),
    ).toBe("boton-crudo-block-espana-p-sm-cp-st");
    expect(
      canonicalProductId(
        "boton-crudo-congelado-block-stto-polar-sm-sp-st-100-pn",
      ),
    ).toBe("boton-crudo-block-polar-sm-sp-st");

    confirmProductionCatalogItem({
      ...createUnconfirmedCatalogItem(
        "ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P CM CP ST MIXTA 100% P.N.",
      ),
      productId:
        "anillas-crudas-congeladas-block-stto-espana-p-cm-cp-st-mixta-100-pn",
      familyId: "anillas",
      familyName: "ANILLAS",
      summaryGroupId: "ANILLAS",
      source: "MANUAL",
    });

    const active = getActiveProducts();
    const matchingAnillas = active.filter((item) =>
      productIdsEquivalent(item.productId, "anillas-espana-p-cm-cp-st-mixta"),
    );
    expect(matchingAnillas).toHaveLength(1);
    expect(matchingAnillas[0]?.productId).toBe("anillas-espana-p-cm-cp-st-mixta");

    const preview = buildFreezingExcelPreview(
      {
        sheetName: "15-10-2026",
        totalAros: 30,
        totalKg: 300,
        sourceGrandTotalAros: 30,
        sourceGrandTotalKg: 300,
        warnings: [],
        reconciled: true,
        rows: [
          {
            rowNumber: 1,
            rawProductName:
              "BOTON CRUDO CONGELADO BLOCK S/TTO ESPAÑA P SM CP ST 100% P.N.",
            baseProductName:
              "BOTON CRUDO CONGELADO BLOCK S/TTO ESPAÑA P SM CP ST 100% P.N.",
            quantityAros: 10,
            packaging: null,
            totalKg: 100,
          },
          {
            rowNumber: 2,
            rawProductName:
              "ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P CM CP ST MIXTA 100% P.N.",
            baseProductName:
              "ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P CM CP ST MIXTA 100% P.N.",
            quantityAros: 10,
            packaging: null,
            totalKg: 100,
          },
          {
            rowNumber: 3,
            rawProductName:
              "BOTON CRUDO CONGELADO BLOCK S/TTO POLAR SM SP ST 100% P.N.",
            baseProductName:
              "BOTON CRUDO CONGELADO BLOCK S/TTO POLAR SM SP ST 100% P.N.",
            quantityAros: 10,
            packaging: null,
            totalKg: 100,
          },
        ],
      },
      "congelado.xlsx",
      "DAY",
      active,
    );

    expect(preview.reviewRows).toBe(3);
    expect(preview.rows.map((r) => r.product)).toEqual([
      null,
      null,
      null,
    ]);
    expect(preview.presentationWarnings).toHaveLength(3);
  });

  it("marks historical base names as Envasado-only for downstream matching", () => {
    const historical = PRODUCTION_CATALOG_ITEMS.find(
      (item) => item.productId === "conos-con-piel-crudos",
    );

    expect(historical).toBeDefined();
    expect(historical?.allowedProcesses).toEqual(["PACKING"]);

    const preview = buildFreezingExcelPreview(
      {
        sheetName: "Reporte",
        totalAros: 10,
        totalKg: 100,
        sourceGrandTotalAros: null,
        sourceGrandTotalKg: null,
        warnings: [],
        reconciled: true,
        rows: [
          {
            rowNumber: 5,
            rawProductName: historical!.productName,
            baseProductName: historical!.productName,
            quantityAros: 10,
            packaging: null,
            totalKg: 100,
          },
        ],
      },
      "base-historical.xlsx",
      "DAY",
      [historical!],
    );

    expect(preview.rows[0]?.product).toBeNull();
    expect(preview.reviewRows).toBe(1);
  });
});
