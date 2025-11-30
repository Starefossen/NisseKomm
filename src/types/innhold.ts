// ============================================================
// Badge System Types
// ============================================================

/**
 * Structured unlock condition for badges
 * @public - Used in Badge interface
 */
export type BadgeUnlockCondition =
  | {
      type: "bonusoppdrag";
      day: number;
    }
  | {
      type: "eventyr";
      eventyrId: string;
    }
  | {
      type: "allDecryptionsSolved";
      challengeIds: string[];
    }
  | {
      type: "allSymbolsCollected";
      requiredCount: number;
    }
  | {
      type: "allQuestsCompleted";
      requiredCount: number;
    };

/**
 * Badge definition from merker.json
 * @public - Loaded from data/merker.json
 */
export interface Badge {
  id: string;
  navn: string;
  beskrivelse: string;
  ikon: string;
  type: "bonusoppdrag" | "eventyr" | "decryption" | "collection" | "completion";
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
  metadata: {
    versjon: string;
    total_merker: number;
    beskrivelse: string;
  };
}

// ============================================================
// Eventy System (from eventyr.json)
// ============================================================

interface Foreldreveiledning {
  sammendrag: string;
  pedagogisk_fokus: string[];
  tips: string[];
}

interface EventyrBeløning {
  type:
    | "badge"
    | "module_unlock"
    | "secret_unlock"
    | "symbol_collection"
    | "grand_finale";
  badge_id?: string;
  badge_navn?: string;
  module_id?: string;
  symbol_id?: string;
  file?: string;
  beskrivelse: string;
}

export interface Eventyr {
  id: string;
  navn: string;
  beskrivelse: string;
  tema: string[];
  farge: string;
  ikon: string;
  vanskelighetsgrad: "lett" | "middels" | "vanskelig";
  første_opplåsingsdag: number; // Day when eventyr metrics/alerts become visible
  belønning: EventyrBeløning;
  foreldreveiledning: Foreldreveiledning;
}

export interface EventyrData {
  eventyr: Eventyr[];
  metadata: {
    versjon: string;
    total_eventyr: number;
    hoved_eventyr: number;
    mini_eventyr: number;
    beskrivelse: string;
  };
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
  validering: "kode" | "forelder"; // Code submission or parent validation
  kode?: string; // Only required if validering is "kode"
  badge_id: string; // Badge identifier (e.g., "antenne-ingenior")
  badge_icon: "coin" | "heart" | "zap" | "trophy" | "gift" | "star";
  badge_navn: string; // Badge title (e.g., "Antenne-ekspert")
}

/**
 * Eventyr reference - links a quest to its narrative arc
 * @public - Used in Oppdrag interface
 */
export interface EventyrRef {
  id: string; // Eventyr identifier (e.g., "morkets-trussel", "iqs-oppfinnelser")
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
  messageWhenSolved: string; // Message revealed on successful decryption
  unlocksFiles?: string[]; // Additional files unlocked on success
}

/**
 * Print material for parent setup guide
 * @public - Used in Oppdrag interface
 */
export interface PrintMaterial {
  type: "note" | "map" | "diagram" | "puzzle" | "symbol"; // Material type
  content: string; // Material content/description
  title?: string; // Optional title
}

// Daily mission/riddle
export interface Oppdrag {
  // Core properties (required)
  dag: number;
  tittel: string;
  nissemail_tekst: string; // Mission description for children (available in app)
  kode: string;
  dagbokinnlegg: string; // Santa's diary entry for this day (required)

  // Physical setup for parents (required)
  rampenissen_rampestrek: string; // Description of physical mischief scene for parent setup
  fysisk_hint: string; // Physical clue location hint (e.g., "Sjekk skoene i gangen")
  oppsett_tid: "enkel" | "moderat" | "avansert"; // Setup time: 5min | 15min | 30min+
  materialer_nødvendig: string[]; // Items parents need to acquire
  beste_rom: string; // Suggested room/location for mischief
  hint_type:
    | "skrevet" // Written clue
    | "visuell" // Visual clue
    | "gjemt_objekt" // Hidden object
    | "arrangement" // Physical arrangement/scene
    | "spor" // Trail/tracks
    | "lyd" // Sound/audio clue
    | "kombinasjon"; // Combination of types

  // Optional: Basic features
  hendelse?: string; // Optional public event description (shows on calendar)
  bonusoppdrag?: Bonusoppdrag; // Optional bonus challenge

  // Multi-day narrative and unlock system
  eventyr?: EventyrRef; // Eventyr grouping (major/mini eventyr)
  reveals?: ContentReveals; // Content unlocked by completing this quest
  requires?: ContentRequirements; // Content required to access this quest
  symbol_clue?: DecryptionSymbol; // Symbol clue hidden in the real world
  decryption_challenge?: DecryptionChallenge; // Symbol-based decryption puzzle
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
    afterDay?: number; // Unlock after completing this day
  };
}

// System metric/status
export interface SystemMetrikk {
  navn: string;
  verdi: number;
  maks: number;
  status: "normal" | "advarsel" | "kritisk";
  min?: number; // Minimum value for progression calculation
  unlock_day?: number; // Day when metric becomes visible
}

// Submitted code log (localStorage)
export interface InnsendelseLog {
  kode: string;
  dato: string; // ISO date string
}
