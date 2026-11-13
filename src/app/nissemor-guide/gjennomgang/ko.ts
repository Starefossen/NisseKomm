import type { MediaVurderinger } from "@/app/api/media/vurdering/route";
import { PRIS } from "@/lib/forbruk";
import {
  brukbar,
  celleAv,
  celleFor,
  familie,
  versionKey,
  type StatusKilde,
} from "@/lib/media-status";
import { segmentHint, videoStatus } from "@/lib/segmenter";
import { TRENGER, type TrengerHva } from "@/lib/trenger";
import { dagAv, typeAv } from "../media/filter";
import { juliusFiles } from "../media/oversikt";
import { tilstand, type Element } from "./elementer";
import { taggLinje } from "@/lib/vurdering-tagger";
import type { Laerdom } from "@/lib/laerdom";
import type { Prioritet } from "@/lib/vurdering-lager";

/**
 * Gjennomgang's queue, derived from files and verdicts (no state of its own):
 * «Venter på deg» = Hans has something to look at, «Hos agent» = a generation
 * or an edit is next, «Lærdom» = notes on approved/OK items.
 */
export interface Linje {
  /** The id the line opens (`?id=` when it is a Gjennomgang element). */
  id: string;
  tittel: string;
  hva: string;
  type: string;
  dag?: number;
  notat?: string;
  kommando?: string;
  /** NOK for a retake (PRIS). */
  pris?: number;
  /** Shown in red: something broke. */
  feil?: boolean;
  /** Segment to open in the segment strip (`&s=`). */
  seg?: number;
  /** An agent's «look at this first» (prioriter_vurdering). */
  prioritet?: Prioritet;
}

/** From /api/media/ko. */
export interface KoServer {
  forbruk: { brukt: number; igjen: number; budsjett: number; fra: string };
  duplikater: string[];
  jobber: Record<string, string>;
  /** Segment numbers per Julius day (julius-manus.json). */
  manus: Record<string, number[]>;
  /** Machine flags per segment of the Julius video in use, by day. */
  flagg?: Record<string, { s: number; flagg: string[] }[]>;
  /** Days whose automatic cut failed → log path. */
  kuttFeil?: Record<string, string>;
  /** Segment times in the video in use, by day: where a cut check points. */
  segtid?: Record<string, { s: number; start: number; slutt: number }[]>;
  /** assets/laerdom.json: suggestions already made rules or turned down leave Lærdom. */
  laerdom?: Laerdom;
  /** Open agent priorities by id. */
  prioriteter?: Record<string, Prioritet>;
}

const pad = (n: number) => String(n).padStart(2, "0");
const typeFor = (id: string) =>
  id.startsWith("manus/") ? "manus" : (typeAv(id) ?? id.split("/")[0]);
const dagFor = (id: string) =>
  id.startsWith("dag/") ? Number(id.split("/")[1]) : dagAv(id);
const notatAv = (v?: MediaVurderinger[string]) =>
  (
    (v?.notat ?? v?.forrige?.notat ?? "").replace(/\s*\n\s*/g, " / ") +
    taggLinje(v)
  ).trim() || undefined;

/** What the agent runs to remake a media file, and what it costs. */
export function omtak(
  path: string,
  jobber: Record<string, string>,
  segmenter: number,
): { kommando: string; pris: number } {
  const dag = dagAv(path);
  if (path.startsWith("video/julius/"))
    return {
      kommando: `python3 assets/bin/julius-dag.py ${dag} --suffix -vN`,
      pris: PRIS.video * Math.max(1, segmenter),
    };
  if (path.startsWith("audio/rampenissen/"))
    return {
      kommando: `bash assets/bin/rampenissen-tts.sh ${dag} --force`,
      pris: PRIS.tts,
    };
  if (path.startsWith("video/tv/"))
    return {
      kommando: `bash assets/bin/tv-loops.sh --bare ${path.slice(9, -4)}`,
      pris: PRIS.video,
    };
  if (/\.mp4$/.test(path))
    return { kommando: `ny video: ${path}`, pris: PRIS.video };
  const jobb = jobber[versionKey(path)];
  return {
    kommando: jobb
      ? `python3 assets/bin/generer.py kjør --bare ${jobb} --force`
      : `nytt bilde: ${path}`,
    pris: PRIS.bilde,
  };
}

/** What the agent delivers for «Trenger mer»; only a sketch costs (one image call). */
export function trengerJobb(
  id: string,
  hva: TrengerHva,
  jobber: Record<string, string>,
): { kommando: string; pris: number } {
  const svar = `POST /api/media/vurdering {"path":"${id}",`;
  if (hva === "skisse") {
    const dag = dagFor(id);
    const jobb =
      jobber[versionKey(id)] ?? (dag ? `strek/dag${pad(dag)}` : undefined);
    return {
      kommando: `${jobb ? `python3 assets/bin/generer.py kjør --bare ${jobb} --force` : `skisse til ${id}`}, så ${svar}"levert":true}`,
      pris: PRIS.bilde,
    };
  }
  if (hva === "forklaring")
    return { kommando: `${svar}"forklaring":"…"}`, pris: 0 };
  return {
    kommando: `lag ${TRENGER[hva]} for ${id}, så ${svar}"levert":true}`,
    pris: 0,
  };
}

const sorter = (a: Linje, b: Linje) =>
  (a.dag ?? 99) - (b.dag ?? 99) ||
  a.type.localeCompare(b.type) ||
  a.id.localeCompare(b.id);

const RANG = { hast: 0, høy: 1 } as const;
/** «Venter på deg» unfiltered: hast, then høy, then the normal order. */
export const medPrioritet = (a: Linje, b: Linje) =>
  (a.prioritet ? RANG[a.prioritet.nivaa] : 2) -
    (b.prioritet ? RANG[b.prioritet.nivaa] : 2) || sorter(a, b);

/** The priority a line answers to: its id, its segment's base id, its family or one of its element's files. */
export function prioritetFor(
  id: string,
  p: Record<string, Prioritet>,
  media: string[] = [],
): Prioritet | undefined {
  return Object.values(p).find((x) => {
    const f = x.fil.replace(/#.*/, "");
    return (
      x.fil === id ||
      f === id ||
      versionKey(f) === versionKey(id) ||
      media.some((m) => versionKey(m) === versionKey(f))
    );
  });
}

/** «PRIORITERT · grunn · av agent (frist)» */
export const prioritetTekst = (p: Prioritet) =>
  `PRIORITERT${p.nivaa === "hast" ? " (HAST)" : ""} · ${p.grunn} · av ${p.av.replace(/^agent:/, "")}${p.frist ? ` · frist ${p.frist.slice(0, 10)}` : ""}`;

export function byggKo(
  liste: Element[],
  k: StatusKilde & { vurderinger: MediaVurderinger },
  s: KoServer,
) {
  const vurd = k.vurderinger;
  const venter: Linje[] = [];
  const agent: Linje[] = [];
  const laerdom: Linje[] = [];
  const dup = new Set(s.duplikater);
  const finnes = new Set(
    k.filer.filter((f) => f.size !== null).map((f) => f.path),
  );
  const tittel = new Map(liste.map((e) => [e.id, e.tittel]));
  const segmenterPaa = (dag?: number) =>
    dag ? (s.manus[dag]?.length ?? 0) : 0;

  // Media families: every file an element shows, and every file with a verdict.
  const familier = new Set<string>();
  for (const e of liste) for (const p of e.media) familier.add(versionKey(p));
  // A verdict on a file that is gone (no file, no inventory job) is history, not a queue item.
  const kjente = new Set(k.filer.map((f) => versionKey(f.path)));
  for (const id of Object.keys(vurd))
    if (/\.\w+$/.test(id) && !id.includes("#") && kjente.has(versionKey(id)))
      familier.add(versionKey(id));

  // A segmented Julius video waits on its segments (videoStatus): its own line
  // only once they are all ✓/◐ («Klar for hele videoen»).
  const segmenterVenter = (dag: number | undefined, type: string) => {
    const segs = type === "julius" && dag ? s.manus[dag] : undefined;
    const id = (n: number) => `video/julius/dag-${pad(dag!)}#s${n}`;
    // Videos joined before segmenter.json have no segment verdicts: their own line as before.
    if (!segs?.length || !segs.some((n) => vurd[id(n)])) return false;
    const st = videoStatus(
      segs.map((n) => ({ s: n })),
      (n) => vurd[id(n)],
    );
    return st.steg !== "klar" && st.steg !== "ferdig";
  };

  for (const key of familier) {
    const f = familie(key, k);
    const ny = f.kandidat ?? f.iBruk;
    const dag = dagFor(key);
    const type = typeFor(key);
    // A Julius day without any video goes through its script (below).
    if (
      type === "julius" &&
      !juliusFiles(dag ?? 0, k.filer).some((p) => finnes.has(p))
    )
      continue;
    const v = vurd[ny.path];
    const elementId = liste.find((e) =>
      e.media.some((p) => versionKey(p) === key),
    )?.id;
    // A day section judged as a whole (Rampestrek with its sketch) is not held back by its file.
    if (
      elementId?.startsWith("dag/") &&
      vurd[elementId]?.vurdering &&
      !v?.vurdering
    )
      continue;
    const linje = {
      id: elementId ?? ny.path,
      tittel: tittel.get(elementId ?? "") ?? ny.path,
      type,
      dag,
      notat: notatAv(v),
    };
    // Radio gate: an unapproved script blocks TTS, so it waits on Hans when the clip is missing,
    // not approved/OK (incl. unjudged or a new version), or older than a changed script.
    const radio = key.match(/^audio\/rampenissen\/dag-(\d+)\.mp3$/)?.[1];
    const mid = `manus/radio/dag-${radio}`;
    const mv = radio ? vurd[mid] : undefined;
    const lagRadio =
      ny.celle === "mangler" || !brukbar(celleAv(v)) || !!mv?.forrige;
    if (radio && lagRadio) {
      if (mv?.vurdering && !brukbar(celleAv(mv))) {
        agent.push({
          id: mid,
          tittel: `Radiomanus dag ${Number(radio)}`,
          type: "manus",
          dag,
          hva: "lag på nytt",
          notat: notatAv(mv),
          pris: 0,
          kommando:
            "endre klippet i docs/manus/rampenissen-radio-2026.md, så python3 assets/bin/medie.py radio-manus",
        });
        continue;
      }
      if (!brukbar(celleAv(mv))) {
        // The clip has its own line too, so its element is in the tab it is counted in.
        if (elementId) venter.push({ ...linje, hva: "venter på radiomanuset" });
        venter.push({
          id: mid,
          tittel: `Radiomanus dag ${Number(radio)}`,
          type: "manus",
          dag,
          notat: notatAv(mv),
          hva: mv?.forrige
            ? "manus endret, radio må lages på nytt"
            : "manus før radio",
        });
        continue;
      }
    }
    // An optional file nobody has made waits on no one.
    if (ny.celle === "valgfri") continue;
    if (ny.celle === "mangler") {
      agent.push({
        ...linje,
        hva: "ikke laget",
        ...omtak(key, s.jobber, segmenterPaa(dag)),
      });
    } else if (v?.vurdering && !brukbar(celleAv(v))) {
      agent.push({
        ...linje,
        hva: `lag på nytt (${ny.navn})`,
        ...omtak(key, s.jobber, segmenterPaa(dag)),
      });
    } else if (
      !v?.vurdering &&
      !dup.has(ny.path) &&
      !segmenterVenter(dag, type)
    ) {
      venter.push({
        ...linje,
        hva: v?.forrige
          ? `ny versjon (${ny.navn})`
          : v?.notat
            ? `notat uten vurdering (${ny.navn})`
            : `ny (${ny.navn})`,
      });
    }
  }

  // Guide sections: a changed text or a rejection; never-reviewed day sections (gåte, tekster,
  // utskrifter, oppsett, rampestrek) wait on Hans too, sorted by day like everything else.
  for (const e of liste) {
    const dagSeksjon = e.id.startsWith("dag/") && !!e.dag;
    if ((e.media.length && !dagSeksjon) || e.id.startsWith("manus/")) continue;
    const v = vurd[e.id];
    // Without its own verdict a section with a file (rampestrek, its sketch) inherits the
    // file's: the family loop above gives it its one line, or none when the file is approved.
    if (!v && e.media.length) continue;
    const linje = {
      id: e.id,
      tittel: e.tittel,
      type: e.gruppe,
      dag: e.dag,
      notat: notatAv(v),
    };
    if (v?.vurdering && !brukbar(celleAv(v)))
      agent.push({
        ...linje,
        hva: "lag på nytt",
        kommando: "rediger kilden (docs/ eller koden)",
        pris: 0,
      });
    else if (!v?.vurdering && (v?.forrige || v?.notat))
      venter.push({
        ...linje,
        hva: v.forrige ? "ny versjon" : "notat uten vurdering",
      });
    else if (!v) venter.push({ ...linje, hva: "aldri vurdert" });
  }

  // Script gate: days without a video wait on their segments, then on the video call.
  let segmenter = 0;
  for (const [d, segs] of Object.entries(s.manus)) {
    const dag = Number(d);
    const id = `manus/julius/dag-${pad(dag)}`;
    const harVideo = juliusFiles(dag, k.filer).some((p) => finnes.has(p));
    const åpne = segs.filter((n) => !brukbar(celleAv(vurd[`${id}#s${n}`])));
    for (const n of segs) {
      const v = vurd[`${id}#s${n}`];
      if (v?.vurdering && !brukbar(celleAv(v)))
        agent.push({
          id,
          tittel: `Manus dag ${dag}, segment ${n}`,
          type: "manus",
          dag,
          hva: "lag på nytt",
          notat: notatAv(v),
          pris: 0,
          kommando: segmentHint(`${id}#s${n}`, "lag_paa_nytt").replace(
            /^ → /,
            "",
          ),
        });
    }
    if (harVideo) {
      // A script changed after its video: the video may say the old lines.
      const endret = segs.filter((n) => vurd[`${id}#s${n}`]?.forrige);
      if (endret.length)
        venter.push({
          id,
          tittel: `Manus dag ${dag}`,
          type: "manus",
          dag,
          hva: `manus endret etter videoen (s${endret.join(", s")})`,
        });
      continue;
    }
    const venterHer = åpne.filter((n) => !vurd[`${id}#s${n}`]?.vurdering);
    segmenter += venterHer.length;
    if (venterHer.length)
      venter.push({
        id,
        tittel: `Manus dag ${dag}`,
        type: "manus",
        dag,
        hva: `${venterHer.length} av ${segs.length} segmenter venter`,
      });
    else if (!åpne.length)
      // The video is what is missing: the line is the Julius element's, so the script reads ✓.
      agent.push({
        id:
          liste.find((e) => e.gruppe === "julius" && e.dag === dag)?.id ??
          `video/julius/dag-${pad(dag)}.mp4`,
        tittel: `Julius dag ${dag}`,
        type: "julius",
        dag,
        hva: "manus godkjent, ingen video",
        kommando: `python3 assets/bin/julius-dag.py ${dag}`,
        pris: PRIS.video * segs.length,
      });
  }

  for (const [d, logg] of Object.entries(s.kuttFeil ?? {}))
    agent.push({
      id:
        liste.find((e) => e.gruppe === "julius" && e.dag === Number(d))?.id ??
        `video/julius/dag-${pad(Number(d))}.mp4`,
      tittel: `Julius dag ${Number(d)}`,
      type: "julius",
      dag: Number(d),
      hva: `kuttet feilet, se ${logg}`,
      feil: true,
      pris: 0,
    });

  // Video segment retakes (the segment strip).
  for (const [id, v] of Object.entries(vurd)) {
    const m = id.match(/^video\/julius\/dag-(\d+)#s(\d+)$/);
    if (!m) continue;
    if (v.kuttsjekk) {
      const dag = Number(m[1]);
      const sg = s.segtid?.[dag]?.find((x) => x.s === Number(m[2]));
      const t = sg
        ? v.kuttsjekk.retning === "slutt"
          ? sg.slutt
          : sg.start
        : undefined;
      venter.push({
        id: liste.find((e) => e.gruppe === "julius" && e.dag === dag)?.id ?? id,
        tittel: `Julius dag ${dag}, segment ${m[2]}`,
        type: "julius",
        dag,
        seg: Number(m[2]),
        hva: `dag ${dag} s${m[2]}: hør kuttet${t === undefined ? "" : ` @${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`}`,
      });
    }
    if (!v.vurdering || brukbar(celleAv(v))) continue;
    if (v.vurdering === "kutt") {
      agent.push({
        id:
          liste.find((e) => e.gruppe === "julius" && e.dag === Number(m[1]))
            ?.id ?? id,
        tittel: `Julius dag ${Number(m[1])}, segment ${m[2]}`,
        type: "julius",
        dag: Number(m[1]),
        hva: `kutt ${v.kutt?.retning ?? ""}`.trim(),
        notat: notatAv(v),
        pris: 0,
        kommando: `python3 assets/bin/julius-dag.py ${Number(m[1])} --kutt`,
      });
      continue;
    }
    agent.push({
      id:
        liste.find((e) => e.gruppe === "julius" && e.dag === Number(m[1]))
          ?.id ?? id,
      tittel: `Julius dag ${Number(m[1])}, segment ${m[2]}`,
      type: "julius",
      dag: Number(m[1]),
      hva: "lag segmentet på nytt",
      notat: notatAv(v),
      pris: PRIS.video,
      kommando: segmentHint(id, "lag_paa_nytt").replace(/^ → /, ""),
    });
  }

  // Flagged segments Hans has not judged yet: one line each.
  for (const [d, segs] of Object.entries(s.flagg ?? {})) {
    const dag = Number(d);
    const el = liste.find((e) => e.gruppe === "julius" && e.dag === dag)?.id;
    for (const { s: n, flagg } of segs) {
      if (vurd[`video/julius/dag-${pad(dag)}#s${n}`]?.vurdering) continue;
      venter.push({
        id: el ?? `video/julius/dag-${pad(dag)}.mp4`,
        tittel: `Julius dag ${dag} s${n}`,
        type: "julius",
        dag,
        seg: n,
        hva: `dag ${dag} s${n}: ! ${flagg.join("; ")}`,
      });
    }
  }

  // «Trenger mer»: open requests are the agent's, delivered ones come back to Hans.
  const trengerTelling: Partial<Record<TrengerHva, number>> = {};
  for (const [id, v] of Object.entries(vurd)) {
    const t = v.trenger;
    if (!t) continue;
    trengerTelling[t.hva] = (trengerTelling[t.hva] ?? 0) + 1;
    const el = liste.find((e) => e.id === id || e.media.includes(id))?.id ?? id;
    const linje = {
      id: el,
      tittel: tittel.get(el) ?? id,
      type: typeFor(id),
      dag: dagFor(id),
      notat: t.notat,
    };
    if (!t.levert)
      agent.push({
        ...linje,
        hva: `trenger ${TRENGER[t.hva]}`,
        ...trengerJobb(id, t.hva, s.jobber),
      });
    else if (!t.lest)
      venter.push({ ...linje, hva: `Ny info: ${TRENGER[t.hva]} lagt til` });
  }

  const behandlet = new Set([
    ...(s.laerdom?.avvist ?? []),
    ...(s.laerdom?.regler.flatMap((r) => r.kilder) ?? []),
  ]);
  for (const [id, v] of Object.entries(vurd))
    if (
      brukbar(celleAv(v)) &&
      (v.notat || v.tagger?.length) &&
      !behandlet.has(id)
    )
      laerdom.push({
        id,
        tittel: tittel.get(id) ?? id,
        type: typeFor(id),
        dag: dagFor(id),
        hva: v.vurdering!,
        notat: notatAv(v),
      });

  const pr = s.prioriteter ?? {};
  for (const l of [...venter, ...agent]) {
    const p = prioritetFor(l.id, pr, liste.find((e) => e.id === l.id)?.media);
    if (p) l.prioritet = p;
  }
  return {
    venter: venter.sort(medPrioritet),
    agent: agent.sort(sorter),
    laerdom: laerdom.sort(sorter),
    segmenter,
    trengerTelling,
  };
}

export const FREMDRIFT = [
  ["godkjent", "Godkjent", "bg-(--gold)"],
  ["ok", "OK", "bg-amber-300"],
  ["venter", "Venter på deg", "bg-(--cold-blue)"],
  ["agent", "Hos agent", "bg-(--christmas-red)"],
  ["mangler", "Mangler", "bg-(--gray)"],
  ["valgfri", "Valgfri", "bg-(--gray)/30"],
  ["ikke", "Ikke aktuelt", "bg-(--gray)/30"],
] as const;
export type Fremdrift = (typeof FREMDRIFT)[number][0];

/** The progress bar's bucket for an element (Julius per video until the segment status model lands). */
export function fremdriftGruppe(e: Element): string {
  if (e.gruppe === "julius") return "Julius";
  if (e.id.startsWith("manus/")) return "Manus";
  if (e.gruppe === "Snøfall TV" || e.gruppe === "Promo") return "TV og promo";
  if (e.gruppe === "radio") return "Radio";
  if (e.gruppe === "rampestrek") return "Skisser";
  if (e.gruppe === "utskrifter") return "Utskrifter";
  if (e.media.some((p) => /\.(png|jpe?g)$/.test(p))) return "Bilder";
  return "Guideseksjoner";
}

/**
 * One element's status, the same in the matrix, the progress bar and the
 * Element view: a queue line wins (Hos agent over Venter), a segmented Julius
 * video follows its segments (videoStatus), else the verdict on what is in use.
 */
export function elementStatus(
  e: Element,
  k: StatusKilde & { vurderinger: MediaVurderinger },
  agent: Set<string>,
  venter: Set<string>,
  s: Pick<Partial<KoServer>, "manus" | "duplikater"> = {},
): Fremdrift {
  const manus = s.manus ?? {};
  const iBruk = tilstand(e, k).celle;
  // An approved candidate is Hans' verdict on the item: what is left is «Ta i bruk», no review.
  const kand = e.media.length
    ? celleFor(e.media, k).familie?.kandidat
    : undefined;
  const c = kand && brukbar(kand.celle) && !brukbar(iBruk) ? kand.celle : iBruk;
  if (c === "valgfri") return "valgfri";
  if (agent.has(e.id)) return "agent";
  if (venter.has(e.id)) return "venter";
  const segs = e.gruppe === "julius" && e.dag ? manus[e.dag] : undefined;
  const sid = (n: number) => `video/julius/dag-${pad(e.dag!)}#s${n}`;
  if (segs?.length && segs.some((n) => k.vurderinger[sid(n)])) {
    const vs = videoStatus(
      segs.map((n) => ({ s: n })),
      (n) => k.vurderinger[sid(n)],
      k.vurderinger[e.media.find((p) => k.vurderinger[p]) ?? ""],
    );
    if (vs.steg === "nytt" || vs.steg === "kutt") return "agent";
    if (vs.steg === "ferdig")
      return vs.tekst.startsWith("◐") ? "ok" : "godkjent";
    if (vs.steg !== "klar" || !brukbar(c)) return "venter";
  }
  if (c === "mangler" || c === "godkjent" || c === "ok") return c;
  // A Julius script is judged per segment: out of both queues means every segment passed.
  if (/^manus\/julius\//.test(e.id)) return "godkjent";
  // A radio script without its own verdict: an approved clip approved it (medie.py does the same).
  const radio = e.id.match(/^manus\/radio\/dag-(\d+)$/)?.[1];
  if (radio && !k.vurderinger[e.id]) {
    const klipp = celleFor([`audio/rampenissen/dag-${radio}.mp3`], k).celle;
    if (brukbar(klipp)) return klipp;
  }
  if (c === "lag_paa_nytt") return "agent";
  // A byte-identical copy of another file: nothing to judge.
  return e.media.some((p) => s.duplikater?.includes(p)) ? "ikke" : "venter";
}

/**
 * Every element in exactly one bucket, from the same queue byggKo makes, so
 * «Venter på deg» and «Hos agent» are exactly the tabs' elements (an element
 * in both counts as Hos agent; the tabs show these numbers). Besides them:
 * Mangler = a missing file no queue line covers, Utenfor køen = neither a
 * verdict nor a queue line (e.g. rejected but no agent line), the verdict
 * otherwise. Optional unmade items are «valgfri».
 */
export function fremdrift(
  liste: Element[],
  k: StatusKilde & { vurderinger: MediaVurderinger },
  ko: { venter: Linje[]; agent: Linje[] },
  s: Pick<Partial<KoServer>, "manus" | "duplikater"> = {},
) {
  const agent = new Set(ko.agent.map((l) => l.id));
  const venter = new Set(ko.venter.map((l) => l.id));
  const poster = liste.map((e) => ({
    ...e,
    status: elementStatus(e, k, agent, venter, s),
    type: fremdriftGruppe(e),
  }));
  const telling = (ps: typeof poster) =>
    Object.fromEntries(
      FREMDRIFT.map(([st]) => [st, ps.filter((p) => p.status === st).length]),
    ) as Record<Fremdrift, number>;
  const typer = [...new Set(poster.map((p) => p.type))];
  return {
    poster,
    total: {
      navn: "Hele sesongen",
      n: poster.length,
      telling: telling(poster),
    },
    typer: typer.map((t) => {
      const ps = poster.filter((p) => p.type === t);
      return { navn: t, n: ps.length, telling: telling(ps) };
    }),
  };
}
