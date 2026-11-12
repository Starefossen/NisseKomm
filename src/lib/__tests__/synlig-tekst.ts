/**
 * Every string a child can see, with the first day it is visible. Shared by
 * kodelekkasje.test.ts (codes) and entiteter.test.ts (character names).
 * Text that only appears after day k is solved counts from day k + 1.
 */
import { getAllOppdrag } from "@/lib/oppdrag";
import statisk from "@/data/statisk_innhold.json";
import radioHint from "@/data/radio-hint.json";
import eventyrData from "@/data/eventyr.json";
import merker from "@/data/merker.json";
import videoer from "@/data/julius_videoer.json";
import { TIDBITS } from "@/lib/tidbits";
import { KAPITLER } from "@/components/windows/nissespill/kapitler";
import {
  bjelleKrav,
  dagensUtfordring,
  ETAPPER,
  lagBane,
  leveringsoppdrag,
  pakkenavn,
  RADIO,
} from "@/components/windows/snofall-tv/slede";
import {
  STEDER,
  stedsnavn,
  type FriOpts,
} from "@/components/windows/snofall-tv/vidda";
import type { FilNode } from "@/types/innhold";
import { OPPLASINGER, mailPuffTekst, puffTekst } from "@/lib/opplasinger";
import {
  CHANNELS,
  KULDE_INTERCEPTS,
} from "@/components/windows/snofall-tv/channels";
import fs from "fs";
import path from "path";

export const quests = getAllOppdrag();

export type Visible = { from: number; where: string; text: string };

export const visible: Visible[] = [];
const add = (from: number, where: string, text?: string) => {
  if (text) visible.push({ from, where, text });
};

// Birk and Lyng read these on air around the morning clip (get_clips).
for (const [d, h] of Object.entries(
  radioHint.dag as Record<string, Record<string, string | undefined>>,
)) {
  add(Number(d), `dag ${d} intro_hint`, h.intro_hint);
  add(Number(d), `dag ${d} reaksjon_hint`, h.reaksjon_hint);
  add(Number(d), `dag ${d} rampestrek_hint`, h.rampestrek_hint);
  add(Number(d), `dag ${d} utfordring_hint`, h.utfordring_hint);
}
for (const [dato, t] of Object.entries(radioHint.host))
  add(1, `host_hint ${dato}`, t);

for (const q of quests) {
  const k = q.dag;
  add(k, `dag ${k} tittel`, q.tittel);
  add(k, `dag ${k} nissemail_tekst`, q.nissemail_tekst);
  add(k, `dag ${k} skjerm_teaser`, q.skjerm_teaser);
  if ((q.skjerm_teaser ?? "").length > 60)
    throw new Error(`dag ${k} skjerm_teaser > 60 tegn`);
  add(k, `dag ${k} symbol_clue`, q.symbol_clue?.description);
  add(k, `dag ${k} krypto-hint`, q.decryption_challenge?.hint);
  add(k + 1, `dag ${k} julius_ps`, q.julius_ps);
  add(k + 1, `dag ${k} julius_ps_bonus`, q.julius_ps_bonus);
  add(k + 1, `dag ${k} julius_ps_krypto_mangler`, q.julius_ps_krypto_mangler);
  add(k + 1, `dag ${k} krypto-belønning`, q.decryption_challenge?.rewardText);
  const b = q.bonusoppdrag;
  if (b) {
    for (const [f, t] of Object.entries({
      tittel: b.tittel,
      beskrivelse: b.beskrivelse,
      fysisk_oppgave: b.fysisk_oppgave,
    })) {
      add(k + 1, `dag ${k} bonus ${f}`, t);
    }
    add(k + 1, `dag ${k} bonus belønning_tekst`, b.belønning_tekst);
  }
}

const alerts = statisk.daily_alerts as Array<{
  day: number;
  tekst: string;
  etterKode?: boolean;
}>;
for (const a of alerts) {
  add(a.etterKode ? a.day + 1 : a.day, `dag ${a.day} varsel`, a.tekst);
}

// Unlock alerts, banners and nudges (lib/opplasinger.ts); nudges only follow a solved code
for (const o of OPPLASINGER) {
  const fra = o.etterKode ? o.dag + 1 : o.dag;
  add(fra, `opplåsing dag ${o.dag} ${o.vindu}`, o.tekst);
  add(fra, `opplåsing dag ${o.dag} ${o.vindu} varsel`, o.varsel);
  for (const n of [2, 3, 4] as const)
    add(
      o.dag + 1,
      `opplåsing dag ${o.dag} ${o.vindu} puff ${n}`,
      puffTekst(o, n) ?? undefined,
    );
}

for (let d = 1; d <= 24; d++) add(d, `dag ${d} mail-puff`, mailPuffTekst(d));

const challengeDay = new Map(
  quests
    .filter((q) => q.decryption_challenge)
    .map((q) => [q.decryption_challenge!.challengeId, q.dag]),
);
const walk = (nodes: FilNode[], path: string) => {
  for (const n of nodes) {
    const p = `${path}/${n.navn}`;
    if (n.barn) walk(n.barn, p);
    const c = n.unlockConditions;
    const from = c?.requiresSolvedDecryption
      ? challengeDay.get(c.requiresSolvedDecryption)! + 1
      : (c?.afterDay ?? 1);
    add(from, `NisseNet ${p}`, n.innhold);
  }
};
walk(statisk.filer as FilNode[], "");

for (const e of eventyrData.eventyr) {
  add(1, `eventyr ${e.id}`, e.navn);
  // EventyrOversikt shows the description once day 7 (KULDE) is solved
  add(8, `eventyr ${e.id} beskrivelse`, e.beskrivelse);
  for (const m of e.milepaeler) {
    add(m.dag + 1, `milepæl dag ${m.dag}`, `${m.navn} ${m.tekst}`);
  }
}
for (const m of merker.merker) add(1, `merke ${m.id}`, m.beskrivelse);
for (const v of videoer)
  add(v.dag, `Julius-video dag ${v.dag}`, v.transkripsjon);

// Tidbits: every text from its fraDag (the hidden track and a password
// file's text are gated later, but checking from fraDag is stricter).
const t = TIDBITS;
for (const [where, list] of Object.entries({
  idle: t.idle.linjer,
  terminal: t.terminal.hemmeligeOrd,
  feilkode: t.terminal.feilKode,
  tv: t.tv,
  spam: t.spam,
  kalender: t.kalender,
  stats: t.stats,
  musikk: [t.musikk.skjultSpor],
  nissenet: t.nissenet.filer,
  passord: t.nissenet.feilPassord,
})) {
  for (const e of list) add(e.fraDag, `tidbits ${where}`, JSON.stringify(e));
}

// NISSESPILL: every string in a chapter is visible from its unlock day. The whole
// chapter is serialised (numbers dropped: hotspot rects are not text), so new
// fields are covered without listing them.
for (const k of KAPITLER) {
  add(
    k.dag,
    `nissespill kapittel ${k.n}`,
    JSON.stringify(k, (_, v) => (typeof v === "number" ? undefined : v)),
  );
  // Locked chapters show title and teaser in the list from the first chapter's day.
  add(
    KAPITLER[0].dag,
    `nissespill kapittel ${k.n} låst`,
    `${k.tittel} ${k.teaser ?? ""}`,
  );
}

// Sledesimulator: stage name, IQ's intro and the day's challenge show on the
// start screen from the stage's day.
for (const e of ETAPPER) {
  add(e.dag, `slede ${e.id}`, `${e.navn} ${e.intro}`);
  const varder = lagBane(e).filter((t) => t.type === "varde").length;
  add(e.dag, `slede ${e.id} bjellekrav`, bjelleKrav(varder).join(" "));
  for (let d = e.dag; d <= 24; d++) {
    add(d, `slede ${e.id} utfordring dag ${d}`, dagensUtfordring(d, e).tekst);
    const l = leveringsoppdrag(d, e);
    if (l) add(d, `slede ${e.id} levering dag ${d}`, l.tekst);
  }
}
add(14, "slede pakkenavn", [0, 1, 2, 3].map((i) => pakkenavn([], i)).join(" "));
add(8, "slede radio", Object.values(RADIO).flat().join(" "));
// Free flight: the vidda's places as the map and the HUD name them on day d (locked
// ones say when they open), Rampenissen's line when each is found, Bergen past the
// gate once day 24 is solved, and its last stop by name once day 22 is solved.
const steder = (o: FriOpts) =>
  STEDER.map((s) => `${stedsnavn(s, o)} ${stedsnavn(s, o, true)}`).join(" ");
for (let d = 8; d <= 24; d++)
  add(
    d,
    `slede vidda dag ${d}`,
    steder({ dag: d, bergen: false, landås: false }),
  );
for (const s of STEDER)
  add(s.id === "bergen" ? 25 : s.dag, `slede vidda radio ${s.id}`, s.radio);
add(25, "slede bergen", steder({ dag: 24, bergen: true, landås: false }));
add(23, "slede landås", steder({ dag: 24, bergen: true, landås: true }));

// Inline strings in components: every literal and JSX text in the file, from the
// day the window can first show it (stricter than per-string gating).
const kilde = (fil: string) =>
  fs.readFileSync(path.join(__dirname, "../../..", fil), "utf8");
export const literaler = (src: string) =>
  (
    src.match(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`|>[^<>{}]+</g) ??
    []
  )
    // shown text has a capital letter; paths, urls and class names do not count
    .filter((s) => /\p{Lu}/u.test(s) && !/\/|\.(mp4|png|jpg|webm|mp3)/.test(s))
    .join("\n");
add(1, "Day1Opener", literaler(kilde("src/components/ui/Day1Opener.tsx")));
add(
  8,
  "Sledeflukt",
  literaler(kilde("src/components/windows/sledeflukt/Sledeflukt.tsx")),
);
add(
  8,
  "FriFlyging",
  literaler(kilde("src/components/windows/sledeflukt/FriFlyging.tsx")),
);
for (const [d, t] of Object.entries(KULDE_INTERCEPTS))
  add(Number(d), `Snøfall TV Kulde dag ${d}`, t);
add(1, "Snøfall TV kanaler", CHANNELS.map((c) => c.name).join(" "));

// NisseStats (reveals day 16, open from that morning): each metric from its
// unlock_day, the log from each line's fra_dag, the window's own literals.
const NISSESTATS_DAG = quests.find((q) =>
  q.reveals?.modules?.includes("NISSESTATS"),
)!.dag;
for (const m of statisk.nissestats_global_metrics)
  add(
    Math.max(NISSESTATS_DAG, m.unlock_day),
    `NisseStats måler ${m.navn}`,
    `${m.navn} ${m.description}`,
  );
for (const f of statisk.nissestats_feed)
  add(
    Math.max(NISSESTATS_DAG, f.fra_dag),
    `NisseStats logg dag ${f.fra_dag}`,
    f.tekst,
  );
add(
  NISSESTATS_DAG,
  "NisseStats",
  literaler(kilde("src/components/windows/NisseStats.tsx")),
);
