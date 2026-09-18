import { describe, expect, it } from "vitest";

import {
  CAPTURE_CATALOG_ITEMS,
  filterCaptureCatalogItems,
  filterProductionCatalogItems,
  PRODUCTION_CATALOG_ITEMS,
} from "./productionCatalog";
import { SEED_CAPTURE_PRODUCTS } from "./seedProducts";

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
    expect(PRODUCTION_CATALOG_ITEMS.length).toBeGreaterThan(
      CAPTURE_CATALOG_ITEMS.length,
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
});
