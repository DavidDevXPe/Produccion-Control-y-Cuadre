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
});
