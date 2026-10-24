import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useRecentProducts } from "./useRecentProducts";

describe("useRecentProducts", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("initializes with empty list and updates reactively when adding recent items", () => {
    const { result } = renderHook(() => useRecentProducts("test-card"));
    expect(result.current.recentIds).toEqual([]);

    act(() => {
      result.current.addRecent("prod-1");
    });
    expect(result.current.recentIds).toEqual(["prod-1"]);

    act(() => {
      result.current.addRecent("prod-2");
    });
    expect(result.current.recentIds).toEqual(["prod-2", "prod-1"]);

    act(() => {
      result.current.clearRecents();
    });
    expect(result.current.recentIds).toEqual([]);
  });

  it("synchronizes recent items between mounted pickers using the same scope", () => {
    const firstPicker = renderHook(() => useRecentProducts("shared-scope"));
    const secondPicker = renderHook(() => useRecentProducts("shared-scope"));

    act(() => {
      firstPicker.result.current.addRecent("product-1");
    });

    expect(secondPicker.result.current.recentIds).toEqual(["product-1"]);
  });

  it("keeps an origin-specific option ahead of its shared product id", () => {
    const { result } = renderHook(() => useRecentProducts("shared-scope"));

    act(() => {
      result.current.addRecent("product-1", "origin-day-2|product-1");
    });

    expect(result.current.recentIds).toEqual([
      "origin-day-2|product-1",
      "product-1",
    ]);
  });

  it("refreshes recent items after another tab changes local storage", () => {
    const { result } = renderHook(() => useRecentProducts("shared-scope"));
    const stored = JSON.stringify({ "shared-scope": ["external-product"] });

    localStorage.setItem("trabunda-recent-products-v1", stored);
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "trabunda-recent-products-v1",
          newValue: stored,
        }),
      );
    });

    expect(result.current.recentIds).toEqual(["external-product"]);
  });
});
