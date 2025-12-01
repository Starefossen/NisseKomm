#!/usr/bin/env tsx
/**
 * Interactive Session Migration Script
 *
 * Converts existing SHA-256 hash-based sessions to new UUID-based system.
 * Prompts operator for missing data (family name, kid names, parent email, friend names).
 *
 * Usage:
 *   npx tsx scripts/migrate-sessions.ts [--dataset <production|development>] [--dry-run]
 *
 * Options:
 *   --dataset <name>  Target Sanity dataset (default: production)
 *   --dry-run         Preview migrations without committing changes
 *
 * Examples:
 *   npx tsx scripts/migrate-sessions.ts --dataset development
 *   npx tsx scripts/migrate-sessions.ts --dataset production --dry-run
 *
 * Process:
 * 1. Fetches all existing userSession documents from Sanity
 * 2. Identifies sessions with 64-char hex sessionId (old SHA-256 format)
 * 3. For each old session:
 *    - Generates new UUID sessionId
 *    - Generates kid code and parent code
 *    - Prompts for family name, kid names (1-4), parent email (optional), friend names (0-15)
 *    - Creates familyCredentials document
 *    - Updates userSession with new sessionId and friendNames
 * 4. Creates migration log for record-keeping
 */

import { createClient } from "@sanity/client";
import { v4 as uuidv4 } from "uuid";
import * as readline from "readline";
import { generateKidCode, generateParentCode } from "../src/lib/code-generator";

// Parse command-line arguments
function parseArgs(): { dataset: string; dryRun: boolean } {
  const args = process.argv.slice(2);
  let dataset = "production";
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dataset" && args[i + 1]) {
      dataset = args[i + 1];
      i++; // Skip next argument
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { dataset, dryRun };
}

const cliArgs = parseArgs();

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset =
  cliArgs.dataset || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-11-01";
const token = process.env.SANITY_API_TOKEN;
const dryRun = cliArgs.dryRun;

// Validate dataset
const validDatasets = ["production", "development"];
if (!validDatasets.includes(dataset)) {
  console.error(`❌ Invalid dataset: "${dataset}"`);
  console.error(`   Allowed values: ${validDatasets.join(", ")}`);
  process.exit(1);
}

if (!projectId || !token) {
  console.error("❌ Missing required environment variables:");
  console.error("   NEXT_PUBLIC_SANITY_PROJECT_ID");
  console.error("   SANITY_API_TOKEN");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

interface OldSession {
  _id: string;
  sessionId: string;
  [key: string]: unknown;
}

interface MigrationData {
  oldSessionId: string;
  newSessionId: string;
  kidCode: string;
  parentCode: string;
  familyName: string;
  kidNames: string[];
  friendNames: string[];
  parentEmail: string;
}

// Readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function promptKidNames(): Promise<string[]> {
  console.log("\n👦👧 Kid Names (1-4 required, max 20 chars each):");
  const names: string[] = [];

  for (let i = 1; i <= 4; i++) {
    const name = await prompt(`  Kid ${i} name (or press Enter to stop): `);
    if (!name) {
      if (i === 1) {
        console.log("⚠️  At least 1 kid name is required!");
        i--; // Retry
        continue;
      }
      break;
    }

    if (name.length > 20) {
      console.log("⚠️  Name too long (max 20 chars)");
      i--; // Retry
      continue;
    }

    names.push(name);
  }

  return names;
}

async function promptFriendNames(): Promise<string[]> {
  console.log("\n👫 Friend Names (0-15 optional, max 20 chars each):");
  const names: string[] = [];

  for (let i = 1; i <= 15; i++) {
    const name = await prompt(`  Friend ${i} name (or press Enter to stop): `);
    if (!name) break;

    if (name.length > 20) {
      console.log("⚠️  Name too long (max 20 chars)");
      i--; // Retry
      continue;
    }

    names.push(name);
  }

  return names;
}

async function migrateSession(
  session: OldSession,
): Promise<MigrationData | null> {
  console.log("\n" + "=".repeat(60));
  console.log(`📦 Migrating Session: ${session.sessionId}`);
  console.log("=".repeat(60));

  // Generate new credentials
  const newSessionId = uuidv4();

  // Fetch existing codes to avoid collisions
  const existingCredentials = await client.fetch<
    Array<{ kidCode: string; parentCode: string }>
  >(`*[_type == "familyCredentials"]{kidCode, parentCode}`);
  const existingKidCodes = existingCredentials.map((c) => c.kidCode);
  const existingParentCodes = existingCredentials.map((c) => c.parentCode);

  const autoKidCode = generateKidCode(
    new Date().getFullYear(),
    existingKidCodes,
  );
  const autoParentCode = generateParentCode(existingParentCodes);

  console.log(`\n🆕 Auto-Generated Credentials:`);
  console.log(`   Session ID: ${newSessionId}`);
  console.log(`   Kid Code:   ${autoKidCode}`);
  console.log(`   Parent Code: ${autoParentCode}`);

  // Prompt for manual kid code or use auto-generated
  const useManualKidCode = await prompt(
    "\n🎯 Enter custom kid code (or press Enter to use auto-generated): ",
  );

  let kidCode = autoKidCode;

  // Validate manual kid code if provided
  if (useManualKidCode.trim()) {
    if (existingKidCodes.includes(useManualKidCode.trim().toUpperCase())) {
      console.log("⚠️  Kid code already exists! Using auto-generated instead.");
    } else {
      kidCode = useManualKidCode.trim().toUpperCase();
      console.log(`\n✏️  Using custom kid code: ${kidCode}`);
    }
  }

  const parentCode = autoParentCode;

  // Prompt for family data
  const familyName = await prompt("\n🏠 Family Name (optional): ");
  const kidNames = await promptKidNames();
  const parentEmail = await prompt("\n📧 Parent Email (optional): ");
  const friendNames = await promptFriendNames();

  // Confirm migration
  console.log("\n📋 Migration Summary:");
  console.log(`   Family: ${familyName || "(not provided)"}`);
  console.log(`   Kids: ${kidNames.join(", ")}`);
  console.log(
    `   Friends: ${friendNames.length > 0 ? friendNames.join(", ") : "(none)"}`,
  );
  console.log(`   Email: ${parentEmail || "(not provided)"}`);

  const confirm = await prompt("\n✅ Proceed with migration? (yes/no): ");
  if (confirm.toLowerCase() !== "yes") {
    console.log("⏭️  Skipping this session...");
    return null;
  }

  try {
    if (dryRun) {
      console.log("🔍 DRY RUN: Would create familyCredentials document");
      console.log("🔍 DRY RUN: Would update userSession document");
    } else {
      // Create familyCredentials document
      await client.create({
        _type: "familyCredentials",
        kidCode,
        parentCode,
        sessionId: newSessionId,
        familyName: familyName || undefined,
        kidNames,
        friendNames,
        parentEmail: parentEmail || undefined,
        createdAt: new Date().toISOString(),
      });

      console.log("✅ Created familyCredentials document");

      // Update userSession with new sessionId and friendNames
      await client
        .patch(session._id)
        .set({
          sessionId: newSessionId,
          friendNames,
        })
        .commit();

      console.log("✅ Updated userSession document");
    }

    return {
      oldSessionId: session.sessionId,
      newSessionId,
      kidCode,
      parentCode,
      familyName: familyName || "",
      kidNames,
      friendNames,
      parentEmail: parentEmail || "",
    };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return null;
  }
}

async function main() {
  console.log("\n🔄 NisseKomm Session Migration Tool");
  console.log("=====================================");
  console.log(`📦 Project ID: ${projectId}`);
  console.log(`🗄️  Dataset:    ${dataset}`);
  console.log(
    `🔧 Mode:       ${dryRun ? "DRY RUN (no changes)" : "LIVE MIGRATION"}`,
  );
  console.log("=====================================\n");

  // Safety prompt for production dataset
  if (dataset === "production" && !dryRun) {
    console.log("⚠️  WARNING: You are about to modify the PRODUCTION dataset!");
    const confirmProd = await prompt(
      "⚠️  Type 'MIGRATE PRODUCTION' to continue: ",
    );
    if (confirmProd !== "MIGRATE PRODUCTION") {
      console.log("❌ Migration cancelled for safety.");
      rl.close();
      return;
    }
    console.log("");
  }

  try {
    // Fetch all sessions with old format (64-char hex sessionId)
    console.log(
      "🔍 Searching for sessions with old format (64-char SHA-256)...\n",
    );

    const sessions = await client.fetch<OldSession[]>(
      `*[_type == "userSession" && length(sessionId) == 64]`,
    );

    if (sessions.length === 0) {
      console.log("✨ No sessions need migration!");
      rl.close();
      return;
    }

    console.log(`📊 Found ${sessions.length} session(s) to migrate\n`);

    const migrations: MigrationData[] = [];

    for (const session of sessions) {
      const result = await migrateSession(session);
      if (result) {
        migrations.push(result);
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log(dryRun ? "📊 DRY RUN SUMMARY" : "📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Dataset: ${dataset}`);
    console.log(`Total sessions processed: ${sessions.length}`);
    console.log(
      dryRun
        ? `Would migrate: ${migrations.length}`
        : `Successfully migrated: ${migrations.length}`,
    );
    console.log(`Skipped: ${sessions.length - migrations.length}`);

    if (migrations.length > 0) {
      console.log("\n🎫 ACCESS CODES:");
      console.log("-".repeat(60));
      migrations.forEach((m) => {
        console.log(`\n👨‍👩‍👧‍👦 Family: ${m.familyName || "(unnamed)"}`);
        console.log(`   Kids: ${m.kidNames.join(", ")}`);
        console.log(`   🔑 Kid Code:    ${m.kidCode}`);
        console.log(`   🔐 Parent Code: ${m.parentCode}`);
      });
    }

    if (dryRun) {
      console.log("\n✅ Dry run complete! No changes were made.\n");
    } else {
      console.log("\n✅ Migration complete!\n");
    }
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
