import { NextRequest, NextResponse } from "next/server";
import { isLanMode, isLanOnlyPath } from "@/lib/mode";

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
  return NextResponse.next();
}

export const config = {
  // All paths (www redirect), minus Next's own assets
  matcher: ["/((?!_next/static|_next/image).*)"],
};
