#!/usr/bin/env tsx
/**
 * Send Daily Mission Email Script
 *
 * Sends daily mission reminder emails to test the email rendering and functionality.
 * Can target specific families or all subscribed families in a dataset.
 *
 * Usage:
 *   # Send test email for a specific day
 *   pnpm email:daily-dev --day 5
 *   pnpm email:daily-prod --day 5
 *
 *   # Send to a specific family by email
 *   pnpm email:daily-dev --day 5 --email parent@example.com
 *   pnpm email:daily-prod --day 5 --email parent@example.com
 *
 *   # Dry run (list families without sending)
 *   pnpm email:daily-dev --day 5 --dry-run
 *   pnpm email:daily-prod --day 5 --dry-run
 *
 *   # Send to all subscribed families (use with caution!)
 *   pnpm email:daily-prod --day 5 --all
 *
 * Environment:
 *   Requires .env.local with:
 *   - NEXT_PUBLIC_SANITY_PROJECT_ID
 *   - SANITY_API_TOKEN
 *   - RESEND_API_KEY
 *   - UNSUBSCRIBE_SECRET (for generating unsubscribe tokens)
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient, type SanityClient } from "@sanity/client";
import { createHmac } from "crypto";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

// Import email service and mission data loader
import { sendDailyMissionEmail } from "../src/lib/email-service";
import { getAllOppdrag } from "../src/lib/oppdrag";

interface FamilyCredentials {
  _id: string;
  sessionId: string;
  kidCode: string;
  parentCode: string;
  familyName: string | null;
  kidNames: string[];
  parentEmail: string;
  emailSubscription?: boolean;
  createdAt: string;
}

interface CLIArgs {
  dataset: "development" | "production";
  day: number;
  email?: string;
  dryRun: boolean;
  all: boolean;
}

// Delay helper for rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Resend rate limit: 2 requests per second
const DELAY_BETWEEN_EMAILS_MS = 600;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Environment variables
const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://nissekomm.no";
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET;

// Generate unsubscribe token (copied from /api/unsubscribe/route.ts)
function generateUnsubscribeToken(sessionId: string): string {
  if (!UNSUBSCRIBE_SECRET) {
    throw new Error("UNSUBSCRIBE_SECRET is not configured");
  }
  const hmac = createHmac("sha256", UNSUBSCRIBE_SECRET);
  hmac.update(sessionId);
  return hmac.digest("hex");
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);

  // Determine dataset from --dataset flag
  let dataset: "development" | "production" = "development";
  const datasetIndex = args.indexOf("--dataset");
  if (datasetIndex !== -1 && args[datasetIndex + 1]) {
    const value = args[datasetIndex + 1];
    if (value === "production" || value === "prod") {
      dataset = "production";
    } else if (value === "development" || value === "dev") {
      dataset = "development";
    }
  }

  // Parse day number (required)
  let day: number | undefined;
  const dayIndex = args.indexOf("--day");
  if (dayIndex !== -1 && args[dayIndex + 1]) {
    day = parseInt(args[dayIndex + 1], 10);
    if (isNaN(day) || day < 1 || day > 24) {
      console.error("❌ --day must be a number between 1 and 24");
      process.exit(1);
    }
  } else {
    console.error("❌ Missing required argument: --day <1-24>");
    process.exit(1);
  }

  // Check for specific email
  let email: string | undefined;
  const emailIndex = args.indexOf("--email");
  if (emailIndex !== -1 && args[emailIndex + 1]) {
    email = args[emailIndex + 1];
  }

  // Check for dry run
  const dryRun = args.includes("--dry-run");

  // Check for --all flag (required for bulk sends)
  const all = args.includes("--all");

  return { dataset, day, email, dryRun, all };
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

async function sendEmailWithRetry(
  family: FamilyCredentials,
  day: number,
  missionTitle: string,
  missionText: string,
  rampeStrek: string,
  fysiskHint: string,
  materialer: string[],
  unsubscribeUrl: string,
  retryCount = 0,
): Promise<boolean> {
  try {
    await sendDailyMissionEmail({
      to: family.parentEmail,
      familyName: family.familyName || undefined,
      kidNames: family.kidNames,
      day,
      missionTitle,
      missionText,
      rampeStrek,
      fysiskHint,
      materialer,
      unsubscribeUrl,
    });

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for rate limit error
    if (
      errorMessage.includes("Too many requests") ||
      errorMessage.includes("rate limit")
    ) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = RETRY_DELAY_MS * (retryCount + 1);
        console.log(
          `\n   ⏳ Rate limited. Waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${MAX_RETRIES}...`,
        );
        await delay(waitTime);
        return sendEmailWithRetry(
          family,
          day,
          missionTitle,
          missionText,
          rampeStrek,
          fysiskHint,
          materialer,
          unsubscribeUrl,
          retryCount + 1,
        );
      }
      console.error(
        `   ✗ Failed after ${MAX_RETRIES} retries: ${errorMessage}`,
      );
      return false;
    }
    console.error(`   ✗ Failed: ${errorMessage}`);
    return false;
  }
}

async function main() {
  const args = parseArgs();

  console.log("╔══════════════════════════════════════════╗");
  console.log("║  📧 NisseKomm Daily Mission Email Sender ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("");

  // Load mission data for the specified day
  const allOppdrag = getAllOppdrag();
  const mission = allOppdrag.find((m) => m.dag === args.day);

  if (!mission) {
    console.error(`❌ No mission found for day ${args.day}`);
    console.error("   Available days: 1-24");
    process.exit(1);
  }

  console.log("┌─ Configuration ─────────────────────────┐");
  console.log(`│ 📦 Dataset:     ${args.dataset.padEnd(24)}│`);
  console.log(`│ 📅 Day:         ${args.day.toString().padEnd(24)}│`);
  console.log(`│ 📜 Mission:     ${mission.tittel.slice(0, 24).padEnd(24)}│`);
  console.log(`│ 🌐 Base URL:    ${BASE_URL.slice(0, 24).padEnd(24)}│`);
  console.log(
    `│ 🎯 Target:      ${(args.email || "Subscribed families").slice(0, 24).padEnd(24)}│`,
  );
  console.log(
    `│ 🔍 Mode:        ${(args.dryRun ? "DRY RUN" : "LIVE").padEnd(24)}│`,
  );
  console.log("└──────────────────────────────────────────┘");
  console.log("");

  // Validate environment
  if (!process.env.RESEND_API_KEY && !args.dryRun) {
    console.error("❌ RESEND_API_KEY is not set. Cannot send emails.");
    process.exit(1);
  }

  if (!UNSUBSCRIBE_SECRET) {
    console.error(
      "❌ UNSUBSCRIBE_SECRET is not set. Cannot generate unsubscribe tokens.",
    );
    process.exit(1);
  }

  // Prevent sending production emails with localhost URL
  if (
    args.dataset === "production" &&
    !args.dryRun &&
    (BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1"))
  ) {
    console.error(
      "❌ Cannot send production emails with localhost in NEXT_PUBLIC_URL.",
    );
    console.error(`   Current URL: ${BASE_URL}`);
    console.error(
      "   Set NEXT_PUBLIC_URL to production domain (e.g., https://nissekomm.no)",
    );
    process.exit(1);
  }

  const sanity = createSanityClient(args.dataset);

  // Fetch families
  console.log("🔍 Fetching families from Sanity...");

  let query = `*[_type == "familyCredentials"`;
  const params: Record<string, string> = {};

  if (args.email) {
    query += ` && lower(parentEmail) == $email`;
    params.email = args.email.toLowerCase();
  } else {
    // Only fetch families with emailSubscription = true
    query += ` && emailSubscription == true`;
  }

  query += `] | order(createdAt desc) {
    _id,
    sessionId,
    kidCode,
    parentCode,
    familyName,
    kidNames,
    parentEmail,
    emailSubscription,
    createdAt
  }`;

  const families = await sanity.fetch<FamilyCredentials[]>(query, params);

  if (families.length === 0) {
    console.log("📭 No families found matching criteria.");
    if (!args.email) {
      console.log("   (No families have emailSubscription enabled)");
    }
    process.exit(0);
  }

  console.log(`\n📋 Found ${families.length} familie(s):\n`);

  // List families
  families.forEach((family, index) => {
    const name = family.familyName || "Unnamed";
    const kids = (family.kidNames || []).join(", ") || "No kids";
    const date = new Date(family.createdAt).toLocaleDateString("no-NO");
    const subscribed = family.emailSubscription ? "✓" : "✗";
    console.log(
      `   ${index + 1}. ${name} (${kids}) - ${family.parentEmail} [${date}] ${subscribed}`,
    );
  });

  if (args.dryRun) {
    console.log("\n✅ Dry run complete. No emails were sent.");
    process.exit(0);
  }

  // Require --email or --all flag for sending
  if (!args.email && !args.all) {
    console.error("\n❌ Bulk email requires --all flag for confirmation.");
    console.error("   Use --email <address> to send to a specific family.");
    console.error("   Or use --all to send to all subscribed families.");
    console.error("   Or use --dry-run to preview without sending.");
    process.exit(1);
  }

  // Confirmation prompt for sending to all
  if (!args.email && families.length > 1) {
    console.log(
      `\n⚠️  You are about to send ${families.length} emails to ALL subscribed families.`,
    );
    console.log("   Press Ctrl+C to cancel, or wait 5 seconds to continue...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // Send emails
  console.log("\n📤 Sending emails...\n");

  let sent = 0;
  let failed = 0;

  for (const family of families) {
    const name = family.familyName || "Unnamed";
    process.stdout.write(`   → ${name} (${family.parentEmail})... `);

    // Generate unsubscribe URL
    const token = generateUnsubscribeToken(family.sessionId);
    const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?sessionId=${encodeURIComponent(family.sessionId)}&token=${token}`;

    const success = await sendEmailWithRetry(
      family,
      args.day,
      mission.tittel,
      mission.nissemail_tekst,
      mission.rampenissen_rampestrek,
      mission.fysisk_hint,
      mission.materialer_nødvendig || [],
      unsubscribeUrl,
    );

    if (success) {
      console.log("✓ Sent");
      sent++;
    } else {
      failed++;
    }

    // Rate limit: wait between emails to avoid hitting Resend's 2 req/s limit
    await delay(DELAY_BETWEEN_EMAILS_MS);
  }

  console.log("\n════════════════════════════════════════════");
  console.log(`✅ Complete: ${sent} sent, ${failed} failed`);
  console.log("════════════════════════════════════════════");
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
