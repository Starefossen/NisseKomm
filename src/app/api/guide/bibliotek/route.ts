import type { NextRequest } from "next/server";
import { authorizeMedia } from "@/lib/media-server";
import { bibliotek } from "@/lib/guide-innhold";

export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  try {
    return Response.json(await bibliotek());
  } catch {
    return new Response("Serverfeil", { status: 500 });
  }
}
