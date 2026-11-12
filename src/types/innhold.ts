// ============================================================
// Badge System Types
// ============================================================

/**
 * Structured unlock condition for badges
 * @public - Used in Badge interface
 */
export type BadgeUnlockCondition =
  | { type: "decryptionSolved"; challengeId: string }
  | { type: "dayCompleted"; day: number }
  | { type: "allQuestsCompleted" };

/**
 * Badge definition from merker.json
 * @public - Loaded from data/merker.json
 */
export interface Badge {
  id: string;
  navn: string;
  beskrivelse: string;
  ikon: string;
  type: "decryption" | "completion";
  opplasingstekst: string; // Shown in the gold flash when earned
  unlockCondition: BadgeUnlockCondition;
}

/**
 * Earned badge record stored in localStorage
 * @public - Used in StorageManager
 */
export interface EarnedBadge {
  badgeId: string;
  timestamp: number;
}

/**
 * Badge data structure from merker.json
 * @public - Top-level structure of merker.json file
 */
export interface BadgeData {
  merker: Badge[];
}

// ============================================================
// Eventy System (from eventyr.json)
// ============================================================

interface EventyrBeløning {
  type: "badge";
  badge_id: string;
}

export interface Milepael {
  dag: number;
  navn: string;
  tekst: string;
}

export interface Eventyr {
  id: string;
  navn: string;
  beskrivelse: string;
  farge: string;
  ikon: string;
  første_opplåsingsdag: number;
  belønning: EventyrBeløning;
  milepaeler: Milepael[];
}

export interface EventyrData {
  eventyr: Eventyr[];
}

// ============================================================
// Quest Content Types
// ============================================================

/**
 * Bonus challenge unlocked after main quest completion
 * @public - Used in Oppdrag interface and mission data files
 */
export interface Bonusoppdrag {
  tittel: string;
  beskrivelse: string;
  fysisk_oppgave: string;
  validering: "forelder";
  frost_effekt: number;
  belønning_tekst: string;
}

/**
 * Eventyr reference - links a quest to its narrative arc
 * @public - Used in Oppdrag interface
 */
export interface EventyrRef {
  id: string; // Eventyr identifier (2026: "spokelseskoden")
  phase: number; // Phase number within eventyr (1-5 for major eventyr, 1-2 for mini-eventyr)
}

/**
 * Content revealed by completing a quest
 * @public - Used in Oppdrag interface
 */
export interface ContentReveals {
  files?: string[]; // File IDs unlocked in NisseNet (e.g., "orakelet-varsel.txt")
  topics?: string[]; // Topic keywords unlocked (kebab-case, e.g., "orakelet-varsel-snostorm")
  decryptionSymbols?: string[]; // Symbol IDs awarded (e.g., "snowflake-1", "star-2")
  modules?: string[]; // Module IDs to unlock (e.g., "NISSEMUSIKK", "SNØFALL_TV")
}

/**
 * Content required to access a quest
 * @public - Used in Oppdrag interface
 */
export interface ContentRequirements {
  topics?: string[]; // Topic keywords required from prior quests
  completedDays?: number[]; // Specific days that must be completed first
}

/**
 * Decryption symbol awarded for quest completion
 * @public - Used in Oppdrag interface
 */
export interface DecryptionSymbol {
  symbolId: string; // Unique symbol identifier (e.g., "snowflake-green")
  symbolIcon: string; // Pixelarticons icon name (e.g., "pin", "moon-star", "mood-happy")
  symbolColor: "green" | "red" | "blue" | "gold" | "gray"; // Icon color filter
  description: string; // Short description (e.g., "Grønn snøkrystall")
}

/**
 * Decryption challenge requiring collected symbols
 * @public - Used in Oppdrag interface
 */
export interface DecryptionChallenge {
  challengeId: string; // Unique challenge identifier
  requiredSymbols: string[]; // Symbol IDs needed to attempt challenge
  correctSequence: number[]; // Correct arrangement (indexes into requiredSymbols)
  messageWhenSolved?: string; // Message revealed on successful decryption
  hint: string; // Order hint shown in NisseKrypto
  rewardText: string; // Shown when solved
  unlocksFiles?: string[]; // Additional files unlocked on success
}

/**
 * Print material for parent setup guide
 * @public - Used in Oppdrag interface
 */
export interface PrintMaterial {
  type:
    | "note"
    | "map"
    | "diagram"
    | "puzzle"
    | "symbol"
    | "lyrics"
    | "recipe"
    | "certificate"; // Material type
  content: string; // Material content/description
  title?: string; // Optional title
  monospace?: boolean; // Use monospace font for ASCII art and code-like content
}

// Daily mission/riddle as the kids' browser gets it (src/data/oppdrag-klient.json)
export interface Oppdrag {
  // Core properties (required)
  dag: number;
  tittel: string;
  skjerm_teaser?: string; // One line for the hallway screen from 06:00; never a code or a clue
  nissemail_tekst: string; // Mission description for children (available in app)
  julius_ps?: string; // Shown under Julius' video once the code is solved
  julius_ps_bonus?: string; // Replaces julius_ps once LYKT2026 (or the day's bonus) is approved
  julius_ps_krypto_mangler?: string; // Replaces julius_ps while the day's decryption is unsolved

  // Optional: Basic features
  hendelse?: string; // Optional public event description (shows on calendar)
  bonusoppdrag?: Bonusoppdrag; // Optional bonus challenge

  // Multi-day narrative and unlock system
  eventyr?: EventyrRef; // Eventyr grouping (major/mini eventyr)
  reveals?: ContentReveals; // Content unlocked by completing this quest
  requires?: ContentRequirements; // Content required to access this quest
  symbol_clue?: DecryptionSymbol; // Symbol clue hidden in the real world
  decryption_challenge?: DecryptionChallenge; // Symbol-based decryption puzzle
}

/**
 * The full quest, server only (src/lib/oppdrag.ts): the day code and the
 * parent fields never reach a client bundle (scripts/sjekk-klientkoder.mjs).
 */
export interface OppdragFull extends Omit<Oppdrag, "bonusoppdrag"> {
  kode: string;
  bonusoppdrag?: Bonusoppdrag & { foreldre_kode: string }; // Typed by a parent in KodeTerminal
  rampenissen_rampestrek: string; // Description of physical mischief scene for parent setup
  fysisk_hint: string; // Physical clue location hint (e.g., "Sjekk skoene i gangen")
  oppsett_tid: "enkel" | "moderat" | "avansert"; // Setup time: 5min | 15min | 30min+
  materialer_nødvendig: string[]; // Items parents need to acquire
  beste_rom: string; // Suggested room/location for mischief

  print_materials?: PrintMaterial[]; // Additional print materials for parents
}

// Alert/warning message
export interface Varsel {
  id?: string;
  day?: number; // Day number for daily alerts
  tekst: string;
  type: "info" | "advarsel" | "kritisk";
  tidspunkt: string;
}

// File tree node (file or folder)
export interface FilNode {
  navn: string;
  type: "mappe" | "fil";
  innhold?: string; // Content for files
  barn?: FilNode[]; // Children for folders
  unlockConditions?: {
    requiresTopics?: string[]; // Topics required to unlock this file
    afterDay?: number; // Visible from the morning of this day
    requiresSolvedDecryption?: string; // Visible once this challenge is solved
  };
}

// Submitted code log (localStorage)
export interface InnsendelseLog {
  kode: string;
  dato: string; // ISO date string
  day?: number; // Quest day number (added for reliable matching with {{KID_CODE}} placeholder)
}

// Custom calendar event (from parent settings)
export interface CalendarEvent {
  dag: number; // Day 1-24
  hendelse: string; // Event description
}
