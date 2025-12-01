/**
 * Storage Adapter Tests
 *
 * Tests the storage adapter layer, focusing on:
 * - Array/Record conversion for Sanity compatibility
 * - _key generation for Sanity array items
 * - Bidirectional data transformation
 * - Complex data type handling
 *
 * These tests verify that data is correctly transformed between:
 * - In-game format: Record<string, number> (e.g., {topic: day})
 * - Sanity format: Array<{_key, topic, day}> (with required _key)
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalStorageAdapter, SanityStorageAdapter } from "../storage-adapter";

// NOTE: SanityStorageAdapter tests are skipped because mocking fetch with proper
// TypeScript types in Jest is complex. The adapter logic is tested indirectly through:
// 1. Manual testing with real Sanity backend
// 2. Integration tests in storage-manager.test.ts (localStorage mode)
// 3. API route tests that verify Sanity data structure

describe("LocalStorage Adapter", () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageAdapter();
  });

  it("should set and get primitive values", () => {
    adapter.set("test-key", "test-value");
    expect(adapter.get("test-key", "default")).toBe("test-value");
  });

  it("should set and get objects", () => {
    const obj = { name: "Alice", age: 10 };
    adapter.set("test-obj", obj);
    expect(adapter.get("test-obj", {})).toEqual(obj);
  });

  it("should set and get arrays", () => {
    const arr = [1, 2, 3];
    adapter.set("test-arr", arr);
    expect(adapter.get("test-arr", [])).toEqual(arr);
  });

  it("should return default value for missing keys", () => {
    expect(adapter.get("missing", "default")).toBe("default");
  });

  it("should check if key exists", () => {
    adapter.set("exists", true);
    expect(adapter.has("exists")).toBe(true);
    expect(adapter.has("missing")).toBe(false);
  });

  it("should remove keys", () => {
    adapter.set("to-remove", "value");
    expect(adapter.has("to-remove")).toBe(true);
    adapter.remove("to-remove");
    expect(adapter.has("to-remove")).toBe(false);
  });

  it("should clear all data", () => {
    adapter.set("key1", "value1");
    adapter.set("key2", "value2");
    adapter.clear();
    expect(adapter.has("key1")).toBe(false);
    expect(adapter.has("key2")).toBe(false);
  });
});

describe("SanityStorageAdapter - Array/Record Conversion", () => {
  let adapter: SanityStorageAdapter;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  // Mock fetch globally for these tests
  beforeEach(() => {
    localStorage.clear();

    // Mock fetch to simulate Sanity API
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;
  });

  describe("topicUnlocks conversion", () => {
    it("should convert Record to Array with _key when saving", async () => {
      // Mock session creation and sync
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response) // GET session (not found)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessionId: "test-session" }),
        } as unknown as Response) // POST session (create)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as unknown as Response); // PATCH sync

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      // Set topicUnlocks as Record (in-game format)
      const topicUnlocks = {
        "brevfugl-system": 1,
        "nissenet-intro": 3,
      };
      adapter.set("nissekomm-topic-unlocks", topicUnlocks);

      // Wait for background sync
      await adapter.waitForPendingSyncs();

      // Verify PATCH request was made with array format + _key
      const patchCall = mockFetch.mock.calls.find(
        (call) =>
          call[0] === "/api/session/sync" &&
          (call[1] as RequestInit)?.method === "PATCH",
      );

      expect(patchCall).toBeDefined();
      const body = JSON.parse((patchCall?.[1] as RequestInit)?.body as string);

      expect(body.updates.topicUnlocks).toEqual([
        { _key: "topic-brevfugl-system", topic: "brevfugl-system", day: 1 },
        { _key: "topic-nissenet-intro", topic: "nissenet-intro", day: 3 },
      ]);
    });

    it("should convert Array to Record when loading from Sanity", async () => {
      // Mock session with topicUnlocks as array (Sanity format)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionId: "test-session",
          topicUnlocks: [
            { _key: "topic-test1", topic: "test1", day: 5 },
            { _key: "topic-test2", topic: "test2", day: 7 },
          ],
        }),
      } as unknown as Response);

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      // Should convert array to Record internally
      const topicUnlocks = adapter.get<Record<string, number>>(
        "nissekomm-topic-unlocks",
        {},
      );

      expect(topicUnlocks).toEqual({
        test1: 5,
        test2: 7,
      });
    });
  });

  describe("decryptionAttempts conversion", () => {
    it("should convert Record to Array with _key when saving", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessionId: "test-session" }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as unknown as Response);

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      const attempts = {
        "frosne-koder": 3,
        stjernetegn: 1,
      };
      adapter.set("nissekomm-decryption-attempts", attempts);

      await adapter.waitForPendingSyncs();

      const patchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) =>
          call[0] === "/api/session/sync" &&
          (call[1] as RequestInit)?.method === "PATCH",
      ) as [string, { body: string }] | undefined;

      expect(patchCall).toBeDefined();
      const body = JSON.parse(patchCall![1].body);
      expect(body.updates.decryptionAttempts).toEqual([
        {
          _key: "decrypt-frosne-koder",
          challengeId: "frosne-koder",
          attemptCount: 3,
        },
        {
          _key: "decrypt-stjernetegn",
          challengeId: "stjernetegn",
          attemptCount: 1,
        },
      ]);
    });

    it("should convert Array to Record when loading", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          json: async () => ({
            sessionId: "test-session",
            decryptionAttempts: [
              {
                _key: "decrypt-challenge1",
                challengeId: "challenge1",
                attemptCount: 5,
              },
              {
                _key: "decrypt-challenge2",
                challengeId: "challenge2",
                attemptCount: 2,
              },
            ],
          }),
        } as unknown as Response,
      );

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      const attempts = adapter.get<Record<string, number>>(
        "nissekomm-decryption-attempts",
        {},
      );

      expect(attempts).toEqual({
        challenge1: 5,
        challenge2: 2,
      });
    });
  });

  describe("failedAttempts conversion", () => {
    it("should convert Record to Array with _key when saving", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessionId: "test-session" }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as unknown as Response);

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      const failed = {
        1: 2,
        5: 3,
        12: 1,
      };
      adapter.set("nissekomm-failed-attempts", failed);

      await adapter.waitForPendingSyncs();

      const patchCall = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.find(
        (call) =>
          call[0] === "/api/session/sync" &&
          (call[1] as RequestInit)?.method === "PATCH",
      );

      const body = JSON.parse((patchCall?.[1] as RequestInit)?.body as string);
      expect(body.updates.failedAttempts).toEqual([
        { _key: "failed-1", day: 1, attemptCount: 2 },
        { _key: "failed-5", day: 5, attemptCount: 3 },
        { _key: "failed-12", day: 12, attemptCount: 1 },
      ]);
    });

    it("should convert Array to Record when loading", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          json: async () => ({
            sessionId: "test-session",
            failedAttempts: [
              { _key: "failed-3", day: 3, attemptCount: 4 },
              { _key: "failed-7", day: 7, attemptCount: 2 },
            ],
          }),
        } as unknown as Response,
      );

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      const failed = adapter.get<Record<number, number>>(
        "nissekomm-failed-attempts",
        {},
      );

      expect(failed).toEqual({
        3: 4,
        7: 2,
      });
    });
  });

  describe("_key generation for other arrays", () => {
    it("should add _key to submittedCodes", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessionId: "test-session" }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as unknown as Response);

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      const codes = [
        { kode: "TEST1", dato: "2025-12-01T10:00:00Z" },
        { kode: "TEST2", dato: "2025-12-02T10:00:00Z" },
      ];
      adapter.set("nissekomm-codes", codes);

      await adapter.waitForPendingSyncs();

      const patchCall = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.find(
        (call) =>
          call[0] === "/api/session/sync" &&
          (call[1] as RequestInit)?.method === "PATCH",
      );

      const body = JSON.parse((patchCall?.[1] as RequestInit)?.body as string);
      expect(body.updates.submittedCodes).toEqual([
        {
          _key: "code-TEST1-2025-12-01T10:00:00Z",
          kode: "TEST1",
          dato: "2025-12-01T10:00:00Z",
        },
        {
          _key: "code-TEST2-2025-12-02T10:00:00Z",
          kode: "TEST2",
          dato: "2025-12-02T10:00:00Z",
        },
      ]);
    });

    it("should add _key to bonusOppdragBadges", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessionId: "test-session" }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as unknown as Response);

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      const badges = [
        { day: 11, icon: "🚨", navn: "Antenna Expert" },
        { day: 16, icon: "📦", navn: "Inventory Master" },
      ];
      adapter.set("nissekomm-bonusoppdrag-badges", badges);

      await adapter.waitForPendingSyncs();

      const patchCall = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.find(
        (call) =>
          call[0] === "/api/session/sync" &&
          (call[1] as RequestInit)?.method === "PATCH",
      );

      const body = JSON.parse((patchCall?.[1] as RequestInit)?.body as string);
      expect(body.updates.bonusOppdragBadges).toEqual([
        { _key: "bonus-11", day: 11, icon: "🚨", navn: "Antenna Expert" },
        { _key: "bonus-16", day: 16, icon: "📦", navn: "Inventory Master" },
      ]);
    });

    it("should add _key to eventyrBadges", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessionId: "test-session" }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as unknown as Response);

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      const badges = [
        { eventyrId: "adventureA", icon: "📖", navn: "Story Hero" },
        { eventyrId: "adventureB", icon: "⭐", navn: "Quest Complete" },
      ];
      adapter.set("nissekomm-eventyr-badges", badges);

      await adapter.waitForPendingSyncs();

      const patchCall = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.find(
        (call) =>
          call[0] === "/api/session/sync" &&
          (call[1] as RequestInit)?.method === "PATCH",
      );

      const body = JSON.parse((patchCall?.[1] as RequestInit)?.body as string);
      expect(body.updates.eventyrBadges).toEqual([
        {
          _key: "eventyr-adventureA",
          eventyrId: "adventureA",
          icon: "📖",
          navn: "Story Hero",
        },
        {
          _key: "eventyr-adventureB",
          eventyrId: "adventureB",
          icon: "⭐",
          navn: "Quest Complete",
        },
      ]);
    });

    it("should add _key to earnedBadges", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessionId: "test-session" }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as unknown as Response);

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      const badges = [
        { badgeId: "badge1", timestamp: 1701432000000 },
        { badgeId: "badge2", timestamp: 1701518400000 },
      ];
      adapter.set("nissekomm-earned-badges", badges);

      await adapter.waitForPendingSyncs();

      const patchCall = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.find(
        (call) =>
          call[0] === "/api/session/sync" &&
          (call[1] as RequestInit)?.method === "PATCH",
      );

      const body = JSON.parse((patchCall?.[1] as RequestInit)?.body as string);
      expect(body.updates.earnedBadges).toEqual([
        {
          _key: "badge-badge1-1701432000000",
          badgeId: "badge1",
          timestamp: 1701432000000,
        },
        {
          _key: "badge-badge2-1701518400000",
          badgeId: "badge2",
          timestamp: 1701518400000,
        },
      ]);
    });

    it("should add _key to collectedSymbols", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessionId: "test-session" }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as unknown as Response);

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      const symbols = [
        { symbolId: "symbol1", symbolIcon: "❄️", description: "Snowflake" },
        { symbolId: "symbol2", symbolIcon: "⭐", description: "Star" },
      ];
      adapter.set("nissekomm-collected-symbols", symbols);

      await adapter.waitForPendingSyncs();

      const patchCall = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.find(
        (call) =>
          call[0] === "/api/session/sync" &&
          (call[1] as RequestInit)?.method === "PATCH",
      );

      const body = JSON.parse((patchCall?.[1] as RequestInit)?.body as string);
      expect(body.updates.collectedSymbols).toEqual([
        {
          _key: "symbol-symbol1",
          symbolId: "symbol1",
          symbolIcon: "❄️",
          description: "Snowflake",
        },
        {
          _key: "symbol-symbol2",
          symbolId: "symbol2",
          symbolIcon: "⭐",
          description: "Star",
        },
      ]);
    });

    it("should preserve existing _key in arrays", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessionId: "test-session" }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as unknown as Response);

      adapter = new SanityStorageAdapter("test-session");
      await adapter.waitForInitialization();

      const codesWithKeys = [
        { _key: "existing-key-1", kode: "TEST1", dato: "2025-12-01T10:00:00Z" },
      ];
      adapter.set("nissekomm-codes", codesWithKeys);

      await adapter.waitForPendingSyncs();

      const patchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) =>
          call[0] === "/api/session/sync" &&
          (call[1] as RequestInit)?.method === "PATCH",
      ) as [string, { body: string }] | undefined;

      expect(patchCall).toBeDefined();
      const body = JSON.parse(patchCall![1].body);
      // Should preserve existing _key
      expect(body.updates.submittedCodes[0]._key).toBe("existing-key-1");
    });
  });

  describe("Bidirectional conversion integrity", () => {
    it("should roundtrip topicUnlocks correctly", async () => {
      // Save as Record
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessionId: "test-session" }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as unknown as Response);

      const adapter1 = new SanityStorageAdapter("test-session");
      await adapter1.waitForInitialization();

      const original = {
        "topic-a": 1,
        "topic-b": 2,
        "topic-c": 3,
      };
      adapter1.set("nissekomm-topic-unlocks", original);
      await adapter1.waitForPendingSyncs();

      // Extract what was sent to Sanity
      const patchCall = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.find(
        (call) =>
          call[0] === "/api/session/sync" &&
          (call[1] as RequestInit)?.method === "PATCH",
      );
      const sentToSanity = JSON.parse(
        (patchCall?.[1] as RequestInit)?.body as string,
      ).updates.topicUnlocks;

      // Load in new adapter instance (simulating cross-device)
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          json: async () => ({
            sessionId: "test-session",
            topicUnlocks: sentToSanity,
          }),
        } as unknown as Response,
      );

      const adapter2 = new SanityStorageAdapter("test-session");
      await adapter2.waitForInitialization();

      const loaded = adapter2.get<Record<string, number>>(
        "nissekomm-topic-unlocks",
        {},
      );

      // Should match original exactly
      expect(loaded).toEqual(original);
    });
  });
});
