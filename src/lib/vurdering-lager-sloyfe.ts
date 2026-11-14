import { versionKey } from "./media-status";
import {
  ALLTID,
  endreLager,
  kjentId,
  type Arbeid,
  type Lager,
  type Prioritet,
  type Svar,
} from "./vurdering-lager-kjerne";

export class UgyldigPrioritet extends Error {}

const sjekkId = (a: Record<string, unknown>) => {
  const id = typeof a.id === "string" ? a.id.trim() : "";
  if (!id || id.includes("..") || id.startsWith("/") || !kjentId(id))
    throw new UgyldigPrioritet("ugyldig id");
  return id;
};
const element = (l: Lager, id: string) =>
  (l.elementer[versionKey(id)] ??= { vurderinger: [], historikk: [] });
const tekstArg = (x: unknown, navn: string, maks: number) => {
  const t = typeof x === "string" ? x.trim() : "";
  if (!t || t.length > maks)
    throw new UgyldigPrioritet(`${navn} mangler (maks ${maks} tegn)`);
  return t;
};

const SPM_ORD =
  "hvorfor|hva|hvordan|hvem|hvor|hvilken|hvilket|hvilke|når|kan|skal|bør|burde|må|er|blir|går|stemmer|vil|hadde|what|why|how|where|when|who|which|should|can|could|would|is|are|does|do|did|will";
const SPM_START = new RegExp(`^\\s*["«“'‘]?(?:${SPM_ORD})(?![\\p{L}])`, "iu");
/** Fra denne datoen gjelder det brede spørsmålsbegrepet også for godkjente notater. */
export const SPM_BRED_FRA = "2026-11-13";

/**
 * A note that asks something: a «?» outside quotes (a «?» only inside «»/""/''
 * quotes from the script does not count), or a start with a question word.
 * `bred` false = the old rule (ends with «?» or hv-word/«når» start) for old approved notes.
 */
export const erSpørsmål = (t?: string, bred = true) => {
  if (!t) return false;
  if (!bred)
    return (
      /\?\s*$/.test(t) ||
      /^\s*(hvorfor|hva|hvordan|hvem|hvor|hvilken|hvilket|hvilke|når)(?![\p{L}])/iu.test(
        t,
      )
    );
  const utenSitat = t.replace(
    /«[^»]*»|"[^"]*"|“[^”]*”|(?<!\p{L})'[^']*'/gu,
    "",
  );
  return utenSitat.includes("?") || SPM_START.test(t);
};

export const ARBEID_MS = 2 * 3600_000;

export interface Tråd {
  fil: string;
  tråd: Svar[];
  /** Replies Hans has not seen. */
  nytt: boolean;
}
export interface Spørsmål {
  fil: string;
  notat: string;
  når: string;
}

/**
 * The agent ↔ Hans loop by element: reply threads, open questions (a question in
 * a note, any verdict, until a reply after it or Hans closes it) and work in progress.
 */
export function sløyfe(l: Lager, nå = Date.now()) {
  const svar: Record<string, Tråd> = {};
  const spørsmål: Record<string, Spørsmål> = {};
  const arbeid: Record<string, Arbeid & { stoppet?: boolean }> = {};
  for (const [k, e] of Object.entries(l.elementer)) {
    const tråd = e.svar ?? [];
    if (tråd.length)
      svar[k] = {
        fil: tråd.at(-1)!.fil,
        tråd,
        nytt: tråd.some((x) => x.når > (e.svarSett ?? "")),
      };
    for (const v of e.vurderinger) {
      const når = v.oppdatert ?? "";
      if (
        erSpørsmål(
          v.notat,
          når >= SPM_BRED_FRA ||
            !["godkjent", "ok"].includes(v.vurdering ?? ""),
        ) &&
        !tråd.some((x) => x.når > når) &&
        !((e.spmLukket ?? "") > når)
      )
        spørsmål[k] = { fil: v.fil, notat: v.notat!, når };
    }
    if (e.arbeid)
      arbeid[k] = {
        ...e.arbeid,
        ...(nå - Date.parse(e.arbeid.når) > ARBEID_MS ? { stoppet: true } : {}),
      };
  }
  return { svar, spørsmål, arbeid };
}

/** Hans has seen the replies (opened the item, or gave a verdict). */
export function merkSvarSett(l: Lager, fil: string, når: string) {
  const e = l.elementer[versionKey(fil)];
  if (e?.svar?.some((x) => x.når > (e.svarSett ?? ""))) e.svarSett = når;
}

/**
 * {id, tekst}: a reply under Hans' note (closes its question); {id, sett: true}: Hans
 * saw the replies; {id, lukk: true}: Hans closes the question without a reply.
 */
export function svarVurdering(
  dir: string,
  a: Record<string, unknown>,
  av: string,
) {
  const id = sjekkId(a);
  const når = new Date(Date.now()).toISOString();
  if (a.sett === true)
    return endreLager(dir, (l) => {
      merkSvarSett(l, id, når);
      return { ok: true };
    });
  if (a.lukk === true)
    return endreLager(dir, (l) => {
      const e = element(l, id);
      e.spmLukket = når;
      e.historikk.push({
        hash: ALLTID,
        fil: id,
        oppdatert: når,
        av,
        merknad: `spørsmål lukket av ${av}`,
      });
      return { ok: true };
    });
  const tekst = tekstArg(a.tekst, "tekst", 2000);
  return endreLager(dir, (l) => {
    const e = element(l, id);
    const s: Svar = { fil: id, tekst, av, når };
    (e.svar ??= []).push(s);
    e.historikk.push({
      hash: ALLTID,
      fil: id,
      oppdatert: når,
      av,
      merknad: `svar fra ${av}: ${tekst}`,
    });
    return s;
  });
}

/** {id, hva}: an agent is working on it (refresh to keep it alive); {id, ferdig: true} ends it. */
export function arbeidVurdering(
  dir: string,
  a: Record<string, unknown>,
  av: string,
) {
  const id = sjekkId(a);
  const når = new Date(Date.now()).toISOString();
  if (a.ferdig === true)
    return endreLager(dir, (l) => {
      const e = l.elementer[versionKey(id)];
      if (!e?.arbeid) return false;
      e.historikk.push({
        hash: ALLTID,
        fil: e.arbeid.fil,
        oppdatert: når,
        av,
        merknad: `arbeid ferdig (${e.arbeid.hva}) av ${av}`,
      });
      delete e.arbeid;
      return true;
    });
  const hva = tekstArg(a.hva, "hva", 200);
  return endreLager(dir, (l) => {
    const e = element(l, id);
    // A refresh of the same work is no history line.
    if (e.arbeid?.av !== av || e.arbeid.hva !== hva)
      e.historikk.push({
        hash: ALLTID,
        fil: id,
        oppdatert: når,
        av,
        merknad: `under arbeid av ${av}: ${hva}`,
      });
    e.arbeid = { fil: id, av, hva, når };
    return e.arbeid;
  });
}

/** Every open priority by id (the queue's sort and mark). */
export const prioriteter = (l: Lager): Record<string, Prioritet> =>
  Object.fromEntries(
    Object.values(l.elementer)
      .filter((e) => e.prioritet)
      .map((e) => [e.prioritet!.fil, e.prioritet!]),
  );

/** Drop the element's priority with a history line; no-op when there is none. */
export function lukkPrioritet(
  l: Lager,
  fil: string,
  merknad: string,
  når: string,
) {
  const e = l.elementer[versionKey(fil)];
  if (!e?.prioritet) return false;
  e.historikk.push({
    hash: ALLTID,
    fil: e.prioritet.fil,
    oppdatert: når,
    merknad,
  });
  delete e.prioritet;
  return true;
}

/** Set (or with `fjern` remove) an agent's priority on one id; validated here for API, MCP and CLI. */
export function prioriter(dir: string, a: Record<string, unknown>, av: string) {
  const id = sjekkId(a);
  const når = new Date(Date.now()).toISOString();
  if (a.fjern === true)
    return endreLager(dir, (l) =>
      lukkPrioritet(l, id, `prioritet fjernet av ${av}`, når),
    );
  const nivaa = a.nivaa ?? "høy";
  if (nivaa !== "hast" && nivaa !== "høy")
    throw new UgyldigPrioritet("nivaa må være hast eller høy");
  const grunn = typeof a.grunn === "string" ? a.grunn.trim() : "";
  if (!grunn || grunn.length > 200)
    throw new UgyldigPrioritet("grunn mangler (maks 200 tegn)");
  if (
    a.frist !== undefined &&
    (typeof a.frist !== "string" || Number.isNaN(Date.parse(a.frist)))
  )
    throw new UgyldigPrioritet("frist må være en ISO-dato");
  const p: Prioritet = {
    fil: id,
    nivaa,
    grunn,
    av,
    når,
    ...(a.frist ? { frist: a.frist as string } : {}),
  };
  return endreLager(dir, (l) => {
    const e = (l.elementer[versionKey(id)] ??= {
      vurderinger: [],
      historikk: [],
    });
    e.prioritet = p;
    e.historikk.push({
      hash: ALLTID,
      fil: id,
      oppdatert: når,
      av,
      merknad: `prioritet satt (${nivaa}) av ${av}: ${grunn}${p.frist ? ` · frist ${p.frist}` : ""}`,
    });
    return p;
  });
}
