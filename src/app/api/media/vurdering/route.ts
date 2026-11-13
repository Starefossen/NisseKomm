import path from "node:path";
import type { NextRequest } from "next/server";
import { authorizeMedia, mediaDir } from "@/lib/media-server";
import { versionKey } from "@/lib/media-status";
import type { Forrige } from "@/lib/vurdering-versjon";
import {
  endreLager,
  lesLager,
  oppføring,
  settVurdering,
  visning,
} from "@/lib/vurdering-lager";
import { taggerFor } from "@/lib/vurdering-tagger";

/** «ok» = usable with flaws; its note is a lesson for later generation. */
export type Verdikt = "godkjent" | "ok" | "lag_paa_nytt";

export interface MediaVurderingItem {
  vurdering?: Verdikt;
  notat?: string;
  oppdatert?: string;
  /** What was reviewed: file size-mtime or a hash of the section text. */
  versjon?: string;
  /** Set when served: the verdict given to an earlier version. */
  forrige?: Forrige;
  tagger?: string[];
  tid?: number;
}

export type MediaVurderinger = Record<string, MediaVurderingItem>;

const badRequest = () => new Response("Ugyldig forespørsel", { status: 400 });
const serverError = () => new Response("Serverfeil", { status: 500 });

function isSafePath(p: string): boolean {
  if (typeof p !== "string" || !p.trim()) return false;
  if (p.includes("\0")) return false;
  const trimmed = p.trim();
  const normalized = path.normalize(trimmed);
  if (
    normalized.startsWith("..") ||
    normalized.includes("..") ||
    path.isAbsolute(trimmed) ||
    path.isAbsolute(normalized) ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("\\")
  ) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;
  try {
    return Response.json(await visning(mediaDir(), await lesLager(mediaDir())));
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const denied = await authorizeMedia(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return badRequest();
  }

  const {
    path: relPath,
    vurdering,
    notat,
    tagger,
    tid,
  } = body as Record<string, unknown>;

  if (typeof relPath !== "string" || !isSafePath(relPath)) {
    return badRequest();
  }

  const cleanPath = relPath.trim();

  const allowedVerdicts = ["godkjent", "ok", "lag_paa_nytt", null, ""];
  if (
    vurdering !== undefined &&
    !allowedVerdicts.includes(vurdering as string | null)
  ) {
    return badRequest();
  }

  if (
    notat !== undefined &&
    (typeof notat !== "string" || notat.length > 1000)
  ) {
    return badRequest();
  }

  const lov = taggerFor(cleanPath.trim());
  if (
    tagger !== undefined &&
    (!Array.isArray(tagger) || tagger.some((t) => !lov.includes(t)))
  ) {
    return badRequest();
  }
  if (
    tid !== undefined &&
    tid !== null &&
    (typeof tid !== "number" || !(tid >= 0) || tid > 36000)
  ) {
    return badRequest();
  }

  const dir = mediaDir();
  // Real wall-clock time: TIDSMASKIN mocks date-utils, and review notes need the actual time.
  const now = new Date(Date.now()).toISOString();
  let ugyldig = false;
  try {
    return await endreLager(dir, async (l) => {
      const prev =
        l.elementer[versionKey(cleanPath)]?.vurderinger.find(
          (v) => v.fil === cleanPath,
        ) ?? {};
      const nextVerdict =
        vurdering !== undefined
          ? (vurdering as Verdikt | null | "")
          : (prev as MediaVurderingItem).vurdering;
      const nextNote =
        notat !== undefined
          ? (notat as string).trim()
          : ((prev as MediaVurderingItem).notat ?? "");
      // A redo without a note tells the generator nothing.
      if (nextVerdict === "lag_paa_nytt" && !nextNote) {
        ugyldig = true;
        throw new Error("lag_paa_nytt uten notat");
      }
      const p = prev as MediaVurderingItem;
      const nesteTagger =
        tagger !== undefined ? [...new Set(tagger as string[])] : p.tagger;
      const nesteTid =
        tid !== undefined ? (tid as number | null) : (p.tid ?? null);
      const v = await settVurdering(dir, l, cleanPath, {
        ...(nesteTagger?.length ? { tagger: nesteTagger } : {}),
        ...(nesteTid !== null ? { tid: Math.round(nesteTid * 10) / 10 } : {}),
        ...(nextVerdict ? { vurdering: nextVerdict } : {}),
        ...(nextNote ? { notat: nextNote } : {}),
        oppdatert: now,
      });
      const entry = v && oppføring(v);
      return Response.json({
        ok: true,
        path: cleanPath,
        entry,
        vurderinger: await visning(dir, l),
      });
    });
  } catch {
    return ugyldig ? badRequest() : serverError();
  }
}
