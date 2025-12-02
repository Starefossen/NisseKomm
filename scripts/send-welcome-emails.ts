#!/usr/bin/env tsx
/**
 * Send Welcome Emails Script
 *
 * Sends welcome emails with access codes to registered families.
 * Can target a single family by email or all families in a dataset.
 * By default, excludes test emails (@example.com).
 *
 * Usage:
 *   # Send to all families in development dataset
 *   pnpm email:dev
 *
 *   # Send to all families in production dataset
 *   pnpm email:prod
 *
 *   # Send to a specific family by email
 *   pnpm email:dev --email parent@example.com
 *   pnpm email:prod --email parent@example.com
 *
 *   # Dry run (list families without sending)
 *   pnpm email:dev --dry-run
 *   pnpm email:prod --dry-run
 *
 *   # Include test emails (@example.com)
 *   pnpm email:dev --include-test
 *
 * Environment:
 *   Requires .env.local with:
 *   - NEXT_PUBLIC_SANITY_PROJECT_ID
 *   - SANITY_API_TOKEN
 *   - RESEND_API_KEY
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient, type SanityClient } from "@sanity/client";
import { Resend } from "resend";

// Load environment variables from .env.local
config({ path: resolve(__dirname, "../.env.local") });

interface FamilyCredentials {
  _id: string;
  kidCode: string;
  parentCode: string;
  familyName: string | null;
  kidNames: string[];
  parentEmail: string;
  createdAt: string;
}

interface CLIArgs {
  dataset: "development" | "production";
  email?: string;
  dryRun: boolean;
  includeTest: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);

  // Determine dataset from --dataset flag or pnpm script name
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

  // Check for specific email
  let email: string | undefined;
  const emailIndex = args.indexOf("--email");
  if (emailIndex !== -1 && args[emailIndex + 1]) {
    email = args[emailIndex + 1];
  }

  // Check for dry run
  const dryRun = args.includes("--dry-run");

  // Check for include-test flag (by default, exclude @example.com emails)
  const includeTest = args.includes("--include-test");

  return { dataset, email, dryRun, includeTest };
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

// Email template functions (copied from email-service.ts to avoid import issues)
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Rampenissen <rampenissen@nissekomm.no>";
const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://nissekomm.no";

function createWelcomeEmailHtml({
  familyName,
  kidCode,
  parentCode,
  kidNames,
}: {
  familyName?: string;
  kidCode: string;
  parentCode: string;
  kidNames: string[];
}): string {
  const familyGreeting = familyName ? `Familien${familyName}` : "Kjære familie";
  const kidNamesFormatted = kidNames.join(", ");

  return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Velkommen til NisseKomm</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: 'Courier New', Courier, monospace !important;}
  </style>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      .dark-bg { background-color: #000000 !important; }
      .dark-bezel { background-color: #1a1a1a !important; }
      .dark-screen { background-color: #050a05 !important; }
      .dark-green-box { background-color: #1a3a1a !important; }
      .dark-blue-box { background-color: #1a2a3a !important; }
      .green-text { color: #00ff00 !important; }
      .gold-text { color: #ffd700 !important; }
      .cyan-text { color: #00ddff !important; }
    }
  </style>
</head>
<body class="dark-bg" style="margin: 0; padding: 0; background-color: #000000; font-family: 'Courier New', Courier, monospace;">
  <!-- Dark wrapper for email clients -->
  <div class="dark-bg" style="background-color: #000000; width: 100%; margin: 0; padding: 0;">
  <table role="presentation" class="dark-bg" style="width: 100%; border-collapse: collapse; background-color: #000000;" bgcolor="#000000">
    <tr>
      <td align="center" class="dark-bg" style="padding: 40px 20px; background-color: #000000;" bgcolor="#000000">
        <!-- CRT Monitor Frame -->
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <!-- Outer bezel -->
          <tr>
            <td class="dark-bezel" style="background-color: #1a1a1a; border-radius: 20px; padding: 20px;" bgcolor="#1a1a1a">
              <!-- Inner screen with scanline effect -->
              <table role="presentation" class="dark-screen" style="width: 100%; border-collapse: collapse; background-color: #050a05; border: 4px solid #00ff00;" bgcolor="#050a05">
                <tr>
                  <td class="dark-screen" style="padding: 30px; background-color: #050a05;" bgcolor="#050a05">
                    <!-- Header -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <tr>
                        <td style="border-bottom: 2px solid #00ff00; padding-bottom: 15px;">
                          <h1 style="margin: 0; color: #00ff00; font-size: 28px; font-weight: normal; text-transform: uppercase; letter-spacing: 2px;">
                            ⚡ NISSEKOMM ⚡
                          </h1>
                          <p style="margin: 5px 0 0 0; color: #00aa00; font-size: 14px;">
                            &gt; SNØFALL OPERASJONS-SENTER
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Welcome message -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                      <tr>
                        <td style="color: #00ff00; font-size: 16px; line-height: 1.6;">
                          <p style="margin: 0 0 15px 0;">
                            &gt; INNKOMMENDE MELDING FRA NORDPOLEN_
                          </p>
                          <p style="margin: 0 0 15px 0; color: #00dd00;">
                            Hei ${familyGreeting}!
                          </p>
                          <p style="margin: 0 0 15px 0; color: #00dd00;">
                            Dette er Rampenissen! Jeg har fått beskjed fra Julius (ja, SELVESTE julenissen!) om at ${kidNamesFormatted} skal hjelpe meg med hemmelige oppdrag i desember!
                          </p>
                          <p style="margin: 0; color: #00dd00;">
                            Her er kodene dere trenger for å koble til NisseKomm - vårt superhemmelige kommunikasjonssystem:
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Kid Code Box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                      <tr>
                        <td>
                          <table role="presentation" class="dark-green-box" width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#1a3a1a" style="border: 2px solid #00ff00; background: #1a3a1a; background-color: #1a3a1a;">
                            <tr>
                              <td class="dark-green-box" bgcolor="#1a3a1a" style="background: #1a3a1a; background-color: #1a3a1a;">
                                <p style="margin: 0 0 10px 0; color: #00ff00; font-size: 14px; text-transform: uppercase;">
                                  🎄 BARNEKODE (for ${kidNamesFormatted}):
                                </p>
                                <p style="margin: 0; color: #ffd700; font-size: 28px; font-weight: bold; letter-spacing: 3px; text-align: center; padding: 10px 0;">
                                  ${kidCode}
                                </p>
                                <p style="margin: 10px 0 0 0; color: #00aa00; font-size: 12px;">
                                  &gt; Bruk denne koden for å starte NisseKomm hver dag!
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Parent Code Box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                      <tr>
                        <td>
                          <table role="presentation" class="dark-blue-box" width="100%" cellpadding="20" cellspacing="0" border="0" bgcolor="#1a2a3a" style="border: 2px solid #00ddff; background: #1a2a3a; background-color: #1a2a3a;">
                            <tr>
                              <td class="dark-blue-box" bgcolor="#1a2a3a" style="background: #1a2a3a; background-color: #1a2a3a;">
                                <p style="margin: 0 0 10px 0; color: #00ddff; font-size: 14px; text-transform: uppercase;">
                                  🔐 FORELDREKODE (kun for voksne):
                                </p>
                                <p style="margin: 0; color: #ffd700; font-size: 22px; font-weight: bold; letter-spacing: 2px; text-align: center; padding: 10px 0;">
                                  ${parentCode}
                                </p>
                                <p style="margin: 10px 0 0 0; color: #00aadd; font-size: 12px;">
                                  &gt; Gir tilgang til <a href="${BASE_URL}/nissemor-guide" style="color: #00ddff;">Nissemor sin Foreldreveiledning</a> med fasit og tips!
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Instructions -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                      <tr>
                        <td style="color: #00ff00; font-size: 14px; line-height: 1.8;">
                          <p style="margin: 0 0 10px 0; color: #00ff00; text-transform: uppercase;">
                            &gt; INSTRUKSJONER:
                          </p>
                          <p style="margin: 0 0 8px 0; color: #00dd00; padding-left: 15px;">
                            1. Gå til <a href="${BASE_URL}" style="color: #ffd700; text-decoration: underline;">${BASE_URL.replace(/^https?:\/\//, "")}</a>
                          </p>
                          <p style="margin: 0 0 8px 0; color: #00dd00; padding-left: 15px;">
                            2. Skriv inn BARNEKODEN for å starte
                          </p>
                          <p style="margin: 0 0 8px 0; color: #00dd00; padding-left: 15px;">
                            3. Les dagens e-post fra meg (Rampenissen!)
                          </p>
                          <p style="margin: 0; color: #00dd00; padding-left: 15px;">
                            4. Løs gåten og skriv inn svarkoden
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                      <tr>
                        <td align="center">
                          <a href="${BASE_URL}" style="display: inline-block; background-color: #00ff00; color: #000000; font-size: 18px; font-weight: bold; text-decoration: none; padding: 15px 40px; border: 3px solid #00aa00; text-transform: uppercase; letter-spacing: 2px;">
                            ▶ START NISSEKOMM
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Footer message -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; border-top: 2px solid #00ff00; padding-top: 15px;">
                      <tr>
                        <td style="padding-top: 15px;">
                          <p style="margin: 0 0 10px 0; color: #00dd00; font-size: 14px;">
                            Ta vare på disse kodene - dere trenger dem hver dag i desember!
                          </p>
                          <p style="margin: 0; color: #00ff00; font-size: 14px;">
                            🎅 Hilsen Rampenissen
                          </p>
                          <p style="margin: 10px 0 0 0; color: #666666; font-size: 12px;">
                            &gt; MELDING KRYPTERT MED NISSEKRYPTO v2.4_
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Power LED -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <td align="right" style="padding-right: 10px;">
                    <span style="display: inline-block; width: 10px; height: 10px; background-color: #00ff00; border-radius: 50%; box-shadow: 0 0 10px #00ff00;"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  </div>
</body>
</html>
`;
}

function createWelcomeEmailText({
  familyName,
  kidCode,
  parentCode,
  kidNames,
}: {
  familyName?: string;
  kidCode: string;
  parentCode: string;
  kidNames: string[];
}): string {
  const familyGreeting = familyName ? `Familien${familyName}` : "Kjære familie";
  const kidNamesFormatted = kidNames.join(", ");

  return `
═══════════════════════════════════════
⚡ NISSEKOMM - SNØFALL OPERASJONS-SENTER ⚡
═══════════════════════════════════════

> INNKOMMENDE MELDING FRA NORDPOLEN

Hei ${familyGreeting}!

Dette er Rampenissen! Jeg har fått beskjed fra Julius
(ja, SELVESTE julenissen!) om at ${kidNamesFormatted}
skal hjelpe meg med hemmelige oppdrag i desember!

Her er kodene dere trenger:

───────────────────────────────────────
🎄 BARNEKODE (for ${kidNamesFormatted}):

    ${kidCode}

> Bruk denne koden for å starte NisseKomm hver dag!
───────────────────────────────────────

───────────────────────────────────────
🔐 FORELDREKODE (kun for voksne):

    ${parentCode}

> Gir tilgang til Foreldreveiledning med fasit og tips!
───────────────────────────────────────

> INSTRUKSJONER:
  1. Gå til ${BASE_URL}
  2. Skriv inn BARNEKODEN for å starte
  3. Les dagens e-post fra meg (Rampenissen!)
  4. Løs gåten og skriv inn svarkoden

Ta vare på disse kodene - dere trenger dem hver dag i desember!

🎅 Hilsen Rampenissen

───────────────────────────────────────
> MELDING KRYPTERT MED NISSEKRYPTO v2.4
═══════════════════════════════════════
`;
}

async function sendWelcomeEmail(
  resend: Resend,
  family: FamilyCredentials,
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: family.parentEmail,
      subject: "🎄 Velkommen til NisseKomm - Dine hemmelige koder!",
      html: createWelcomeEmailHtml({
        familyName: family.familyName || undefined,
        kidCode: family.kidCode,
        parentCode: family.parentCode,
        kidNames: family.kidNames,
      }),
      text: createWelcomeEmailText({
        familyName: family.familyName || undefined,
        kidCode: family.kidCode,
        parentCode: family.parentCode,
        kidNames: family.kidNames,
      }),
    });

    if (error) {
      console.error(`   ✗ Failed: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`   ✗ Error:`, error);
    return false;
  }
}

async function main() {
  const args = parseArgs();

  console.log("╔══════════════════════════════════════════╗");
  console.log("║  📧 NisseKomm Welcome Email Sender       ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("");
  console.log("┌─ Configuration ─────────────────────────┐");
  console.log(`│ 📦 Dataset:     ${args.dataset.padEnd(24)}│`);
  console.log(`│ 📧 From:        ${FROM_EMAIL.slice(0, 24).padEnd(24)}│`);
  console.log(`│ 🌐 Base URL:    ${BASE_URL.slice(0, 24).padEnd(24)}│`);
  console.log(
    `│ 🎯 Target:      ${(args.email || "ALL families").slice(0, 24).padEnd(24)}│`,
  );
  console.log(
    `│ 🧪 Test emails: ${(args.includeTest ? "INCLUDED" : "EXCLUDED").padEnd(24)}│`,
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

  const sanity = createSanityClient(args.dataset);
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Fetch families
  console.log("🔍 Fetching families from Sanity...");

  let query = `*[_type == "familyCredentials"`;
  const params: Record<string, string> = {};

  if (args.email) {
    query += ` && lower(parentEmail) == $email`;
    params.email = args.email.toLowerCase();
  }

  // Exclude test emails (@example.com) unless --include-test is passed
  if (!args.includeTest) {
    query += ` && !(parentEmail match "*@example.com")`;
  }

  query += `] | order(createdAt desc) {
    _id,
    kidCode,
    parentCode,
    familyName,
    kidNames,
    parentEmail,
    createdAt
  }`;

  const families = await sanity.fetch<FamilyCredentials[]>(query, params);

  if (families.length === 0) {
    console.log("📭 No families found matching criteria.");
    process.exit(0);
  }

  console.log(`\n📋 Found ${families.length} familie(s):\n`);

  // List families
  families.forEach((family, index) => {
    const name = family.familyName || "Unnamed";
    const kids = (family.kidNames || []).join(", ") || "No kids";
    const date = new Date(family.createdAt).toLocaleDateString("no-NO");
    console.log(
      `   ${index + 1}. ${name} (${kids}) - ${family.parentEmail} [${date}]`,
    );
  });

  if (args.dryRun) {
    console.log("\n✅ Dry run complete. No emails were sent.");
    process.exit(0);
  }

  // Confirmation prompt for sending to all
  if (!args.email && families.length > 1) {
    console.log(
      `\n⚠️  You are about to send ${families.length} emails to ALL families.`,
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

    const success = await sendWelcomeEmail(resend, family);

    if (success) {
      console.log("✓ Sent");
      sent++;
    } else {
      failed++;
    }

    // Rate limit: wait 100ms between emails to avoid hitting Resend limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n════════════════════════════════════════════");
  console.log(`✅ Complete: ${sent} sent, ${failed} failed`);
  console.log("════════════════════════════════════════════");
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
