/**
 * Every string a child can see, with the first day it is visible. Shared by
 * kodelekkasje.test.ts (codes) and entiteter.test.ts (character names).
 * Text that only appears after day k is solved counts from day k + 1.
 */
import { getAllOppdrag } from "@/lib/oppdrag";
import statisk from "@/data/statisk_innhold.json";
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
  landemerker,
  leveringsoppdrag,
  pakkenavn,
  RADIO,
  VIDDA,
  VIDDA_BERGEN,
} from "@/components/windows/snofall-tv/slede";
import type { FilNode } from "@/types/innhold";

export const quests = getAllOppdrag();

export type Visible = { from: number; where: string; text: string };

export const visible: Visible[] = [];
const add = (from: number, where: string, text?: string) => {
  if (text) visible.push({ from, where, text });
};

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
  add(
    e.dag,
    `slede ${e.id} landemerker`,
    landemerker(e)
      .map((l) => l.navn)
      .join(" "),
  );
}
add(14, "slede pakkenavn", [0, 1, 2, 3].map((i) => pakkenavn([], i)).join(" "));
add(8, "slede radio", Object.values(RADIO).flat().join(" "));
// Free flight: the vidda's places as they are named on day d (locked ones say when they open),
// Bergen past the gate once day 24 is solved, and its last stop by name once day 22 is solved.
const steder = (e: typeof VIDDA, dag: number, landås = false) =>
  landemerker(e, { dag, landås })
    .map((l) => l.navn)
    .join(" ");
for (let d = 8; d <= 24; d++) add(d, `slede vidda dag ${d}`, steder(VIDDA, d));
add(8, "slede vidda", `${VIDDA.navn} ${VIDDA.intro}`);
add(25, "slede bergen", steder(VIDDA_BERGEN, 24));
add(23, "slede landås", steder(VIDDA_BERGEN, 24, true));
