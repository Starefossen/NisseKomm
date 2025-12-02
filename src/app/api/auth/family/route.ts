/**
 * Family Settings API Endpoint
 *
 * Manage family credentials and settings.
 * Requires parent authentication (parent auth cookie must match session).
 *
 * GET /api/auth/family
 * Returns: { familyName, kidNames, friendNames, email, kidCode, parentCode }
 *
 * PATCH /api/auth/family
 * Body: { familyName?, kidNames?, friendNames?, parentEmail? }
 * Updates allowed fields in familyCredentials document
 *
 * NOTE: Only works with Sanity backend. Returns 501 for localStorage mode.
 */

import { NextRequest } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";
import {
  requireParentAuth,
  requireCredentials,
  successResponse,
  errorResponse,
  createErrorResponse,
} from "@/lib/api-utils";
import type { CalendarEvent } from "@/types/innhold";

interface FamilyResponse {
  familyName: string;
  kidNames: string[];
  friendNames: string[];
  parentEmail: string;
  kidCode: string;
  parentCode: string;
  createdAt: string;
  calendarEvents: CalendarEvent[];
}

interface FamilyUpdateRequest {
  familyName?: string;
  kidNames?: string[];
  friendNames?: string[];
  parentEmail?: string;
  calendarEvents?: CalendarEvent[];
}

/**
 * Check if we're in localStorage mode (no Sanity backend)
 */
function isLocalStorageMode(): boolean {
  return (
    (process.env.NEXT_PUBLIC_STORAGE_BACKEND || "localStorage") ===
    "localStorage"
  );
}

/**
 * GET /api/auth/family
 * Fetch family credentials for authenticated parent
 */
export async function GET(request: NextRequest) {
  try {
    // localStorage mode: Return 501 Not Implemented
    if (isLocalStorageMode()) {
      return errorResponse(
        "Familieinnstillinger er kun tilgjengelig med Sanity-backend. Vennligst sett NEXT_PUBLIC_STORAGE_BACKEND=sanity",
        501,
      );
    }

    // Require parent authentication
    const authResult = requireParentAuth(request);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { sessionId } = authResult;

    // Fetch credentials
    const credentialsResult = await requireCredentials(sessionId);
    if ("error" in credentialsResult) {
      // Return 404 with helpful message - this session has no family registration
      return errorResponse(
        "Ingen familieregistrering funnet for denne økten. Vennligst registrer deg på /register først.",
        404,
      );
    }

    const { credentials } = credentialsResult;

    return successResponse({
      familyName: credentials.familyName || "",
      kidNames: credentials.kidNames || [],
      friendNames: credentials.friendNames || [],
      parentEmail: credentials.parentEmail || "",
      kidCode: credentials.kidCode,
      parentCode: credentials.parentCode,
      createdAt: credentials.createdAt,
      calendarEvents: credentials.calendarEvents || [],
    } as FamilyResponse);
  } catch (error) {
    return createErrorResponse(error, "Failed to fetch family data");
  }
}

/**
 * PATCH /api/auth/family
 * Update family settings
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require parent authentication
    const authResult = requireParentAuth(request);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { sessionId } = authResult;

    // Fetch existing credentials to get document ID
    const credentialsResult = await requireCredentials(sessionId);
    if ("error" in credentialsResult) {
      return credentialsResult.error;
    }

    const { credentials } = credentialsResult;
    const body = (await request.json()) as FamilyUpdateRequest;

    // Build patch object with validation
    const patch: Record<string, unknown> = {};

    // Family name
    if (body.familyName !== undefined) {
      const familyName = body.familyName.trim();
      if (familyName.length === 0) {
        return errorResponse("Familienavn kan ikke være tomt");
      }
      if (familyName.length > 50) {
        return errorResponse("Familienavn kan maks være 50 tegn");
      }
      patch.familyName = familyName;
    }

    // Kid names (1-4 names, each max 20 chars)
    if (body.kidNames !== undefined) {
      const kidNames = body.kidNames
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      if (kidNames.length === 0) {
        return errorResponse("Minst ett barnenavn er påkrevd");
      }
      if (kidNames.length > 4) {
        return errorResponse("Maks 4 barnenavn");
      }
      if (kidNames.some((n) => n.length > 20)) {
        return errorResponse("Barnenavn kan maks være 20 tegn");
      }
      patch.kidNames = kidNames;
    }

    // Friend names (0-15 names, each max 20 chars)
    if (body.friendNames !== undefined) {
      const friendNames = body.friendNames
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      if (friendNames.length > 15) {
        return errorResponse("Maks 15 vennenavn");
      }
      if (friendNames.some((n) => n.length > 20)) {
        return errorResponse("Vennenavn kan maks være 20 tegn");
      }
      patch.friendNames = friendNames;
    }

    // Parent email
    if (body.parentEmail !== undefined) {
      const email = body.parentEmail.trim();
      if (email.length === 0) {
        return errorResponse("E-postadresse kan ikke være tom");
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse("Ugyldig e-postadresse");
      }
      patch.parentEmail = email;
    }

    // Calendar events (0-24 events, max 50 chars each)
    if (body.calendarEvents !== undefined) {
      // Validate each event
      for (const event of body.calendarEvents) {
        if (event.dag < 1 || event.dag > 24) {
          return errorResponse("Dag må være mellom 1 og 24");
        }
        if (!event.hendelse || event.hendelse.trim().length === 0) {
          return errorResponse("Hendelse kan ikke være tom");
        }
        if (event.hendelse.length > 50) {
          return errorResponse("Hendelse kan maks være 50 tegn");
        }
      }
      // Clean up and store
      patch.calendarEvents = body.calendarEvents.map((e) => ({
        dag: e.dag,
        hendelse: e.hendelse.trim(),
      }));
    }

    // If nothing to update
    if (Object.keys(patch).length === 0) {
      return errorResponse("Ingen endringer å lagre");
    }

    // Update in Sanity
    await sanityServerClient.patch(credentials._id).set(patch).commit();

    // Also update playerNames in userSession if kidNames changed
    if (patch.kidNames) {
      const session = await sanityServerClient.fetch(
        `*[_type == "userSession" && sessionId == $sessionId][0]`,
        { sessionId },
      );

      if (session) {
        await sanityServerClient
          .patch(session._id)
          .set({ playerNames: patch.kidNames })
          .commit();
      }
    }

    // Also update friendNames in userSession if friendNames changed
    if (patch.friendNames !== undefined) {
      const session = await sanityServerClient.fetch(
        `*[_type == "userSession" && sessionId == $sessionId][0]`,
        { sessionId },
      );

      if (session) {
        await sanityServerClient
          .patch(session._id)
          .set({ friendNames: patch.friendNames })
          .commit();
      }
    }

    return successResponse({ success: true, updated: Object.keys(patch) });
  } catch (error) {
    return createErrorResponse(error, "Failed to update family data");
  }
}
