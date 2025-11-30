/**
 * Session API Route
 *
 * Handles session initialization and retrieval.
 *
 * GET /api/session
 * - Fetches existing session by sessionId from cookie
 * - Returns session data or 404 if not found
 *
 * POST /api/session
 * - Creates new session with given sessionId
 * - Sets session cookie
 * - Returns created session data
 */

import { NextRequest, NextResponse } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";

const SESSION_COOKIE_NAME = "nissekomm-session";
const SESSION_EXPIRY_DAYS = 365;

/**
 * GET /api/session
 * Fetch session by ID from cookie or query parameter
 * Query parameter takes precedence to support multi-tenant switching
 */
export async function GET(request: NextRequest) {
  try {
    // Try query parameter first (for explicit session loading)
    const url = new URL(request.url);
    let sessionId = url.searchParams.get("sessionId");

    // Fallback to cookie
    if (!sessionId) {
      sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "No session ID in cookie or query" },
        { status: 404 },
      );
    }

    // Query Sanity for session with fresh data (no cache)
    const session = await sanityServerClient.fetch(
      `*[_type == "userSession" && sessionId == $sessionId][0]`,
      { sessionId },
      {
        perspective: "published",
        useCdn: false, // Always fetch fresh data from origin
        cache: "no-store",
      },
    );

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 },
    );
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
      return NextResponse.json(
        { error: "sessionId required" },
        { status: 400 },
      );
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

    // Set cookie
    const maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60; // seconds
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionId,
      maxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false, // Client needs to read this
    });

    return response;
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}
