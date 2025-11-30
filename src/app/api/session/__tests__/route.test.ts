/**
 * @jest-environment node
 */

/**
 * Session API Route Tests
 *
 * Tests the /api/session endpoints using real Sanity backend (no mocking).
 * Covers GET, POST, and DELETE operations with basic cookie validation.
 *
 * IMPORTANT: Requires NEXT_PUBLIC_STORAGE_BACKEND=sanity and valid Sanity credentials
 */

// CRITICAL: next-test-api-route-handler MUST be imported first
import "next-test-api-route-handler";

import { testApiHandler } from "next-test-api-route-handler";
import { describe, it, expect, afterAll } from "@jest/globals";
import * as sessionRoute from "../route";
import { sanityServerClient } from "@/lib/sanity-client";
import { hashPassword } from "@/lib/password-utils";

// Track test sessions for cleanup
const testSessions = new Set<string>();

// Helper to generate unique sessionId
const generateTestSessionId = async () => {
  const password = `TEST_SESSION_${Date.now()}_${Math.random()}`;
  const sessionId = await hashPassword(password);
  testSessions.add(sessionId);
  return sessionId;
};

describe("GET /api/session", () => {
  it("should return 404 when no sessionId provided", async () => {
    await testApiHandler({
      appHandler: sessionRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toBe("No session ID in cookie or query");
      },
    });
  });

  it("should fetch session by query parameter", async () => {
    const sessionId = await generateTestSessionId();

    // Create session first
    await testApiHandler({
      appHandler: sessionRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });
        expect(res.status).toBe(201);
      },
    });

    // Fetch it back
    await testApiHandler({
      appHandler: sessionRoute,
      url: `/api/session?sessionId=${sessionId}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.sessionId).toBe(sessionId);
        expect(json._type).toBe("userSession");
      },
    });
  });

  it("should return 404 for non-existent session", async () => {
    const fakeSessionId = "nonexistent123";

    await testApiHandler({
      appHandler: sessionRoute,
      url: `/api/session?sessionId=${fakeSessionId}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toBe("Session not found");
      },
    });
  });
});

describe("POST /api/session", () => {
  it("should create new session with default values", async () => {
    const sessionId = await generateTestSessionId();

    await testApiHandler({
      appHandler: sessionRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });

        expect(res.status).toBe(201);
        const json = await res.json();

        // Verify structure
        expect(json._type).toBe("userSession");
        expect(json.sessionId).toBe(sessionId);
        expect(json.authenticated).toBe(false);
        expect(json.soundsEnabled).toBe(true);
        expect(json.musicEnabled).toBe(false);
        expect(Array.isArray(json.submittedCodes)).toBe(true);
        expect(Array.isArray(json.viewedEmails)).toBe(true);
        expect(json.submittedCodes.length).toBe(0);
      },
    });
  });

  it("should set session cookie", async () => {
    const sessionId = await generateTestSessionId();

    await testApiHandler({
      appHandler: sessionRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });

        expect(res.status).toBe(201);

        // Check Set-Cookie header
        const setCookie = res.headers.get("set-cookie");
        expect(setCookie).toBeTruthy();
        expect(setCookie).toContain("nissekomm-session=");
        expect(setCookie).toContain(sessionId);
        expect(setCookie).toContain("SameSite=lax");
      },
    });
  });

  it("should return 400 when sessionId missing", async () => {
    await testApiHandler({
      appHandler: sessionRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("sessionId required");
      },
    });
  });
});

describe("DELETE /api/session", () => {
  it("should delete session by sessionId", async () => {
    const sessionId = await generateTestSessionId();

    // Create session
    await testApiHandler({
      appHandler: sessionRoute,
      test: async ({ fetch }) => {
        await fetch({
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });
      },
    });

    // Delete it
    await testApiHandler({
      appHandler: sessionRoute,
      url: `/api/session?sessionId=${sessionId}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "DELETE" });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.sessionId).toBe(sessionId);
      },
    });

    // Verify deleted
    await testApiHandler({
      appHandler: sessionRoute,
      url: `/api/session?sessionId=${sessionId}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(404);
      },
    });
  });

  it("should return 400 when sessionId missing", async () => {
    await testApiHandler({
      appHandler: sessionRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "DELETE" });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("sessionId required");
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
