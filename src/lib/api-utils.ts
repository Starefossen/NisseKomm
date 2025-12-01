/**
 * API Route Utilities
 *
 * Centralized helpers for authentication, session management, and error handling
 * across all API routes. Eliminates duplication and ensures consistent behavior.
 *
 * Key Features:
 * - Session ID extraction from cookies/query/body
 * - Session and credentials validation
 * - Standardized error responses
 * - Type-safe response helpers
 */

import { NextRequest, NextResponse } from "next/server";
import { sanityServerClient } from "@/lib/sanity-client";

const SESSION_COOKIE_NAME = "nissekomm-session";

// ============================================================================
// Types
// ============================================================================

interface ApiError {
  error: string;
  retryable?: boolean;
}

interface SessionData {
  _id: string;
  sessionId: string;
  lastUpdated: string;
  authenticated: boolean;
  soundsEnabled: boolean;
  musicEnabled: boolean;
  submittedCodes: string[];
  viewedEmails: number[];
  viewedBonusOppdragEmails: number[];
  bonusOppdragBadges: string[];
  eventyrBadges: string[];
  earnedBadges: string[];
  topicUnlocks: string | Record<string, unknown>;
  unlockedFiles: string[];
  unlockedModules: string[];
  collectedSymbols: string[];
  solvedDecryptions: string[];
  decryptionAttempts: string | Record<string, unknown>;
  failedAttempts: string | Record<string, unknown>;
  crisisStatus: { antenna: boolean; inventory: boolean };
  santaLetters: string[];
  brevfugler: string[];
  nissenetLastVisit: number;
  playerNames: string[];
  friendNames?: string[];
  niceListLastViewed: string | null;
  dagbokLastRead: number;
}

interface FamilyCredentials {
  _id: string;
  sessionId: string;
  kidCode: string;
  parentCode: string;
  familyName?: string;
  kidNames: string[];
  friendNames: string[];
  parentEmail?: string;
  createdAt: string;
}

// ============================================================================
// Session ID Extraction
// ============================================================================

/**
 * Extract session ID from request (cookie → query → body)
 * Priority order ensures flexibility for different use cases:
 * 1. Cookie (default for authenticated requests)
 * 2. Query parameter (for explicit session loading/switching)
 * 3. Request body (for API calls from tests/scripts)
 *
 * @param request - Next.js request object
 * @param body - Optional parsed request body
 * @returns Session ID or null if not found
 */
export function getSessionId(
  request: NextRequest,
  body?: { sessionId?: string },
): string | null {
  // Try cookie first (most common case)
  const cookieSessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieSessionId) return cookieSessionId;

  // Try query parameter (for session switching)
  const url = new URL(request.url);
  const querySessionId = url.searchParams.get("sessionId");
  if (querySessionId) return querySessionId;

  // Try request body (for tests/API calls)
  if (body?.sessionId) return body.sessionId;

  return null;
}

/**
 * Extract session ID and return 401 error if missing
 * Use this for protected routes that require authentication
 */
export function requireSessionId(
  request: NextRequest,
  body?: { sessionId?: string },
): { sessionId: string } | { error: NextResponse } {
  const sessionId = getSessionId(request, body);

  if (!sessionId) {
    return {
      error: NextResponse.json(
        { error: "No session ID in cookie or query" } as ApiError,
        { status: 401 },
      ),
    };
  }

  return { sessionId };
}

// ============================================================================
// Session & Credentials Validation
// ============================================================================

/**
 * Fetch session from Sanity with fresh data (no cache)
 * Returns null if session not found
 */
export async function fetchSession(
  sessionId: string,
): Promise<SessionData | null> {
  try {
    const session = await sanityServerClient.fetch<SessionData | null>(
      `*[_type == "userSession" && sessionId == $sessionId][0]`,
      { sessionId },
      {
        perspective: "published",
        useCdn: false, // Always fetch fresh data
        cache: "no-store",
      },
    );

    return session;
  } catch (error) {
    console.error("Failed to fetch session:", error);
    throw error; // Re-throw for caller to handle
  }
}

/**
 * Fetch session and return 404 error if not found
 * Use this for routes that require valid session
 */
export async function requireSession(
  sessionId: string,
): Promise<{ session: SessionData } | { error: NextResponse }> {
  try {
    const session = await fetchSession(sessionId);

    if (!session) {
      return {
        error: NextResponse.json({ error: "Session not found" } as ApiError, {
          status: 404,
        }),
      };
    }

    return { session };
  } catch (error) {
    return {
      error: createErrorResponse(error, "Failed to fetch session"),
    };
  }
}

/**
 * Fetch family credentials from Sanity
 * Returns null if credentials not found
 */
export async function fetchCredentials(
  sessionId: string,
): Promise<FamilyCredentials | null> {
  try {
    const credentials =
      await sanityServerClient.fetch<FamilyCredentials | null>(
        `*[_type == "familyCredentials" && sessionId == $sessionId][0]`,
        { sessionId },
      );

    return credentials;
  } catch (error) {
    console.error("Failed to fetch credentials:", error);
    throw error;
  }
}

/**
 * Fetch credentials and return 404 error if not found
 * Use this for routes that require valid family credentials
 */
export async function requireCredentials(
  sessionId: string,
): Promise<{ credentials: FamilyCredentials } | { error: NextResponse }> {
  try {
    const credentials = await fetchCredentials(sessionId);

    if (!credentials) {
      return {
        error: NextResponse.json(
          { error: "Credentials not found" } as ApiError,
          { status: 404 },
        ),
      };
    }

    return { credentials };
  } catch (error) {
    return {
      error: createErrorResponse(error, "Failed to fetch credentials"),
    };
  }
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Create standardized error response with appropriate status code
 * Handles network errors, conflicts, and generic errors
 *
 * @param error - Error object from catch block
 * @param defaultMessage - Default error message if none provided
 * @returns NextResponse with error details
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage = "Internal server error",
): NextResponse {
  console.error(defaultMessage, error);

  // Handle Sanity-specific errors
  const err = error as { statusCode?: number; code?: string; message?: string };

  // Conflict - document was modified (retryable)
  if (err.statusCode === 409) {
    return NextResponse.json(
      {
        error: "Conflict - resource was modified",
        retryable: true,
      } as ApiError,
      { status: 409 },
    );
  }

  // Network errors (retryable)
  if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
    return NextResponse.json(
      {
        error: "Network error",
        retryable: true,
      } as ApiError,
      { status: 503 },
    );
  }

  // Validation errors (non-retryable)
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
        retryable: false,
      } as ApiError,
      { status: 400 },
    );
  }

  // Generic server error (non-retryable)
  return NextResponse.json(
    {
      error: defaultMessage,
      retryable: false,
    } as ApiError,
    { status: 500 },
  );
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create success response with optional data
 */
export function successResponse<T>(data?: T, status = 200): NextResponse {
  const body = data ? data : { success: true };
  return NextResponse.json(body, { status });
}

/**
 * Create error response with message and status
 */
export function errorResponse(
  message: string,
  status = 400,
  retryable = false,
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      retryable,
    } as ApiError,
    { status },
  );
}

// ============================================================================
// Session Cookie Management
// ============================================================================

/**
 * Set session cookie on response
 * Used after successful login/registration
 */
export function setSessionCookie(
  response: NextResponse,
  sessionId: string,
): NextResponse {
  const maxAge = 365 * 24 * 60 * 60; // 365 days in seconds

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
}
