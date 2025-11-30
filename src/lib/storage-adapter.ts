/**
 * Storage Adapter Layer
 *
 * Provides pluggable storage backends for StorageManager.
 * Supports both localStorage (default) and Sanity (cross-device persistence).
 *
 * Usage in StorageManager:
 * ```typescript
 * const adapter = createStorageAdapter();
 * adapter.set('key', value);
 * const value = adapter.get('key', defaultValue);
 * ```
 */

import { createSessionIdFromPassword } from "./session-manager";

// Global tracking of all SanityStorageAdapter instances for cross-adapter sync coordination
const allAdapterInstances = new Set<SanityStorageAdapter>();

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
      console.warn(`LocalStorageAdapter: Failed to read ${key}:`, error);
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
      console.warn(`LocalStorageAdapter: Failed to write ${key}:`, error);
    }
  }

  remove(key: string): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`LocalStorageAdapter: Failed to remove ${key}:`, error);
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
      console.warn("LocalStorageAdapter: Failed to clear:", error);
    }
  }
}

/**
 * Sanity Adapter
 * Stores data in Sanity CMS via API routes for cross-device persistence
 * Uses cache-first synchronous reads with background async sync to maintain
 * compatibility with existing StorageManager API
 */
export class SanityStorageAdapter implements StorageAdapter {
  private cache: Map<string, unknown> = new Map();
  private initialized = false;
  private initPromise: Promise<void>;
  private pendingSyncs: Promise<void>[] = []; // Track pending syncs for testing
  private sessionId: string = ""; // Store sessionId for sync requests

  constructor(password: string) {
    // Register this instance globally for cross-adapter sync coordination
    allAdapterInstances.add(this);
    // Always initialize immediately with password
    this.initPromise = this.initialize(password);
  }

  /**
   * Initialize session and load all data
   */
  private async initialize(password: string): Promise<void> {
    if (this.initialized) return;

    try {
      // Create session ID from password (this sets the cookie)
      this.sessionId = await createSessionIdFromPassword(password);

      // Try to fetch existing session by explicit sessionId (not cookie)
      // This is important for multi-tenant: cookie might have been set by another tenant
      const response = await fetch(
        `/api/session?sessionId=${encodeURIComponent(this.sessionId)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store", // Prevent stale data
        },
      );

      let sessionData;
      if (response.ok) {
        sessionData = await response.json();
      } else if (response.status === 404) {
        // Create new session
        const createResponse = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: this.sessionId }),
          credentials: "include",
          cache: "no-store",
        });

        if (createResponse.ok) {
          sessionData = await createResponse.json();
        } else {
          throw new Error("Failed to create session");
        }
      } else {
        throw new Error("Failed to fetch session");
      }

      // Populate cache from session data
      if (sessionData) {
        // Clear cache first to ensure no stale data
        this.cache.clear();

        const fieldMap = this.getAllFieldMappings();
        Object.values(fieldMap).forEach((field) => {
          if (sessionData[field] !== undefined) {
            this.cache.set(field, sessionData[field]);
          }
        });
      }

      this.initialized = true;
    } catch (error) {
      console.error("SanityStorageAdapter: Initialization failed:", error);
      // Fall back to empty cache
      this.initialized = true;
    }
  }

  /**
   * Convert storage key to Sanity field name
   * Example: "nissekomm-codes" -> "submittedCodes"
   */
  private keyToField(key: string): string {
    const keyMap = this.getAllFieldMappings();
    return keyMap[key] || key;
  }

  /**
   * Get all key-to-field mappings
   */
  private getAllFieldMappings(): Record<string, string> {
    return {
      "nissekomm-authenticated": "authenticated",
      "nissekomm-codes": "submittedCodes",
      "nissekomm-viewed-emails": "viewedEmails",
      "nissekomm-viewed-bonusoppdrag-emails": "viewedBonusOppdragEmails",
      "nissekomm-sounds-enabled": "soundsEnabled",
      "nissekomm-music-enabled": "musicEnabled",
      "nissekomm-bonusoppdrag-badges": "bonusOppdragBadges",
      "nissekomm-eventyr-badges": "eventyrBadges",
      "nissekomm-earned-badges": "earnedBadges",
      "nissekomm-topic-unlocks": "topicUnlocks",
      "nissekomm-unlocked-files": "unlockedFiles",
      "nissekomm-collected-symbols": "collectedSymbols",
      "nissekomm-solved-decryptions": "solvedDecryptions",
      "nissekomm-decryption-attempts": "decryptionAttempts",
      "nissekomm-failed-attempts": "failedAttempts",
      "nissekomm-nissenet-last-visit": "nissenetLastVisit",
      "nissekomm-player-names": "playerNames",
      "nissekomm-nice-list-viewed": "niceListLastViewed",
      "nissekomm-dagbok-last-read": "dagbokLastRead",
      "nissekomm-brevfugler": "brevfugler",
      "nissekomm-unlocked-modules": "unlockedModules",
      "nissekomm-crisis-completed": "crisisStatus",
      "nissekomm-santa-letters": "santaLetters",
    };
  }

  get<T>(key: string, defaultValue: T): T {
    // Wait for initialization if not complete (blocks briefly on first access)
    if (!this.initialized) {
      // Note: This is a synchronous fallback - in practice, initialization
      // should complete before first access due to setAuthenticated() being async
      console.warn(
        "SanityStorageAdapter: get() called before initialization complete",
      );
      return defaultValue;
    }

    const field = this.keyToField(key);

    // Return from cache (synchronous)
    if (this.cache.has(field)) {
      return this.cache.get(field) as T;
    }

    return defaultValue;
  }

  set<T>(key: string, value: T): void {
    const field = this.keyToField(key);

    // Update cache immediately (synchronous)
    this.cache.set(field, value);

    // Sync to Sanity in background (fire-and-forget)
    this.syncInBackground({ [field]: value });
  }

  remove(key: string): void {
    const field = this.keyToField(key);

    // Remove from cache
    this.cache.delete(field);

    // Sync deletion to Sanity
    this.syncInBackground({ [field]: null });
  }

  has(key: string): boolean {
    const field = this.keyToField(key);
    return this.cache.has(field);
  }

  clear(): void {
    this.cache.clear();

    // Clear all fields in Sanity (set to defaults)
    const defaultData = {
      authenticated: false,
      soundsEnabled: true,
      musicEnabled: false,
      submittedCodes: [],
      viewedEmails: [],
      viewedBonusOppdragEmails: [],
      bonusOppdragBadges: [],
      eventyrBadges: [],
      earnedBadges: [],
      topicUnlocks: {},
      unlockedFiles: [],
      unlockedModules: [],
      collectedSymbols: [],
      solvedDecryptions: [],
      decryptionAttempts: {},
      failedAttempts: {},
      crisisStatus: { antenna: false, inventory: false },
      santaLetters: [],
      brevfugler: [],
      nissenetLastVisit: 0,
      playerNames: [],
      niceListLastViewed: null,
      dagbokLastRead: 0,
    };

    this.syncInBackground(defaultData);
  }

  /**
   * Sync data to Sanity in background (non-blocking)
   */
  private syncInBackground(updates: Record<string, unknown>): void {
    // Ensure initialization is complete first
    const syncPromise = this.initPromise?.then(() => {
      return this.syncWithRetry(updates, 1).catch((error) => {
        console.error("SanityStorageAdapter: Background sync failed:", error);
      });
    });

    if (syncPromise) {
      this.pendingSyncs.push(syncPromise as Promise<void>);

      // Clean up completed syncs
      syncPromise.finally(() => {
        const index = this.pendingSyncs.indexOf(syncPromise as Promise<void>);
        if (index > -1) {
          this.pendingSyncs.splice(index, 1);
        }
      });
    }
  }

  /**
   * Wait for initialization to complete
   * Public method to allow callers to wait for async initialization
   */
  async waitForInitialization(): Promise<void> {
    await this.initPromise;
  }

  /**
   * Wait for all pending syncs to complete (useful for testing)
   */
  async waitForPendingSyncs(): Promise<void> {
    await Promise.all(this.pendingSyncs);
  }

  /**
   * Wait for all pending syncs across ALL adapter instances
   * Critical for multi-tenant switching to ensure previous adapter's syncs complete
   */
  static async waitForAllPendingSyncs(): Promise<void> {
    const allSyncs: Promise<void>[] = [];
    for (const adapter of allAdapterInstances) {
      if (adapter.pendingSyncs.length > 0) {
        allSyncs.push(...adapter.pendingSyncs);
      }
    }
    if (allSyncs.length > 0) {
      await Promise.all(allSyncs);
    }
  }

  /**
   * Clear all registered adapter instances (for testing only)
   * WARNING: This should only be called in test cleanup
   */
  static clearAllInstances(): void {
    allAdapterInstances.clear();
  }

  /**
   * Sync data to Sanity with simple retry logic
   */
  private async syncWithRetry(
    updates: Record<string, unknown>,
    retries = 1,
  ): Promise<void> {
    try {
      const response = await fetch("/api/session/sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates,
          sessionId: this.sessionId, // Include sessionId for environments without cookie support
        }),
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const error = (await response.json()) as {
          error?: string;
          retryable?: boolean;
        };

        // Retry on retryable errors
        if (error.retryable && retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay
          return this.syncWithRetry(updates, retries - 1);
        }

        throw new Error(error.error || "Sync failed");
      }
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.syncWithRetry(updates, retries - 1);
      }
      throw error;
    }
  }
}

/**
 * Factory function to create the appropriate storage adapter
 * Based on NEXT_PUBLIC_STORAGE_BACKEND environment variable
 *
 * @param password - Boot password for Sanity multi-tenancy (required for Sanity backend)
 */
export function createStorageAdapter(password?: string): StorageAdapter {
  const backend = process.env.NEXT_PUBLIC_STORAGE_BACKEND || "localStorage";

  switch (backend) {
    case "sanity":
      if (!password) {
        console.warn(
          "Sanity backend requires password, falling back to localStorage",
        );
        return new LocalStorageAdapter();
      }
      return new SanityStorageAdapter(password);
    case "localStorage":
    default:
      return new LocalStorageAdapter();
  }
}
