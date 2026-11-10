/**
 * Client-side session helpers. The session cookie is HttpOnly; the client
 * keeps only the kid code, which puzzles use as {{KID_CODE}}.
 */

const KID_CODE_KEY = "nissekomm-kid-code";

export const getSessionId = (): string | null =>
  typeof localStorage === "undefined"
    ? null
    : localStorage.getItem(KID_CODE_KEY);

export function setSessionId(kidCode: string): void {
  localStorage.setItem(KID_CODE_KEY, kidCode);
}

function serverLogout(): void {
  fetch("/api/auth/logout", { method: "POST", body: "{}" }).catch(() => {});
}

export function clearSessionId(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(KID_CODE_KEY);
  }
  serverLogout();
}

export const clearParentAuth = serverLogout;
