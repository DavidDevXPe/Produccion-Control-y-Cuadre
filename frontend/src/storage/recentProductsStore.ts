import { TRABUNDA_STORAGE_KEYS } from "./trabundaStorage";

type RecentProductsMap = Record<string, string[]>;

function parseRecentMap(raw: string | null): RecentProductsMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as RecentProductsMap;
    }
    return {};
  } catch {
    return {};
  }
}

export function getRecentProductIds(scopeKey: string): string[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(
      TRABUNDA_STORAGE_KEYS.recentProducts,
    );
    const map = parseRecentMap(raw);
    const list = map[scopeKey];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addRecentProductId(
  scopeKey: string,
  productId: string,
  maxItems = 8,
): string[] {
  if (!productId || typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(
      TRABUNDA_STORAGE_KEYS.recentProducts,
    );
    const map = parseRecentMap(raw);
    const currentList = Array.isArray(map[scopeKey]) ? map[scopeKey] : [];
    const nextList = [
      productId,
      ...currentList.filter((id) => id !== productId),
    ].slice(0, maxItems);
    map[scopeKey] = nextList;
    window.localStorage.setItem(
      TRABUNDA_STORAGE_KEYS.recentProducts,
      JSON.stringify(map),
    );
    return nextList;
  } catch {
    return [productId];
  }
}

export function clearRecentProductIds(scopeKey?: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    if (!scopeKey) {
      window.localStorage.removeItem(TRABUNDA_STORAGE_KEYS.recentProducts);
      return;
    }
    const raw = window.localStorage.getItem(
      TRABUNDA_STORAGE_KEYS.recentProducts,
    );
    const map = parseRecentMap(raw);
    delete map[scopeKey];
    window.localStorage.setItem(
      TRABUNDA_STORAGE_KEYS.recentProducts,
      JSON.stringify(map),
    );
  } catch {
    // Ignore storage failure
  }
}
