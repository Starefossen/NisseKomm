import { NextRequest, NextResponse } from "next/server";
import { isLanMode, isLanOnlyPath } from "@/lib/mode";

export function proxy(request: NextRequest) {
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
  matcher: [
    "/nissemor-guide/:path*",
    "/dev/:path*",
    "/mcp/:path*",
    "/_arkiv/:path*",
  ],
};
