import { NextRequest, NextResponse } from "next/server";
import { isLanMode, isLanOnlyPath } from "@/lib/mode";

export function proxy(request: NextRequest) {
  if (!isLanMode() && isLanOnlyPath(request.nextUrl.pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/nissemor-guide/:path*", "/dev/:path*", "/mcp/:path*"],
};
