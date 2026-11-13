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
import { getAllOppdrag, getOppdrag as getQuestByDay } from "./oppdrag";
import { frostLevelFor, frostModeFor } from "./frost";
import { runerFor } from "./game-engine";
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

let filer: Record<string, string> = bakt;

/** Run `f` against another bake (an old guide-innhold.json from git): the verdict migration. */
export function medBake<T>(b: Record<string, string>, f: () => T): T {
  const før = filer;
  filer = b;
  try {
    return f();
  } finally {
    filer = før;
  }
}

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
  ["historie", "8.1 Korte former"],
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

/** historie §8, the one source of every rampestrek text; §8.1 holds its short forms. */
const strekTabell = () =>
  tabellPerDag(del("historie", "8. Rampestreker").split("### 8.1 ")[0]);

/** Short title per day for the sharing sheet (historie §8.1 «Tittel»). */
export const strekTitler = (): string[] => {
  const kort = tabellPerDag(del("historie", "8.1 Korte former"));
  return Array.from({ length: 24 }, (_, i) => kort.get(i + 1)?.[1] ?? "");
};

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

/**
 * Cards used again after their day: new runes in cut-off corners (Meta 1),
 * backup dots, rune sources for day 7 and 17, Meta 2 (18 → 21), and the
 * alphabet strip (day 5 → 22). The evening checklist asks for a spare set.
 */
export const RESERVESETT: Record<number, string> = {
  1: "dag01-tradkort",
  3: "dag03-frostlapp",
  4: "dag04-skokort",
  5: "alfabetstrimmel",
  6: "dag06-silhuetter",
  7: "dag07-frostlapp",
  12: "dag12-frostlapp-tredelt",
  13: "dag13-krydderkort",
  18: "dag18-rosinkort",
  20: "dag20-putekort",
  23: "dag23-stjerner",
};

/**
 * The source lines behind tonight's sections (kveld, utskrifter, rampestrek):
 * what a verdict is given to. Raw doc text, so chips, links and other
 * derived UI never make a reviewed section «ny versjon».
 */
export function kveldKilde(n: number) {
  const rad = (t: string) =>
    tabell(t)
      .find((r) => Number(r[0]) === n)
      ?.join(" | ") ?? "";
  return [
    dagBlokk(del("gaater", "Dag for dag"), n),
    rad(del("historie", "8. Rampestreker").split("### 8.1 ")[0]),
    rad(del("historie", "8.1 Korte former")),
    kveldRad(n),
  ]
    .join("\n")
    .trim();
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
  const s = strekTabell().get(n) ?? [];
  const kort = tabellPerDag(del("historie", "8.1 Korte former")).get(n) ?? [];
  const sjekkliste = [
    ...(
      blokk.match(/^- \*\*Sjekkliste:\*\*\n((?:  - .+\n)+)/m)?.[1] ?? ""
    ).matchAll(/^  - (.+)$/gm),
  ].map((m) => ren(m[1]));
  const materialer = felt("Materialer");
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
    /** The ladder a parent gives one step at a time; never the code. */
    hint: felt("Hint")
      .split(/(?:^|\s)\d+\)\s+/)
      .map((x) => x.trim())
      .filter(Boolean),
    hanna: felt("Hanna"),
    oppsett,
    /** Tonight's checklist, the only lines the guide ticks off; `x.pdf` names a print. */
    sjekkliste,
    minutter: Number(oppsett.match(/\d+/)?.[0] ?? 0),
    materialer,
    /** Shopping items in tonight's materials, checklist and prank. */
    varer: vareTreff([materialer, ren(s[4] ?? ""), ...sjekkliste]),
    utskrifterTekst,
    // Only files the guide can print; the text also names replaced ones.
    utskrifter: [...utskrifterTekst.matchAll(/([\w-]+)\.pdf/g)]
      .map((m) => m[1])
      .filter((u) => (UTSKRIFTER as readonly string[]).includes(u)),
    reserve: felt("Reserve"),
    reservesett: RESERVESETT[n] as string | undefined,
    iKveld: kveldRad(n),
    strek: {
      tekst: ren(s[2] ?? ""),
      type: s[3] ?? "",
      materialer: ren(s[4] ?? ""),
      minutter: Number(s[5] ?? 0),
      brikke: s[6] ?? "",
      // historie §8.1: title on the sheet, the scene to draw, the checklist line.
      tittel: ren(kort[1] ?? ""),
      tegnbar: ren(kort[2] ?? ""),
      sjekk: ren(kort[3] ?? ""),
    },
  };
}

function byggeplan(plan: string) {
  return plan
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
    );
}

function sjekklisteDag1() {
  return (del("gaater", "Sjekkliste").match(/```\n([\s\S]*?)```/)?.[1] ?? "")
    .trim()
    .split(/\n\s*\n/)
    .map((b) => {
      const [tittel, ...linjer] = b.split("\n");
      return {
        tittel,
        punkter: linjer.map((l) => ren(l.replace(/^\[ \] /, ""))),
      };
    });
}

// --- Shopping list (gaater «(a) Handleliste») ---------------------------

/** «Klementiner, 2,3 kg-esker» → «klementiner»: first part of the name, as a slug. */
export const vareId = (vare: string) =>
  ren(vare)
    .split(/,|\(| eller /)[0]
    .toLowerCase()
    .replace(/[æå]/g, (c) => (c === "æ" ? "ae" : "a"))
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Words a day text uses for an item: each part of its name (split on «,»,
 * «eller», «+», «i stedet for»; parentheses, numbers and units dropped)
 * plus the table's «Ord» column for names the days spell differently.
 */
function vareOrd(vare: string, ord: string): string[] {
  const deler = ren(vare)
    .replace(/\([^)]*\)/g, "")
    .toLowerCase()
    .split(/,| eller | \+ | i stedet for /)
    .map((d) =>
      d
        .replace(/[\d,.–×]+\s*(kg|cm|g|m)?(?![\p{L}])/gu, "")
        .split(/\s+/)
        .filter((w) => !["ekte", "små", "stor", "a4", "cirka"].includes(w))
        .join(" ")
        .trim(),
    )
    .filter((d) => /^\p{L}/u.test(d) && d.length >= 3);
  return [
    ...deler,
    ...ord.split(",").map((o) => o.trim().toLowerCase()),
  ].filter(Boolean);
}

/** A word matches as a whole word, in any of its Norwegian inflections. */
const ordRegex = (o: string) => {
  const stamme = o.length > 5 ? o.replace(/(er|e|r)$/, "") : o;
  const esc = stamme.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?<![\\p{L}-])${esc}(?:er|ene|en|et|e|r|s|ne|a)?(?![\\p{L}])`,
    "giu",
  );
};

export function handleliste() {
  let gruppe = "";
  const ut = [];
  for (const [vare, mengde, dager, hvor, pris, lenke = "", ord = ""] of tabell(
    del("gaater", "(a) Handleliste"),
  )) {
    if (vare === "**Sum**") continue;
    if (vare.startsWith("**")) {
      gruppe = ren(vare);
      continue;
    }
    const dagListe = [...dager.matchAll(/\d+/g)].map((m) => Number(m[0]));
    ut.push({
      id: vareId(vare),
      vare: ren(vare),
      gruppe,
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
      lenke: lenke.split(" ")[0],
      // «(søk)» marks a shop search, not a checked product page.
      sok: lenke.includes("(søk)"),
      /** Needed for the day-1 build 28.–30. Nov, or for every card. */
      tidlig: dagListe.includes(1) || /alle/.test(dager),
      /** No single day: paper for all cards, the catch-all row at home. */
      generell: !dagListe.length,
      ord: vareOrd(vare, ord),
    });
  }
  return ut;
}

export type VareTreff = { id: string; vare: string; ord: string[] };

/** Items named in these texts, with the exact words found (for marking them in place). */
export function vareTreff(tekster: string[]): VareTreff[] {
  const tekst = tekster.join("\n");
  // The catch-all row of things at home would mark every «teip»; it isn't shopping.
  return handleliste().flatMap((v) => {
    if (v.generell && v.kilde === "hjemme") return [];
    const funnet = new Set(
      v.ord.flatMap((o) => [...tekst.matchAll(ordRegex(o))].map((m) => m[0])),
    );
    return funnet.size ? [{ id: v.id, vare: v.vare, ord: [...funnet] }] : [];
  });
}

// --- Before the season (gaater + radio) --------------------------------

const punkter = (tekst: string) =>
  [...tekst.matchAll(/^- (.+)$/gm)].map((m) => ren(m[1]));

export function forSesongen() {
  const kal = del("gaater", "(c) Forberedelseskalender");
  const plan = del("gaater", "Byggeplan 28.–30. november");
  const handel = del("gaater", "(a) Handleliste");
  const plan1 = byggeplan(plan);
  const sjekk1 = sjekklisteDag1();
  const dag1 = vareTreff([
    ...plan1.flatMap((b) => b.steg.map((s) => s.tekst)),
    ...sjekk1.flatMap((s) => s.punkter),
  ]);
  return {
    innen25: punkter(kal.split("**Kveld for kveld**")[0]),
    byggeplan: plan1,
    morgen1: ren(plan.match(/^Morgenen 1\. desember.+$/m)?.[0] ?? ""),
    sjekkliste: sjekk1,
    /** Shopping items named in the day-1 build plan and checklists. */
    dag1,
    handleliste: {
      intro: ren(
        handel.split("\n").find((l) => l.startsWith("Nettbudsjett")) ?? "",
      ),
      varer: handleliste(),
      sum: ren(tabell(handel).find((r) => r[0] === "**Sum**")?.[3] ?? ""),
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
  const runer = (d: number) =>
    runerFor(dager(d), (x) => getQuestByDay(x)?.kode);
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
        n === 14 && "Den blå fuglen sirkler klokketårnet.",
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
  /** Sentences of `tekst` that a gaater quote points at (S0 only). */
  merk?: string[];
}

/** Sentences of a gaater field; keeps ** around letters so the UI can hide them. */
const setninger = (s: string) =>
  s
    .replace(/`/g, "")
    .replace(/\u2744\uFE0F?/g, "✱")
    // Never split inside «…»: a quoted line stays one piece.
    .split(/(?<=[.!?»])\s+(?=[A-ZÆØÅ«*0-9])/)
    .reduce<string[]>((acc, x) => {
      const forrige = acc.at(-1);
      const aapen = (t: string) =>
        (t.match(/«/g) ?? []).length > (t.match(/»/g) ?? []).length;
      if (forrige !== undefined && aapen(forrige))
        acc[acc.length - 1] += ` ${x}`;
      else acc.push(x);
      return acc;
    }, [])
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

  // S0: the whole mail; marked are the sentences any «…» quote in the day's
  // gaater block (Brikke S, Slik løses den, Hint) lands in.
  const mail = q?.nissemail_tekst ?? "";
  if (mail) {
    const sitater = [...blokk.matchAll(/«([^«»]+)»/g)]
      .map((m) => norm(m[1]))
      .filter((x) => x.length > 8 && norm(mail).includes(x));
    skjerm.unshift({
      id: "S0",
      hvor: "NisseMail (i dag)",
      naar: `${n}. desember`,
      tekst: mail,
      kilde: "epost",
      kildeDag: n,
      merk: mail
        .split(/(?<=[.!?])\s+/)
        .filter((x) =>
          sitater.some((z) => norm(x).includes(z) || z.includes(norm(x))),
        ),
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

/** The Gåtekart's source: the day's gaater block and the text of every piece, without labels. */
export const gaatekartKilde = (n: number) => {
  const g = gaatekart(n);
  return [
    dagBlokk(del("gaater", "Dag for dag"), n),
    ...[...g.hjemme, ...g.skjerm].map((b) => b.tekst),
  ]
    .join("\n")
    .trim();
};

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
