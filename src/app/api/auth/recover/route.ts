/**
 * Password Recovery API Endpoint
 *
 * Resends family credentials to the registered parent email.
 * Includes rate limiting (5 minutes between requests per email).
 *
 * POST /api/auth/recover
 * Body: { email: string }
 * Returns: { success: true, message: string } - Always returns success to prevent email enumeration
 */

import { NextRequest } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";
import { successResponse, createErrorResponse } from "@/lib/api-utils";
import { sendWelcomeEmail } from "@/lib/email-service";

interface RecoverRequest {
  email: string;
}

interface FamilyCredentials {
  _id: string;
  kidCode: string;
  parentCode: string;
  familyName: string | null;
  kidNames: string[];
  parentEmail: string;
  lastRecoveryEmail: string | null;
}

// Rate limit: 5 minutes between recovery emails
const RATE_LIMIT_MS = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RecoverRequest;

    // Validate email format
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      // Return generic success to prevent email enumeration
      return successResponse({
        success: true,
        message: "Hvis e-posten er registrert, vil du motta kodene dine snart.",
      });
    }

    // Look up family credentials by email
    const credentials =
      await sanityServerClient.fetch<FamilyCredentials | null>(
        `*[_type == "familyCredentials" && lower(parentEmail) == $email][0]{
        _id,
        kidCode,
        parentCode,
        familyName,
        kidNames,
        parentEmail,
        lastRecoveryEmail
      }`,
        { email },
      );

    // If no credentials found, return generic success (prevent enumeration)
    if (!credentials) {
      console.log(`[Recovery] No credentials found for email: ${email}`);
      return successResponse({
        success: true,
        message: "Hvis e-posten er registrert, vil du motta kodene dine snart.",
      });
    }

    // Check rate limit
    if (credentials.lastRecoveryEmail) {
      const lastSent = new Date(credentials.lastRecoveryEmail).getTime();
      const now = Date.now();
      const timeSinceLastEmail = now - lastSent;

      if (timeSinceLastEmail < RATE_LIMIT_MS) {
        const minutesRemaining = Math.ceil(
          (RATE_LIMIT_MS - timeSinceLastEmail) / 60000,
        );
        console.log(
          `[Recovery] Rate limited for ${email}, ${minutesRemaining} minutes remaining`,
        );
        return successResponse({
          success: true,
          message: `Vent ${minutesRemaining} minutt${minutesRemaining > 1 ? "er" : ""} før du prøver igjen.`,
        });
      }
    }

    // Send recovery email
    const emailSent = await sendWelcomeEmail({
      to: credentials.parentEmail,
      familyName: credentials.familyName || undefined,
      kidCode: credentials.kidCode,
      parentCode: credentials.parentCode,
      kidNames: credentials.kidNames,
    });

    if (emailSent) {
      // Update lastRecoveryEmail timestamp
      await sanityServerClient
        .patch(credentials._id)
        .set({ lastRecoveryEmail: new Date().toISOString() })
        .commit();

      console.log(`[Recovery] Email sent successfully to: ${email}`);
    } else {
      console.error(`[Recovery] Failed to send email to: ${email}`);
    }

    // Always return success to prevent email enumeration
    return successResponse({
      success: true,
      message: "Hvis e-posten er registrert, vil du motta kodene dine snart.",
    });
  } catch (error) {
    return createErrorResponse(error, "Recovery request failed");
  }
}
