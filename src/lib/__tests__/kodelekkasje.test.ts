/**
 * No kid-visible text may show a code before its day is solved.
 *
 * For each day d we collect every string a child can see on day d before
 * typing that day's code, and look for the codes of day d and all later days.
 * Text that only appears after day k is solved (PS, bonus reward, decrypted
 * files, milestones) counts from day k + 1.
 */
import { describe, it, expect } from "@jest/globals";
import { getAllOppdrag } from "@/lib/oppdrag";
import statisk from "@/data/statisk_innhold.json";
import eventyrData from "@/data/eventyr.json";
import merker from "@/data/merker.json";
import videoer from "@/data/julius_videoer.json";
import { TIDBITS } from "@/lib/tidbits";
import type { FilNode } from "@/types/innhold";

const quests = getAllOppdrag();

// app-tekster-2026.md C: «Landås» is the family's place name in texts on
// other days than 22 and is accepted there by design.
const ALLOWED = new Set(["LANDÅS"]);

// Locked texts that mention a later code in passing. Listed so a new leak
// still fails; each one is a question for Hans, not a fix.
const KNOWN = new Set<string>([]);

type Visible = { from: number; where: string; text: string };

const visible: Visible[] = [];
const add = (from: number, where: string, text?: string) => {
  if (text) visible.push({ from, where, text });
};

for (const q of quests) {
  const k = q.dag;
  add(k, `dag ${k} tittel`, q.tittel);
  add(k, `dag ${k} nissemail_tekst`, q.nissemail_tekst);
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

const pattern = (code: string) =>
  /^\d+$/.test(code)
    ? new RegExp(`(?<!\\d)${code}(?!\\d)`)
    : new RegExp(code, "i");

describe("kodelekkasje", () => {
  it.each(quests.map((q) => q.dag))(
    "dag %i: ingen synlig tekst viser dagens eller senere koder",
    (d) => {
      const codes = quests
        .filter((q) => q.dag >= d && !ALLOWED.has(q.kode))
        .map((q) => q.kode);
      const leaks = visible
        .filter((v) => v.from <= d)
        .flatMap((v) =>
          codes
            .filter((c) => pattern(c).test(v.text))
            .map((c) => `${c} i ${v.where}`)
            .filter((l) => !KNOWN.has(l)),
        );
      expect(leaks).toEqual([]);
    },
  );
});
