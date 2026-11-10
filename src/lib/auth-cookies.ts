/**
 * Client-side reads of the login cookies set by /api/auth/login.
 * ponytail: unsigned cookies, replaced by a signed cookie in T4.
 */

export const SESSION_COOKIE = "nissekomm-session";
export const PARENT_COOKIE = "nissekomm-parent-auth";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  for (const c of document.cookie.split(";")) {
    const [k, v] = c.trim().split("=");
    if (k === name && v) return v;
  }
  return null;
}

function clearCookie(name: string): void {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=; max-age=0; path=/`;
  }
}

export const getSessionId = () => readCookie(SESSION_COOKIE);
export const clearSessionId = () => clearCookie(SESSION_COOKIE);
export const clearParentAuth = () => clearCookie(PARENT_COOKIE);

export function isParentAuthenticated(): boolean {
  const session = getSessionId();
  return session !== null && readCookie(PARENT_COOKIE) === session;
}
