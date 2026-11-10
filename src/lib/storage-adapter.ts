/**
 * Storage Adapter Layer
 *
 * Provides pluggable storage backends for StorageManager.
 * localStorage is the only backend; T6 adds the server sync adapter.
 *
 * Usage in StorageManager:
 * ```typescript
 * const adapter = createStorageAdapter();
 * adapter.set('key', value);
 * const value = adapter.get('key', defaultValue);
 * ```
 */

/**
 * Storage Adapter Interface
 * All storage backends must implement these methods
 * Note: Interface is synchronous to maintain compatibility with existing StorageManager API
 */
export interface StorageAdapter {
  get<T>(key: string, defaultValue: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  has(key: string): boolean;
  clear(): void;
}

/**
 * LocalStorage Adapter
 * Direct synchronous wrapper around browser localStorage
 */
export class LocalStorageAdapter implements StorageAdapter {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return defaultValue;
      return JSON.parse(stored) as T;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`LocalStorageAdapter: Failed to read ${key}:`, error);
      }
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`LocalStorageAdapter: Failed to write ${key}:`, error);
      }
    }
  }

  remove(key: string): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`LocalStorageAdapter: Failed to remove ${key}:`, error);
      }
    }
  }

  has(key: string): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  clear(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("LocalStorageAdapter: Failed to clear:", error);
      }
    }
  }
}

// ponytail: NEXT_PUBLIC_STORAGE_BACKEND has one value, "localStorage", until T6
export function createStorageAdapter(): StorageAdapter {
  return new LocalStorageAdapter();
}
