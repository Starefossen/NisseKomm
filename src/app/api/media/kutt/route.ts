import type { NextRequest } from "next/server";
import { avbrytKutt, kuttDag, kuttStatus } from "@/lib/kutt-jobb";
import { authorizeMedia } from "@/lib/media-server";

/** How the automatic cut for a day is going (lan mode, parent only). */
export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const dag = kuttDag(Number(req.nextUrl.searchParams.get("dag")));
  if (!dag) return new Response("Ugyldig forespørsel", { status: 400 });
  return Response.json(kuttStatus(dag));
}

/** «Avbryt»: stops the day's running cut; julius-dag.py puts the takes back. */
export async function DELETE(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const dag = kuttDag(Number(req.nextUrl.searchParams.get("dag")));
  if (!dag) return new Response("Ugyldig forespørsel", { status: 400 });
  return Response.json({ avbrutt: avbrytKutt(dag), ...kuttStatus(dag) });
}
