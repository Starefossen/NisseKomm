/**
 * Session Manager
 *
 * Handles session ID storage and retrieval for multi-tenant game sessions.
 * Each family has a unique UUID-based session ID linked to their credentials.
 *
 * Session ID Strategy:
 * - UUIDs assigned during registration via /api/auth/register
 * - Returned from /api/auth/login after code validation
 * - Stored in cookie for persistence across page loads
 * - Cookie: nissekomm-session, 365 days expiry, httpOnly=false (client needs read access)
 * - Fallback to localStorage if cookies disabled
 */

const SESSION_COOKIE_NAME = "nissekomm-session";
const SESSION_STORAGE_KEY = "nissekomm-session-id";
const SESSION_EXPIRY_DAYS = 365;

// Parent authentication cookie - stores sessionId when parent is authenticated
const PARENT_AUTH_COOKIE_NAME = "nissekomm-parent-auth";
const PARENT_AUTH_STORAGE_KEY = "nissekomm-parent-auth";

/**
 * Set session ID in storage
 * Used after successful login via /api/auth/login
 */
export function setSessionId(sessionId: string): void {
  setSessionCookie(sessionId);

  // Also store in localStorage as fallback
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to write to localStorage:", e);
    }
  }
}

/**
 * Get current session ID from cookie or localStorage
 */
export function getSessionId(): string | null {
  // Try cookie first
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === SESSION_COOKIE_NAME && value) {
        return value;
      }
    }
  }

  // Fallback to localStorage
  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SESSION_STORAGE_KEY);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to read from localStorage:", e);
    }
  }

  return null;
}

/**
 * Clear session ID (logout)
 */
export function clearSessionId(): void {
  // Clear cookie
  if (typeof document !== "undefined") {
    document.cookie = `${SESSION_COOKIE_NAME}=; max-age=0; path=/`;
  }

  // Clear localStorage
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to clear localStorage:", e);
    }
  }
}

/**
 * Get kid code from session (used for Day 1 code resolution)
 * - localStorage backend: Returns sessionId (which IS the kidCode)
 * - Sanity backend: Fetches kidCode from session API
 */
export async function getKidCodeFromSession(): Promise<string | null> {
  const sessionId = getSessionId();
  if (!sessionId) {
    return null;
  }

  const backend = process.env.NEXT_PUBLIC_STORAGE_BACKEND || "localStorage";
  console.debug("[SessionManager] Storage backend:", backend);

  // localStorage mode: sessionId IS the kidCode
  if (backend === "localStorage") {
    const { isValidKidCode } = await import("./code-generator");
    // Verify it's a valid kid code format
    if (isValidKidCode(sessionId)) {
      console.debug(
        "[SessionManager] localStorage mode - sessionId is valid kidCode",
      );
      return sessionId;
    }
    // If sessionId is a parent code, we can't get the kid code in localStorage mode
    return null;
  }

  // Sanity mode: Fetch from API with timeout
  console.debug("[SessionManager] Sanity mode - fetching kidCode from API...");
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `/api/session/kid-code?sessionId=${sessionId}`,
      {
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[SessionManager] Failed to fetch kid code, status:",
          response.status,
        );
      }
      return null;
    }

    const data = (await response.json()) as { kidCode?: string };
    console.debug(
      "[SessionManager] Successfully fetched kidCode:",
      data.kidCode ? "YES" : "NO",
    );
    return data.kidCode || null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      if (error instanceof Error && error.name === "AbortError") {
        console.error(
          "[SessionManager] Kid code fetch timed out after 5 seconds",
        );
      } else {
        console.error("[SessionManager] Failed to fetch kid code:", error);
      }
    }
    return null;
  }
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

// ============================================================================
// Parent Authentication
// ============================================================================

/**
 * Set parent as authenticated for current session
 * Called after successful parent code validation or registration
 * @param sessionId - The session ID to associate with parent auth (must match current session)
 */
export function setParentAuthenticated(sessionId: string): void {
  if (typeof document === "undefined") return;

  const maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60; // seconds
  const isSecure = window.location.protocol === "https:";

  // Cookie attributes for security
  const cookieString = [
    `${PARENT_AUTH_COOKIE_NAME}=${sessionId}`,
    `max-age=${maxAge}`,
    `path=/`,
    `samesite=lax`,
    isSecure ? "secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = cookieString;

  // Also store in localStorage as fallback
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(PARENT_AUTH_STORAGE_KEY, sessionId);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to write parent auth to localStorage:", e);
    }
  }
}

/**
 * Check if parent is authenticated for current session
 * Returns true only if parent auth cookie exists AND matches current session
 */
export function isParentAuthenticated(): boolean {
  const currentSessionId = getSessionId();
  if (!currentSessionId) return false;

  // Try cookie first
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === PARENT_AUTH_COOKIE_NAME && value === currentSessionId) {
        return true;
      }
    }
  }

  // Fallback to localStorage
  try {
    if (typeof window !== "undefined") {
      const storedAuth = localStorage.getItem(PARENT_AUTH_STORAGE_KEY);
      return storedAuth === currentSessionId;
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to read parent auth from localStorage:", e);
    }
  }

  return false;
}

/**
 * Clear parent authentication (logout from parent guide)
 * Does NOT clear kid session - just revokes parent access
 */
export function clearParentAuth(): void {
  // Clear cookie
  if (typeof document !== "undefined") {
    document.cookie = `${PARENT_AUTH_COOKIE_NAME}=; max-age=0; path=/`;
  }

  // Clear localStorage
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(PARENT_AUTH_STORAGE_KEY);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to clear parent auth from localStorage:", e);
    }
  }
}
