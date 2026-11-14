/**
 * Web push subscriptions for this device (parent session, lan mode).
 * GET: {publicKey, typer} (typer for ?endpoint=, null when not subscribed).
 * POST {subscription, typer}: subscribe or change types. DELETE {endpoint}.
 */
import type { NextRequest } from "next/server";
import { hasRole, jsonError, readJsonBody } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { isLanMode } from "@/lib/mode";
import { fjernSub, lagreSub, lesSubs, renskSub } from "@/lib/notify/push";

export const dynamic = "force-dynamic";

async function nekt(request: NextRequest) {
  if (!isLanMode()) return jsonError("Ikke funnet", 404);
  if (!(await hasRole(request, "parent")))
    return jsonError("Ikke innlogget", 401);
  return null;
}

export async function GET(request: NextRequest) {
  const n = await nekt(request);
  if (n) return n;
  const ep = request.nextUrl.searchParams.get("endpoint");
  const sub = ep
    ? (await lesSubs(getStore())).find((s) => s.endpoint === ep)
    : null;
  return Response.json({
    publicKey: process.env.VAPID_PUBLIC_KEY ?? null,
    typer: sub?.typer ?? null,
  });
}

export async function POST(request: NextRequest) {
  const n = await nekt(request);
  if (n) return n;
  const body = await readJsonBody(request);
  if (body instanceof Response) return body;
  const sub = renskSub(body);
  if (!sub) return jsonError("Ugyldig forespørsel", 400);
  await lagreSub(getStore(), sub);
  return new Response(null, { status: 204 });
}

export async function DELETE(request: NextRequest) {
  const n = await nekt(request);
  if (n) return n;
  const body = await readJsonBody(request);
  if (body instanceof Response) return body;
  if (typeof body.endpoint !== "string")
    return jsonError("Ugyldig forespørsel", 400);
  await fjernSub(getStore(), body.endpoint);
  return new Response(null, { status: 204 });
}
