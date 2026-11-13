import type { NextRequest } from "next/server";
import { authorizeMedia } from "@/lib/media-server";
import { gjennomganger } from "@/lib/guide-innhold";

export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  try {
    return Response.json(await gjennomganger());
  } catch {
    return new Response("Serverfeil", { status: 500 });
  }
}
