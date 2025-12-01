/**
 * Session Sync API Route
 *
 * Handles partial session updates with timestamp tracking.
 *
 * PATCH /api/session/sync
 * - Updates specific fields in session
 * - Automatically adds lastUpdated timestamp
 * - Supports retry logic from client
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

/**
 * PATCH /api/session/sync
 * Update session fields
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    // Extract and validate session ID
    const sessionIdResult = requireSessionId(request, body);
    if ("error" in sessionIdResult) return sessionIdResult.error;
    const { sessionId } = sessionIdResult;

    // Validate updates object
    if (!updates || typeof updates !== "object") {
      return errorResponse("updates object required");
    }

    // Fetch and validate existing session
    const sessionResult = await requireSession(sessionId);
    if ("error" in sessionResult) return sessionResult.error;
    const { session: existingSession } = sessionResult;

    // Update session with new fields and timestamp
    const updatedSession = await sanityServerClient
      .patch(existingSession._id)
      .set({
        ...updates,
        lastUpdated: new Date().toISOString(),
      })
      .commit();

    return successResponse({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    return createErrorResponse(error, "Failed to sync session");
  }
}
