/**
 * API Route: /api/cron/send-daily-emails
 *
 * Scheduled endpoint called by Vercel Cron at 21:00 CET daily.
 * Sends reminder emails to all subscribed families about tomorrow's mission.
 *
 * Authorization: Requires CRON_SECRET header matching environment variable
 * Schedule: Daily at 21:00 CET (configured in vercel.json)
 *
 * Process:
 * 1. Verify CRON_SECRET authorization
 * 2. Calculate tomorrow's day (current day + 1)
 * 3. Fetch all families with emailSubscription=true
 * 4. Load tomorrow's mission from oppdrag data
 * 5. Send personalized email to each family
 * 6. Log results
 */

import { NextRequest, NextResponse } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";
import { sendDailyMissionEmail } from "@/lib/email-service";
import { generateUnsubscribeToken } from "@/app/api/unsubscribe/route";
import { getAllOppdrag } from "@/lib/oppdrag";

const STORAGE_BACKEND =
  process.env.NEXT_PUBLIC_STORAGE_BACKEND || "localStorage";
const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://nissekomm.no";

/**
 * Structured logger with timestamps for better Vercel log visibility
 */
function log(
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  data?: unknown,
) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [Daily Email Cron] [${level}]`;

  if (data !== undefined) {
    console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`${prefix} ${message}`);
  }
}

interface FamilyCredentials {
  _id: string;
  sessionId: string;
  familyName: string;
  kidNames: string[];
  parentEmail: string;
  emailSubscription: boolean;
}

/**
 * POST /api/cron/send-daily-emails
 * Send daily mission emails to all subscribed families
 */
export async function POST(request: NextRequest) {
  // Log startup configuration for debugging
  log("INFO", "=== CRON JOB STARTED ===");
  log("INFO", "Environment Configuration", {
    storageBackend: STORAGE_BACKEND,
    hasCronSecret: !!CRON_SECRET,
    baseUrl: BASE_URL,
    hasResendKey: !!process.env.RESEND_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });

  try {
    // Verify authorization (Vercel Cron sends secret in Authorization header)
    const authHeader = request.headers.get("authorization");
    log("INFO", "Authorization check", {
      hasAuthHeader: !!authHeader,
      hasCronSecret: !!CRON_SECRET,
    });

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      log("WARN", "Unauthorized access attempt - auth header mismatch");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only works with Sanity backend
    if (STORAGE_BACKEND === "localStorage") {
      log(
        "WARN",
        "Cannot send emails: Sanity backend required, but localStorage is configured",
      );
      return NextResponse.json(
        { error: "Email service requires Sanity backend" },
        { status: 400 },
      );
    }

    // Calculate tomorrow's day (emails sent at 21:00 for next day)
    // Convert to CET (UTC+1) or CEST (UTC+2) timezone
    const now = new Date();
    const cet = new Date(
      now.toLocaleString("en-US", { timeZone: "Europe/Oslo" }),
    );
    const currentDay = cet.getDate();
    const currentMonth = cet.getMonth() + 1; // 1-indexed

    log("INFO", "Time calculation", {
      utcTime: now.toISOString(),
      cetTime: cet.toISOString(),
      currentDay,
      currentMonth,
    });

    // Only send emails in December
    if (currentMonth !== 12) {
      log("INFO", "Outside December period - no emails to send", {
        currentMonth,
      });
      return NextResponse.json({
        success: true,
        message: `Outside December period (month ${currentMonth}), no emails sent`,
        sent: 0,
        currentDay,
        currentMonth,
      });
    }

    const tomorrowDay = currentDay + 1;
    log("INFO", `Tomorrow will be day ${tomorrowDay} of December`);

    // Don't send emails after Dec 24
    if (tomorrowDay > 24) {
      log("INFO", "After Dec 24 - no more missions", { tomorrowDay });
      log("INFO", "After Dec 24 - no more missions", { tomorrowDay });
      return NextResponse.json({
        success: true,
        message: `All missions completed (tomorrow would be day ${tomorrowDay})`,
        sent: 0,
        tomorrowDay,
      });
    }

    // Load tomorrow's mission
    log("INFO", "Loading mission data", { day: tomorrowDay });
    const allOppdrag = getAllOppdrag();
    const tomorrowMission = allOppdrag.find((m) => m.dag === tomorrowDay);

    if (!tomorrowMission) {
      log("ERROR", "No mission found for day", { day: tomorrowDay });
      return NextResponse.json(
        { error: `No mission data for day ${tomorrowDay}` },
        { status: 500 },
      );
    }

    log("INFO", "Mission loaded", {
      day: tomorrowDay,
      title: tomorrowMission.tittel,
    });

    // Fetch all subscribed families
    log("INFO", "Fetching subscribed families from Sanity...");
    const families = await sanityServerClient.fetch<FamilyCredentials[]>(
      `*[_type == "familyCredentials" && emailSubscription == true]{
        _id,
        sessionId,
        familyName,
        kidNames,
        parentEmail,
        emailSubscription
      }`,
    );

    if (!families || families.length === 0) {
      log("WARN", "No subscribed families found in Sanity");
      return NextResponse.json({
        success: true,
        message: "No subscribed families found",
        sent: 0,
        day: tomorrowDay,
      });
    }

    log("INFO", "Found subscribed families", {
      count: families.length,
      emails: families.map((f) => f.parentEmail),
    });

    // Send email to each family
    log("INFO", `Starting email send to ${families.length} families...`);
    const results = await Promise.allSettled(
      families.map(async (family, index) => {
        log("INFO", `Sending email ${index + 1}/${families.length}`, {
          to: family.parentEmail,
          familyName: family.familyName,
        });

        // Generate secure unsubscribe token
        const token = generateUnsubscribeToken(family.sessionId);
        const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?session=${encodeURIComponent(family.sessionId)}&token=${token}`;

        try {
          const result = await sendDailyMissionEmail({
            to: family.parentEmail,
            familyName: family.familyName,
            kidNames: family.kidNames,
            day: tomorrowDay,
            missionTitle: tomorrowMission.tittel,
            missionText: tomorrowMission.nissemail_tekst,
            rampeStrek: tomorrowMission.rampenissen_rampestrek,
            fysiskHint: tomorrowMission.fysisk_hint,
            materialer: tomorrowMission.materialer_nødvendig || [],
            unsubscribeUrl,
          });

          if (result) {
            log(
              "INFO",
              `Email ${index + 1}/${families.length} sent successfully`,
              {
                to: family.parentEmail,
              },
            );
          } else {
            log(
              "ERROR",
              `Email ${index + 1}/${families.length} failed - service returned false`,
              {
                to: family.parentEmail,
              },
            );
          }

          return result;
        } catch (emailError) {
          log(
            "ERROR",
            `Email ${index + 1}/${families.length} threw exception`,
            {
              to: family.parentEmail,
              error:
                emailError instanceof Error
                  ? emailError.message
                  : String(emailError),
              stack: emailError instanceof Error ? emailError.stack : undefined,
            },
          );
          throw emailError;
        }
      }),
    );

    // Count successes and failures
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value === true,
    ).length;
    const failed = results.filter(
      (r) =>
        r.status === "rejected" ||
        (r.status === "fulfilled" && r.value === false),
    ).length;

    log("INFO", "=== CRON JOB COMPLETED ===", {
      successful,
      failed,
      total: families.length,
    });

    // Log detailed results
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        log("ERROR", `Failed to send email`, {
          to: families[index].parentEmail,
          reason: result.reason,
        });
      } else if (result.value === false) {
        log("ERROR", `Email service returned false`, {
          to: families[index].parentEmail,
        });
      } else {
        log("INFO", `Email sent successfully`, {
          to: families[index].parentEmail,
        });
      }
    });

    return NextResponse.json({
      success: true,
      day: tomorrowDay,
      missionTitle: tomorrowMission.tittel,
      totalFamilies: families.length,
      sent: successful,
      failed,
    });
  } catch (error) {
    log("ERROR", "Unexpected error in cron job", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to send daily emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/cron/send-daily-emails
 * Health check and diagnostics endpoint
 * Returns configuration and readiness status
 */
export async function GET(request: NextRequest) {
  const now = new Date();
  const cet = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Oslo" }),
  );
  const currentDay = cet.getDate();
  const currentMonth = cet.getMonth() + 1;
  const tomorrowDay = currentDay + 1;

  // Check if test mode is requested via query parameter
  const url = new URL(request.url);
  const testMode = url.searchParams.get("test") === "true";

  const diagnostics = {
    service: "Daily Mission Email Cron",
    status: "healthy",
    timestamp: new Date().toISOString(),
    schedule: {
      configured: "Daily at 21:00 CET (0 21 * 12 *)",
      timezone: "Europe/Oslo (CET/CEST)",
    },
    currentTime: {
      utc: now.toISOString(),
      cet: cet.toISOString(),
      currentDay,
      currentMonth,
      tomorrowDay:
        currentMonth === 12 && tomorrowDay <= 24 ? tomorrowDay : null,
    },
    configuration: {
      storageBackend: STORAGE_BACKEND,
      enabled: STORAGE_BACKEND === "sanity",
      hasCronSecret: !!CRON_SECRET,
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      baseUrl: BASE_URL,
      nodeEnv: process.env.NODE_ENV,
    },
    readiness: {
      inDecember: currentMonth === 12,
      hasMoreMissions: tomorrowDay <= 24,
      backendConfigured: STORAGE_BACKEND === "sanity",
      secretsConfigured: !!CRON_SECRET && !!process.env.RESEND_API_KEY,
    },
  };

  // In test mode, also try to fetch families count
  if (testMode && STORAGE_BACKEND === "sanity") {
    try {
      const count = await sanityServerClient.fetch<number>(
        `count(*[_type == "familyCredentials" && emailSubscription == true])`,
      );
      (diagnostics as Record<string, unknown>).subscribedFamiliesCount = count;
    } catch (error) {
      (diagnostics as Record<string, unknown>).sanityError =
        error instanceof Error ? error.message : String(error);
    }
  }

  const allReady =
    diagnostics.readiness.inDecember &&
    diagnostics.readiness.hasMoreMissions &&
    diagnostics.readiness.backendConfigured &&
    diagnostics.readiness.secretsConfigured;

  return NextResponse.json({
    ...diagnostics,
    ready: allReady,
    warnings: [
      !diagnostics.readiness.inDecember && "Not in December",
      !diagnostics.readiness.hasMoreMissions && "No more missions to send",
      !diagnostics.readiness.backendConfigured &&
        "Sanity backend not configured",
      !diagnostics.readiness.secretsConfigured && "Missing required secrets",
    ].filter(Boolean),
  });
}
