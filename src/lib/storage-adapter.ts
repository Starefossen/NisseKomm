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

  constructor(sessionId: string) {
    // Register this instance globally for cross-adapter sync coordination
    allAdapterInstances.add(this);
    this.sessionId = sessionId;
    console.debug(
      "[SanityAdapter] Creating new adapter for session:",
      sessionId.substring(0, 8) + "...",
    );
    // Always initialize immediately with sessionId
    this.initPromise = this.initialize();
  }

  /**
   * Initialize session and load all data
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    try {
      // SessionId is already set in constructor

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
        throw new Error(`Failed to fetch session: ${response.status}`);
      }

      // Populate cache from session data
      if (sessionData) {
        // Clear cache first to ensure no stale data
        this.cache.clear();

        const fieldMap = this.getAllFieldMappings();
        let loadedFields = 0;
        Object.values(fieldMap).forEach((field) => {
          if (sessionData[field] !== undefined) {
            // Convert Sanity array format to in-game Record format for certain fields
            let value = sessionData[field];

            // topicUnlocks: [{topic, day}] → {topic: day}
            if (field === "topicUnlocks" && Array.isArray(value)) {
              const record: Record<string, number> = {};
              value.forEach((item: { topic: string; day: number }) => {
                record[item.topic] = item.day;
              });
              value = record;
            }

            // decryptionAttempts: [{challengeId, attemptCount}] → {challengeId: attemptCount}
            if (field === "decryptionAttempts" && Array.isArray(value)) {
              const record: Record<string, number> = {};
              value.forEach(
                (item: { challengeId: string; attemptCount: number }) => {
                  record[item.challengeId] = item.attemptCount;
                },
              );
              value = record;
            }

            // failedAttempts: [{day, attemptCount}] → {day: attemptCount}
            if (field === "failedAttempts" && Array.isArray(value)) {
              const record: Record<number, number> = {};
              value.forEach((item: { day: number; attemptCount: number }) => {
                record[item.day] = item.attemptCount;
              });
              value = record;
            }

            this.cache.set(field, value);
            loadedFields++;
          }
        });
      }

      this.initialized = true;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[SanityAdapter] Initialization failed:", error);
      }
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
      "nissekomm-friend-names": "friendNames",
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
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "SanityStorageAdapter: get() called before initialization complete",
        );
      }
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
      topicUnlocks: [], // Array format for Sanity
      unlockedFiles: [],
      unlockedModules: [],
      collectedSymbols: [],
      solvedDecryptions: [],
      decryptionAttempts: [], // Array format for Sanity
      failedAttempts: [], // Array format for Sanity
      crisisStatus: { antenna: false, inventory: false },
      santaLetters: [],
      brevfugler: [],
      nissenetLastVisit: 0,
      playerNames: [],
      friendNames: [],
      niceListLastViewed: null,
      dagbokLastRead: 0,
    };

    this.syncInBackground(defaultData);
  }

  /**
   * Get default value for a field
   */
  private getDefaultForField(field: string): unknown {
    switch (field) {
      case "topicUnlocks":
      case "decryptionAttempts":
      case "failedAttempts":
        return {};
      default:
        return null;
    }
  }

  /**
   * Generate a unique key for Sanity array items
   */
  private generateKey(prefix: string, identifier: string | number): string {
    return `${prefix}-${identifier}`;
  }

  /**
   * Prepare updates for Sanity sync
   * Converts in-game Record format to Sanity array format where needed
   * Adds _key property to all array items (required by Sanity)
   */
  private prepareUpdatesForSanity(
    updates: Record<string, unknown>,
  ): Record<string, unknown> {
    const prepared: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(updates)) {
      // topicUnlocks: {topic: day} → [{_key, topic, day}]
      if (
        field === "topicUnlocks" &&
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const array: { _key: string; topic: string; day: number }[] = [];
        Object.entries(value as Record<string, number>).forEach(
          ([topic, day]) => {
            array.push({
              _key: this.generateKey("topic", topic),
              topic,
              day,
            });
          },
        );
        prepared[field] = array;
      }
      // decryptionAttempts: {challengeId: attemptCount} → [{_key, challengeId, attemptCount}]
      else if (
        field === "decryptionAttempts" &&
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const array: {
          _key: string;
          challengeId: string;
          attemptCount: number;
        }[] = [];
        Object.entries(value as Record<string, number>).forEach(
          ([challengeId, attemptCount]) => {
            array.push({
              _key: this.generateKey("decrypt", challengeId),
              challengeId,
              attemptCount,
            });
          },
        );
        prepared[field] = array;
      }
      // failedAttempts: {day: attemptCount} → [{_key, day, attemptCount}]
      else if (
        field === "failedAttempts" &&
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const array: { _key: string; day: number; attemptCount: number }[] = [];
        Object.entries(value as Record<number, number>).forEach(
          ([day, attemptCount]) => {
            array.push({
              _key: this.generateKey("failed", day),
              day: Number(day),
              attemptCount,
            });
          },
        );
        prepared[field] = array;
      }
      // Add _key to other array types if they don't have it
      else if (Array.isArray(value)) {
        prepared[field] = this.ensureKeysInArray(field, value);
      } else {
        prepared[field] = value;
      }
    }

    return prepared;
  }

  /**
   * Ensure all objects in an array have _key property
   */
  private ensureKeysInArray(field: string, array: unknown[]): unknown[] {
    return array.map((item, index) => {
      if (typeof item === "object" && item !== null && !("_key" in item)) {
        // Generate key based on field-specific logic
        let key: string;

        if (field === "submittedCodes" && "kode" in item && "dato" in item) {
          // Use code + timestamp for unique key
          key = this.generateKey(
            "code",
            `${(item as { kode: string }).kode}-${(item as { dato: string }).dato}`,
          );
        } else if (
          field === "bonusOppdragBadges" &&
          "day" in item &&
          typeof (item as { day: number }).day === "number"
        ) {
          key = this.generateKey("bonus", (item as { day: number }).day);
        } else if (field === "eventyrBadges" && "eventyrId" in item) {
          key = this.generateKey(
            "eventyr",
            (item as { eventyrId: string }).eventyrId,
          );
        } else if (
          field === "earnedBadges" &&
          "badgeId" in item &&
          "timestamp" in item
        ) {
          key = this.generateKey(
            "badge",
            `${(item as { badgeId: string }).badgeId}-${(item as { timestamp: number }).timestamp}`,
          );
        } else if (field === "collectedSymbols" && "symbolId" in item) {
          key = this.generateKey(
            "symbol",
            (item as { symbolId: string }).symbolId,
          );
        } else if (
          field === "santaLetters" &&
          "day" in item &&
          typeof (item as { day: number }).day === "number"
        ) {
          key = this.generateKey("letter", (item as { day: number }).day);
        } else if (
          field === "brevfugler" &&
          "dag" in item &&
          "tidspunkt" in item
        ) {
          key = this.generateKey(
            "brevfugl",
            `${(item as { dag: number }).dag}-${(item as { tidspunkt: string }).tidspunkt}`,
          );
        } else {
          // Fallback: use field name + index
          key = this.generateKey(field, index);
        }

        return { _key: key, ...item };
      }
      return item;
    });
  }

  /**
   * Sync data to Sanity in background (non-blocking)
   */
  private syncInBackground(updates: Record<string, unknown>): void {
    // Ensure initialization is complete first
    const syncPromise = this.initPromise?.then(() => {
      return this.syncWithRetry(updates, 1).catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("SanityStorageAdapter: Background sync failed:", error);
        }
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
      // Prepare updates (serialize JSON string fields)
      const preparedUpdates = this.prepareUpdatesForSanity(updates);

      const response = await fetch("/api/session/sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: preparedUpdates,
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

  /**
   * Get friend names from userSession document
   */
  async getFriendNames(): Promise<string[]> {
    await this.waitForInitialization();
    try {
      const response = await fetch(
        `/api/session/friends?sessionId=${this.sessionId}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch friend names");
        }
        return [];
      }

      const data = (await response.json()) as { friendNames?: string[] };
      return data.friendNames || [];
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching friend names:", error);
      }
      return [];
    }
  }

  /**
   * Set friend names in userSession document
   */
  async setFriendNames(names: string[]): Promise<void> {
    await this.waitForInitialization();
    try {
      const response = await fetch("/api/session/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.sessionId,
          friendNames: names,
        }),
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Failed to update friend names");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error setting friend names:", error);
      }
      throw error;
    }
  }
}

/**
 * Factory function to create the appropriate storage adapter
 * Based on NEXT_PUBLIC_STORAGE_BACKEND environment variable
 *
 * @param sessionId - UUID session identifier (required for Sanity backend)
 */
export function createStorageAdapter(sessionId?: string): StorageAdapter {
  const backend = process.env.NEXT_PUBLIC_STORAGE_BACKEND || "localStorage";

  switch (backend) {
    case "sanity":
      if (!sessionId) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Sanity backend requires sessionId, falling back to localStorage",
          );
        }
        return new LocalStorageAdapter();
      }
      return new SanityStorageAdapter(sessionId);
    case "localStorage":
    default:
      return new LocalStorageAdapter();
  }
}
