/**
 * @jest-environment node
 */

/**
 * Session Sync API Route Tests
 *
 * Tests the /api/session/sync endpoint using real Sanity backend (no mocking).
 * Covers PATCH operations with field updates and error scenarios.
 *
 * IMPORTANT: Requires NEXT_PUBLIC_STORAGE_BACKEND=sanity and valid Sanity credentials
 */

// CRITICAL: next-test-api-route-handler MUST be imported first
import "next-test-api-route-handler";

import { testApiHandler } from "next-test-api-route-handler";
import { describe, it, expect, afterAll } from "@jest/globals";
import * as syncRoute from "../route";
import * as sessionRoute from "../../route";
import { sanityServerClient } from "@/lib/sanity-client";
import { hashPassword } from "@/lib/password-utils";

// Track test sessions for cleanup
const testSessions = new Set<string>();

// Helper to generate unique sessionId
const generateTestSessionId = async () => {
  const password = `TEST_SYNC_${Date.now()}_${Math.random()}`;
  const sessionId = await hashPassword(password);
  testSessions.add(sessionId);
  return sessionId;
};

// Helper to create a session
const createSession = async (sessionId: string) => {
  await testApiHandler({
    appHandler: sessionRoute,
    test: async ({ fetch }) => {
      await fetch({
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });
    },
  });
};

describe("PATCH /api/session/sync", () => {
  it("should update session fields", async () => {
    const sessionId = await generateTestSessionId();
    await createSession(sessionId);

    await testApiHandler({
      appHandler: syncRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({
            sessionId,
            updates: {
              soundsEnabled: false,
              musicEnabled: true,
            },
          }),
        });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.session.soundsEnabled).toBe(false);
        expect(json.session.musicEnabled).toBe(true);
      },
    });
  });

  it("should automatically add lastUpdated timestamp", async () => {
    const sessionId = await generateTestSessionId();
    await createSession(sessionId);

    const beforeUpdate = new Date().toISOString();

    await testApiHandler({
      appHandler: syncRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({
            sessionId,
            updates: { soundsEnabled: false },
          }),
        });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.session.lastUpdated).toBeTruthy();
        expect(
          new Date(json.session.lastUpdated).getTime(),
        ).toBeGreaterThanOrEqual(new Date(beforeUpdate).getTime());
      },
    });
  });

  it("should persist updates to Sanity", async () => {
    const sessionId = await generateTestSessionId();
    await createSession(sessionId);

    // Update via sync endpoint
    await testApiHandler({
      appHandler: syncRoute,
      test: async ({ fetch }) => {
        await fetch({
          method: "PATCH",
          body: JSON.stringify({
            sessionId,
            updates: { soundsEnabled: false },
          }),
        });
      },
    });

    // Verify via GET endpoint
    await testApiHandler({
      appHandler: sessionRoute,
      url: `/api/session?sessionId=${sessionId}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        const json = await res.json();
        expect(json.soundsEnabled).toBe(false);
      },
    });
  });

  it("should return 401 when sessionId missing", async () => {
    await testApiHandler({
      appHandler: syncRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({
            updates: { soundsEnabled: false },
          }),
        });

        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe("No session ID in cookie or body");
      },
    });
  });

  it("should return 400 when updates missing", async () => {
    const sessionId = await generateTestSessionId();

    await testApiHandler({
      appHandler: syncRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({ sessionId }),
        });

        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("updates object required");
      },
    });
  });

  it("should return 404 for non-existent session", async () => {
    const fakeSessionId = "nonexistent123";

    await testApiHandler({
      appHandler: syncRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({
            sessionId: fakeSessionId,
            updates: { soundsEnabled: false },
          }),
        });

        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toBe("Session not found");
      },
    });
  });

  it("should update array fields", async () => {
    const sessionId = await generateTestSessionId();
    await createSession(sessionId);

    await testApiHandler({
      appHandler: syncRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({
            sessionId,
            updates: {
              submittedCodes: [
                { kode: "CODE1", dato: new Date().toISOString() },
              ],
              viewedEmails: [1, 2, 3],
            },
          }),
        });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.session.submittedCodes.length).toBe(1);
        expect(json.session.viewedEmails.length).toBe(3);
      },
    });
  });
});

// Cleanup test sessions from Sanity
afterAll(async () => {
  console.log(`Cleaning up ${testSessions.size} test sessions...`);
  let successCount = 0;
  let failCount = 0;

  for (const sessionId of testSessions) {
    try {
      await sanityServerClient.delete({
        query: `*[_type == "userSession" && sessionId == $sessionId]`,
        params: { sessionId },
      });
      successCount++;
    } catch (error) {
      failCount++;
      console.warn(`Failed to delete session ${sessionId}:`, error);
    }
  }

  console.log(`Cleanup complete: ${successCount} deleted, ${failCount} failed`);
  testSessions.clear();
}, 30000);
