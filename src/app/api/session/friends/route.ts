/**
 * Friend Names API - Get and update friend names for Nice List
 *
 * GET /api/session/friends?sessionId=xxx
 * - Returns friendNames array from userSession
 *
 * PATCH /api/session/friends
 * - Updates friendNames in userSession
 * - Body: { sessionId: string, friendNames: string[] }
 */

import { NextRequest } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";
import {
  requireSessionId,
  requireSession,
  errorResponse,
  createErrorResponse,
  successResponse,
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET - Retrieve friend names from userSession
 */
export async function GET(request: NextRequest) {
  try {
    const sessionIdResult = requireSessionId(request);
    if ("error" in sessionIdResult) return sessionIdResult.error;
    const { sessionId } = sessionIdResult;

    const sessionResult = await requireSession(sessionId);
    if ("error" in sessionResult) return sessionResult.error;
    const { session } = sessionResult;

    return successResponse({ friendNames: session.friendNames || [] });
  } catch (error) {
    return createErrorResponse(error, "Failed to fetch friend names");
  }
}

/**
 * PATCH - Update friend names in userSession
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      friendNames: string[];
    };

    const sessionIdResult = requireSessionId(request, body);
    if ("error" in sessionIdResult) return sessionIdResult.error;
    const { sessionId } = sessionIdResult;

    const { friendNames } = body;

    // Validate friend names
    if (!Array.isArray(friendNames)) {
      return errorResponse("friendNames must be an array");
    }

    if (friendNames.length > 15) {
      return errorResponse("Maximum 15 friend names allowed");
    }

    // Validate each name
    for (const name of friendNames) {
      if (typeof name !== "string" || name.length > 20) {
        return errorResponse(
          "Friend names must be strings with max 20 characters",
        );
      }
    }

    // Update userSession document
    await sanityServerClient
      .patch(sessionId)
      .set({ friendNames })
      .commit({ autoGenerateArrayKeys: true });

    return successResponse();
  } catch (error) {
    return createErrorResponse(error, "Failed to update friend names");
  }
}
