import path from "node:path";
import type { NextRequest } from "next/server";
import { authorizeMedia, mediaDir } from "@/lib/media-server";
import { versionKey } from "@/lib/media-status";
import { segmentRaws, type Forrige } from "@/lib/vurdering-versjon";
import {
  endreLager,
  kjentId,
  lesLager,
  oppføring,
  stemple,
  type Oppføring,
  type Vurdering,
  settVurdering,
  visning,
} from "@/lib/vurdering-lager";
import { taggerFor } from "@/lib/vurdering-tagger";
import type { Kutt } from "@/lib/segmenter";
import { kuttDag, startKutt } from "@/lib/kutt-jobb";

/** «ok» = usable with flaws; its note is a lesson for later generation. */
/** «kutt» (✂, Julius segments only) = trim the take at `kutt`, no new call. */
export type Verdikt = "godkjent" | "ok" | "lag_paa_nytt" | "kutt";

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
  kutt?: Kutt;
  kuttsjekk?: Kutt;
}

export type MediaVurderinger = Record<string, MediaVurderingItem>;

const p0 = (v: Partial<Vurdering>) => v as MediaVurderingItem;
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
    raw,
    kutt,
    behold,
  } = body as Record<string, unknown>;

  if (typeof relPath !== "string" || !isSafePath(relPath)) {
    return badRequest();
  }

  const cleanPath = relPath.trim();
  // A verdict on something that does not exist (video/julius/dag-99#s1) would sit in the store forever.
  if (!kjentId(cleanPath)) return badRequest();

  const allowedVerdicts = ["godkjent", "ok", "lag_paa_nytt", "kutt", null, ""];
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

  // ✂ needs a direction and a point inside the take; only Julius segments have takes to cut.
  const segId = /^video\/julius\/dag-\d+#s\d+$/.test(cleanPath);
  const k = kutt as Kutt | undefined;
  if (
    (kutt !== undefined && vurdering !== "kutt") ||
    (vurdering === "kutt" && !segId) ||
    (k !== undefined &&
      (!k ||
        typeof k !== "object" ||
        !["slutt", "start"].includes(k.retning) ||
        typeof k.t !== "number" ||
        !(k.t > 0) ||
        k.t > 600))
  )
    return badRequest();

  const dir = mediaDir();
  // A segment verdict belongs to the take Hans watched (the video's segmenter.json),
  // not to whatever raw clip assets/out holds now.
  const seg = cleanPath.match(/^video\/julius\/dag-(\d+)#s(\d+)$/);
  if (raw !== undefined) {
    if (
      !seg ||
      typeof raw !== "string" ||
      !(await segmentRaws(dir, Number(seg[1]), Number(seg[2]))).includes(raw)
    )
      return badRequest();
  }
  // «Behold forrige vurdering»: the change can't be shown, Hans says the verdict still holds.
  if (behold === true) {
    try {
      return await endreLager(dir, async (l) => {
        const e = l.elementer[versionKey(cleanPath)];
        const v = e?.vurderinger.find((x) => x.fil === cleanPath);
        if (!v) return badRequest();
        e.historikk.push({ ...v, merknad: "beholdt: endring ukjent" });
        await stemple(dir, l, cleanPath);
        return Response.json({ ok: true, vurderinger: await visning(dir, l) });
      });
    } catch {
      return serverError();
    }
  }
  // Real wall-clock time: TIDSMASKIN mocks date-utils, and review notes need the actual time.
  const now = new Date(Date.now()).toISOString();
  let ugyldig = false;
  try {
    const svar = await endreLager(dir, async (l) => {
      const lagret = l.elementer[versionKey(cleanPath)]?.vurderinger.find(
        (v) => v.fil === cleanPath,
      );
      const prev: Partial<Vurdering> = lagret ?? {};
      const nextVerdict =
        vurdering !== undefined
          ? (vurdering as Verdikt | null | "")
          : (prev as MediaVurderingItem).vurdering;
      const nextNote =
        notat !== undefined
          ? (notat as string).trim()
          : ((prev as MediaVurderingItem).notat ?? "");
      // ✂ without a point (a note saved on it keeps the stored one) cuts nothing.
      if (nextVerdict === "kutt" && !k && !p0(prev).kutt) {
        ugyldig = true;
        throw new Error("kutt uten tid");
      }
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
      const felt: Oppføring = {
        ...(nesteTagger?.length ? { tagger: nesteTagger } : {}),
        ...(nesteTid !== null ? { tid: Math.round(nesteTid * 10) / 10 } : {}),
        ...(nextVerdict ? { vurdering: nextVerdict } : {}),
        ...(nextNote ? { notat: nextNote } : {}),
        ...(nextVerdict === "kutt"
          ? {
              kutt: k
                ? { retning: k.retning, t: Math.round(k.t * 100) / 100 }
                : p.kutt,
            }
          : {}),
        // The cut check stays (the cut take already carries the old verdict) until Hans
        // gives an explicit one: G ends it, L or a new ✂ replaces the verdict.
        ...(vurdering === undefined && p.kuttsjekk
          ? { kuttsjekk: p.kuttsjekk }
          : {}),
        oppdatert: now,
      };
      // Tags, time or a note alone never re-give the verdict: it keeps the hash it
      // was given to, so on new content it still reads «ny versjon».
      const gammel = vurdering === undefined && lagret ? lagret : null;
      let v: Vurdering | null;
      if (gammel) {
        const e = l.elementer[versionKey(cleanPath)];
        e.historikk.push({ ...gammel });
        v = {
          hash: gammel.hash,
          fil: gammel.fil,
          ...(gammel.versjon ? { versjon: gammel.versjon } : {}),
          ...(gammel.tekst != null
            ? { tekst: gammel.tekst, hashVersjon: gammel.hashVersjon }
            : {}),
          ...felt,
        };
        e.vurderinger = e.vurderinger.map((x) => (x === gammel ? v! : x));
      } else
        v = await settVurdering(
          dir,
          l,
          cleanPath,
          felt,
          raw as string | undefined,
        );
      const entry = v && oppføring(v);
      return Response.json({
        ok: true,
        path: cleanPath,
        entry,
        vurderinger: await visning(dir, l),
      });
    });
    // Saved ✂ cuts at once (authorizeMedia above: lan mode and a parent only).
    const dag = seg && vurdering === "kutt" ? kuttDag(Number(seg[1])) : null;
    if (dag && svar.ok) startKutt(dag);
    return svar;
  } catch {
    return ugyldig ? badRequest() : serverError();
  }
}
