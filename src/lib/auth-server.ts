/** Session check for server components (pages), which get no NextRequest. */
import "server-only";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { hasRole, type Role } from "./auth";

export async function harRolle(role: Role): Promise<boolean> {
  const h = await headers();
  // ponytail: plain-http URL; https is only seen via TRUST_PROXY's X-Forwarded-Proto,
  // which is how production runs (behind Kourier). Direct TLS would need the real scheme.
  const r = new NextRequest(`http://${h.get("host") ?? "localhost"}/`, {
    headers: new Headers(h),
  });
  return hasRole(r, role);
}
