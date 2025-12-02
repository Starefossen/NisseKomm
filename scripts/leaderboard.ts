#!/usr/bin/env tsx
/**
 * Leaderboard Script
 *
 * Displays quest completion progress and last active status for all families.
 * Useful for monitoring engagement and identifying families that may need help.
 *
 * Usage:
 *   # Development dataset
 *   pnpm leaderboard:dev
 *
 *   # Production dataset
 *   pnpm leaderboard:prod
 *
 *   # Show detailed breakdown
 *   pnpm leaderboard:dev --details
 *
 *   # Filter by minimum progress
 *   pnpm leaderboard:dev --min-quests 10
 *
 * Environment:
 *   Requires .env.local with:
 *   - NEXT_PUBLIC_SANITY_PROJECT_ID
 *   - SANITY_API_TOKEN
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient, type SanityClient } from "@sanity/client";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

interface FamilyCredentials {
  _id: string;
  sessionId: string;
  familyName: string | null;
  kidNames: string[];
  parentEmail: string;
  createdAt: string;
}

interface UserSession {
  _id: string;
  sessionId: string;
  lastUpdated: string;
  submittedCodes: Array<{ kode: string; dato: string }>;
}

interface LeaderboardEntry {
  familyName: string;
  kidNames: string[];
  completedQuests: number;
  lastActive: string;
  lastActiveDate: Date;
  registeredDate: Date;
  parentEmail: string;
}

interface CLIArgs {
  dataset: "development" | "production";
  details: boolean;
  minQuests: number;
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

  // Check for details flag
  const details = args.includes("--details");

  // Parse minimum quests filter
  let minQuests = 0;
  const minQuestsIndex = args.indexOf("--min-quests");
  if (minQuestsIndex !== -1 && args[minQuestsIndex + 1]) {
    minQuests = parseInt(args[minQuestsIndex + 1], 10);
    if (isNaN(minQuests) || minQuests < 0) {
      console.error("❌ --min-quests must be a positive number");
      process.exit(1);
    }
  }

  return { dataset, details, minQuests };
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

function formatDate(date: Date): string {
  return date.toLocaleDateString("no-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "nå nettopp";
  if (diffMinutes < 60) return `${diffMinutes}m siden`;
  if (diffHours < 24) return `${diffHours}t siden`;
  if (diffDays === 1) return "i går";
  if (diffDays < 7) return `${diffDays} dager siden`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} uker siden`;
  return `${Math.floor(diffDays / 30)} måneder siden`;
}

function getProgressBar(
  completed: number,
  total: number,
  width: number = 20,
): string {
  const filledWidth = Math.round((completed / total) * width);
  const emptyWidth = width - filledWidth;
  const filled = "█".repeat(filledWidth);
  const empty = "░".repeat(emptyWidth);
  return `${filled}${empty}`;
}

async function main() {
  const args = parseArgs();

  console.log("╔══════════════════════════════════════════╗");
  console.log("║  🏆 NisseKomm Quest Leaderboard          ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("");
  console.log("┌─ Configuration ─────────────────────────┐");
  console.log(`│ 📦 Dataset:     ${args.dataset.padEnd(24)}│`);
  console.log(
    `│ 📊 Details:     ${(args.details ? "Enabled" : "Disabled").padEnd(24)}│`,
  );
  console.log(`│ 🎯 Min Quests:  ${args.minQuests.toString().padEnd(24)}│`);
  console.log("└──────────────────────────────────────────┘");
  console.log("");

  const sanity = createSanityClient(args.dataset);

  // Fetch all families and their sessions
  console.log("🔍 Fetching family data...\n");

  const families = await sanity.fetch<FamilyCredentials[]>(
    `*[_type == "familyCredentials"] | order(createdAt desc) {
      _id,
      sessionId,
      familyName,
      kidNames,
      parentEmail,
      createdAt
    }`,
  );

  const sessions = await sanity.fetch<UserSession[]>(
    `*[_type == "userSession"] {
      _id,
      sessionId,
      lastUpdated,
      submittedCodes
    }`,
  );

  if (families.length === 0) {
    console.log("📭 No families found in dataset.");
    process.exit(0);
  }

  // Build leaderboard
  const leaderboard: LeaderboardEntry[] = families.map((family) => {
    const session = sessions.find((s) => s.sessionId === family.sessionId);
    const completedQuests = session?.submittedCodes?.length || 0;
    const lastUpdated = session?.lastUpdated || family.createdAt;
    const lastActiveDate = new Date(lastUpdated);

    return {
      familyName: family.familyName || "Ukjent familie",
      kidNames: family.kidNames,
      completedQuests,
      lastActive: formatRelativeTime(lastActiveDate),
      lastActiveDate,
      registeredDate: new Date(family.createdAt),
      parentEmail: family.parentEmail,
    };
  });

  // Filter by minimum quests
  const filtered = leaderboard.filter(
    (entry) => entry.completedQuests >= args.minQuests,
  );

  if (filtered.length === 0) {
    console.log(
      `📭 No families found with at least ${args.minQuests} completed quest(s).`,
    );
    process.exit(0);
  }

  // Sort by completed quests (descending), then by last active (most recent first)
  filtered.sort((a, b) => {
    if (b.completedQuests !== a.completedQuests) {
      return b.completedQuests - a.completedQuests;
    }
    return b.lastActiveDate.getTime() - a.lastActiveDate.getTime();
  });

  // Calculate statistics
  const totalFamilies = filtered.length;
  const totalQuests = filtered.reduce((sum, e) => sum + e.completedQuests, 0);
  const avgQuests = totalQuests / totalFamilies;
  const maxQuests = Math.max(...filtered.map((e) => e.completedQuests));

  // Display summary
  console.log("┌─ Summary ────────────────────────────────┐");
  console.log(`│ 👨‍👩‍👧‍👦 Total Families:   ${totalFamilies.toString().padEnd(21)}│`);
  console.log(`│ 🎯 Total Quests:     ${totalQuests.toString().padEnd(21)}│`);
  console.log(`│ 📊 Average:          ${avgQuests.toFixed(1).padEnd(21)}│`);
  console.log(`│ 🏆 Highest:          ${maxQuests.toString().padEnd(21)}│`);
  console.log("└──────────────────────────────────────────┘");
  console.log("");

  // Display leaderboard
  if (args.details) {
    console.log(
      "┌─ Detailed Leaderboard ───────────────────────────────────────────────┐",
    );
    console.log("");

    filtered.forEach((entry, index) => {
      const rank = index + 1;
      const medal =
        rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "  ";
      const kids = entry.kidNames.join(", ");
      const progressBar = getProgressBar(entry.completedQuests, 24, 24);

      console.log(
        `${medal} #${rank.toString().padStart(2)} ${entry.familyName.padEnd(20)}`,
      );
      console.log(`   👶 ${kids}`);
      console.log(`   📧 ${entry.parentEmail}`);
      console.log(
        `   🎯 ${entry.completedQuests}/24 ${progressBar} ${((entry.completedQuests / 24) * 100).toFixed(0)}%`,
      );
      console.log(
        `   🕐 Sist aktiv: ${entry.lastActive} (${formatDate(entry.lastActiveDate)})`,
      );
      console.log(`   📅 Registrert: ${formatDate(entry.registeredDate)}`);
      console.log("");
    });

    console.log(
      "└──────────────────────────────────────────────────────────────────────┘",
    );
  } else {
    console.log(
      "┌─ Leaderboard ────────────────────────────────────────────────────────┐",
    );
    console.log("");
    console.log(
      "  Rank  Familie                  Oppdrag  Fremgang              Sist aktiv",
    );
    console.log(
      "  ────  ──────────────────────   ───────  ────────────────────  ──────────────",
    );

    filtered.forEach((entry, index) => {
      const rank = index + 1;
      const medal =
        rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "  ";
      const progressBar = getProgressBar(entry.completedQuests, 24, 20);

      console.log(
        `  ${medal} ${rank.toString().padStart(2)}  ${entry.familyName.padEnd(23)} ${entry.completedQuests.toString().padStart(2)}/24   ${progressBar}  ${entry.lastActive.padEnd(14)}`,
      );
    });

    console.log("");
    console.log(
      "└──────────────────────────────────────────────────────────────────────┘",
    );
    console.log("");
    console.log("💡 Use --details for more information about each family");
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
