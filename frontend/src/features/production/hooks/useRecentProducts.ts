import { useCallback, useEffect, useState } from "react";
import {
  addRecentProductId,
  clearRecentProductIds,
  getRecentProductIds,
} from "../../../storage/recentProductsStore";
import { TRABUNDA_STORAGE_KEYS } from "../../../storage/trabundaStorage";

const RECENT_PRODUCTS_UPDATED_EVENT = "trabunda:recent-products-updated";

function notifyRecentProductsUpdated(scopeKey: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(RECENT_PRODUCTS_UPDATED_EVENT, {
      detail: { scopeKey },
    }),
  );
}

export function useRecentProducts(scopeKey: string) {
  const [recentState, setRecentState] = useState(() => ({
    scopeKey,
    ids: getRecentProductIds(scopeKey),
  }));
  const recentIds =
    recentState.scopeKey === scopeKey
      ? recentState.ids
      : getRecentProductIds(scopeKey);

  useEffect(() => {
    const handleRecentProductsUpdated = (event: Event) => {
      const updatedScopeKey = (
        event as CustomEvent<{ scopeKey?: string | null }>
      ).detail?.scopeKey;
      if (updatedScopeKey == null || updatedScopeKey === scopeKey) {
        setRecentState({ scopeKey, ids: getRecentProductIds(scopeKey) });
      }
    };

    window.addEventListener(
      RECENT_PRODUCTS_UPDATED_EVENT,
      handleRecentProductsUpdated,
    );
    return () => {
      window.removeEventListener(
        RECENT_PRODUCTS_UPDATED_EVENT,
        handleRecentProductsUpdated,
      );
    };
  }, [scopeKey]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== window.localStorage) return;
      if (
        event.key !== null &&
        event.key !== TRABUNDA_STORAGE_KEYS.recentProducts
      ) {
        return;
      }

      setRecentState({ scopeKey, ids: getRecentProductIds(scopeKey) });
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [scopeKey]);

  const addRecent = useCallback(
    (productId: string, optionId = productId) => {
      const recentProductIds = addRecentProductId(scopeKey, productId, 16);
      const next =
        optionId === productId
          ? recentProductIds
          : addRecentProductId(scopeKey, optionId, 16);
      setRecentState({ scopeKey, ids: next });
      notifyRecentProductsUpdated(scopeKey);
    },
    [scopeKey],
  );

  const clearRecents = useCallback(() => {
    clearRecentProductIds(scopeKey);
    setRecentState({ scopeKey, ids: [] });
    notifyRecentProductsUpdated(scopeKey);
  }, [scopeKey]);

  return {
    recentIds,
    addRecent,
    clearRecents,
  };
}
