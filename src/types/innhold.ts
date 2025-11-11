/**
 * Side-quest (bonus challenge unlocked after main quest)
 * @public - Used in Oppdrag interface and mission data files
 */
export interface Sideoppdrag {
  tittel: string;
  beskrivelse: string;
  validering: "kode" | "forelder"; // Code submission or parent validation
  kode?: string; // Only required if validering is "kode"
  badge_icon: "coin" | "heart" | "zap" | "trophy" | "gift" | "star";
  badge_navn: string; // Badge title (e.g., "Antenne-ekspert")
}

// Daily mission/riddle
export interface Oppdrag {
  dag: number;
  tittel: string;
  beskrivelse: string;
  kode: string;
  hendelse?: string; // Optional public event description
  dagbokinnlegg: string; // Santa's diary entry for this day (required)
  rampenissen_rampestrek: string; // Description of physical mischief scene for parent setup
  fysisk_ledetekst: string; // Physical clue location hint (e.g., "Sjekk skoene i gangen")
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
  cross_reference_topic?: string; // Cryptic topic keyword for cross-day references
  sideoppdrag?: Sideoppdrag; // Optional bonus challenge
  badge_icon?: "coin" | "heart" | "zap" | "trophy" | "gift" | "star"; // Badge for main quest completion
}

// Alert/warning message
export interface Varsel {
  id: string;
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
}

// System metric/status
export interface SystemMetrikk {
  navn: string;
  verdi: number;
  maks: number;
  status: "normal" | "advarsel" | "kritisk";
}

// Calendar day configuration
export interface KalenderDag {
  dag: number;
  låst: boolean;
  fullført: boolean;
  hendelse?: string; // Optional public event
}

// Submitted code log (localStorage)
export interface InnsendelseLog {
  kode: string;
  dato: string; // ISO date string
}
