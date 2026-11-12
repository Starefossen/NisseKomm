/**
 * The whole season for the parent guide, read from the baked docs
 * (historie, storyboard, gaater) and the game's own data. Server-only and
 * parent-only, like guide-innhold.ts: the docs hold every code in clear text.
 */
import bakt from "@/data/guide-innhold.json";
import statisk from "@/data/statisk_innhold.json";
import eventyr from "@/data/eventyr.json";
import tidbits from "@/data/tidbits.json";
import radioHint from "@/data/radio-hint.json";
import { getAllOppdrag } from "./oppdrag";
import { getQuestByDay } from "./data-loader";
import { frostLevelFor, frostModeFor } from "./frost";
import { GameEngine } from "./game-engine";
import { getKidContext } from "./mcp/tools";
import juliusVideoer from "@/data/julius_videoer.json";
import gaatebiter from "@/data/gaatebiter.json";
import { dagBlokk, parseJulius } from "./guide-innhold";
import { KULDE_RUNER } from "@/components/windows/snofall-tv/runer";
import { interceptFor } from "@/components/windows/snofall-tv/channels";
import {
  ETAPPER,
  dagensUtfordring,
  etapperFor,
  leveringsoppdrag,
} from "@/components/windows/snofall-tv/slede";
import { STEDER } from "@/components/windows/snofall-tv/vidda";
import { UTSKRIFTER } from "@/app/nissemor-guide/printout/filer";
import { KAPITLER } from "@/components/windows/nissespill/kapitler";

const filer: Record<string, string> = bakt;

export const DOK = {
  historie: "docs/historie-2026.md",
  storyboard: "docs/storyboard-2026.md",
  gaater: "docs/gaater-2026.md",
} as const;
const md = (k: keyof typeof DOK) => filer[DOK[k]] ?? "";

/** «## 3. Kanalene» (or ###/####) by the start of its title, to the next heading at the same or a higher level. */
export function seksjon(tekst: string, tittel: string): string {
  const esc = tittel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = tekst.match(new RegExp(`^(#{2,4}) ${esc}.*$`, "m"));
  if (!m || m.index === undefined) return "";
  const rest = tekst.slice(m.index + m[0].length);
  const slutt = rest.search(new RegExp(`^#{2,${m[1].length}} `, "m"));
  return m[0] + (slutt < 0 ? rest : rest.slice(0, slutt));
}

/** Every doc section the guide reads; the test fails when a heading is renamed. */
export const SEKSJONER: readonly [keyof typeof DOK, string][] = [
  ["historie", "1. Premiss"],
  ["historie", "2. Milepæler"],
  ["historie", "3.3 Morgenrådet"],
  ["historie", "3.6 Barnas faste roller"],
  ["historie", "3.6b Tre regler"],
  ["historie", "3.7 Varden"],
  ["historie", "5. Belønninger"],
  ["historie", "6. Frost"],
  ["historie", "8. Rampestreker"],
  ["historie", "9. Snøfall TV"],
  ["storyboard", "1. Flateoversikt"],
  ["storyboard", "2. Faste regler"],
  ["storyboard", "3. Dag for dag"],
  ["gaater", "Dag for dag"],
  ["gaater", "(a) Handleliste"],
  ["gaater", "(c) Forberedelseskalender"],
  ["gaater", "Byggeplan 28.–30. november"],
  ["gaater", "Sjekkliste"],
];
const del = (k: keyof typeof DOK, tittel: string) => seksjon(md(k), tittel);

/** The guide shows frost squares as ✱: ❄ renders as a colour emoji on iPad. */
const ren = (s: string) =>
  s
    .replace(/[*`]/g, "")
    .replace(/\u2744\uFE0F?/g, "✱")
    .trim();

/** Body rows of the first markdown table in `tekst`, cells trimmed. */
export function tabell(tekst: string): string[][] {
  return tekst
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-/.test(l))
    .slice(1)
    .map((l) =>
      l
        .slice(1, l.lastIndexOf("|"))
        .split("|")
        .map((c) => c.trim()),
    );
}

const tabellPerDag = (tekst: string) =>
  new Map(tabell(tekst).map((r) => [Number(r[0]), r]));

// --- Tonight (gaater-2026.md) ------------------------------------------

/** gaater «Kveld for kveld»: the evening before day n (day 1: 28.–30. nov). */
function kveldRad(n: number): string {
  const rader = tabell(
    del("gaater", "(c) Forberedelseskalender").split(
      "**Kveld for kveld**",
    )[1] ?? "",
  );
  const kveld = n === 1 ? "28.–30. nov" : `${n - 1}. des`;
  return ren(rader.find((r) => ren(r[0]) === kveld)?.[1] ?? "");
}

export function kveldDag(n: number) {
  const blokk = dagBlokk(del("gaater", "Dag for dag"), n);
  if (!blokk) return null;
  const felt = (k: string) =>
    ren(
      blokk.match(new RegExp(`^- \\*\\*${k}[^:]*:\\*\\* (.+)$`, "m"))?.[1] ??
        "",
    );
  const oppsett = felt("Oppsett");
  const utskrifterTekst = felt("Utskrifter");
  const s = tabellPerDag(del("historie", "8. Rampestreker")).get(n) ?? [];
  return {
    dag: n,
    tittel: ren(blokk.split("\n")[0].replace(/^#+ Dag \d+ \(\S+\) – /, "")),
    mekanikk: felt("Mekanikk"),
    brikkeH: felt("Brikke H"),
    brikkeS: felt("Brikke S"),
    slikLoses: felt("Slik løses den")
      .split(/(?:^|\s)\d+\)\s+/)
      .map((x) => x.trim())
      .filter(Boolean),
    hanna: felt("Hanna"),
    oppsett,
    minutter: Number(oppsett.match(/\d+/)?.[0] ?? 0),
    materialer: felt("Materialer"),
    utskrifterTekst,
    // Only files the guide can print; the text also names replaced ones.
    utskrifter: [...utskrifterTekst.matchAll(/([\w-]+)\.pdf/g)]
      .map((m) => m[1])
      .filter((u) => (UTSKRIFTER as readonly string[]).includes(u)),
    reserve: felt("Reserve"),
    iKveld: kveldRad(n),
    strek: {
      tekst: ren(s[2] ?? ""),
      type: s[3] ?? "",
      materialer: ren(s[4] ?? ""),
      minutter: Number(s[5] ?? 0),
      brikke: s[6] ?? "",
    },
  };
}

// --- Before the season (gaater + radio) --------------------------------

const punkter = (tekst: string) =>
  [...tekst.matchAll(/^- (.+)$/gm)].map((m) => ren(m[1]));

export function forSesongen() {
  const kal = del("gaater", "(c) Forberedelseskalender");
  const plan = del("gaater", "Byggeplan 28.–30. november");
  const handel = del("gaater", "(a) Handleliste");
  const grupper: {
    navn: string;
    varer: {
      vare: string;
      mengde: string;
      dager: string;
      hvor: string;
      kilde: string;
      pris: string;
    }[];
  }[] = [];
  let sum = "";
  for (const [vare, mengde, dager, hvor, pris] of tabell(handel)) {
    if (vare === "**Sum**") sum = ren(hvor);
    else if (vare.startsWith("**"))
      grupper.push({ navn: ren(vare), varer: [] });
    else
      grupper.at(-1)?.varer.push({
        vare: ren(vare),
        mengde,
        dager,
        hvor: ren(hvor),
        // First word of «Hvor»: «hjemme eller lokalt» is at home.
        kilde: /^nett/i.test(hvor)
          ? "nett"
          : /^hjemme/i.test(hvor)
            ? "hjemme"
            : "lokalt",
        pris,
      });
  }
  return {
    innen25: punkter(kal.split("**Kveld for kveld**")[0]),
    byggeplan: plan
      .split(/^\*\*(.+)\*\*$/m)
      .slice(1)
      .reduce<{ tittel: string; steg: { tekst: string; min: string }[] }[]>(
        (acc, x, i) =>
          i % 2 === 0
            ? [...acc, { tittel: x, steg: [] }]
            : ((acc.at(-1)!.steg = tabell(x).map((r) => ({
                tekst: ren(r.at(-2)!),
                min: r.at(-1)!,
              }))),
              acc),
        [],
      ),
    morgen1: ren(plan.match(/^Morgenen 1\. desember.+$/m)?.[0] ?? ""),
    sjekkliste: (
      del("gaater", "Sjekkliste").match(/```\n([\s\S]*?)```/)?.[1] ?? ""
    )
      .trim()
      .split(/\n\s*\n/)
      .map((b) => {
        const [tittel, ...linjer] = b.split("\n");
        return {
          tittel,
          punkter: linjer.map((l) => ren(l.replace(/^\[ \] /, ""))),
        };
      }),
    handleliste: {
      intro: ren(
        handel.split("\n").find((l) => l.startsWith("Nettbudsjett")) ?? "",
      ),
      grupper,
      sum,
    },
    radio: Object.entries(radioHint.host).map(([dato, tekst]) => ({
      dato,
      tekst,
    })),
  };
}

/** Day list: title and print files per day (Dager, Utskrifter). */
export const dagListe = () =>
  Array.from({ length: 24 }, (_, i) => kveldDag(i + 1)!).map((d) => ({
    dag: d.dag,
    tittel: d.tittel,
    utskrifter: d.utskrifter,
  }));

// --- Historien ---------------------------------------------------------

export function historien() {
  return [
    {
      tittel: "Hva NisseKomm er",
      deler: [
        del("historie", "1. Premiss"),
        del("historie", "3.6 Barnas faste roller"),
        del("historie", "3.6b Tre regler"),
      ],
    },
    {
      tittel: "Slik går en dag",
      deler: [
        del("storyboard", "2. Faste regler"),
        del("historie", "3.3 Morgenrådet"),
        del("historie", "3.7 Varden"),
      ],
    },
    {
      tittel: "Flatene",
      deler: [del("storyboard", "1. Flateoversikt")],
    },
    {
      tittel: "Milepæler",
      deler: [del("historie", "2. Milepæler")],
    },
    {
      tittel: "Belønninger og frost",
      deler: [del("historie", "5. Belønninger"), del("historie", "6. Frost")],
    },
  ];
}

// --- One line per subsystem per day ------------------------------------

const dager = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

/** Objects in tidbits.json that appear on day n (fraDag), as «section: text». */
function tidbitsPaa(n: number): string[] {
  const ut: string[] = [];
  const gaa = (v: unknown, sti: string) => {
    if (Array.isArray(v)) return v.forEach((x) => gaa(x, sti));
    if (!v || typeof v !== "object") return;
    const o = v as Record<string, unknown>;
    const kal = sti === "kalender" && o.dag === n;
    if (o.fraDag === n || kal) {
      const t = [
        o.navn,
        o.emne,
        Array.isArray(o.ord) ? o.ord.join("/") : o.ord,
        o.tekst ?? o.verdi,
      ]
        .filter((x) => typeof x === "string" && x)
        .join(": ");
      ut.push(`${sti}: ${String(t).split("\n")[0].slice(0, 140)}`);
    } else if (sti !== "kalender" || !("dag" in o))
      for (const [k, x] of Object.entries(o)) gaa(x, sti ? `${sti}.${k}` : k);
  };
  gaa(tidbits, "");
  return ut;
}

type FilNode = {
  navn: string;
  type: string;
  unlockConditions?: { afterDay?: number };
  barn?: FilNode[];
};
function filerPaa(n: number): string[] {
  const ut = new Set<string>();
  (function gaa(noder: FilNode[], dir: string) {
    for (const f of noder)
      if (f.type === "fil") {
        if (f.unlockConditions?.afterDay === n) ut.add(`${dir}/${f.navn}`);
      } else gaa(f.barn ?? [], `${dir}/${f.navn}`);
  })(statisk.filer as FilNode[], "");
  // The quest names files without folder; keep only those not found above.
  for (const f of getQuestByDay(n)?.reveals?.files ?? [])
    if (![...ut].some((p) => p.endsWith(`/${f}`))) ut.add(f);
  return [...ut];
}

export function delsystemer(n: number) {
  const runer = (d: number) => GameEngine.getLearnedRunes(dager(d));
  const nye = [...runer(n)].filter((r) => !runer(n - 1).has(r));
  const frost = frostLevelFor(n, false);
  const modus = frostModeFor({
    day: n,
    month: 12,
    hour: 10,
    solved: false,
    disabled: false,
  });
  const tv = tabellPerDag(del("historie", "9. Snøfall TV")).get(n);
  const milepael = eventyr.eventyr[0].milepaeler.find((m) => m.dag === n);
  const etappe = etapperFor(n).at(-1);
  const ny = ETAPPER.filter((e) => e.dag === n).map((e) => e.navn);
  const levering = etappe && leveringsoppdrag(n, etappe);
  const kap = KAPITLER.filter((k) => k.dag === n);
  const kapNaa = KAPITLER.filter((k) => k.dag <= n).at(-1);
  const radio =
    (
      radioHint.dag as Record<
        string,
        { intro_hint?: string; reaksjon_hint?: string }
      >
    )[n] ?? {};
  const linjer: [string, string][] = [
    [
      "Frost",
      frost === null
        ? "Ikke målt ennå (frostgraden vises fra dag 7)."
        : `${frost} % om morgenen, ${frostLevelFor(n, true)} % etter koden${frostLevelFor(n, true, true) !== frostLevelFor(n, true) ? `, ${frostLevelFor(n, true, true)} % med bonus` : ""}.${modus.level ? ` Frostmodus nivå ${modus.level} til koden er løst (senest kl. 20): «${modus.message}»` : ""}`,
    ],
    [
      "Runer",
      `${nye.length ? `Nye etter koden: ${nye.join(" ")}` : "Ingen nye runer"} (${runer(n).size} til sammen).${KULDE_RUNER[n] ? ` Kuldes runelinje: «${KULDE_RUNER[n]}».` : ""}`,
    ],
    [
      "Milepæl",
      milepael ? `${milepael.navn}: ${milepael.tekst}` : "Ingen i dag.",
    ],
    [
      "Snøfall TV",
      [
        tv
          ? `${ren(tv[1])}: ${ren(tv[2])}`
          : "Ingen ny hendelse; frostgraden styrer bildet.",
        interceptFor(n) && `85,0 MHz: «${interceptFor(n)}»`,
        n === 13 && "Luciatog over landsbyen 06–09.",
        n === 14 && "Den blå brevfuglen sirkler klokketårnet.",
      ]
        .filter(Boolean)
        .join(" "),
    ],
    ["NisseNet", filerPaa(n).join(", ") || "Ingen nye filer."],
    [
      "Sledeflukt",
      n < 8
        ? "Ikke åpen ennå (fra dag 8)."
        : [
            ny.length && `Ny etappe: ${ny.join(", ")}.`,
            etappe &&
              `Dagens utfordring på ${etappe.navn}: ${dagensUtfordring(n, etappe).tekst}.`,
            levering && `Leveringsoppdrag: ${levering.tekst}.`,
            STEDER.filter((s) => s.dag === n).length &&
              `Fri flyging åpner: ${STEDER.filter((s) => s.dag === n)
                .map((s) => s.navn)
                .join(", ")}.`,
          ]
            .filter(Boolean)
            .join(" "),
    ],
    [
      "Ugleposten",
      kap.length
        ? kap
            .map(
              (k) =>
                `Kapittel ${k.n} åpner: ${k.tittel} (${k.scener.filter((s) => s.fjaer).length} fjær).`,
            )
            .join(" ")
        : kapNaa
          ? `Kapittel ${kapNaa.n} (${kapNaa.tittel}) er det nyeste.`
          : "Ikke åpen ennå (fra dag 4).",
    ],
    ["Småting", tidbitsPaa(n).join(" · ") || "Ingenting nytt."],
    ["Radio, intro", radio.intro_hint ?? "Ikke skrevet."],
    ["Radio, reaksjon", radio.reaksjon_hint ?? "Ikke skrevet."],
  ];
  return linjer;
}

// --- Varden (get_kid_context) ------------------------------------------

/** What get_kid_context returns on day n at 12:00, with n unsolved and solved. */
export function varden(n: number) {
  const at = new Date(Date.UTC(2026, 11, n, 11));
  const kjor = (losteTil: number) => {
    const loste = getAllOppdrag().filter((q) => q.dag <= losteTil);
    const ctx = getKidContext(
      {
        "nissekomm-codes": loste.map((q) => ({ day: q.dag, kode: q.kode })),
        "nissekomm-collected-symbols": loste.flatMap((q) =>
          q.symbol_clue ? [{ symbolId: q.symbol_clue.symbolId }] : [],
        ),
      },
      at,
    );
    const iDag = ctx.days.find((d) => (d as { day?: number }).day === n);
    const skjulte = ctx.files
      .filter((f) =>
        String((f as { content?: unknown }).content).includes("[skjult]"),
      )
      .map((f) => String((f as { path?: unknown }).path));
    return {
      dag: JSON.stringify(iDag, (_, v) =>
        typeof v === "string" && v.length > 160 ? `${v.slice(0, 160)}…` : v,
      ),
      filer: ctx.files.length,
      skjulte,
      symboler: ctx.symbols.length,
      bytes: Buffer.byteLength(JSON.stringify(ctx)),
      avkortet: ctx.truncated,
    };
  };
  return { uloest: kjor(n - 1), loest: kjor(n) };
}

/** Story-board summary of the day: «Dag N» under storyboard §3. */
export const sammendrag = (n: number) =>
  ren(dagBlokk(del("storyboard", "3. Dag for dag"), n));

// --- Gåtekart (riddle map) ---------------------------------------------

/** Loose match: case, whitespace, «…» vs «...» and a trailing full stop don't count. */
export const norm = (s: string) =>
  s
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, "")
    .toLowerCase();

const transkripsjon = (d: number) =>
  juliusVideoer.find((v) => v.dag === d)?.transkripsjon ?? "";

/** Path, unlock day and decryption of a NisseNet file by name. */
function filInfo(navn: string) {
  let funn: { sti: string; dag?: number; krypto?: string } | null = null;
  (function gaa(noder: FilNode[], dir: string) {
    for (const f of noder as (FilNode & {
      unlockConditions?: { requiresSolvedDecryption?: string };
    })[])
      if (f.type === "fil" && f.navn === navn)
        funn = {
          sti: `${dir}/${f.navn}`,
          dag: f.unlockConditions?.afterDay,
          krypto: f.unlockConditions?.requiresSolvedDecryption,
        };
      else if (f.type !== "fil") gaa(f.barn ?? [], `${dir}/${f.navn}`);
  })(statisk.filer as FilNode[], "");
  return funn as { sti: string; dag?: number; krypto?: string } | null;
}

export type Kilde = "julius" | "epost" | "ps" | "fil" | "symbol";
export interface Bit {
  id: string;
  /** Where the piece is, in plain words. */
  hvor: string;
  /** From when the kids can see it. */
  naar: string;
  tekst: string;
  kilde?: Kilde;
  /** Day whose text holds the piece (fra_dag for older pieces). */
  kildeDag?: number;
  /** Words the text must contain; tested against the kids' text. */
  sitat?: string;
  segment?: number;
}

/** Sentences of a gaater field; keeps ** around letters so the UI can hide them. */
const setninger = (s: string) =>
  s
    .replace(/`/g, "")
    .replace(/\u2744\uFE0F?/g, "✱")
    .split(/(?<=[.!?»])\s+(?=[A-ZÆØÅ«*0-9])/)
    .map((x) => x.trim())
    .filter(Boolean);

/** Piece list for one day: the house column from «Brikke H», the screen column from «Brikke S» quotes and gaatebiter.json. */
export function gaatekart(n: number) {
  const blokk = dagBlokk(del("gaater", "Dag for dag"), n);
  const felt = (k: string) =>
    blokk.match(new RegExp(`^- \\*\\*${k}[^:]*:\\*\\* (.+)$`, "m"))?.[1] ?? "";
  const q = getQuestByDay(n);
  const segs = parseJulius(
    filer["docs/manus/julius-2026.md"] ?? "",
    n,
  )?.segmenter;
  const hjemme: Bit[] = setninger(felt("Brikke H")).map((tekst, i) => ({
    id: `H${i + 1}`,
    hvor: "Hjemme",
    naar: n === 1 ? "Morgenen 1. desember" : `Morgenen ${n}. desember`,
    tekst,
  }));

  const skjerm: Bit[] = [];
  const legg = (b: Omit<Bit, "id">) =>
    skjerm.push({ id: `S${skjerm.length + 1}`, ...b });
  for (const [, sitat] of felt("Brikke S").matchAll(/«([^«»]+)»/g)) {
    const s = norm(sitat);
    const seg = segs?.findIndex((x) => norm(x.replikk).includes(s)) ?? -1;
    if (norm(transkripsjon(n)).includes(s) || seg >= 0)
      legg({
        hvor: `Julius' video${seg >= 0 ? `, segment ${seg + 1}` : ""}`,
        naar: `${n}. desember; teksten under spilleren når videoen er sett`,
        tekst: sitat,
        kilde: "julius",
        kildeDag: n,
        sitat,
        segment: seg >= 0 ? seg + 1 : undefined,
      });
    else if (q && norm(q.nissemail_tekst).includes(s))
      legg({
        hvor: "NisseMail",
        naar: `${n}. desember`,
        tekst: sitat,
        kilde: "epost",
        kildeDag: n,
        sitat,
      });
    else
      legg({
        hvor: "Står ikke i Julius-teksten, e-posten eller PS-en (bare i gåteplanen)",
        naar: "",
        tekst: sitat,
      });
  }
  const symbolDager = getAllOppdrag()
    .filter((x) => x.symbol_clue)
    .map((x) => x.dag);
  for (const b of gaatebiter.biter.filter((x) => x.dag === n)) {
    const fra = "fra_dag" in b ? Number(b.fra_dag) : n;
    const fq = getQuestByDay(fra);
    if (b.type === "fil") {
      const f = filInfo(String(b.id));
      legg({
        hvor: `NisseNet ${f?.sti ?? b.id}`,
        naar: f?.krypto
          ? `når NisseKrypto «${f.krypto}» er løst`
          : `fra ${f?.dag ?? "?"}. desember`,
        tekst: b.sitat,
        kilde: "fil",
      });
    } else if (b.type === "symbol") {
      const sd = symbolDager.find(
        (d) => getQuestByDay(d)?.symbol_clue?.symbolId === b.id,
      );
      legg({
        hvor: `Symbolkort ${symbolDager.indexOf(sd ?? 0) + 1}/9`,
        naar: `skannes ${sd}. desember`,
        tekst: getQuestByDay(sd ?? 0)?.symbol_clue?.description ?? "",
        kilde: "symbol",
      });
    } else if (b.type === "ps")
      legg({
        hvor: `Julius' PS fra dag ${fra}`,
        naar: `etter koden ${fra}. desember`,
        tekst: fq?.julius_ps ?? "",
        kilde: "ps",
        kildeDag: fra,
      });
    else if (b.type === "epost")
      legg({
        hvor: `NisseMail dag ${fra}`,
        naar: `${fra}. desember`,
        tekst: fq?.nissemail_tekst ?? "",
        kilde: "epost",
        kildeDag: fra,
      });
    else
      legg({
        hvor: `Julius' video dag ${fra} (arkivet)`,
        naar: `teksten ligger i arkivet fra ${fra}. desember`,
        tekst: transkripsjon(fra),
        kilde: "julius",
        kildeDag: fra,
      });
  }

  const andel = felt("Andel per flate");
  const hus = Number(andel.match(/(\d+)\s*%/)?.[1] ?? NaN);
  return {
    hjemme,
    skjerm,
    epost: q?.nissemail_tekst ?? "",
    andel: ren(andel),
    husProsent: Number.isFinite(hus) ? hus : null,
  };
}

/** One row per day for the season map under Dager. */
export const sesongKart = () =>
  getAllOppdrag()
    .filter((q) => q.dag <= 24)
    .map((q) => {
      const k = gaatekart(q.dag);
      const d = kveldDag(q.dag);
      const av = (f: (b: Bit) => boolean) =>
        k.skjerm.filter(f).map((b) => `${b.id} ${b.hvor}`);
      return {
        dag: q.dag,
        tittel: d?.tittel.split(" · ")[0] ?? q.tittel,
        hjemme: k.hjemme.map((b) => b.tekst).join(" "),
        epost: av((b) => b.kilde === "epost"),
        julius: av((b) => b.kilde === "julius"),
        annet: av((b) => !["epost", "julius"].includes(b.kilde ?? "")),
        kode: q.kode,
        oppsett: d?.oppsett ?? "",
      };
    });
