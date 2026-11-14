/**
 * Server-side reader for the parent guide's day view, library and search.
 * Manus and entity texts come from src/data/guide-innhold.json (baked by
 * scripts/guide-innhold.mjs, since the image has no docs/ or assets/); only
 * reference images are read from disk (dev box). Every route using it is
 * parent-only, so the JSON stays out of the kid bundle.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { getOppdrag as getQuestByDay } from "./oppdrag";
import statisk from "@/data/statisk_innhold.json";
import bakt from "@/data/guide-innhold.json";
import juliusManus from "@/data/julius-manus.json";
import { opplasingerPaaDag } from "./opplasinger";
import { KAPITLER } from "@/components/windows/nissespill/kapitler";
import { ETAPPER } from "@/components/windows/snofall-tv/slede";
import {
  delsystemer,
  gaatekart,
  kveldDag,
  sammendrag,
  varden,
} from "./guide-sesong";

const ROOT = () => process.cwd();
const filer: Record<string, string> = bakt;
const read = async (rel: string) => filer[rel] ?? "";

/** docs/gjennomganger/<dato>-<navn>.md, newest first. */
export const gjennomganger = () =>
  Object.keys(filer)
    .filter((f) => f.startsWith("docs/gjennomganger/"))
    .sort()
    .reverse()
    .map((f) => ({ navn: path.basename(f, ".md"), tekst: filer[f] }));

export const MANUS = {
  julius: "docs/manus/julius-2026.md",
  radio: "docs/manus/rampenissen-radio-2026.md",
  app: "docs/manus/app-tekster-2026.md",
  promo: "docs/manus/julius-promo.md",
} as const;

type Fil = {
  navn: string;
  innhold?: string;
  barn?: Fil[];
  unlockConditions?: { afterDay?: number };
};

/** NisseNet files that open with day `dag` (afterDay or the quest's reveals). */
function dagFiler(dag: number, navn: string[]) {
  const ut: { sti: string; innhold: string }[] = [];
  const gå = (liste: Fil[], sti: string) => {
    for (const f of liste) {
      if (f.barn) gå(f.barn, `${sti}${f.navn}/`);
      else if (f.unlockConditions?.afterDay === dag || navn.includes(f.navn))
        ut.push({ sti: sti + f.navn, innhold: f.innhold ?? "" });
    }
  };
  gå(statisk.filer as Fil[], "");
  return ut;
}

/** The kid-visible texts of one day as Gjennomgang's «Tekster» shows them: the verdict's content. */
export function teksterKilde(dag: number): string {
  const q = getQuestByDay(dag);
  if (!q) return "";
  return [
    q.nissemail_tekst,
    q.julius_ps,
    q.julius_ps_bonus,
    q.julius_ps_krypto_mangler,
    ...statisk.daily_alerts.filter((a) => a.day === dag).map((a) => a.tekst),
    ...dagFiler(dag, q.reveals?.files ?? []).map(
      (f) => `${f.sti}\n${f.innhold}`,
    ),
  ]
    .filter(Boolean)
    .join("\n");
}

/** The two promo films (A = Dag 90, B = Dag 91) as plain script text. */
export async function promoer() {
  const md = await read(MANUS.promo);
  return (["A", "B"] as const).map((id, i) => ({
    id,
    tekst: dagBlokk(md, 90 + i),
  }));
}

/** «## Dag 7 (ma) – …» (or ###) up to the next heading of the same level. */
export function dagBlokk(md: string, dag: number): string {
  const m = md.match(
    new RegExp(`^(#{2,3}) Dag ${dag} \\(.*?(?=^\\1 |(?![\\s\\S]))`, "ms"),
  );
  return m ? m[0] : "";
}

// Same numbers as assets/bin/julius-dag.py (timing, MAX_WORDS).
const WPS = 1.79;
const START = 0.5;
const TAIL = 2.0;
const MAX_WORDS = 22;
/** julius-dag.py wcount: a hyphenated token («TV-en») is spoken as one word. */
export const wcount = (s: string) =>
  (s.toLowerCase().match(/[a-zæøå0-9]+(?:-[a-zæøå0-9]+)*/g) ?? []).length;

export interface JuliusSegment {
  replikk: string;
  sek: number;
  handling: string;
  kulde: string;
  laast: boolean;
  ord: number;
  /** Lint warnings from julius-dag.py's rules; empty when the segment fits. */
  varsler: string[];
}

export function lintSegment(replikk: string, sek: number, laast: boolean) {
  const n = wcount(replikk);
  const need = START + n / WPS + TAIL;
  const varsler: string[] = [];
  if (n > MAX_WORDS && !laast) varsler.push(`${n} ord (maks ${MAX_WORDS})`);
  if (need > sek)
    varsler.push(
      `${n} ord trenger ${need.toFixed(1)} s med 2 s hale, bestilt ${sek} s`,
    );
  else if (sek >= 15 && need > 13)
    varsler.push(
      `${n} ord trenger ${need.toFixed(1)} s; modellen leverer ofte 13 s på 15`,
    );
  return { n, varsler };
}

/** Port of medie.julius_segments: heading, intro paragraph and segments of one day. */
export function parseJulius(md: string, dag: number) {
  const blokk = dagBlokk(md, dag);
  if (!blokk) return null;
  const [hode, ...deler] = blokk.split(/\*\*Replikk:\*\*/);
  const linjer = hode.split("\n");
  const segmenter: JuliusSegment[] = [];
  for (const seg of deler) {
    // Greedy within the line: a quoted Rampenissen line inside the replikk has its own «».
    const linje = seg.match(/^\s*«(.+)»([^»\n]*)/);
    const sek = seg.match(/^\s*- Varighet: (\d+) s(.*)$/m);
    if (!linje || !sek) continue;
    const felt = (k: string) =>
      seg.match(new RegExp(`^\\s*- ${k}: (.+)$`, "m"))?.[1].trim() ?? "";
    const tag = (linje[2] + sek[2]).toLowerCase();
    const laast = tag.includes("låst") || tag.includes("brikke");
    const replikk = linje[1].trim();
    const { n, varsler } = lintSegment(linje[1].trim(), Number(sek[1]), laast);
    segmenter.push({
      replikk,
      sek: Number(sek[1]),
      handling: felt("Handling"),
      kulde: felt("Kulde"),
      laast,
      ord: n,
      varsler,
    });
  }
  return {
    tittel: linjer[0].replace(/^#+ /, ""),
    intro: linjer
      .slice(1)
      .join("\n")
      .replace(/^\d+\.\s*$/m, "")
      .trim(),
    segmenter,
  };
}

/** **Strek:**, **Klipp:**, **Lydregi:**, **intro_hint:** fields of one radio day. */
export function parseRadio(md: string, dag: number) {
  const blokk = dagBlokk(md, dag);
  if (!blokk) return null;
  const felt: Record<string, string> = {};
  for (const m of blokk.matchAll(/^\*\*([\wæøå_]+):\*\* (.+)$/gm)) {
    felt[m[1].toLowerCase()] = m[2].trim().replace(/^«|»$/g, "");
  }
  return felt;
}

export async function dagInnhold(dag: number) {
  const [julius, radio] = await Promise.all([
    read(MANUS.julius),
    read(MANUS.radio),
  ]);
  const q = getQuestByDay(dag);
  const pad = String(dag).padStart(2, "0");
  const etapper = ETAPPER.filter((e) => e.dag === dag);
  return {
    dag,
    sammendrag: sammendrag(dag),
    kveld: kveldDag(dag),
    kart: gaatekart(dag),
    delsystemer: delsystemer(dag),
    varden: varden(dag),
    julius: parseJulius(julius, dag),
    /** Per segment: review hash and julius-dag.py's lint (python3 assets/bin/julius-dag.py manus). */
    manusport:
      (juliusManus as Record<string, (typeof juliusManus)["1"]>)[String(dag)] ??
      [],
    radio: parseRadio(radio, dag),
    oppdrag: q ?? null,
    filer: dagFiler(dag, q?.reveals?.files ?? []),
    varsler: statisk.daily_alerts.filter((a) => a.day === dag),
    opplasinger: opplasingerPaaDag(dag).map((o) => ({
      tekst: o.tekst,
      navn: o.navn,
      varsel: o.varsel ?? null,
    })),
    kapitler: KAPITLER.filter((k) => k.dag === dag).map((k) => ({
      n: k.n,
      tittel: k.tittel,
      teaser: k.teaser ?? null,
      intro: k.intro,
      klar: k.klar,
    })),
    etapper: etapper.map((e) => ({ id: e.id, navn: e.navn, intro: e.intro })),
    medier: [
      `video/julius/dag-${pad}.mp4`,
      `audio/rampenissen/dag-${pad}.mp3`,
      ...etapper.map((e) => `feed/slede-${e.id}.jpg`),
    ],
  };
}

// --- Library -----------------------------------------------------------

export const ENTITET_TYPER = ["characters", "locations", "objects"] as const;

const BILDE = /\.(jpe?g|png|webp)$/i;
const ID = /^[a-z0-9-]+$/;

interface Jobb {
  ut?: string;
  sted?: string;
  bilde?: string;
  refs?: string[];
  mal?: string;
}

/** Port of medie.used_by: medier.json jobs that use an entity as place, image, ref or template variable. */
export function bruktAv(
  id: string,
  jobber: Record<string, Jobb>,
  maler: Record<string, string>,
): string[] {
  const seg = `/${id}`;
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const variabel = new RegExp(`\\{\\{(\\w+/)?${esc}[}.]`);
  return Object.entries(jobber)
    .filter(([, j]) => {
      const stier = [j.bilde ?? "", ...(j.refs ?? [])];
      return (
        j.sted === id ||
        stier.some((p) => p.includes(`${seg}#`) || p.includes(`${seg}/`)) ||
        variabel.test(maler[j.mal ?? ""] ?? "")
      );
    })
    .map(([k]) => k);
}

export async function bibliotek() {
  const jobber: Record<string, Jobb> = JSON.parse(
    (await read("assets/medier.json")) || "{}",
  );
  const malStier = [
    ...new Set(Object.values(jobber).flatMap((j) => (j.mal ? [j.mal] : []))),
  ];
  const maler = Object.fromEntries(
    await Promise.all(malStier.map(async (m) => [m, await read(m)])),
  );
  const ut = [];
  for (const type of ENTITET_TYPER) {
    const ids = [
      ...new Set(
        Object.keys(filer).flatMap(
          (f) => f.match(new RegExp(`^assets/${type}/([^/]+)/`))?.[1] ?? [],
        ),
      ),
    ]
      .filter((id) => ID.test(id))
      .sort();
    for (const id of ids) {
      const dir = `assets/${type}/${id}`;
      const [md, beskrivelse, filer] = await Promise.all([
        read(`${dir}/entitet.md`),
        read(`${dir}/beskrivelse.txt`),
        readdir(path.join(ROOT(), dir)).catch(() => [] as string[]),
      ]);
      const navn = md.match(/^# (.+)$/m)?.[1] ?? id;
      const jobb = bruktAv(id, jobber, maler);
      ut.push({
        type,
        id,
        navn,
        entitet: md,
        beskrivelse,
        bilder: filer.filter((f) => BILDE.test(f)).sort(),
        medier: jobb.map((k) => ({ jobb: k, ut: jobber[k].ut ?? null })),
      });
    }
  }
  return ut;
}

/**
 * Whitelisted reference image under assets/{characters,locations,objects}/<id>/,
 * or null. Pure, so the route test can pin the whitelist.
 */
export function assetFil(parts: string[]): string | null {
  if (parts.length !== 3) return null;
  const [type, id, fil] = parts;
  if (!(ENTITET_TYPER as readonly string[]).includes(type)) return null;
  if (!ID.test(id) || !/^[A-Za-z0-9][\w.-]*$/.test(fil) || !BILDE.test(fil))
    return null;
  if (fil.includes("..")) return null;
  return `assets/${type}/${id}/${fil}`;
}

// --- Search ------------------------------------------------------------

export interface Treff {
  kilde: string;
  lenke: string;
  foer: string;
  treff: string;
  etter: string;
}

interface Dok {
  kilde: string;
  lenke: string;
  tekst: string;
}

const MANUSNAVN: Record<keyof typeof MANUS, string> = {
  julius: "Julius-manus",
  radio: "Radiomanus",
  app: "Apptekster",
  promo: "Promomanus",
};
const TYPE: Record<string, string> = {
  characters: "Karakter",
  locations: "Sted",
  objects: "Gjenstand",
};

/** Search reads text, not markdown: headings, bold and code marks go. */
const somTekst = (md: string) =>
  md.replace(/^#+\s*/gm, "").replace(/\*\*|__|`/g, "");

async function dokumenter(): Promise<Dok[]> {
  const docs: Dok[] = [];
  for (const [nokkel, fil] of Object.entries(MANUS) as [
    keyof typeof MANUS,
    string,
  ][]) {
    const md = await read(fil);
    // Split on day headings; the text before day 1 links to the file's day 1.
    for (const del of md.split(/^(?=#{2,3} Dag \d+ \()/m)) {
      const dag = Number(del.match(/^#{2,3} Dag (\d+) \(/)?.[1]);
      docs.push({
        kilde: `${dag ? `Dag ${dag} · ` : ""}${MANUSNAVN[nokkel]}`,
        lenke: `/nissemor-guide/dag/${dag || 1}`,
        tekst: somTekst(del),
      });
    }
  }
  for (let dag = 1; dag <= 24; dag++) {
    const q = getQuestByDay(dag);
    if (q)
      docs.push({
        kilde: `Dag ${dag} · Appen`,
        lenke: `/nissemor-guide/dag/${dag}`,
        tekst: JSON.stringify(q, null, 1),
      });
  }
  for (const k of KAPITLER)
    docs.push({
      kilde: `Ugleposten kapittel ${k.n}: ${k.tittel}`,
      lenke: `/nissemor-guide/dag/${k.dag}`,
      tekst: JSON.stringify(k, null, 1),
    });
  for (const e of await bibliotek())
    docs.push({
      kilde: `${TYPE[e.type] ?? e.type}: ${e.navn}`,
      lenke: `/nissemor-guide/bibliotek#${e.id}`,
      tekst: somTekst(`${e.entitet}\n${e.beskrivelse}`),
    });
  return docs;
}

export function finnTreff(docs: Dok[], q: string, max = 60): Treff[] {
  const needle = q.toLowerCase();
  const out: Treff[] = [];
  for (const d of docs) {
    const lower = d.tekst.toLowerCase();
    let i = lower.indexOf(needle);
    let perDok = 0;
    while (i >= 0 && perDok < 3 && out.length < max) {
      const a = Math.max(0, i - 80);
      const b = Math.min(d.tekst.length, i + needle.length + 80);
      out.push({
        kilde: d.kilde,
        lenke: d.lenke,
        foer: (a > 0 ? "…" : "") + d.tekst.slice(a, i),
        treff: d.tekst.slice(i, i + needle.length),
        etter:
          d.tekst.slice(i + needle.length, b) + (b < d.tekst.length ? "…" : ""),
      });
      perDok++;
      i = lower.indexOf(needle, i + needle.length);
    }
  }
  return out;
}

export async function sok(q: string): Promise<Treff[]> {
  return finnTreff(await dokumenter(), q);
}
