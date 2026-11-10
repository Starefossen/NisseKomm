/**
 * Klementin-Ekspressen spike: one scene as plain data.
 * Rects are percent of the 16:9 still so hotspots follow the image on any screen.
 */

export type Verb = "se" | "bruk" | "snakk";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DialogChoice {
  text: string;
  reply: string;
  /** Flag set when this choice is picked (e.g. learned something). */
  setsFlag?: string;
}

export interface Dialog {
  speaker: string;
  opening: string;
  choices: DialogChoice[];
}

export interface Hotspot {
  id: string;
  name: string;
  rect: Rect;
  /** What a bare tap does when no verb is chosen. */
  smart: Verb;
  se: string;
  /** Text when BRUK is pressed with empty hands; omitted = generic shrug. */
  bruk?: string;
  /** BRUK with empty hands picks this item up (once). */
  gir?: string;
  snakk?: Dialog;
  /** Using this item here succeeds and sets the flag; any other item fails. */
  trenger?: { item: string; flag: string; tekst: string; forbruker?: boolean };
  /** Shown instead of `se` once the flag is set. */
  seEtter?: { flag: string; tekst: string };
}

export interface Item {
  id: string;
  name: string;
  /** Inline SVG path (24×24 viewbox) so the spike needs no new icon files. */
  icon: string;
  se: string;
}

export interface Scene {
  id: string;
  name: string;
  /** Media path for `mediaUrl`. */
  bilde: string;
  /** Flag that turns the lights on; until then the scene renders dark. */
  lysFlag: string;
  hotspots: Hotspot[];
  /** Three progressive hints for the scene's single puzzle. */
  tips: [string, string, string];
}

export const ITEMS: Record<string, Item> = {
  kobbertraad: {
    id: "kobbertraad",
    name: "Kobbertråd",
    icon: "M4 12a8 8 0 0 1 16 0M6 12a6 6 0 0 1 12 0M8 12a4 4 0 0 1 8 0M3 12h18",
    se: "En snelle med blank kobbertråd. IQ har skrevet «IKKE TIL SLEDEN» på den med tusj.",
  },
};

export const VERKSTED: Scene = {
  id: "verksted",
  name: "IQs verksted",
  bilde: "feed/iq-verksted.png",
  lysFlag: "strom_paa",
  tips: [
    "Rampenissen: «Det e bekmørkt her inne. Nokka må ha gått i stykker da IQ smalt døra igjen.»",
    "Rampenissen: «Sjå på den veggen med alle målerne. Og sjå på rotet på benken. Dæm hører sammen.»",
    "Rampenissen: «Ta kobbertråden fra benken og bruk den på sikringsskapet til venstre. Enkelt og greit.»",
  ],
  hotspots: [
    {
      id: "sikringsskap",
      name: "Sikringsskapet",
      rect: { x: 0, y: 20, w: 23, h: 45 },
      smart: "se",
      se: "Et skap fullt av målere og visere. Alle viserne peker på null, og en liten luke står åpen. Mellom to skruer er det et tomt gap der det burde gått en tråd.",
      seEtter: {
        flag: "strom_paa",
        tekst:
          "Viserne vipper fornøyd fram og tilbake. Det brummer lavt i skapet. Strøm!",
      },
      bruk: "Du pirker i luka. Ingenting skjer. Det mangler noe mellom skruene.",
      trenger: {
        item: "kobbertraad",
        flag: "strom_paa",
        forbruker: true,
        tekst:
          "Du tvinner kobbertråden mellom skruene. Det knitrer, det blinker … og hele verkstedet våkner til liv!",
      },
    },
    {
      id: "snelle",
      name: "Trådsnella",
      rect: { x: 14, y: 72, w: 15, h: 18 },
      smart: "bruk",
      se: "En snelle med kobbertråd ligger halvt under en tang. Den ser ikke ut til å høre til noe spesielt.",
      gir: "kobbertraad",
      seEtter: {
        flag: "har_tatt_snelle",
        tekst: "Her lå snella. Nå ligger bare tanga igjen.",
      },
    },
    {
      id: "kopp",
      name: "Kaffekoppen",
      rect: { x: 43, y: 72, w: 13, h: 18 },
      smart: "se",
      se: "En kaffekopp som fortsatt ryker. Oppi flyter tre skruer og noe som kanskje er en rosin. Kanskje.",
      bruk: "Du løfter koppen. Den er varm. Du setter den ned igjen veldig forsiktig. Ingen trenger å vite om dette.",
    },
    {
      id: "dor",
      name: "Døra",
      rect: { x: 64, y: 18, w: 20, h: 54 },
      smart: "snakk",
      se: "En tung tredør med en lapp: «BANK TRE GANGER. IKKE FIRE.» Noen har banket fire ganger, for det er en liten bulk nederst.",
      bruk: "Låst. Fra innsiden høres det skritt og noe som rasler.",
      snakk: {
        speaker: "IQ (gjennom døra)",
        opening:
          "«Hvem er det? Hvis det er Rampenissen igjen, så er svaret fortsatt NEI, du får ikke låne turbo-skissen!»",
        choices: [
          {
            text: "Det er oss! Lyset er gått her inne.",
            reply:
              "«Gått? GÅTT? Da har sikringen røket igjen. Det ligger alltid litt kobbertråd på benken, hvis ikke noen har … lånt den.»",
            setsFlag: "iq_tips",
          },
          {
            text: "Hvorfor står det IKKE RØR på skiltet?",
            reply:
              "«Fordi folk rører. Særlig én bestemt person med rød lue. Skiltet gjelder forresten også dere, men dere er sikkert flinkere.»",
          },
          {
            text: "Hva er Klementin-Ekspressen?",
            reply:
              "«Det … er hemmelig. Veldig hemmelig. Så hemmelig at jeg ikke engang husker det selv akkurat nå. Spør igjen når lyset er på.»",
          },
        ],
      },
    },
  ],
};
