/**
 * Small surprises the kids can stumble on (src/data/tidbits.json).
 * Schema: docs/tidbits.md. Every entry has `fraDag` (first day, 1-24) and an
 * optional `tilDag` (last day); text is kid-visible and covered by
 * kodelekkasje.test.ts, so it must never name a code.
 */
export interface Tidbit {
  fraDag: number;
  tilDag?: number;
  tekst: string;
}

export interface HemmeligOrd extends Tidbit {
  /** Words typed in KodeTerminal, case-insensitive. */
  ord: string[];
}

export interface TvTidbit extends Tidbit {
  /** Frequency on K4's wheel (80-100, step 0.5; not 85 or 90). */
  frekvens: number;
  /** Media library paths; text over static if missing. */
  bilde?: string;
  lyd?: string;
}

export interface SpamMail extends Tidbit {
  fra: string;
  emne: string;
}

export interface KalenderTidbit extends Tidbit {
  /** Door the line belongs to; shown once that door is completed. */
  dag: number;
}

export interface StatTidbit extends Tidbit {
  navn: string;
  verdi: string;
}

export interface NisseNetTidbit extends Tidbit {
  navn: string;
  /** Case-insensitive; the text stays hidden until it is typed. */
  passord?: string;
  /** Hidden until this many owl feathers are found in Ugleposten (opplasinger FJAER_MAAL). */
  fjaer?: number;
}

export interface Tidbits {
  idle: { minutter: number; linjer: Tidbit[] };
  terminal: { hemmeligeOrd: HemmeligOrd[]; feilKode: Tidbit[] };
  tv: TvTidbit[];
  spam: SpamMail[];
  kalender: KalenderTidbit[];
  stats: StatTidbit[];
  musikk: {
    skjultSpor: Tidbit & { path: string; tittel: string; etterLøstDag: number };
  };
  nissenet: { filer: NisseNetTidbit[]; feilPassord: Tidbit[] };
}
