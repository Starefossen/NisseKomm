/**
 * @jest-environment node
 */

/**
 * Auth Login API Route Tests
 *
 * Tests the /api/auth/login endpoint for kid and parent code validation.
 * Tests both localStorage and Sanity backend modes.
 */

// CRITICAL: next-test-api-route-handler MUST be imported first
import "next-test-api-route-handler";

import { testApiHandler } from "next-test-api-route-handler";
import { describe, it, expect, afterAll, beforeAll } from "@jest/globals";
import * as loginRoute from "../../login/route";
import { sanityServerClient } from "@/lib/sanity-client";
import { generateKidCode, generateParentCode } from "@/lib/code-generator";

// Track test data for cleanup
const testCredentials: Array<{ sessionId: string }> = [];

// Helper to create test credentials directly in Sanity
const createTestCredentials = async () => {
  const sessionId = `test_login_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const kidCode = generateKidCode();
  const parentCode = generateParentCode();

  await sanityServerClient.create({
    _type: "familyCredentials",
    sessionId,
    kidCode,
    parentCode,
    familyName: "Test Login Family",
    kidName: "Test Kid",
    createdAt: new Date().toISOString(),
  });

  testCredentials.push({ sessionId });

  return { sessionId, kidCode, parentCode };
};

// Cleanup after all tests
afterAll(async () => {
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

  await Promise.race([
    Promise.all(cleanupPromises),
    new Promise((resolve) => setTimeout(resolve, 8000)),
  ]);
}, 15000);

describe("POST /api/auth/login", () => {
  describe("Input Validation", () => {
    it("should reject missing code", async () => {
      await testApiHandler({
        appHandler: loginRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          expect(res.status).toBe(400);

          const json = await res.json();
          expect(json.error).toBeTruthy();
        },
      });
    });

    it("should reject empty code", async () => {
      await testApiHandler({
        appHandler: loginRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: "" }),
          });
          expect(res.status).toBe(400);
        },
      });
    });

    it("should reject invalid code format", async () => {
      await testApiHandler({
        appHandler: loginRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: "invalid-format" }),
          });
          expect(res.status).toBe(401);

          const json = await res.json();
          expect(json.error).toContain("Ugyldig kode");
        },
      });
    });
  });

  describe("Kid Code Login", () => {
    it("should accept valid kid code and return session with kid role", async () => {
      const { sessionId, kidCode } = await createTestCredentials();

      await testApiHandler({
        appHandler: loginRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: kidCode }),
          });
          expect(res.status).toBe(200);

          const json = await res.json();
          expect(json.sessionId).toBe(sessionId);
          expect(json.role).toBe("kid");
        },
      });
    });

    it("should be case-insensitive for kid codes", async () => {
      const { sessionId, kidCode } = await createTestCredentials();

      await testApiHandler({
        appHandler: loginRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: kidCode.toLowerCase() }),
          });
          expect(res.status).toBe(200);

          const json = await res.json();
          expect(json.sessionId).toBe(sessionId);
          expect(json.role).toBe("kid");
        },
      });
    });

    it("should reject non-existent kid code", async () => {
      await testApiHandler({
        appHandler: loginRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: "NONEXISTENT2025" }),
          });
          expect(res.status).toBe(401);
        },
      });
    });
  });

  describe("Parent Code Login", () => {
    it("should accept valid parent code and return session with parent role", async () => {
      const { sessionId, parentCode } = await createTestCredentials();

      await testApiHandler({
        appHandler: loginRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: parentCode }),
          });
          expect(res.status).toBe(200);

          const json = await res.json();
          expect(json.sessionId).toBe(sessionId);
          expect(json.role).toBe("parent");
        },
      });
    });

    it("should be case-insensitive for parent codes", async () => {
      const { sessionId, parentCode } = await createTestCredentials();

      await testApiHandler({
        appHandler: loginRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: parentCode.toLowerCase() }),
          });
          expect(res.status).toBe(200);

          const json = await res.json();
          expect(json.sessionId).toBe(sessionId);
          expect(json.role).toBe("parent");
        },
      });
    });

    it("should reject non-existent parent code", async () => {
      await testApiHandler({
        appHandler: loginRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: "NORDPOL-FAKECODE" }),
          });
          expect(res.status).toBe(401);
        },
      });
    });
  });
});
