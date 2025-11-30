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

import { NextRequest, NextResponse } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";

const SESSION_COOKIE_NAME = "nissekomm-session";

/**
 * PATCH /api/session/sync
 * Update session fields
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates, sessionId: bodySessionId } = body;

    // Get sessionId from cookie or request body (for tests)
    const sessionId =
      request.cookies.get(SESSION_COOKIE_NAME)?.value || bodySessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: "No session ID in cookie or body" },
        { status: 401 },
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "updates object required" },
        { status: 400 },
      );
    }

    // Find existing session (no cache for fresh data)
    const existingSession = await sanityServerClient.fetch(
      `*[_type == "userSession" && sessionId == $sessionId][0]`,
      { sessionId },
      {
        perspective: "published",
        useCdn: false,
        cache: "no-store",
      },
    );

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Update session with new fields and timestamp
    const updatedSession = await sanityServerClient
      .patch(existingSession._id)
      .set({
        ...updates,
        lastUpdated: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error("Failed to sync session:", error);

    // Return specific error codes for retry logic
    const err = error as { statusCode?: number; code?: string };
    if (err.statusCode === 409) {
      // Conflict - document was modified
      return NextResponse.json(
        { error: "Conflict - session was modified", retryable: true },
        { status: 409 },
      );
    }

    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
      return NextResponse.json(
        { error: "Network error", retryable: true },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Failed to sync session", retryable: false },
      { status: 500 },
    );
  }
}
