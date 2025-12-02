/**
 * @jest-environment node
 */

/**
 * Family API Route Tests
 *
 * Tests the /api/family endpoint that returns non-sensitive family data.
 * Verifies that sensitive fields (codes, email) are never exposed.
 *
 * IMPORTANT: Requires NEXT_PUBLIC_STORAGE_BACKEND=sanity and valid Sanity credentials
 */

// CRITICAL: next-test-api-route-handler MUST be imported first
import "next-test-api-route-handler";

import { testApiHandler } from "next-test-api-route-handler";
import { describe, it, expect, afterAll } from "@jest/globals";
import * as familyRoute from "../route";
import { sanityServerClient } from "@/lib/sanity-client";
import { generateKidCode, generateParentCode } from "@/lib/code-generator";

// Must match SESSION_COOKIE_NAME in api-utils.ts
const SESSION_COOKIE_NAME = "nissekomm-session";

// Track test credentials for cleanup
const testCredentials: Array<{ sessionId: string; _id?: string }> = [];

const TEST_FAMILY_DATA = {
  familyName: "Testfamilien",
  kidNames: ["Ola", "Kari"],
  friendNames: ["Per", "Lise"],
  calendarEvents: [
    { dag: 6, hendelse: "Luciafrokost på skolen" },
    { dag: 13, hendelse: "Julekonsert" },
  ],
};

// Helper to create test credentials directly in Sanity
// Includes retry logic to wait for Sanity eventual consistency
const createTestCredentials = async (
  overrides: Partial<{
    familyName: string;
    kidNames: string[];
    friendNames: string[];
    calendarEvents: Array<{ dag: number; hendelse: string }>;
  }> = {},
) => {
  const sessionId = `test_family_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const kidCode = generateKidCode();
  const parentCode = generateParentCode();

  const result = await sanityServerClient.create({
    _type: "familyCredentials",
    sessionId,
    kidCode,
    parentCode,
    parentEmail: "test@example.com",
    familyName: overrides.familyName ?? TEST_FAMILY_DATA.familyName,
    kidNames: overrides.kidNames ?? TEST_FAMILY_DATA.kidNames,
    friendNames: overrides.friendNames ?? TEST_FAMILY_DATA.friendNames,
    calendarEvents: overrides.calendarEvents ?? TEST_FAMILY_DATA.calendarEvents,
    createdAt: new Date().toISOString(),
  });

  testCredentials.push({ sessionId, _id: result._id });

  // Wait for Sanity eventual consistency - retry until queryable
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    const found = await sanityServerClient.fetch(
      `*[_type == "familyCredentials" && sessionId == $sessionId][0]`,
      { sessionId },
      { useCdn: false, cache: "no-store", next: { revalidate: 0 } },
    );
    if (found) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { sessionId, kidCode, parentCode, _id: result._id };
};

// Cleanup after all tests
afterAll(async () => {
  const cleanupPromises = testCredentials.map(async (cred) => {
    try {
      if (cred._id) {
        await sanityServerClient.delete(cred._id);
      } else {
        const doc = await sanityServerClient.fetch(
          `*[_type == "familyCredentials" && sessionId == $sessionId][0]`,
          { sessionId: cred.sessionId },
        );
        if (doc?._id) {
          await sanityServerClient.delete(doc._id);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, 8000);
  });

  await Promise.race([
    Promise.all(cleanupPromises).then(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}, 15000);

describe("GET /api/family", () => {
  it("should return empty defaults when no session cookie", async () => {
    await testApiHandler({
      appHandler: familyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.familyName).toBeUndefined();
        expect(json.kidNames).toEqual([]);
        expect(json.friendNames).toEqual([]);
        expect(json.calendarEvents).toEqual([]);
      },
    });
  });

  it("should return family data for valid session", async () => {
    const { sessionId } = await createTestCredentials();

    await testApiHandler({
      appHandler: familyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
          headers: {
            Cookie: `${SESSION_COOKIE_NAME}=${sessionId}`,
          },
        });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.familyName).toBe(TEST_FAMILY_DATA.familyName);
        expect(json.kidNames).toEqual(TEST_FAMILY_DATA.kidNames);
        expect(json.friendNames).toEqual(TEST_FAMILY_DATA.friendNames);
        expect(json.calendarEvents).toEqual(TEST_FAMILY_DATA.calendarEvents);
      },
    });
  });

  it("should NOT expose sensitive fields (kidCode, parentCode, parentEmail)", async () => {
    const { sessionId } = await createTestCredentials();

    await testApiHandler({
      appHandler: familyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
          headers: {
            Cookie: `${SESSION_COOKIE_NAME}=${sessionId}`,
          },
        });
        expect(res.status).toBe(200);

        const json = await res.json();

        // Verify sensitive fields are NOT present
        expect(json.kidCode).toBeUndefined();
        expect(json.parentCode).toBeUndefined();
        expect(json.parentEmail).toBeUndefined();
        expect(json.sessionId).toBeUndefined();

        // Also check they're not nested anywhere
        const jsonString = JSON.stringify(json);
        expect(jsonString).not.toContain("kidCode");
        expect(jsonString).not.toContain("parentCode");
        expect(jsonString).not.toContain("parentEmail");
        expect(jsonString).not.toContain("test@example.com");
      },
    });
  });

  it("should return empty defaults for session without credentials", async () => {
    // Use a random non-existent session ID
    const orphanSessionId = `orphan_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await testApiHandler({
      appHandler: familyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
          headers: {
            Cookie: `${SESSION_COOKIE_NAME}=${orphanSessionId}`,
          },
        });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.familyName).toBeUndefined();
        expect(json.kidNames).toEqual([]);
        expect(json.friendNames).toEqual([]);
        expect(json.calendarEvents).toEqual([]);
      },
    });
  });

  it("should handle partial family data gracefully", async () => {
    // Create credentials with minimal data (no optional fields)
    const minimalSessionId = `minimal_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const minimalResult = await sanityServerClient.create({
      _type: "familyCredentials",
      sessionId: minimalSessionId,
      kidCode: generateKidCode(),
      parentCode: generateParentCode(),
      createdAt: new Date().toISOString(),
      // No familyName, kidNames, friendNames, calendarEvents
    });

    testCredentials.push({
      sessionId: minimalSessionId,
      _id: minimalResult._id,
    });

    await testApiHandler({
      appHandler: familyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
          headers: {
            Cookie: `${SESSION_COOKIE_NAME}=${minimalSessionId}`,
          },
        });
        expect(res.status).toBe(200);

        const json = await res.json();
        // Should return empty arrays for missing array fields
        expect(json.kidNames).toEqual([]);
        expect(json.friendNames).toEqual([]);
        expect(json.calendarEvents).toEqual([]);
        // familyName can be undefined
        expect(json.familyName).toBeUndefined();
      },
    });
  });

  it("should return calendar events in correct structure", async () => {
    const { sessionId } = await createTestCredentials();

    await testApiHandler({
      appHandler: familyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
          headers: {
            Cookie: `${SESSION_COOKIE_NAME}=${sessionId}`,
          },
        });
        expect(res.status).toBe(200);

        const json = await res.json();

        // Verify calendar event structure
        expect(Array.isArray(json.calendarEvents)).toBe(true);
        json.calendarEvents.forEach(
          (event: { dag: number; hendelse: string }) => {
            expect(typeof event.dag).toBe("number");
            expect(event.dag).toBeGreaterThanOrEqual(1);
            expect(event.dag).toBeLessThanOrEqual(24);
            expect(typeof event.hendelse).toBe("string");
          },
        );
      },
    });
  });
});
