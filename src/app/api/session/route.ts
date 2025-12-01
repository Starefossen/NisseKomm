/**
 * Session API Route
 *
 * Handles session initialization, retrieval, and deletion.
 *
 * GET /api/session
 * - Fetches existing session by sessionId from cookie or query parameter
 * - Returns session data or 404 if not found
 *
 * POST /api/session
 * - Creates new session with given sessionId
 * - Sets session cookie
 * - Returns created session data
 *
 * DELETE /api/session?sessionId=<id>
 * - Deletes session(s) matching the sessionId
 * - Used for cleanup, especially in tests
 * - Returns success status
 */

import { NextRequest, NextResponse } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";
import {
  getSessionId,
  fetchSession,
  setSessionCookie,
  errorResponse,
  createErrorResponse,
  successResponse,
} from "@/lib/api-utils";

/**
 * GET /api/session
 * Fetch session by ID from cookie or query parameter
 * Query parameter takes precedence to support multi-tenant switching
 */
export async function GET(request: NextRequest) {
  try {
    // Extract session ID (query takes precedence for multi-tenant switching)
    const sessionId = getSessionId(request);

    if (!sessionId) {
      return errorResponse("No session ID in cookie or query", 404);
    }

    // Fetch session with fresh data (no cache)
    const session = await fetchSession(sessionId);

    if (!session) {
      return errorResponse("Session not found", 404);
    }

    return successResponse(session);
  } catch (error) {
    return createErrorResponse(error, "Failed to fetch session");
  }
}

/**
 * POST /api/session
 * Create new session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return errorResponse("sessionId required");
    }

    // Create new session document in Sanity
    const newSession = await sanityServerClient.create({
      _type: "userSession",
      sessionId,
      lastUpdated: new Date().toISOString(),
      // Initialize with default values
      authenticated: false,
      soundsEnabled: true,
      musicEnabled: false,
      submittedCodes: [],
      viewedEmails: [],
      viewedBonusOppdragEmails: [],
      bonusOppdragBadges: [],
      eventyrBadges: [],
      earnedBadges: [],
      topicUnlocks: {},
      unlockedFiles: [],
      unlockedModules: [],
      collectedSymbols: [],
      solvedDecryptions: [],
      decryptionAttempts: {},
      failedAttempts: {},
      crisisStatus: { antenna: false, inventory: false },
      santaLetters: [],
      brevfugler: [],
      nissenetLastVisit: 0,
      playerNames: [],
      niceListLastViewed: null,
      dagbokLastRead: 0,
    });

    // Create response with session cookie
    const response = NextResponse.json(newSession, { status: 201 });
    return setSessionCookie(response, sessionId);
  } catch (error) {
    return createErrorResponse(error, "Failed to create session");
  }
}

/**
 * DELETE /api/session
 * Delete session by sessionId (for cleanup, especially in tests)
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return errorResponse("sessionId required");
    }

    // Delete all sessions matching the sessionId
    await sanityServerClient.delete({
      query: `*[_type == "userSession" && sessionId == $sessionId]`,
      params: { sessionId },
    });

    return successResponse({ sessionId });
  } catch (error) {
    return createErrorResponse(error, "Failed to delete session");
  }
}
