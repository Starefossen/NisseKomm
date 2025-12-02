/**
 * Family Data API Endpoint
 *
 * Fetches non-sensitive family data for the current session.
 * Does not require parent authentication - read-only access for kids.
 *
 * Returns:
 * - familyName: Display name for the family
 * - kidNames: Names of children (for personalization)
 * - friendNames: Friend names (for snill_slem_liste.txt)
 * - calendarEvents: Custom calendar events
 *
 * Excludes sensitive data:
 * - kidCode, parentCode (authentication)
 * - parentEmail (privacy)
 * - sessionId (internal)
 *
 * GET /api/family
 * Returns: FamilyData (non-sensitive fields only)
 */

import { NextRequest } from "next/server";
import {
  requireSessionId,
  fetchCredentials,
  successResponse,
  createErrorResponse,
} from "@/lib/api-utils";
import type { CalendarEvent } from "@/types/innhold";

/**
 * Public family data response
 * Excludes codes, email, and internal fields
 */
interface FamilyDataResponse {
  familyName?: string;
  kidNames: string[];
  friendNames: string[];
  calendarEvents: CalendarEvent[];
}

/**
 * GET /api/family
 * Fetch family data for authenticated session (kid or parent)
 */
export async function GET(request: NextRequest) {
  try {
    // Require session authentication (kid or parent)
    const sessionResult = requireSessionId(request);
    if ("error" in sessionResult) {
      // No session = return empty defaults
      return successResponse({
        familyName: undefined,
        kidNames: [],
        friendNames: [],
        calendarEvents: [],
      } satisfies FamilyDataResponse);
    }

    const { sessionId } = sessionResult;

    // Fetch credentials (source of family data)
    const credentials = await fetchCredentials(sessionId);

    if (!credentials) {
      // No credentials = return empty defaults
      return successResponse({
        familyName: undefined,
        kidNames: [],
        friendNames: [],
        calendarEvents: [],
      } satisfies FamilyDataResponse);
    }

    // Return only non-sensitive fields
    const familyData: FamilyDataResponse = {
      familyName: credentials.familyName,
      kidNames: credentials.kidNames || [],
      friendNames: credentials.friendNames || [],
      calendarEvents: credentials.calendarEvents || [],
    };

    return successResponse(familyData);
  } catch (error) {
    return createErrorResponse(error, "Failed to fetch family data");
  }
}
