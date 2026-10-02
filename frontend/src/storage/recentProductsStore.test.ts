import { beforeEach, describe, expect, it } from "vitest";
import { TRABUNDA_STORAGE_KEYS } from "./trabundaStorage";
import {
  addRecentProductId,
  clearRecentProductIds,
  getRecentProductIds,
} from "./recentProductsStore";

describe("recentProductsStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns empty array when nothing has been stored", () => {
    expect(getRecentProductIds("test-scope")).toEqual([]);
  });

  it("adds and prepends recent product ids up to the limit", () => {
    addRecentProductId("test-scope", "p1");
    addRecentProductId("test-scope", "p2");
    addRecentProductId("test-scope", "p3");
    expect(getRecentProductIds("test-scope")).toEqual(["p3", "p2", "p1"]);

    // Adding existing moves it to top
    addRecentProductId("test-scope", "p1");
    expect(getRecentProductIds("test-scope")).toEqual(["p1", "p3", "p2"]);

    // Limit to 2
    addRecentProductId("test-scope", "p4", 2);
    expect(getRecentProductIds("test-scope")).toEqual(["p4", "p1"]);
  });

  it("keeps scopes isolated", () => {
    addRecentProductId("scope-a", "product-a");
    addRecentProductId("scope-b", "product-b");

    expect(getRecentProductIds("scope-a")).toEqual(["product-a"]);
    expect(getRecentProductIds("scope-b")).toEqual(["product-b"]);
  });

  it("clears specific scope or all scopes", () => {
    addRecentProductId("scope-a", "product-a");
    addRecentProductId("scope-b", "product-b");

    clearRecentProductIds("scope-a");
    expect(getRecentProductIds("scope-a")).toEqual([]);
    expect(getRecentProductIds("scope-b")).toEqual(["product-b"]);

    clearRecentProductIds();
    expect(getRecentProductIds("scope-b")).toEqual([]);
    expect(
      window.localStorage.getItem(TRABUNDA_STORAGE_KEYS.recentProducts),
    ).toBeNull();
  });
});
