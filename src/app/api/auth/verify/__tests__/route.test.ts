/**
 * @jest-environment node
 */

/**
 * Auth Verify API Route Tests
 *
 * Tests the /api/auth/verify endpoints for session and parent authentication.
 * Tests both GET (session verification) and POST (parent code verification).
 */

// CRITICAL: next-test-api-route-handler MUST be imported first
import "next-test-api-route-handler";

import { testApiHandler } from "next-test-api-route-handler";
import { describe, it, expect, afterAll } from "@jest/globals";
import * as verifyRoute from "../../verify/route";
import { sanityServerClient } from "@/lib/sanity-client";
import { generateKidCode, generateParentCode } from "@/lib/code-generator";

// Track test data for cleanup
const testCredentials: Array<{ sessionId: string; kidCode: string }> = [];

// Helper to create test credentials directly in Sanity
const createTestCredentials = async () => {
  const sessionId = `test_session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const kidCode = generateKidCode();
  const parentCode = generateParentCode();

  await sanityServerClient.create({
    _type: "familyCredentials",
    sessionId,
    kidCode,
    parentCode,
    familyName: "Test Family",
    kidName: "Test Kid",
    createdAt: new Date().toISOString(),
  });

  testCredentials.push({ sessionId, kidCode });

  return { sessionId, kidCode, parentCode };
};

// Cleanup after all tests - extended timeout for Sanity operations
afterAll(async () => {
  // Delete all test credentials with longer timeout
  const cleanupPromises = testCredentials.map(async (cred) => {
    try {
      const doc = await sanityServerClient.fetch(
        `*[_type == "familyCredentials" && sessionId == $sessionId][0]`,
        { sessionId: cred.sessionId },
      );
      if (doc?._id) {
        await sanityServerClient.delete(doc._id);
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  // Use AbortController pattern to properly cancel timeout
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, 8000);
  });

  await Promise.race([
    Promise.all(cleanupPromises).then(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}, 15000); // 15 second timeout for afterAll

describe("GET /api/auth/verify", () => {
  it("should return unauthenticated when no session cookie", async () => {
    await testApiHandler({
      appHandler: verifyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.authenticated).toBe(false);
        expect(json.role).toBeNull();
      },
    });
  });

  it("should return authenticated with kid role when valid session exists", async () => {
    const { sessionId } = await createTestCredentials();

    await testApiHandler({
      appHandler: verifyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
          headers: {
            Cookie: `nissekomm-session=${sessionId}`,
          },
        });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.authenticated).toBe(true);
        expect(json.role).toBe("kid");
        expect(json.sessionId).toBe(sessionId);
      },
    });
  });

  it("should return unauthenticated for invalid session", async () => {
    await testApiHandler({
      appHandler: verifyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "GET",
          headers: {
            Cookie: `nissekomm-session=invalid_session_id`,
          },
        });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.authenticated).toBe(false);
        expect(json.role).toBeNull();
      },
    });
  });
});

describe("POST /api/auth/verify (Parent Verification)", () => {
  it("should return isParent false when no session cookie", async () => {
    await testApiHandler({
      appHandler: verifyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: "SOME-CODE" }),
        });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.isParent).toBe(false);
      },
    });
  });

  it("should validate correct parent code", async () => {
    const { sessionId, parentCode } = await createTestCredentials();

    await testApiHandler({
      appHandler: verifyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            Cookie: `nissekomm-session=${sessionId}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: parentCode }),
        });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.isParent).toBe(true);

        // Should set parent auth cookie
        const setCookie = res.headers.get("set-cookie");
        expect(setCookie).toContain("nissekomm-parent-auth");
      },
    });
  });

  it("should reject incorrect parent code", async () => {
    const { sessionId } = await createTestCredentials();

    await testApiHandler({
      appHandler: verifyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            Cookie: `nissekomm-session=${sessionId}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: "WRONG-CODE" }),
        });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.isParent).toBe(false);

        // Should NOT set parent auth cookie
        const setCookie = res.headers.get("set-cookie");
        expect(setCookie).toBeNull();
      },
    });
  });

  it("should be case-insensitive for parent code", async () => {
    const { sessionId, parentCode } = await createTestCredentials();

    await testApiHandler({
      appHandler: verifyRoute,
      test: async ({ fetch }) => {
        // Test with lowercase
        const res = await fetch({
          method: "POST",
          headers: {
            Cookie: `nissekomm-session=${sessionId}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: parentCode.toLowerCase() }),
        });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.isParent).toBe(true);
      },
    });
  });

  it("should check existing parent auth cookie when no code provided", async () => {
    const { sessionId } = await createTestCredentials();

    await testApiHandler({
      appHandler: verifyRoute,
      test: async ({ fetch }) => {
        // Request without code but with parent auth cookie
        const res = await fetch({
          method: "POST",
          headers: {
            Cookie: `nissekomm-session=${sessionId}; nissekomm-parent-auth=${sessionId}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.isParent).toBe(true);
      },
    });
  });

  it("should return isParent false when parent auth cookie is invalid", async () => {
    const { sessionId } = await createTestCredentials();

    await testApiHandler({
      appHandler: verifyRoute,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            Cookie: `nissekomm-session=${sessionId}; nissekomm-parent-auth=wrong_session`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.isParent).toBe(false);
      },
    });
  });
});
