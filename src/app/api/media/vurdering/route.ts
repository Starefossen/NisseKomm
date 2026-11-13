import { stat } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { authorizeMedia, mediaDir } from "@/lib/media-server";
import { versionKey } from "@/lib/media-status";
import { segmentRaws, versjonAv, type Forrige } from "@/lib/vurdering-versjon";
import {
  endreLager,
  erMediefil,
  FinnesIkke,
  LagerNyere,
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
import { TRENGER, type Trenger } from "@/lib/trenger";
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
  trenger?: Trenger;
  forklaring?: string;
}

export type MediaVurderinger = Record<string, MediaVurderingItem>;

const p0 = (v: Partial<Vurdering>) => v as MediaVurderingItem;
const badRequest = () => new Response("Ugyldig forespørsel", { status: 400 });
const serverError = () => new Response("Serverfeil", { status: 500 });
const feilSvar = (err: unknown) =>
  err instanceof FinnesIkke
    ? new Response("filen finnes ikke", { status: 400 })
    : err instanceof LagerNyere
      ? new Response(err.message, { status: 409 })
      : serverError();

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
  // ?versjon=<id>: what the id holds now; the page sends it back with the verdict (409 if it moved).
  const id = new URL(req.url).searchParams.get("versjon");
  if (id !== null) {
    if (!isSafePath(id)) return badRequest();
    return Response.json({ versjon: await versjonAv(mediaDir(), id.trim()) });
  }
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
    trenger,
    forklaring,
    levert,
    versjon: sett,
  } = body as Record<string, unknown>;
  // Guide session = Hans; a Bearer token = an agent (X-Agent names it).
  const av = req.headers.get("authorization")
    ? `agent:${(req.headers.get("x-agent") ?? "ukjent").replace(/[^\w.-]/g, "").slice(0, 40) || "ukjent"}`
    : "hans";

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

  // «Trenger mer»: {hva, notat?} asks, null withdraws; the agent answers with `forklaring` or `levert`.
  const tr = trenger as { hva?: unknown; notat?: unknown } | null | undefined;
  if (
    (tr !== undefined &&
      tr !== null &&
      (typeof tr !== "object" ||
        typeof tr.hva !== "string" ||
        !Object.hasOwn(TRENGER, tr.hva) ||
        (tr.notat !== undefined &&
          (typeof tr.notat !== "string" || tr.notat.length > 1000)))) ||
    (forklaring !== undefined &&
      (typeof forklaring !== "string" || forklaring.length > 4000)) ||
    (levert !== undefined && levert !== true)
  )
    return badRequest();

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
  // A verdict on a file that is not there would approve whatever lands there later.
  if (vurdering && erMediefil(cleanPath)) {
    const fins = await stat(path.join(dir, cleanPath)).then(
      (s) => s.isFile(),
      () => false,
    );
    if (!fins) return new Response("filen finnes ikke", { status: 400 });
  }
  // The page sends the version it showed: a verdict never lands on content Hans has not seen.
  if (
    vurdering !== undefined &&
    typeof sett === "string" &&
    raw === undefined &&
    (await versjonAv(dir, cleanPath)) !== sett
  )
    return new Response("innholdet er endret siden du så det, last på nytt", {
      status: 409,
    });
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
    } catch (err) {
      return feilSvar(err);
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
      const forkl =
        forklaring !== undefined
          ? (forklaring as string).trim()
          : (p.forklaring ?? "");
      let tb: Trenger | undefined =
        tr === null
          ? undefined
          : tr
            ? {
                hva: tr.hva as Trenger["hva"],
                ...(typeof tr.notat === "string" && tr.notat.trim()
                  ? { notat: tr.notat.trim() }
                  : {}),
                når: now,
              }
            : p.trenger;
      // Delivered: an explanation or a sketch (`levert`). A verdict after that marks it read.
      if (levert && !tb) {
        ugyldig = true;
        throw new Error("levert uten trenger");
      }
      if (tb && !tb.levert && (levert || (forklaring !== undefined && forkl)))
        tb = { ...tb, levert: now };
      if (tb?.levert && !tb.lest && vurdering !== undefined && !tr)
        tb = { ...tb, lest: now };
      // A verdict while the request is still open answers it: Hans judged without waiting.
      const lukket =
        !!tb && !tb.levert && !!nextVerdict && vurdering !== undefined && !tr;
      if (lukket) tb = undefined;
      const felt: Oppføring = {
        ...(tb ? { trenger: tb } : {}),
        ...(lukket ? { merknad: "trenger lukket av dom" } : {}),
        ...(forkl ? { forklaring: forkl } : {}),
        ...(nesteTagger?.length ? { tagger: nesteTagger } : {}),
        ...(nesteTid !== null ? { tid: Math.round(nesteTid * 10) / 10 } : {}),
        ...(nextVerdict ? { vurdering: nextVerdict } : {}),
        ...(nextNote ? { notat: nextNote } : {}),
        av,
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
  } catch (err) {
    return ugyldig ? badRequest() : feilSvar(err);
  }
}
