import { NextRequest, NextResponse } from "next/server";
import { isLanMode, isLanOnlyPath } from "@/lib/mode";

export function buildCsp(nonce: string, dev = false): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'` +
      (dev ? " 'unsafe-eval'" : ""),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'" + (dev ? " ws: wss:" : ""),
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  // The gate has no host redirect; target is a fixed origin, never taken from the request
  const fwd =
    process.env.TRUST_PROXY === "1"
      ? request.headers.get("x-forwarded-host")?.split(",")[0]
      : null;
  const host = (fwd ?? request.headers.get("host") ?? "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
  if (host === "www.nissekomm.no") {
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(
      `https://nissekomm.no${pathname}${search}`,
      301,
    );
  }
  // public/_arkiv (rejected takes) is MEDIA_DIR in dev: never served statically, only via /media/_arkiv (parents)
  if (request.nextUrl.pathname.startsWith("/_arkiv/")) {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (!isLanMode() && isLanOnlyPath(request.nextUrl.pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  // Next reads the nonce from the request's CSP header and stamps its inline scripts
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");
  const headers = new Headers(request.headers);
  headers.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  // All paths (www redirect), minus Next's own assets
  matcher: ["/((?!_next/static|_next/image).*)"],
};
