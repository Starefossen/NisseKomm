/**
 * POST /api/push/test {endpoint}: a test notification to this device (parent session).
 * POST /api/push/kveld: tonight's checklist, once per Oslo date; Varden's cron
 *   calls it at 20:00 (Bearer JWT), the app's own timer does too (instrumentation).
 * POST /api/push/agent {tittel, tekst}: an agent needs an answer (Bearer JWT).
 */
import type { NextRequest } from "next/server";
import { jsonError, readJsonBody } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { authorizeMedia } from "@/lib/media-server";
import { antallKveldTing } from "@/lib/guide-sesong";
import { sendKveld, sendPush } from "@/lib/notify/push";

export const dynamic = "force-dynamic";

const kutt = (v: unknown, n: number) =>
  typeof v === "string" ? v.trim().slice(0, n) : "";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hva: string }> },
) {
  const denied = await authorizeMedia(request);
  if (denied) return denied;
  const { hva } = await params;
  const bearer = !!request.headers.get("authorization");
  let body: Record<string, unknown> = {};
  if (bearer) body = await request.json().catch(() => ({}));
  else {
    const b = await readJsonBody(request);
    if (b instanceof Response) return b;
    body = b;
  }
  const store = getStore();
  if (hva === "test") {
    if (typeof body.endpoint !== "string")
      return jsonError("Ugyldig forespørsel", 400);
    const n = await sendPush(
      store,
      {
        type: "agent",
        title: "Testvarsel",
        body: "Varslene fra Nissemor-guiden virker.",
      },
      body.endpoint,
    );
    return Response.json({ sendt: n });
  }
  if (hva === "kveld")
    return Response.json({ sendt: await sendKveld(store, antallKveldTing) });
  if (hva === "agent") {
    const tekst = kutt(body.tekst, 300);
    if (!tekst) return jsonError("Ugyldig forespørsel", 400);
    const n = await sendPush(store, {
      type: "agent",
      title: kutt(body.tittel, 80) || "En agent trenger svar",
      body: tekst,
      url: "/nissemor-guide/vurderinger",
    });
    return Response.json({ sendt: n });
  }
  return jsonError("Ikke funnet", 404);
}
