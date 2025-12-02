/**
 * Jest Global Teardown
 *
 * Runs after all tests complete to clean up Sanity test data.
 * This catches any test data that wasn't cleaned up by individual test suites.
 */

import { createClient } from "@sanity/client";

async function globalTeardown() {
  // Skip if not using Sanity backend
  if (process.env.NEXT_PUBLIC_STORAGE_BACKEND !== "sanity") {
    console.log("\n[Teardown] Skipping Sanity cleanup (localStorage mode)");
    return;
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_TOKEN;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "development";

  if (!projectId || !token) {
    console.log("\n[Teardown] Skipping cleanup (missing Sanity credentials)");
    return;
  }

  console.log("\n[Teardown] Cleaning up Sanity test data...");

  const sanity = createClient({
    projectId,
    dataset,
    apiVersion: "2024-11-01",
    token,
    useCdn: false,
  });

  try {
    // Find and delete test familyCredentials
    const testFamilies = await sanity.fetch<Array<{ _id: string }>>(
      `*[_type == "familyCredentials" && (
        parentEmail match "*@example.com" ||
        sessionId match "test_*" ||
        sessionId match "minimal_*" ||
        sessionId match "orphan_*"
      )] { _id }`,
    );

    // Find and delete test userSessions
    const testSessions = await sanity.fetch<Array<{ _id: string }>>(
      `*[_type == "userSession" && (
        sessionId match "test_*" ||
        sessionId match "minimal_*" ||
        sessionId match "orphan_*"
      )] { _id }`,
    );

    const totalToDelete = testFamilies.length + testSessions.length;

    if (totalToDelete === 0) {
      console.log("[Teardown] No test data to clean up");
      return;
    }

    // Delete in transaction
    const transaction = sanity.transaction();
    testFamilies.forEach((doc) => transaction.delete(doc._id));
    testSessions.forEach((doc) => transaction.delete(doc._id));

    await transaction.commit();

    console.log(
      `[Teardown] Cleaned up ${testFamilies.length} families, ${testSessions.length} sessions`,
    );
  } catch (error) {
    // Don't fail the test run if cleanup fails
    console.error("[Teardown] Cleanup error (non-fatal):", error);
  }
}

export default globalTeardown;
