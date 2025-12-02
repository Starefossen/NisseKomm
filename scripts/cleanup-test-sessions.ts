#!/usr/bin/env tsx
/**
 * Cleanup Test Sessions Script
 *
 * Removes test data from Sanity including:
 * - familyCredentials with @example.com emails (test registrations)
 * - familyCredentials with sessionId starting with "test_" (unit tests)
 * - userSession documents linked to test families or with test-like sessionIds
 *
 * Usage:
 *   # Clean up development dataset (default)
 *   pnpm cleanup:test-sessions
 *
 *   # Clean up specific dataset
 *   pnpm cleanup:test-sessions --dataset production
 *
 *   # Dry run - show what would be deleted
 *   pnpm cleanup:test-sessions --dry-run
 *
 * Environment:
 *   Requires .env.local with Sanity credentials
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient, type SanityClient } from "@sanity/client";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

interface CLIArgs {
  dataset: "development" | "production";
  dryRun: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);

  let dataset: "development" | "production" = "development";
  const datasetIndex = args.indexOf("--dataset");
  if (datasetIndex !== -1 && args[datasetIndex + 1]) {
    const value = args[datasetIndex + 1];
    if (value === "production" || value === "prod") {
      dataset = "production";
    }
  }

  const dryRun = args.includes("--dry-run");

  return { dataset, dryRun };
}

function createSanityClient(dataset: string): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_TOKEN;

  if (!projectId) {
    throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set");
  }
  if (!token) {
    throw new Error("SANITY_API_TOKEN is not set");
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: "2024-11-01",
    token,
    useCdn: false,
    perspective: "published",
  });
}

async function cleanupTestSessions() {
  const args = parseArgs();
  const sanity = createSanityClient(args.dataset);

  console.log("╔══════════════════════════════════════════╗");
  console.log("║  🧹 NisseKomm Test Data Cleanup          ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("");
  console.log(`📦 Dataset: ${args.dataset}`);
  console.log(`🔍 Mode: ${args.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log("");

  try {
    // Step 1: Find test familyCredentials
    // Matches:
    // - emails ending in @example.com (test registrations)
    // - sessionId starting with "test_" (unit tests: test_family_, test_login_, test_session_)
    // - sessionId starting with "minimal_" or "orphan_" (edge case tests)
    console.log("🔍 Searching for test family credentials...");

    const testFamilies = await sanity.fetch<
      Array<{
        _id: string;
        sessionId: string;
        parentEmail: string | null;
        familyName: string | null;
        createdAt: string;
      }>
    >(
      `*[_type == "familyCredentials" && (
        parentEmail match "*@example.com" ||
        sessionId match "test_*" ||
        sessionId match "minimal_*" ||
        sessionId match "orphan_*"
      )] | order(createdAt desc) {
        _id,
        sessionId,
        parentEmail,
        familyName,
        createdAt
      }`,
    );

    console.log(`   Found ${testFamilies.length} test families`);

    // Step 2: Find test userSessions
    // Matches:
    // - Sessions linked to test families
    // - Sessions with test-like sessionIds (hash patterns from test data)
    const testSessionIds = testFamilies.map((f) => f.sessionId).filter(Boolean);

    // Also find orphaned test sessions that might have been created directly
    const testSessions = await sanity.fetch<
      Array<{ _id: string; sessionId: string; createdAt: string }>
    >(
      `*[_type == "userSession" && (
        sessionId in $sessionIds ||
        sessionId match "test_*" ||
        sessionId match "minimal_*" ||
        sessionId match "orphan_*"
      )] { _id, sessionId, createdAt }`,
      { sessionIds: testSessionIds },
    );

    console.log(`   Found ${testSessions.length} test user sessions`);
    console.log("");

    if (testFamilies.length === 0 && testSessions.length === 0) {
      console.log("✅ No test data found. Database is clean!");
      return;
    }

    // List test families
    if (testFamilies.length > 0) {
      console.log("📋 Test families to delete:");
      testFamilies.slice(0, 20).forEach((family, index) => {
        const name = family.familyName || "Unnamed";
        const email = family.parentEmail || "no email";
        const date = new Date(family.createdAt).toLocaleDateString("no-NO");
        console.log(`   ${index + 1}. ${name} - ${email} [${date}]`);
      });
      if (testFamilies.length > 20) {
        console.log(`   ... and ${testFamilies.length - 20} more`);
      }
      console.log("");
    }

    // List test sessions
    if (testSessions.length > 0) {
      console.log("📋 Test sessions to delete:");
      testSessions.slice(0, 10).forEach((session, index) => {
        const shortId = session.sessionId.substring(0, 20) + "...";
        const date = new Date(session.createdAt).toLocaleDateString("no-NO");
        console.log(`   ${index + 1}. ${shortId} [${date}]`);
      });
      if (testSessions.length > 10) {
        console.log(`   ... and ${testSessions.length - 10} more`);
      }
      console.log("");
    }

    if (args.dryRun) {
      console.log("✅ Dry run complete. No data was deleted.");
      console.log(
        `   Would delete: ${testFamilies.length} families, ${testSessions.length} sessions`,
      );
      return;
    }

    // Delete in batches
    console.log("🗑️  Deleting test data...");

    const batchSize = 50;
    let deletedFamilies = 0;
    let deletedSessions = 0;

    // Delete familyCredentials
    for (let i = 0; i < testFamilies.length; i += batchSize) {
      const batch = testFamilies.slice(i, i + batchSize);
      try {
        const transaction = sanity.transaction();
        batch.forEach((family) => transaction.delete(family._id));
        await transaction.commit();
        deletedFamilies += batch.length;
        console.log(
          `   ✓ Deleted ${deletedFamilies}/${testFamilies.length} families`,
        );
      } catch (error) {
        console.error(`   ✗ Failed to delete family batch:`, error);
      }
    }

    // Delete userSessions
    for (let i = 0; i < testSessions.length; i += batchSize) {
      const batch = testSessions.slice(i, i + batchSize);
      try {
        const transaction = sanity.transaction();
        batch.forEach((session) => transaction.delete(session._id));
        await transaction.commit();
        deletedSessions += batch.length;
        console.log(
          `   ✓ Deleted ${deletedSessions}/${testSessions.length} sessions`,
        );
      } catch (error) {
        console.error(`   ✗ Failed to delete session batch:`, error);
      }
    }

    console.log("");
    console.log("════════════════════════════════════════════");
    console.log(
      `✅ Cleanup complete: ${deletedFamilies} families, ${deletedSessions} sessions deleted`,
    );
    console.log("════════════════════════════════════════════");
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
