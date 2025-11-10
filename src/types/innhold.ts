// Daily mission/riddle
export interface Oppdrag {
  dag: number;
  tittel: string;
  beskrivelse: string;
  kode: string;
  hendelse?: string; // Optional public event description
  dagbokinnlegg?: string; // Santa's diary entry for this day
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
