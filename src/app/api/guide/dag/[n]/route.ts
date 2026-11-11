import type { NextRequest } from "next/server";
import { authorizeMedia } from "@/lib/media-server";
import { dagInnhold } from "@/lib/guide-innhold";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ n: string }> },
) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > 24) {
    return new Response("Ugyldig forespørsel", { status: 400 });
  }
  try {
    return Response.json(await dagInnhold(n));
  } catch {
    return new Response("Serverfeil", { status: 500 });
  }
}
