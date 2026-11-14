import { execFile } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { versionKey } from "./media-status";
import { SESONG, lesLager, type Vurdering } from "./vurdering-lager";
import { TRENGER } from "./trenger";
import { feltDiff, type FeltDiff } from "./tekstdiff";

/**
 * «Historikk ▸» for one Gjennomgang element (statusmodell.md «Historikk per
 * element»): verdicts and their history, file versions and «Ta i bruk», git log
 * of the source text, the machine check, agent actions and cost. Server only,
 * newest first, every line marked who did it.
 */
export type Hvem = "Hans" | "agent" | "maskin";
export interface Hendelse {
  t: string;
  hvem: Hvem;
  /** vurdering · versjon · kilde · sjekk · kostnad */
  hva: string;
  tekst: string;
  diff?: string;
  /** Source commits: the item's own fields, word-diffed before → after. */
  felter?: FeltDiff[];
}

const PRIS: Record<string, number> = {
  video: 17,
  bilde: 1.4,
  tts: 0.1,
  transkripsjon: 0.1,
}; // mirrors assets/bin/forbruk.py PRIS
const to = (n: number) => String(n).padStart(2, "0");
const json = <T>(f: string): Promise<T | null> =>
  readFile(f, "utf8").then(
    (t) => JSON.parse(t) as T,
    () => null,
  );

/** Julius day (video or script or segment) for an id, else undefined. */
const juliusDag = (id: string) =>
  Number(id.match(/^(?:video|manus)\/julius\/dag-(\d\d)/)?.[1]) || undefined;

function vurderingLinjer(v: Vurdering, gammel: boolean): Hendelse[] {
  const ut: Hendelse[] = [];
  const seg = v.fil.match(/#s\d+$/)?.[0] ?? "";
  if (v.vurdering || v.notat || v.tagger?.length)
    ut.push({
      t: v.oppdatert ?? "",
      hvem: v.av?.startsWith("agent:") ? "agent" : "Hans",
      hva: "vurdering",
      tekst: [
        `${v.vurdering ?? "notat"}${seg ? ` ${seg}` : ""}${gammel ? " (erstattet)" : ""}`,
        v.av?.startsWith("agent:") && `av ${v.av}`,
        v.notat && `«${v.notat}»`,
        v.tagger?.length && `merker: ${v.tagger.join(", ")}`,
        v.tid != null && `ved ${v.tid} s`,
        `${/\.\w+(#|$)/.test(v.fil) ? `${path.basename(v.fil)} ` : ""}versjon ${v.versjon ?? v.hash}`,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  if (v.merknad)
    ut.push({
      t: v.oppdatert ?? "",
      hvem: "agent",
      hva: "vurdering",
      tekst: `${v.merknad}${seg ? ` ${seg}` : ""}`,
    });
  if (v.trenger) {
    const t = v.trenger;
    ut.push({
      t: t.når,
      hvem: "Hans",
      hva: "vurdering",
      tekst: `trenger ${TRENGER[t.hva]}${t.notat ? `: ${t.notat}` : ""}`,
    });
    if (t.levert)
      ut.push({
        t: t.levert,
        hvem: "agent",
        hva: "vurdering",
        tekst: `levert: ${TRENGER[t.hva]}`,
      });
  }
  if (v.forklaring)
    ut.push({
      t: v.oppdatert ?? "",
      hvem: "agent",
      hva: "vurdering",
      tekst: `forklaring: ${v.forklaring}`,
    });
  if (v.kuttsjekk)
    ut.push({
      t: v.oppdatert ?? "",
      hvem: "agent",
      hva: "vurdering",
      tekst: `kutt${seg ? ` ${seg}` : ""} venter på kuttsjekk: ${JSON.stringify(v.kuttsjekk)}`,
    });
  return ut;
}

/** The file versions beside an id: -vN/.old-N with their sidecars, and the promote log. */
async function versjoner(dir: string, key: string): Promise<Hendelse[]> {
  if (!/\.[a-z0-9]{2,4}$/i.test(key)) return [];
  const mappe = path.dirname(key);
  const navn = await readdir(path.join(dir, mappe)).catch(() => []);
  const ut: Hendelse[] = [];
  for (const f of navn) {
    const rel = `${mappe}/${f}`;
    if (f.endsWith(".json") || versionKey(rel) !== key) continue;
    const m = await json<{
      generator?: string;
      created?: string;
      model?: string;
      prompt_version?: string;
      prompt_hash?: string;
      source?: { path?: string; section?: string; sha256?: string };
    }>(path.join(dir, `${rel}.meta.json`));
    const t: string =
      m?.created ??
      (await stat(path.join(dir, rel)).then((s) => s.mtime.toISOString()));
    const p = m?.prompt_version ?? m?.prompt_hash;
    ut.push({
      t,
      hvem: "maskin",
      hva: "versjon",
      tekst: [
        `${f} laget`,
        m?.generator,
        m?.model,
        p && `prompt ${p.slice(0, 12)}`,
        m?.source?.path &&
          `kilde ${m.source.path}${m.source.section ? ` «${m.source.section}»` : ""}${m.source.sha256 ? ` ${m.source.sha256.slice(0, 12)}` : ""}`,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }
  const logg = await readFile(
    path.join(dir, "media-promoteringer.log"),
    "utf8",
  ).catch(() => "");
  for (const l of logg.split("\n"))
    if (l.includes(` -> ${key};`)) {
      const [t, ...rest] = l.split(" ");
      ut.push({
        t,
        hvem: "Hans",
        hva: "versjon",
        tekst: `Ta i bruk: ${rest.join(" ")}`,
      });
    }
  return ut;
}

/** Where an id's source text lives, as a git -L range. */
export function kildeFor(id: string): string | null {
  const d = Number(id.match(/dag[-/](\d+)/)?.[1]);
  if (/^dag\/\d+\/rampestrek$/.test(id))
    return `/^## 8[.]/,/^## 9[.]/:docs/historie-${SESONG}.md`;
  if (/^dag\/\d+\/[a-z]+$/.test(id))
    return `/^### Dag ${d} [(]/,/^##/:docs/gaater-${SESONG}.md`;
  if (juliusDag(id))
    return `/^## Dag ${d} [(]/,/^## /:docs/manus/julius-${SESONG}.md`;
  if (/^(manus\/radio|audio\/rampenissen)\/dag-\d+/.test(id))
    return `/^## Dag ${d} [(]/,/^## /:docs/manus/rampenissen-radio-${SESONG}.md`;
  return null;
}

/** «- **Felt:**» names of the changed lines in a section diff. */
export const endredeFelt = (diff: string) => [
  ...new Set(
    diff
      .split("\n")
      .filter((l) => /^[-+](?![-+]{2})/.test(l))
      .map((l) => l.match(/\*\*([^*]+?):?\*\*/)?.[1])
      .filter((f): f is string => !!f),
  ),
];

/** The section a «/start/,/slutt/:fil» range names, cut from the file text. */
export function utdrag(tekst: string, L: string): string {
  const [, start, slutt] = L.match(/^\/(.+?)\/,\/(.+?)\/:/) ?? [];
  const rader = tekst.split("\n");
  const a = rader.findIndex((l) => new RegExp(start).test(l));
  if (a < 0) return "";
  const b = rader.findIndex((l, i) => i > a && new RegExp(slutt).test(l));
  return rader.slice(a, b < 0 ? undefined : b).join("\n");
}

const git = promisify(execFile);
const fil = (sha: string, f: string, repo: string) =>
  git("git", ["show", `${sha}:${f}`], { cwd: repo, maxBuffer: 20e6 }).then(
    (r) => r.stdout,
    () => "",
  );

const gitCache = new Map<string, { til: number; v: Promise<Hendelse[]> }>();
/** git log -L of the source section, cached a minute; nothing without git (the pod). */
export function gitLogg(id: string, repo = process.cwd()): Promise<Hendelse[]> {
  const L = kildeFor(id);
  if (!L) return Promise.resolve([]);
  const c = gitCache.get(L);
  if (c && c.til > Date.now()) return c.v;
  const v = promisify(execFile)(
    "git",
    ["log", "-n", "30", "--format=\u0001%h|%aI|%s", "-L", L],
    { cwd: repo, maxBuffer: 20e6, timeout: 10_000 },
  ).then(
    ({ stdout }) =>
      Promise.all(
        stdout
          .split("\u0001")
          .filter(Boolean)
          .map(async (blokk) => {
            const [hode, ...resten] = blokk.split("\n");
            const [sha, t, ...msg] = hode.split("|");
            const diff = resten.join("\n").trim().slice(0, 8000);
            const f = L.slice(L.lastIndexOf("/:") + 2);
            const [før, nå] = await Promise.all([
              fil(`${sha}^`, f, repo),
              fil(sha, f, repo),
            ]);
            const felter = feltDiff(utdrag(før, L), utdrag(nå, L));
            const felt = felter.length
              ? felter.map((x) => x.felt)
              : endredeFelt(diff);
            return {
              t,
              hvem: "agent" as const,
              hva: "kilde",
              tekst: `${sha} ${msg.join("|")}${felt.length ? ` · felt: ${felt.join(", ")}` : ""}`,
              diff,
              felter,
            };
          }),
      ),
    () => [],
  );
  gitCache.set(L, { til: Date.now() + 60_000, v });
  return v;
}

/** Flags per join (segmenter.json) and per raw take (assets/out sjekk.json); cut backups. */
async function maskinsjekk(
  dir: string,
  id: string,
  repo: string,
): Promise<Hendelse[]> {
  const dag = juliusDag(id);
  if (!dag) return [];
  const s = Number(id.match(/#s(\d+)$/)?.[1]) || undefined;
  const ut: Hendelse[] = [];
  const mappe = path.join(dir, "video/julius");
  for (const f of await readdir(mappe).catch(() => [])) {
    if (!new RegExp(`^dag-${to(dag)}\\b.*\\.segmenter\\.json$`).test(f))
      continue;
    const segs =
      (await json<{ s: number; flagg?: string[] }[]>(path.join(mappe, f))) ??
      [];
    const fl = segs
      .filter((x) => (!s || x.s === s) && x.flagg?.length)
      .map((x) => `s${x.s}: ${x.flagg!.join(", ")}`);
    ut.push({
      t: (await stat(path.join(mappe, f))).mtime.toISOString(),
      hvem: "maskin",
      hva: "sjekk",
      tekst: `${f.replace(".segmenter.json", "")}: ${fl.length ? fl.join(" · ") : "ingen flagg"}`,
    });
  }
  const out = path.join(repo, "assets/out");
  for (const f of await readdir(out).catch(() => [])) {
    const m = f.match(/^dag(\d+)-(\d+)\.(sjekk\.json|før-kutt-\w+\.mp4)$/);
    if (!m || Number(m[1]) !== dag || (s && Number(m[2]) !== s)) continue;
    const t = (await stat(path.join(out, f))).mtime.toISOString();
    if (m[3] === "sjekk.json") {
      const j = await json<{ flagg?: string[]; dekning?: number }>(
        path.join(out, f),
      );
      ut.push({
        t,
        hvem: "maskin",
        hva: "sjekk",
        tekst: `opptak s${m[2]}: ${j?.flagg?.length ? j.flagg.join(", ") : "ingen flagg"}${j?.dekning != null ? ` · dekning ${j.dekning}` : ""}`,
      });
    } else
      ut.push({
        t,
        hvem: "agent",
        hva: "kutt",
        tekst: `s${m[2]} kuttet (original ${f})`,
      });
  }
  return ut;
}

/** Calls in assets/out/forbruk.jsonl whose element names this id, summed with forbruk.py's prices. */
async function kostnad(id: string, repo: string): Promise<Hendelse[]> {
  const base = path.basename(id.replace(/#.*/, ""));
  const stamme = versionKey(base).replace(/\.\w+$/, "");
  const dag = juliusDag(id);
  const s = id.match(/#s(\d+)$/)?.[1];
  const treff = (e: string) =>
    dag
      ? e.includes(s ? `dag${to(dag)}-${s}.` : `dag${to(dag)}-`) ||
        (!s && e.includes(`dag${dag}-`))
      : /\.\w+$/.test(base) && e.includes(`/${stamme}`);
  const rader = (
    await readFile(path.join(repo, "assets/out/forbruk.jsonl"), "utf8").catch(
      () => "",
    )
  )
    .split("\n")
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l) as Record<string, string | number>];
      } catch {
        return [];
      }
    })
    .filter((r) => treff(String(r.element ?? "")));
  if (!rader.length) return [];
  const kall = rader.reduce((n, r) => n + Number(r.antall ?? 1), 0);
  const kr = rader.reduce(
    (n, r) => n + (PRIS[String(r.type)] ?? 0) * Number(r.antall ?? 1),
    0,
  );
  return [
    {
      t: String(rader.at(-1)!.t),
      hvem: "maskin",
      hva: "kostnad",
      tekst: `${kall} kall, ca. ${Math.round(kr)} kr i alt (${[...new Set(rader.map((r) => r.skript))].join(", ")})`,
    },
  ];
}

export async function historikk(
  dir: string,
  id: string,
  repo = process.cwd(),
): Promise<Hendelse[]> {
  const key = versionKey(id.replace(/#.*/, "")) + (id.match(/#.*/)?.[0] ?? "");
  const stamme = key.replace(/\.\w+$/, "");
  const lager = await lesLager(dir);
  const vurd = Object.entries(lager.elementer)
    .filter(([k]) => k === key || k.startsWith(`${stamme}#`))
    .flatMap(([, e]) => [
      ...e.vurderinger.flatMap((v) => vurderingLinjer(v, false)),
      ...e.historikk.flatMap((v) => vurderingLinjer(v, true)),
    ]);
  const alle = (
    await Promise.all([
      versjoner(dir, key),
      gitLogg(key, repo),
      maskinsjekk(dir, key, repo),
      kostnad(key, repo),
    ])
  ).flat();
  // git gives +01:00, the rest Z: one clock before sorting.
  return [...vurd, ...alle]
    .map((x) => {
      const ms = Date.parse(x.t);
      return Number.isNaN(ms) ? x : { ...x, t: new Date(ms).toISOString() };
    })
    .sort((a, b) => b.t.localeCompare(a.t));
}

/** One text line per event, for list_vurderinger and mise run vurderinger --historikk. */
export const historikkTekst = (h: Hendelse[]) =>
  h
    .map(
      (x) =>
        `${x.t.slice(0, 16).replace("T", " ")} | ${x.hvem} | ${x.hva} | ${x.tekst}`,
    )
    .join("\n") || "ingen historikk";
