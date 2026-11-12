import type { NextRequest } from "next/server";
import { authorizeMedia } from "@/lib/media-server";
import { bibliotek, promoer } from "@/lib/guide-innhold";
import {
  dagListe,
  forSesongen,
  historien,
  sesongKart,
} from "@/lib/guide-sesong";

/** First fact in an entitet.md JSON block, the figure's one-line introduction. */
const forsteFakta = (md: string) => {
  try {
    const j = JSON.parse(md.match(/```json\n([\s\S]*?)```/)?.[1] ?? "{}");
    return String(j.fakta?.[0]?.tekst ?? "");
  } catch {
    return "";
  }
};

/** Day list, pre-season and Historien for the parent guide (lan mode, parent only). */
export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  const figurer = (await bibliotek())
    .filter((e) => e.type === "characters")
    .map((e) => ({ id: e.id, navn: e.navn, om: forsteFakta(e.entitet) }));
  return Response.json({
    dager: dagListe(),
    for: forSesongen(),
    historien: historien(),
    kart: sesongKart(),
    figurer,
    promo: await promoer(),
  });
}
