/**
 * Helper module for managing async IndexedDB backup persistence
 * as a secondary layer to localStorage.
 */

const DB_NAME = "TrabundaProductionDB";
const DB_VERSION = 1;
const STORE_NAME = "key_value_store";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a stringified value to IndexedDB
 */
export async function saveToIndexedDB(
  key: string,
  value: string,
): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to write to IndexedDB:", error);
  }
}

/**
 * Loads a stringified value from IndexedDB
 */
export async function loadFromIndexedDB(key: string): Promise<string | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve((request.result as string) || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to read from IndexedDB:", error);
    return null;
  }
}
