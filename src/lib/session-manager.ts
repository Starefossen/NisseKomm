/**
 * Session Manager
 *
 * Handles password-based session IDs for multi-tenant game sessions.
 * Each boot password creates a separate tenant/family session in Sanity.
 *
 * Session ID Strategy:
 * - Hash boot password using SHA-256 to create tenant identifier
 * - Store hashed password in cookie for persistence across page loads
 * - Cookie: nissekomm-session, 365 days expiry, httpOnly=false (client needs read access)
 * - Fallback to localStorage if cookies disabled
 */

import { hashPassword } from "./password-utils";

const SESSION_COOKIE_NAME = "nissekomm-session";
const SESSION_STORAGE_KEY = "nissekomm-session-id";
const SESSION_EXPIRY_DAYS = 365;

/**
 * Create session ID from boot password
 * Returns hashed password to use as tenant identifier
 */
export async function createSessionIdFromPassword(
  password: string,
): Promise<string> {
  const sessionId = await hashPassword(password);
  setSessionCookie(sessionId);

  // Also store in localStorage as fallback
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch (e) {
    console.warn("Failed to write to localStorage:", e);
  }

  return sessionId;
}

/**
 * Set session ID in cookie (internal helper)
 */
function setSessionCookie(sessionId: string): void {
  if (typeof document === "undefined") return;

  const maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60; // seconds
  const isSecure = window.location.protocol === "https:";

  // Cookie attributes for security
  const cookieString = [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    `max-age=${maxAge}`,
    `path=/`,
    `samesite=lax`,
    isSecure ? "secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = cookieString;
}
