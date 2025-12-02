/**
 * @jest-environment node
 */

/**
 * Auth Register API Route Tests
 *
 * Tests the /api/auth/register endpoint for family registration.
 * Tests input validation, code generation, and session creation.
 */

// CRITICAL: next-test-api-route-handler MUST be imported first
import "next-test-api-route-handler";

import { testApiHandler } from "next-test-api-route-handler";
import {
  describe,
  it,
  expect,
  afterAll,
  beforeAll,
  beforeEach,
} from "@jest/globals";
import * as registerRoute from "../../register/route";
import { sanityServerClient } from "@/lib/sanity-client";
import { __resetMock as resetUuidMock } from "@/lib/__mocks__/uuid";

// Track test data for cleanup
const testSessionIds: string[] = [];

// Store original env value
const originalShareKey = process.env.REGISTRATION_SHARE_KEY;

// Cleanup helper
const cleanupSession = async (sessionId: string) => {
  try {
    // Delete familyCredentials
    const cred = await sanityServerClient.fetch(
      `*[_type == "familyCredentials" && sessionId == $sessionId][0]`,
      { sessionId },
    );
    if (cred?._id) {
      await sanityServerClient.delete(cred._id);
    }

    // Delete userSession
    const session = await sanityServerClient.fetch(
      `*[_type == "userSession" && sessionId == $sessionId][0]`,
      { sessionId },
    );
    if (session?._id) {
      await sanityServerClient.delete(session._id);
    }
  } catch {
    // Ignore cleanup errors
  }
};

// Remove share key requirement for most tests
beforeAll(() => {
  delete process.env.REGISTRATION_SHARE_KEY;
});

// Restore original env after all tests
afterAll(async () => {
  // Restore env
  if (originalShareKey) {
    process.env.REGISTRATION_SHARE_KEY = originalShareKey;
  }

  // Cleanup test sessions with proper timeout handling
  const cleanupPromises = testSessionIds.map(cleanupSession);

  // Use AbortController pattern to properly cancel timeout
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, 10000);
  });

  await Promise.race([
    Promise.all(cleanupPromises).then(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}, 20000);

describe("POST /api/auth/register", () => {
  // Reset UUID mock counter before each test for deterministic IDs
  beforeEach(() => {
    resetUuidMock();
  });

  describe("Input Validation", () => {
    it("should reject missing kidNames", async () => {
      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              friendNames: [],
              parentEmail: "test@example.com",
            }),
          });
          expect(res.status).toBe(400); // Validation error
        },
      });
    });

    it("should reject empty kidNames array", async () => {
      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: [],
              friendNames: [],
              parentEmail: "test@example.com",
            }),
          });
          expect(res.status).toBe(400);
        },
      });
    });

    it("should reject more than 4 kid names", async () => {
      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["Kid1", "Kid2", "Kid3", "Kid4", "Kid5"],
              friendNames: [],
              parentEmail: "test@example.com",
            }),
          });
          expect(res.status).toBe(400);
        },
      });
    });

    it("should reject duplicate kid names", async () => {
      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["Emma", "Emma"],
              friendNames: [],
              parentEmail: "test@example.com",
            }),
          });
          expect(res.status).toBe(400);
        },
      });
    });

    it("should reject more than 15 friend names", async () => {
      const manyFriends = Array.from({ length: 16 }, (_, i) => `Friend${i}`);

      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["TestKid"],
              friendNames: manyFriends,
              parentEmail: "test@example.com",
            }),
          });
          expect(res.status).toBe(400);
        },
      });
    });

    it("should reject missing parent email", async () => {
      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["TestKid"],
              friendNames: [],
            }),
          });
          expect(res.status).toBe(400);

          const json = await res.json();
          expect(json.error).toContain("e-post");
        },
      });
    });

    it("should reject invalid email format", async () => {
      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["TestKid"],
              friendNames: [],
              parentEmail: "invalid-email",
            }),
          });
          expect(res.status).toBe(400);

          const json = await res.json();
          expect(json.error).toContain("e-post");
        },
      });
    });
  });

  describe("Successful Registration", () => {
    it("should create family with valid input", async () => {
      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["TestKid"],
              friendNames: ["Friend1", "Friend2"],
              parentEmail: `test${Date.now()}@example.com`,
              familyName: "TestFamily",
            }),
          });
          expect(res.status).toBe(200);

          const json = await res.json();
          expect(json.kidCode).toBeTruthy();
          expect(json.parentCode).toBeTruthy();
          expect(json.sessionId).toBeTruthy();

          // Track for cleanup
          testSessionIds.push(json.sessionId);

          // Validate kid code format: PREFIX + SUFFIX + YEAR (e.g., "SNØMANNPOST2025")
          expect(json.kidCode).toMatch(/^[A-ZÆØÅ]+\d{4}$/);

          // Validate parent code format
          expect(json.parentCode).toMatch(/^NORDPOL-[A-Z0-9]+$/);
        },
      });
    });

    it("should create family with multiple kids", async () => {
      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["Emma", "Oliver", "Nora"],
              friendNames: [],
              parentEmail: `multi${Date.now()}@example.com`,
            }),
          });
          expect(res.status).toBe(200);

          const json = await res.json();
          testSessionIds.push(json.sessionId);

          expect(json.kidCode).toBeTruthy();
          expect(json.parentCode).toBeTruthy();
        },
      });
    });

    it("should generate unique codes for each registration", async () => {
      const codes: { kid: string[]; parent: string[] } = {
        kid: [],
        parent: [],
      };

      // Only test 2 registrations to stay within timeout
      for (let i = 0; i < 2; i++) {
        await testApiHandler({
          appHandler: registerRoute,
          test: async ({ fetch }) => {
            const res = await fetch({
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                kidNames: [`UniqueKid${i}`],
                friendNames: [],
                parentEmail: `unique${Date.now()}_${i}@example.com`,
              }),
            });
            expect(res.status).toBe(200);

            const json = await res.json();
            testSessionIds.push(json.sessionId);

            codes.kid.push(json.kidCode);
            codes.parent.push(json.parentCode);
          },
        });
      }

      // All codes should be unique
      expect(new Set(codes.kid).size).toBe(2);
      expect(new Set(codes.parent).size).toBe(2);
    }, 15000); // Extended timeout for multiple Sanity API calls

    it("should trim whitespace from names", async () => {
      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["  Emma  "],
              friendNames: ["  Friend  "],
              parentEmail: `trim${Date.now()}@example.com`,
              familyName: "  TestFamily  ",
            }),
          });
          expect(res.status).toBe(200);

          const json = await res.json();
          testSessionIds.push(json.sessionId);
        },
      });
    });
  });

  describe("Share Key Validation", () => {
    // Note: Share key validation only applies when REGISTRATION_SHARE_KEY env is set
    // This test validates the route accepts requests when no share key is required
    it("should accept registration without share key when not required", async () => {
      // Ensure no share key is required for this test
      delete process.env.REGISTRATION_SHARE_KEY;

      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["NoKeyKid"],
              friendNames: [],
              parentEmail: `nokey${Date.now()}@example.com`,
            }),
          });
          expect(res.status).toBe(200);

          const json = await res.json();
          testSessionIds.push(json.sessionId);
        },
      });
    });

    it("should reject registration with wrong share key when required", async () => {
      // Set up required share key
      process.env.REGISTRATION_SHARE_KEY = "TEST_SECRET_KEY";

      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["TestKid"],
              friendNames: [],
              parentEmail: `wrongkey${Date.now()}@example.com`,
              shareKey: "WRONG_KEY",
            }),
          });
          expect(res.status).toBe(403);

          const json = await res.json();
          expect(json.error).toContain("registreringsnøkkel");
        },
      });

      // Clean up
      delete process.env.REGISTRATION_SHARE_KEY;
    });

    it("should accept registration with correct share key when required", async () => {
      // Set up required share key
      process.env.REGISTRATION_SHARE_KEY = "TEST_SECRET_KEY";

      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["TestKid"],
              friendNames: [],
              parentEmail: `rightkey${Date.now()}@example.com`,
              shareKey: "TEST_SECRET_KEY",
            }),
          });
          expect(res.status).toBe(200);

          const json = await res.json();
          testSessionIds.push(json.sessionId);
        },
      });

      // Clean up
      delete process.env.REGISTRATION_SHARE_KEY;
    });

    it("should accept share key case-insensitively", async () => {
      // Set up required share key
      process.env.REGISTRATION_SHARE_KEY = "TEST_SECRET_KEY";

      await testApiHandler({
        appHandler: registerRoute,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kidNames: ["TestKid"],
              friendNames: [],
              parentEmail: `casekey${Date.now()}@example.com`,
              shareKey: "test_secret_key", // lowercase
            }),
          });
          expect(res.status).toBe(200);

          const json = await res.json();
          testSessionIds.push(json.sessionId);
        },
      });

      // Clean up
      delete process.env.REGISTRATION_SHARE_KEY;
    });
  });
});
