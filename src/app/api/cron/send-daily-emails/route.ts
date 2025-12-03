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
  try {
    // Verify authorization (Vercel Cron sends secret in Authorization header)
    const authHeader = request.headers.get("authorization");

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.warn("[Daily Email Cron] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only works with Sanity backend
    if (STORAGE_BACKEND === "localStorage") {
      console.warn(
        "[Daily Email Cron] Sanity backend required for email service",
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

    console.log(
      `[Daily Email Cron] Current time (CET): ${cet.toISOString()}, Day: ${currentDay}, Month: ${currentMonth}`,
    );

    // Only send emails in December
    if (currentMonth !== 12) {
      console.log(
        `[Daily Email Cron] Not December (month=${currentMonth}), skipping emails`,
      );
      return NextResponse.json({
        success: true,
        message: `Outside December period (month ${currentMonth}), no emails sent`,
        sent: 0,
        currentDay,
        currentMonth,
      });
    }

    const tomorrowDay = currentDay + 1;
    console.log(
      `[Daily Email Cron] Tomorrow will be day ${tomorrowDay} of December`,
    );

    // Don't send emails after Dec 24
    if (tomorrowDay > 24) {
      console.log(
        `[Daily Email Cron] After Dec 24 (tomorrow=${tomorrowDay}), no more missions`,
      );
      return NextResponse.json({
        success: true,
        message: `All missions completed (tomorrow would be day ${tomorrowDay})`,
        sent: 0,
        tomorrowDay,
      });
    }

    // Load tomorrow's mission
    const allOppdrag = getAllOppdrag();
    const tomorrowMission = allOppdrag.find((m) => m.dag === tomorrowDay);

    if (!tomorrowMission) {
      console.error(
        `[Daily Email Cron] No mission found for day ${tomorrowDay}`,
      );
      return NextResponse.json(
        { error: `No mission data for day ${tomorrowDay}` },
        { status: 500 },
      );
    }

    console.log(
      `[Daily Email Cron] Preparing emails for Day ${tomorrowDay}: ${tomorrowMission.tittel}`,
    );

    // Fetch all subscribed families
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
      console.warn(
        "[Daily Email Cron] No subscribed families found in Sanity!",
      );
      return NextResponse.json({
        success: true,
        message: "No subscribed families found",
        sent: 0,
        day: tomorrowDay,
      });
    }

    console.log(
      `[Daily Email Cron] Found ${families.length} subscribed families, preparing to send...`,
    );
    console.log(
      `[Daily Email Cron] Family emails: ${families.map((f) => f.parentEmail).join(", ")}`,
    );

    // Send email to each family
    console.log(
      `[Daily Email Cron] Starting email send to ${families.length} families...`,
    );
    const results = await Promise.allSettled(
      families.map(async (family, index) => {
        console.log(
          `[Daily Email Cron] Sending email ${index + 1}/${families.length} to ${family.parentEmail}...`,
        );
        // Generate secure unsubscribe token
        const token = generateUnsubscribeToken(family.sessionId);
        const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?session=${encodeURIComponent(family.sessionId)}&token=${token}`;

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

        console.log(
          `[Daily Email Cron] Email ${index + 1}/${families.length} to ${family.parentEmail}: ${result ? "SUCCESS" : "FAILED"}`,
        );
        return result;
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

    console.log(
      `[Daily Email Cron] ✅ COMPLETED - Results: ${successful} sent, ${failed} failed (total: ${families.length})`,
    );

    // Log all results in detail
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `[Daily Email Cron] ❌ FAILED to send to ${families[index].parentEmail}:`,
          result.reason,
        );
      } else if (result.value === false) {
        console.error(
          `[Daily Email Cron] ❌ FAILED to send to ${families[index].parentEmail}: Email service returned false`,
        );
      } else {
        console.log(
          `[Daily Email Cron] ✅ SUCCESS: ${families[index].parentEmail}`,
        );
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
    console.error("[Daily Email Cron] Error:", error);
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
 * Return info about next scheduled email (for debugging)
 */
export async function GET() {
  const now = new Date();
  const cet = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Oslo" }),
  );
  const currentDay = cet.getDate();
  const currentMonth = cet.getMonth() + 1;
  const tomorrowDay = currentDay + 1;

  return NextResponse.json({
    service: "Daily Mission Email Cron",
    schedule: "Daily at 21:00 CET",
    currentTime: cet.toISOString(),
    currentDay,
    currentMonth,
    nextMissionDay:
      tomorrowDay <= 24 && currentMonth === 12 ? tomorrowDay : null,
    storageBackend: STORAGE_BACKEND,
    enabled: STORAGE_BACKEND === "sanity",
  });
}
