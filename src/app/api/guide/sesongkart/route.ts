import type { NextRequest } from "next/server";
import { authorizeMedia } from "@/lib/media-server";
import { sesongLinje } from "@/lib/guide-sesong";

/** Season map for the parent guide; codes only with ?fasit=1 (parent only, lan). */
export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  return Response.json(
    sesongLinje(req.nextUrl.searchParams.get("fasit") === "1"),
  );
}
