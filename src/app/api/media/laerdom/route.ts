import type { NextRequest } from "next/server";
import { authorizeMedia } from "@/lib/media-server";
import { endreLaerdom, lesLaerdom, type Endring } from "@/lib/laerdom";

const tekster = (x: unknown) =>
  Array.isArray(x) && x.every((s) => typeof s === "string");

export async function GET(req: NextRequest) {
  return (await authorizeMedia(req)) ?? Response.json(await lesLaerdom());
}

/** Rule approval from Lærdom: parent only, lan mode only. Writes the file; agents commit it. */
export async function POST(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const b = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const ok =
    b &&
    ((b.handling === "regel" &&
      typeof b.type === "string" &&
      typeof b.regel === "string" &&
      tekster(b.kilder)) ||
      (b.handling === "avvis" && tekster(b.kilder)) ||
      ((b.handling === "av" || b.handling === "på") &&
        Number.isInteger(b.indeks)));
  if (!ok) return new Response("Ugyldig forespørsel", { status: 400 });
  try {
    return Response.json(await endreLaerdom(b as unknown as Endring));
  } catch (err) {
    return new Response((err as Error).message, { status: 400 });
  }
}
