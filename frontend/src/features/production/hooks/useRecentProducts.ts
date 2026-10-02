import { useCallback, useState } from "react";
import {
  addRecentProductId,
  clearRecentProductIds,
  getRecentProductIds,
} from "../../../storage/recentProductsStore";

export function useRecentProducts(scopeKey: string) {
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    getRecentProductIds(scopeKey),
  );

  const addRecent = useCallback(
    (productId: string) => {
      const next = addRecentProductId(scopeKey, productId, 8);
      setRecentIds(next);
    },
    [scopeKey],
  );

  const clearRecents = useCallback(() => {
    clearRecentProductIds(scopeKey);
    setRecentIds([]);
  }, [scopeKey]);

  return {
    recentIds,
    addRecent,
    clearRecents,
  };
}
