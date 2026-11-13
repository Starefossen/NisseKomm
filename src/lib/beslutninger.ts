import { readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";

/**
 * Open choices for Hans (id `beslutning/<slug>`), stored in the repo so they
 * outlive the season: docs/beslutninger-apne.json. Hans answers in Gjennomgang;
 * the answer is kept here and appended as a line to docs/beslutninger.md.
 */
export interface Beslutning {
  slug: string;
  spørsmål: string;
  kontekst: string;
  /** Gjennomgang ids or paths the choice touches. */
  lenker: string[];
  valg: string[];
  /** Index into valg. */
  anbefalt?: number;
  av: string;
  opprettet: string;
  svar?: { valg: number; hvorfor?: string; av: "hans"; dato: string };
}

export class UgyldigBeslutning extends Error {}

const JSON_FIL = "docs/beslutninger-apne.json";
const MD_FIL = "docs/beslutninger.md";
export const MD_SEKSJON = "## Besvart i Gjennomgang";

export async function lesBeslutninger(
  rot = process.cwd(),
): Promise<Beslutning[]> {
  const t = await readFile(path.join(rot, JSON_FIL), "utf8").catch(() => "[]");
  return JSON.parse(t) as Beslutning[];
}

const skriv = (rot: string, b: Beslutning[]) =>
  writeFile(path.join(rot, JSON_FIL), JSON.stringify(b, null, 2) + "\n");

const tekst = (x: unknown, navn: string, maks: number) => {
  const t = typeof x === "string" ? x.trim() : "";
  if (!t || t.length > maks)
    throw new UgyldigBeslutning(`${navn} mangler (maks ${maks} tegn)`);
  return t;
};

const slugAv = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

// ponytail: one writer at a time per process; two dev servers on one checkout could race.
let kø: Promise<unknown> = Promise.resolve();
const låst = <T>(f: () => Promise<T>): Promise<T> => {
  const p = kø.then(f, f);
  kø = p.catch(() => {});
  return p;
};

export function opprettBeslutning(
  a: Record<string, unknown>,
  av: string,
  rot = process.cwd(),
  nå = new Date(),
): Promise<Beslutning> {
  const spørsmål = tekst(a.sporsmal ?? a.spørsmål, "spørsmål", 400);
  const kontekst = tekst(a.kontekst, "kontekst", 2000);
  if (
    !Array.isArray(a.valg) ||
    a.valg.length < 2 ||
    a.valg.length > 4 ||
    a.valg.some((v) => typeof v !== "string" || !v.trim() || v.length > 300)
  )
    throw new UgyldigBeslutning("valg: 2–4 tekster (maks 300 tegn)");
  const valg = (a.valg as string[]).map((v) => v.trim());
  const anbefalt = a.anbefalt === undefined ? undefined : Number(a.anbefalt);
  if (
    anbefalt !== undefined &&
    !(Number.isInteger(anbefalt) && anbefalt >= 0 && anbefalt < valg.length)
  )
    throw new UgyldigBeslutning("anbefalt: indeks i valg");
  const lenker = Array.isArray(a.lenker)
    ? a.lenker.filter((l): l is string => typeof l === "string").slice(0, 10)
    : [];
  const slug = slugAv(typeof a.slug === "string" ? a.slug : spørsmål);
  if (!slug) throw new UgyldigBeslutning("ugyldig slug");
  return låst(async () => {
    const alle = await lesBeslutninger(rot);
    if (alle.some((b) => b.slug === slug))
      throw new UgyldigBeslutning(`finnes alt: beslutning/${slug}`);
    const b: Beslutning = {
      slug,
      spørsmål,
      kontekst,
      lenker,
      valg,
      ...(anbefalt === undefined ? {} : { anbefalt }),
      av,
      opprettet: nå.toISOString(),
    };
    await skriv(rot, [...alle, b]);
    return b;
  });
}

/** Hans' answer: stored, then one line in docs/beslutninger.md. */
export function svarBeslutning(
  a: Record<string, unknown>,
  rot = process.cwd(),
  nå = new Date(),
): Promise<Beslutning> {
  const slug = String(a.id ?? "").replace(/^beslutning\//, "");
  const hvorfor =
    typeof a.hvorfor === "string" && a.hvorfor.trim()
      ? a.hvorfor.trim().slice(0, 1000)
      : undefined;
  return låst(async () => {
    const alle = await lesBeslutninger(rot);
    const b = alle.find((x) => x.slug === slug);
    if (!b) throw new UgyldigBeslutning("ukjent beslutning");
    if (b.svar) throw new UgyldigBeslutning("allerede besvart");
    const valg = Number(a.valg);
    if (!(Number.isInteger(valg) && valg >= 0 && valg < b.valg.length))
      throw new UgyldigBeslutning("valg: indeks i valg");
    const dato = nå.toISOString().slice(0, 10);
    b.svar = { valg, ...(hvorfor ? { hvorfor } : {}), av: "hans", dato };
    await skriv(rot, alle);
    const md = path.join(rot, MD_FIL);
    const før = await readFile(md, "utf8").catch(() => "");
    const linje = `- ${dato}: ${b.spørsmål.replace(/\s+/g, " ")} Svar: ${b.valg[valg].replace(/\s+/g, " ")}${hvorfor ? ` Hvorfor: ${hvorfor.replace(/\s+/g, " ")}` : ""}\n`;
    // A blank line before the first item under the section, none between items (prettier's form).
    const sist = før.trimEnd().split("\n").at(-1) ?? "";
    const hode = før.includes(MD_SEKSJON)
      ? ""
      : `${før.endsWith("\n") || !før ? "" : "\n"}\n${MD_SEKSJON}\n`;
    await appendFile(
      md,
      `${hode || før.endsWith("\n") ? "" : "\n"}${hode}${sist.startsWith("- ") && !hode ? "" : "\n"}${linje}`,
    );
    return b;
  });
}
