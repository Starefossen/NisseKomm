import type { NextRequest } from "next/server";
import { authorizeMedia } from "@/lib/media-server";
import { sok } from "@/lib/guide-innhold";

export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2 || q.length > 100) return Response.json([]);
  try {
    return Response.json(await sok(q));
  } catch {
    return new Response("Serverfeil", { status: 500 });
  }
}
