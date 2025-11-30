#!/usr/bin/env tsx
/**
 * Cleanup Test Sessions Script
 *
 * Removes test sessions from Sanity created in the last 24 hours.
 * Useful for cleaning up after test runs or development sessions.
 *
 * Usage:
 *   pnpm cleanup:test-sessions
 *
 * Environment:
 *   Requires .env.local with Sanity credentials
 *
 * Strategy:
 *   Deletes all sessions with lastUpdated within last 24 hours.
 *   Production sessions should be older and are preserved.
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local BEFORE importing sanity-client
config({ path: resolve(__dirname, "../.env.local") });

async function cleanupTestSessions() {
  // Dynamic import to ensure env vars are loaded first
  const { sanityServerClient } = await import("../src/lib/sanity-client");

  console.log("🔍 Searching for test sessions...");

  try {
    // Find all sessions created in the last 24 hours (likely test sessions)
    // Production sessions would be older and have more activity
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const testSessions = await sanityServerClient.fetch<
      Array<{ _id: string; sessionId: string; lastUpdated: string }>
    >(
      `*[_type == "userSession" && lastUpdated > $oneDayAgo] | order(lastUpdated desc) { _id, sessionId, lastUpdated }`,
      { oneDayAgo },
      {
        perspective: "published",
        useCdn: false,
      },
    );

    if (testSessions.length === 0) {
      console.log("✅ No recent test sessions found. Database is clean!");
      return;
    }

    console.log(
      `📋 Found ${testSessions.length} sessions from last 24 hours:`,
    );
    testSessions.forEach((session, index) => {
      console.log(
        `   ${index + 1}. ${session.sessionId.slice(0, 16)}... (${session.lastUpdated})`,
      );
    });

    console.log("\n🗑️  Deleting test sessions...");

    // Delete sessions in batches
    const batchSize = 10;
    let deleted = 0;
    let failed = 0;

    for (let i = 0; i < testSessions.length; i += batchSize) {
      const batch = testSessions.slice(i, i + batchSize);

      try {
        // Delete batch using transaction
        const transaction = sanityServerClient.transaction();
        batch.forEach((session) => {
          transaction.delete(session._id);
        });
        await transaction.commit();

        deleted += batch.length;
        console.log(
          `   ✓ Deleted batch ${Math.floor(i / batchSize) + 1} (${batch.length} sessions)`,
        );
      } catch (error) {
        failed += batch.length;
        console.error(
          `   ✗ Failed to delete batch ${Math.floor(i / batchSize) + 1}:`,
          error,
        );
      }
    }

    console.log(`\n✅ Cleanup complete: ${deleted} deleted, ${failed} failed`);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

// Run cleanup
cleanupTestSessions().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
